import express from "express";
import http from "http";
import { setupWebSocket } from "./services/websocket";

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

const app = express();

// --- Health & root endpoints (важливо для Render port scan) ---
app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});
app.get("/", (_req, res) => {
	res.status(200).type("text/plain").send("SmartRecu backend alive");
});

// (Опційно) статус для внутрішніх перевірок
app.get("/status", (_req, res) => {
	res.json({ status: "ok" });
});

async function start() {
	console.log("🚀 Starting SmartRecu backend...");

	const server = http.createServer(app);

	server.on("error", (err) => {
		console.error("❌ HTTP server error:", err);
	});

	// Налаштування для стабільності
	server.keepAliveTimeout = 65000;
	// @ts-ignore
	server.headersTimeout = 66000;

	setupWebSocket(server);

	server.listen(PORT, HOST, () => {
		console.log(`✅ HTTP listening on http://${HOST}:${PORT}`);
	});
}

process.on("uncaughtException", (err) => {
	console.error("❌ Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
	console.error("❌ Unhandled rejection:", reason);
});

void start();
