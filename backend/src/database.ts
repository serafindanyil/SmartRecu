import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

const testConnection = async () => {
	try {
		const connection = await pool.getConnection();
		console.log("✅ Database connected successfully");
		connection.release();
	} catch (error) {
		console.error("❌ Database connection failed:", error);
		process.exit(1);
	}
};

testConnection();

export default pool;
