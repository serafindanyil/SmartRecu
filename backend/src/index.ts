import express from "express";
import http from "http";

import { setupWebSocket } from "./services/websocket";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(); // No HTTPS here; Render terminates TLS
setupWebSocket(server);

server.listen(PORT, "0.0.0.0", () => {
	console.log(`Server is running on port ${PORT}`);
});

app.get("/status", (_, res) => {
	res.json({ status: "ok" });
});
