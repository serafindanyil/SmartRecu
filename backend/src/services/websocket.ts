import { Server as WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";
import db from "../database";
import dayjs from "dayjs";

import metrics from "../instructions/metrics.json";
import { TMode } from "src/types/TMode";

// Тип повідомлень
type MessagePayload = {
	device: "esp32" | "web";
	type: string;
	data?: any;
};

// Зберігаємо типи клієнтів
const clientTypes = new Map<WebSocket, "esp32" | "web">();

// Зберігаємо останній час отримання update від ESP32
const esp32LastUpdate = new Map<WebSocket, number>();

// Зберігаємо останній відомий статус ESP32
let lastESP32Status: "Online" | "Offline" = "Offline";

// Ініціалізовані динамічні дані з ESP32
let switchState: boolean | null = null;
let mode: TMode | null = null;

let fanInSpeed: number | null = null;
let fanOutSpeed: number | null = null;

let humidityLevel: number | null = null;
let CO2Level: number | null = null;
let tempInside: number | null = null;
let tempOutside: number | null = null;

const handleSensorUpdate = (data: {
	co2: number;
	humidity: number;
	tempIn: number;
	tempOut: number;
}) => {
	humidityLevel = data.humidity;
	CO2Level = data.co2;
	tempInside = data.tempIn;
	tempOutside = data.tempOut;
};

// Функція для надсилання статусу ESP32 всім web клієнтам
function broadcastESP32Status(
	wss: WebSocketServer,
	status: "Online" | "Offline"
) {
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
			if (
				client.readyState === WebSocket.OPEN &&
				clientTypes.get(client) === "web"
			) {
				client.send(statusMessage);
			}
		});
	}
}

// Функція для перевірки чи є активний ESP32 (отримували update протягом 4 секунд)
function hasActiveESP32(): boolean {
	const currentTime = Date.now();
	const timeout = 3000; // 3 секунди

	return Array.from(esp32LastUpdate.entries()).some(([client, lastUpdate]) => {
		const isClientOpen = client.readyState === WebSocket.OPEN;
		const isRecent = currentTime - lastUpdate < timeout;
		return isClientOpen && isRecent;
	});
}

// Функція для перевірки статусу і надсилання оновлень
function checkAndBroadcastStatus(wss: WebSocketServer) {
	const currentStatus = hasActiveESP32() ? "Online" : "Offline";
	broadcastESP32Status(wss, currentStatus);
}

