"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
const ws_1 = require("ws");
const database_1 = __importDefault(require("../database"));
const dayjs_1 = __importDefault(require("dayjs"));
const metrics_json_1 = __importDefault(require("../instructions/metrics.json"));
// Зберігаємо типи клієнтів
const clientTypes = new Map();
// Зберігаємо останній час отримання update від ESP32
const esp32LastUpdate = new Map();
// Зберігаємо останній відомий статус ESP32
let lastESP32Status = "Offline";
// Ініціалізовані динамічні дані з ESP32
let switchState = null;
let mode = null;
let fanInSpeed = null;
let fanOutSpeed = null;
// Latest in-memory sensor values (volatile cache)
let humidityLevel = null;
let CO2Level = null;
let tempInside = null;
let tempOutside = null;
const handleSensorUpdate = (data) => {
    humidityLevel = data.humidity;
    CO2Level = data.co2;
    tempInside = data.tempIn;
    tempOutside = data.tempOut;
};
// Функція для надсилання статусу ESP32 всім web клієнтам
function broadcastESP32Status(wss, status) {
    // Надсилаємо тільки якщо статус змінився
    if (lastESP32Status !== status) {
        console.log(`📡 Статус ESP32 змінився: ${lastESP32Status} -> ${status}`);
        lastESP32Status = status;
        const statusMessage = JSON.stringify({
            device: "server",
            type: "status",
            data: status,
        });
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN &&
                clientTypes.get(client) === "web") {
                client.send(statusMessage);
            }
        });
    }
}
// Функція для перевірки чи є активний ESP32 (отримували update протягом 4 секунд)
function hasActiveESP32() {
    const currentTime = Date.now();
    const timeout = 3000; // 3 секунди
    return Array.from(esp32LastUpdate.entries()).some(([client, lastUpdate]) => {
        const isClientOpen = client.readyState === ws_1.WebSocket.OPEN;
        const isRecent = currentTime - lastUpdate < timeout;
        return isClientOpen && isRecent;
    });
}
// Функція для перевірки статусу і надсилання оновлень
function checkAndBroadcastStatus(wss) {
    const currentStatus = hasActiveESP32() ? "Online" : "Offline";
    broadcastESP32Status(wss, currentStatus);
}
function setupWebSocket(server) {
    const wss = new ws_1.Server({ server, path: "/ws" });
    const HEARTBEAT_MS = 30000;
    const statusCheckInterval = setInterval(() => {
        checkAndBroadcastStatus(wss);
    }, 2000);
    const SENSOR_PERSIST_MS = 120000; // 2 minutes
    const ANALYTICS_REFRESH_MS = 300000; // 5 minutes
    const saveDataInterval = setInterval(() => {
        console.log("⏰ saveSensorData interval called");
        void saveSensorData(wss);
    }, SENSOR_PERSIST_MS);
    // Periodic analytics aggregation
    const analyticsInterval = setInterval(() => {
        void aggregateSensorAnalytics();
    }, ANALYTICS_REFRESH_MS);
    wss.on("close", () => {
        clearInterval(statusCheckInterval);
        clearInterval(saveDataInterval);
        clearInterval(analyticsInterval);
    });
    wss.on("connection", (ws, req) => {
        const ip = req.socket.remoteAddress;
        console.log(`🔌 Клієнт підключився: ${ip}`);
        // Mark alive on pong
        // @ts-expect-error augment
        ws.isAlive = true;
        ws.on("pong", () => {
            // @ts-expect-error augment
            ws.isAlive = true;
        });
        ws.on("message", async (message) => {
            try {
                const parsed = JSON.parse(message);
                console.log(`📨 From ${parsed.device}:`, parsed);
                // Зберігаємо тип клієнта
                if (!clientTypes.has(ws)) {
                    clientTypes.set(ws, parsed.device);
                    console.log(`👤 Клієнт ідентифікований як: ${parsed.device}`);
                }
                switch (parsed.device) {
                    case "esp32":
                        switch (parsed.type) {
                            case "ping":
                                ws.send(JSON.stringify({ type: "pong", time: Date.now() }));
                                break;
                            case "update":
                                // Оновлюємо час останнього update від ESP32
                                esp32LastUpdate.set(ws, Date.now());
                                // Пересилаємо дані сенсорів всім web клієнтам
                                wss.clients.forEach((client) => {
                                    if (client !== ws &&
                                        client.readyState === ws_1.WebSocket.OPEN &&
                                        clientTypes.get(client) === "web") {
                                        client.send(JSON.stringify({
                                            device: "server",
                                            type: "update",
                                            data: parsed.data,
                                        }));
                                    }
                                });
                                handleSensorUpdate(parsed.data);
                                // Перевіряємо і оновлюємо статус
                                checkAndBroadcastStatus(wss);
                                break;
                            case "switchState":
                                // Оновлюємо час останнього update від ESP32
                                esp32LastUpdate.set(ws, Date.now());
                                switchState = parsed.data;
                                // Пересилаємо дані сенсорів всім web клієнтам
                                wss.clients.forEach((client) => {
                                    if (client !== ws &&
                                        client.readyState === ws_1.WebSocket.OPEN &&
                                        clientTypes.get(client) === "web") {
                                        client.send(JSON.stringify({
                                            device: "server",
                                            type: "switchState",
                                            data: parsed.data,
                                        }));
                                    }
                                });
                                // Перевіряємо і оновлюємо статус
                                checkAndBroadcastStatus(wss);
                                break;
                            case "changeMode":
                                // Оновлюємо час останнього update від ESP32
                                esp32LastUpdate.set(ws, Date.now());
                                mode = parsed.data;
                                // Пересилаємо дані сенсорів всім web клієнтам
                                wss.clients.forEach((client) => {
                                    if (client !== ws &&
                                        client.readyState === ws_1.WebSocket.OPEN &&
                                        clientTypes.get(client) === "web") {
                                        client.send(JSON.stringify({
                                            device: "server",
                                            type: "changeMode",
                                            data: parsed.data,
                                        }));
                                    }
                                });
                                // Перевіряємо і оновлюємо статус
                                checkAndBroadcastStatus(wss);
                                break;
                            case "changeFanInSpd":
                                // Оновлюємо час останнього update від ESP32
                                esp32LastUpdate.set(ws, Date.now());
                                fanInSpeed = parsed.data;
                                // Пересилаємо дані сенсорів всім web клієнтам
                                wss.clients.forEach((client) => {
                                    if (client !== ws &&
                                        client.readyState === ws_1.WebSocket.OPEN &&
                                        clientTypes.get(client) === "web") {
                                        client.send(JSON.stringify({
                                            device: "server",
                                            type: "changeFanInSpd",
                                            data: parsed.data,
                                        }));
                                    }
                                });
                                // Перевіряємо і оновлюємо статус
                                checkAndBroadcastStatus(wss);
                                break;
                            case "changeFanOutSpd":
                                // Оновлюємо час останнього update від ESP32
                                esp32LastUpdate.set(ws, Date.now());
                                fanOutSpeed = parsed.data;
                                // Пересилаємо дані сенсорів всім web клієнтам
                                wss.clients.forEach((client) => {
                                    if (client !== ws &&
                                        client.readyState === ws_1.WebSocket.OPEN &&
                                        clientTypes.get(client) === "web") {
                                        client.send(JSON.stringify({
                                            device: "server",
                                            type: "changeFanOutSpd",
                                            data: parsed.data,
                                        }));
                                    }
                                });
                                // Перевіряємо і оновлюємо статус
                                checkAndBroadcastStatus(wss);
                                break;
                            case "init":
                                // Пересилаємо дані сенсорів всім web клієнтам
                                switchState = parsed.data.switchState;
                                mode = parsed.data.mode;
                                fanInSpeed = parsed.data.fanInSpd;
                                fanOutSpeed = parsed.data.fanOutSpd;
                                checkAndBroadcastStatus(wss);
                                break;
                            default:
                                console.log("⚠️ Невідомий тип від ESP32:", parsed.type);
                                break;
                        }
                        break;
                    case "web":
                        switch (parsed.type) {
                            case "identify":
                                // Надсилаємо конфігурацію
                                ws.send(JSON.stringify({
                                    device: "server",
                                    type: "setup",
                                    data: {
                                        metrics: metrics_json_1.default,
                                        switchState: switchState,
                                        mode: mode,
                                        fanInSpd: fanInSpeed,
                                        fanOutSpd: fanOutSpeed,
                                    },
                                }));
                                // Надсилаємо поточний статус ESP32
                                ws.send(JSON.stringify({
                                    device: "server",
                                    type: "status",
                                    data: hasActiveESP32() ? "Online" : "Offline",
                                }));
                                // Надсилаємо історію сенсорних даних
                                const latestData = await getLatestSensorData(20);
                                const message = JSON.stringify({
                                    device: "server",
                                    type: "sensorHistory",
                                    data: latestData,
                                });
                                ws.send(message);
                                break;
                            case "switchState":
                                for (const [client, type] of clientTypes.entries()) {
                                    if (type === "esp32" &&
                                        client.readyState === ws_1.WebSocket.OPEN) {
                                        client.send(JSON.stringify({
                                            device: "server",
                                            type: "switchState",
                                            data: parsed.data,
                                        }));
                                    }
                                }
                                break;
                            case "changeMode":
                                for (const [client, type] of clientTypes.entries()) {
                                    if (type === "esp32" &&
                                        client.readyState === ws_1.WebSocket.OPEN) {
                                        client.send(JSON.stringify({
                                            device: "server",
                                            type: "changeMode",
                                            data: parsed.data,
                                        }));
                                    }
                                }
                                break;
                            case "changeFanInSpd":
                                for (const [client, type] of clientTypes.entries()) {
                                    if (type === "esp32" &&
                                        client.readyState === ws_1.WebSocket.OPEN) {
                                        client.send(JSON.stringify({
                                            device: "server",
                                            type: "changeFanInSpd",
                                            data: parsed.data,
                                        }));
                                    }
                                }
                                break;
                            case "changeFanOutSpd":
                                for (const [client, type] of clientTypes.entries()) {
                                    if (type === "esp32" &&
                                        client.readyState === ws_1.WebSocket.OPEN) {
                                        client.send(JSON.stringify({
                                            device: "server",
                                            type: "changeFanOutSpd",
                                            data: parsed.data,
                                        }));
                                    }
                                }
                                break;
                            case "ping":
                                ws.send(JSON.stringify({ type: "pong", time: Date.now() }));
                                break;
                            default:
                                console.log("⚠️ Невідомий тип від web:", parsed.type);
                                break;
                        }
                        break;
                    default:
                        console.warn("⚠️ Невідомий тип пристрою:", parsed.device);
                }
            }
            catch (err) {
                console.error("❌ Помилка парсингу повідомлення:", err, "Повідомлення:", message);
            }
        });
        ws.on("close", (code, reason) => {
            const clientType = clientTypes.get(ws);
            console.log(`❌ Клієнт ${clientType || "невідомий"} відключився (код: ${code})`);
            // Видаляємо клієнта з обох мап
            clientTypes.delete(ws);
            esp32LastUpdate.delete(ws);
            // Якщо відключився ESP32, перевіряємо статус
            if (clientType === "esp32") {
                console.log("📡 ESP32 відключився - перевіряємо статус");
                setTimeout(() => {
                    checkAndBroadcastStatus(wss);
                }, 100);
            }
        });
        ws.on("error", (error) => {
            const clientType = clientTypes.get(ws);
            console.error(`❌ WebSocket помилка від ${clientType || "невідомий"}:`, error);
            // Видаляємо клієнта при помилці
            clientTypes.delete(ws);
            esp32LastUpdate.delete(ws);
            // Якщо була помилка з ESP32, перевіряємо статус
            if (clientType === "esp32") {
                console.log("📡 ESP32 помилка - перевіряємо статус");
                setTimeout(() => {
                    checkAndBroadcastStatus(wss);
                }, 100);
            }
        });
    });
    // Ping clients periodically
    setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive)
                return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, HEARTBEAT_MS);
    console.log("✅ WebSocket доступний на /ws");
}
async function getLatestSensorData(limit = 10) {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const [humidityRows] = await database_1.default.execute(`SELECT humidity, timestamp FROM humidity ORDER BY timestamp DESC LIMIT ?`, [safeLimit]);
    const [co2Rows] = await database_1.default.execute(`SELECT co2, timestamp FROM co2 ORDER BY timestamp DESC LIMIT ?`, [safeLimit]);
    return {
        humidity: humidityRows.map((r) => ({
            humidity: Number(r.humidity),
            timestamp: (0, dayjs_1.default)(r.timestamp).format("HH:mm"),
        })),
        co2: co2Rows.map((r) => ({
            co2: Number(r.co2),
            timestamp: (0, dayjs_1.default)(r.timestamp).format("HH:mm"),
        })),
    };
}
async function sendSensorDataToWebClients(wss) {
    try {
        const latestData = await getLatestSensorData(10);
        const message = JSON.stringify({
            device: "server",
            type: "sensorHistory",
            data: latestData,
        });
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN &&
                clientTypes.get(client) === "web") {
                client.send(message);
            }
        });
    }
    catch (err) {
        console.error("❌ Failed to send sensor history to clients:", err);
    }
}
function haveFreshCoreValues() {
    return humidityLevel !== null && CO2Level !== null;
}
async function insertIfNumber(table, column, value) {
    if (typeof value !== "number")
        return;
    await database_1.default.execute(`INSERT INTO ${table} (${column}) VALUES (?)`, [value]);
}
async function saveSensorData(wss) {
    // Do not save when ESP32 is offline
    if (!hasActiveESP32()) {
        console.log("⏭️ Skip save: ESP32 offline");
        return;
    }
    console.log("saveSensorData called", {
        humidityLevel,
        CO2Level,
        tempInside,
        tempOutside,
    });
    try {
        if (haveFreshCoreValues()) {
            await insertIfNumber("humidity", "humidity", humidityLevel);
            await insertIfNumber("co2", "co2", CO2Level);
            await insertIfNumber("temp_inside", "temp_inside", tempInside);
            await insertIfNumber("temp_outside", "temp_outside", tempOutside);
            console.log("💾 Sensor data saved to DB", { humidityLevel, CO2Level, tempInside, tempOutside });
            await sendSensorDataToWebClients(wss);
        }
        else {
            console.log("⚠️ No complete core sensor data to save (humidity & co2 required)");
        }
    }
    catch (err) {
        console.error("❌ Error saving sensor data:", err);
    }
}
// Aggregate last hour (or partial) into fixed 5‑minute buckets; upsert into sensor_analytics
async function aggregateSensorAnalytics() {
    try {
        // Round current time down to 5 minute bucket
        const [bucketRow] = await database_1.default.execute(`SELECT date_trunc('minute', now()) - ((extract(minute from now())::int % 5) * interval '1 minute') AS bucket`);
        const bucketStart = bucketRow[0].bucket;
        // Compute averages for the current 5 minute window
        const [rows] = await database_1.default.execute(`WITH window AS (
				SELECT * FROM generate_series(
					(date_trunc('minute', to_timestamp($1)) - ((extract(minute from to_timestamp($1))::int % 5) * interval '1 minute')),
					date_trunc('minute', to_timestamp($1)),
					interval '1 minute'
				) AS minute
			)
			SELECT
				(SELECT AVG(humidity) FROM humidity WHERE timestamp >= $2 AND timestamp < $3) AS avg_humidity,
				(SELECT AVG(co2) FROM co2 WHERE timestamp >= $2 AND timestamp < $3) AS avg_co2,
				(SELECT AVG(temp_inside) FROM temp_inside WHERE timestamp >= $2 AND timestamp < $3) AS avg_temp_inside,
				(SELECT AVG(temp_outside) FROM temp_outside WHERE timestamp >= $2 AND timestamp < $3) AS avg_temp_outside,
				(SELECT COUNT(*) FROM humidity WHERE timestamp >= $2 AND timestamp < $3) AS samples
			`, [Date.now() / 1000, bucketStart, `${bucketStart} + interval '5 minute'`]);
        const agg = rows[0];
        if (!agg)
            return;
        await database_1.default.execute(`INSERT INTO sensor_analytics (bucket_start, avg_humidity, avg_co2, avg_temp_inside, avg_temp_outside, samples)
			 VALUES ($1,$2,$3,$4,$5,$6)
			 ON CONFLICT (bucket_start)
			 DO UPDATE SET avg_humidity = EXCLUDED.avg_humidity,
				avg_co2 = EXCLUDED.avg_co2,
				avg_temp_inside = EXCLUDED.avg_temp_inside,
				avg_temp_outside = EXCLUDED.avg_temp_outside,
				samples = EXCLUDED.samples,
				updated_at = now()`, [
            bucketStart,
            agg.avg_humidity,
            agg.avg_co2,
            agg.avg_temp_inside,
            agg.avg_temp_outside,
            agg.samples,
        ]);
        console.log("📊 Analytics aggregated for bucket", bucketStart, agg);
    }
    catch (err) {
        console.error("❌ Failed to aggregate analytics:", err);
    }
}
