import express from "express";
import http from "http";

import { setupWebSocket } from "./services/websocket";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

async function start() {
	try {
		const server = http.createServer();
		setupWebSocket(server);

		server.listen(PORT, "0.0.0.0", () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (err) {
		console.error("❌ Failed to start server:", err);
		process.exit(1);
	}
}

void start();

app.get("/status", (_, res) => {
	res.json({ status: "ok" });
});
