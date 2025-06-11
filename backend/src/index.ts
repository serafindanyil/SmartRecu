import express from "express";
import http from "http";
import { setupWebSocket } from "./services/websocket";

const app = express();
const server = http.createServer(app);
setupWebSocket(server);

server.listen(3000, () => {
	console.log(`Server is running on port 3000`);
});

app.get("/status", (_, res) => {
	res.json({ status: "ok" });
});
