"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const websocket_1 = require("./services/websocket");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3000;
async function start() {
    try {
        const server = http_1.default.createServer();
        (0, websocket_1.setupWebSocket)(server);
        server.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (err) {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    }
}
void start();
app.get("/status", (_, res) => {
    res.json({ status: "ok" });
});
