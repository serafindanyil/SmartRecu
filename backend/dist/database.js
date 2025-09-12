"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
// Replace MySQL-style "?" placeholders with PostgreSQL "$1, $2, ..."
function toPgPlaceholders(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
}
function toBoolean(value, fallback = false) {
    if (value == null)
        return fallback;
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes";
}
const DEFAULT_MAX_CLIENTS = 10;
const DEFAULT_IDLE_TIMEOUT_MS = 30000;
const DEFAULT_CONN_TIMEOUT_MS = 10000;
const SSL_ENABLED = toBoolean(process.env.DB_SSL, true);
const SSL_REJECT_UNAUTHORIZED = toBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);
const pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: SSL_ENABLED
        ? { rejectUnauthorized: SSL_REJECT_UNAUTHORIZED }
        : undefined,
    max: DEFAULT_MAX_CLIENTS,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: DEFAULT_CONN_TIMEOUT_MS,
});
pool.on("error", (err) => {
    console.error("❌ Postgres pool error:", err);
});
async function execute(sql, params = []) {
    const text = toPgPlaceholders(sql);
    // pg typings expect mutable array
    const values = Array.isArray(params) ? [...params] : [];
    const res = await pool.query(text, values);
    return [res.rows];
}
/**
 * Create required tables if they do not yet exist.
 * This keeps the project simple without an external migration tool for now.
 * If the schema grows further – introduce a proper migration system (e.g. node-pg-migrate, drizzle, knex).
 */
async function initSchema() {
    const statements = [
        `CREATE TABLE IF NOT EXISTS humidity (
			id SERIAL PRIMARY KEY,
			humidity REAL NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
			timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
        `CREATE INDEX IF NOT EXISTS idx_humidity_timestamp ON humidity (timestamp DESC)`,
        `CREATE TABLE IF NOT EXISTS co2 (
			id SERIAL PRIMARY KEY,
			co2 INTEGER NOT NULL CHECK (co2 >= 0),
			timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
        `CREATE INDEX IF NOT EXISTS idx_co2_timestamp ON co2 (timestamp DESC)`,
        `CREATE TABLE IF NOT EXISTS temp_inside (
			id SERIAL PRIMARY KEY,
			temp_inside REAL NOT NULL,
			timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
        `CREATE INDEX IF NOT EXISTS idx_temp_inside_timestamp ON temp_inside (timestamp DESC)`,
        `CREATE TABLE IF NOT EXISTS temp_outside (
			id SERIAL PRIMARY KEY,
			temp_outside REAL NOT NULL,
			timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
        `CREATE INDEX IF NOT EXISTS idx_temp_outside_timestamp ON temp_outside (timestamp DESC)`,
        `CREATE TABLE IF NOT EXISTS sensor_analytics (
			bucket_start TIMESTAMPTZ PRIMARY KEY,
			avg_humidity REAL,
			avg_co2 REAL,
			avg_temp_inside REAL,
			avg_temp_outside REAL,
			samples INT NOT NULL DEFAULT 0,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
    ];
    for (const sql of statements) {
        await pool.query(sql);
    }
}
async function testConnection() {
    try {
        await pool.query("SELECT 1");
        console.log("✅ Database connected successfully");
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
}
async function bootstrap() {
    await testConnection();
    try {
        await initSchema();
        console.log("✅ Schema ensured");
    }
    catch (err) {
        console.error("❌ Failed to initialize schema:", err);
        process.exit(1);
    }
}
void bootstrap();
const db = { execute, pool, initSchema };
exports.default = db;