export function setupWebSocket(server: HTTPServer) {
	const wss = new WebSocketServer({ server, path: "/ws" });

	const HEARTBEAT_MS = 30000;

	const statusCheckInterval = setInterval(() => {
		checkAndBroadcastStatus(wss);
	}, 2000);

	const saveDataInterval = setInterval(() => {
		console.log("⏰ saveSensorData interval called");
		saveSensorData();
		sendSensorDataToWebClients(wss);
	}, 120000);

	wss.on("close", () => {
		clearInterval(statusCheckInterval);
		clearInterval(saveDataInterval);
	});

	wss.on("connection", (ws: WebSocket, req) => {
		const ip = req.socket.remoteAddress;
		console.log(`🔌 Клієнт підключився: ${ip}`);

		// Mark alive on pong
		// @ts-expect-error augment
		ws.isAlive = true;
		ws.on("pong", () => {
			// @ts-expect-error augment
			ws.isAlive = true;
		});

		ws.on("message", async (message: string) => {
			try {
				const parsed: MessagePayload = JSON.parse(message);
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
									if (
										client !== ws &&
										client.readyState === WebSocket.OPEN &&
										clientTypes.get(client) === "web"
									) {
										client.send(
											JSON.stringify({
												device: "server",
												type: "update",
												data: parsed.data,
											})
										);
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
									if (
										client !== ws &&
										client.readyState === WebSocket.OPEN &&
										clientTypes.get(client) === "web"
									) {
										client.send(
											JSON.stringify({
												device: "server",
												type: "switchState",
												data: parsed.data,
											})
										);
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
									if (
										client !== ws &&
										client.readyState === WebSocket.OPEN &&
										clientTypes.get(client) === "web"
									) {
										client.send(
											JSON.stringify({
												device: "server",
												type: "changeMode",
												data: parsed.data,
											})
										);
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
									if (
										client !== ws &&
										client.readyState === WebSocket.OPEN &&
										clientTypes.get(client) === "web"
									) {
										client.send(
											JSON.stringify({
												device: "server",
												type: "changeFanInSpd",
												data: parsed.data,
											})
										);
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
									if (
										client !== ws &&
										client.readyState === WebSocket.OPEN &&
										clientTypes.get(client) === "web"
									) {
										client.send(
											JSON.stringify({
												device: "server",
												type: "changeFanOutSpd",
												data: parsed.data,
											})
										);
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
								ws.send(
									JSON.stringify({
										device: "server",
										type: "setup",
										data: {
											metrics: metrics,
											switchState: switchState,
											mode: mode,
											fanInSpd: fanInSpeed,
											fanOutSpd: fanOutSpeed,
										},
									})
								);

								// Надсилаємо поточний статус ESP32
								ws.send(
									JSON.stringify({
										device: "server",
										type: "status",
										data: hasActiveESP32() ? "Online" : "Offline",
									})
								);

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
									if (
										type === "esp32" &&
										client.readyState === WebSocket.OPEN
									) {
										client.send(
											JSON.stringify({
												device: "server",
												type: "switchState",
												data: parsed.data,
											})
										);
									}
								}
								break;

							case "changeMode":
								for (const [client, type] of clientTypes.entries()) {
									if (
										type === "esp32" &&
										client.readyState === WebSocket.OPEN
									) {
										client.send(
											JSON.stringify({
												device: "server",
												type: "changeMode",
												data: parsed.data,
											})
										);
									}
								}
								break;
							case "changeFanInSpd":
								for (const [client, type] of clientTypes.entries()) {
									if (
										type === "esp32" &&
										client.readyState === WebSocket.OPEN
									) {
										client.send(
											JSON.stringify({
												device: "server",
												type: "changeFanInSpd",
												data: parsed.data,
											})
										);
									}
								}
								break;

							case "changeFanOutSpd":
								for (const [client, type] of clientTypes.entries()) {
									if (
										type === "esp32" &&
										client.readyState === WebSocket.OPEN
									) {
										client.send(
											JSON.stringify({
												device: "server",
												type: "changeFanOutSpd",
												data: parsed.data,
											})
										);
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
			} catch (err) {
				console.error(
					"❌ Помилка парсингу повідомлення:",
					err,
					"Повідомлення:",
					message
				);
			}
		});

		ws.on("close", (code, reason) => {
			const clientType = clientTypes.get(ws);
			console.log(
				`❌ Клієнт ${clientType || "невідомий"} відключився (код: ${code})`
			);

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
			console.error(
				`❌ WebSocket помилка від ${clientType || "невідомий"}:`,
				error
			);

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
		wss.clients.forEach((ws: any) => {
			if (!ws.isAlive) return ws.terminate();
			ws.isAlive = false;
			ws.ping();
		});
	}, HEARTBEAT_MS);

	console.log("✅ WebSocket доступний на /ws");
}

async function saveSensorData() {
	console.log("saveSensorData called", {
		humidityLevel,
		CO2Level,
		tempInside,
		tempOutside,
	});
	try {
		if (humidityLevel !== null && CO2Level !== null) {
			await db.execute("CALL insert_humidity(?)", [humidityLevel]);
			await db.execute("CALL insert_co2(?)", [CO2Level]);
			await db.execute("CALL insert_temp_inside(?)", [tempInside]);
			await db.execute("CALL insert_temp_outside(?)", [tempOutside]);
			console.log("💾 Sensor data saved to DB (via procedures):", {
				humidityLevel,
				CO2Level,
				tempInside,
				tempOutside,
			});
		} else {
			console.log("⚠️ No sensor data to save");
		}
	} catch (err) {
		console.error("❌ Error saving sensor data:", err);
	}
}

async function sendSensorDataToWebClients(wss: WebSocketServer) {
	const latestData = await getLatestSensorData(10); // <-- тільки 10 останніх
	const message = JSON.stringify({
		device: "server",
		type: "sensorHistory",
		data: latestData,
	});
	wss.clients.forEach((client: WebSocket) => {
		if (
			client.readyState === WebSocket.OPEN &&
			clientTypes.get(client) === "web"
		) {
			client.send(message);
		}
	});
}

async function getLatestSensorData(limit = 20) {
	const safeLimit = Math.max(1, Math.min(limit, 100));
	const [humidityRows] = await db.execute(
		`SELECT humidity, timestamp FROM humidity ORDER BY timestamp DESC LIMIT ${safeLimit}`
	);
	const [co2Rows] = await db.execute(
		`SELECT co2, timestamp FROM co2 ORDER BY timestamp DESC LIMIT ${safeLimit}`
	);
	const [tempInsideRows] = await db.execute(
		`SELECT temp_inside, timestamp FROM temp_inside ORDER BY timestamp DESC LIMIT ${safeLimit}`
	);
	const [tempOutsideRows] = await db.execute(
		`SELECT temp_outside, timestamp FROM temp_outside ORDER BY timestamp DESC LIMIT ${safeLimit}`
	);

	// Форматуємо timestamp у "HH:mm"
	const humidity = (humidityRows as any[]).map((row) => ({
		humidity: row.humidity,
		time: dayjs(row.timestamp).format("HH:mm"),
	}));
	const co2 = (co2Rows as any[]).map((row) => ({
		co2: row.co2,
		time: dayjs(row.timestamp).format("HH:mm"),
	}));
	const tempInside = (tempInsideRows as any[]).map((row) => ({
		tempInside: row.temp_inside,
		time: dayjs(row.timestamp).format("HH:mm"),
	}));
	const tempOutside = (tempOutsideRows as any[]).map((row) => ({
		tempOutside: row.temp_outside,
		time: dayjs(row.timestamp).format("HH:mm"),
	}));

	return {
		humidity,
		co2,
		tempInside,
		tempOutside,
	};
}
