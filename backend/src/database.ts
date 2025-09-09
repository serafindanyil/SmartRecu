import dotenv from "dotenv";
import { Pool, type QueryResultRow } from "pg";

dotenv.config();

type QueryParams = ReadonlyArray<unknown>;

function toPgPlaceholders(sql: string): string {
	let index = 0;
	return sql.replace(/\?/g, () => `$${++index}`);
}

const DEFAULT_MAX_CLIENTS = 10;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;
const DEFAULT_CONN_TIMEOUT_MS = 10_000;

const pool = new Pool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	ssl: { rejectUnauthorized: false },
	max: DEFAULT_MAX_CLIENTS,
	idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT_MS,
	connectionTimeoutMillis: DEFAULT_CONN_TIMEOUT_MS,
});

pool.on("error", (err) => {
	console.error("❌ Postgres pool error:", err);
});

async function execute<T extends QueryResultRow = QueryResultRow>(
	sql: string,
	params: QueryParams = []
): Promise<[T[]]> {
	const text = toPgPlaceholders(sql);
	// Make params mutable for pg typings
	const values: any[] = Array.isArray(params) ? [...params] : [];
	const res = await pool.query<T>(text, values);
	return [res.rows as T[]];
}

async function testConnection(): Promise<void> {
	try {
		await pool.query("SELECT 1");
		console.log("✅ Database connected successfully");
	} catch (error) {
		console.error("❌ Database connection failed:", error);
		process.exit(1);
	}
}

void testConnection();

const db = {
	execute,
	pool,
};

export default db;
