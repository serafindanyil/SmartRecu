"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const websocket_1 = require("./services/websocket");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
(0, websocket_1.setupWebSocket)(server);
server.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});
app.get("/status", (_, res) => {
    res.json({ status: "ok" });
});
