import React, {
	createContext,
	useRef,
	useCallback,
	useState,
	useEffect,
} from "react";

import type {
	TMessagePayload,
	TSensorData,
	TAirQualityConfig,
	TConnectionStatus,
	TWebSocketContextType,
	TWebSocketSetupData,
} from "../types/TWebSocket";

import type { TChangeMode } from "../types/TChangeMode";

export const WebSocketContext = createContext<
	TWebSocketContextType | undefined
>(undefined);

interface WebSocketProviderProps {
	children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null
	);
	const reconnectAttemptsRef = useRef(0);

	const [sensorData, setSensorData] = useState<TSensorData | null>(null);
	const [indicatorConfig, setIndicatorConfig] =
		useState<TAirQualityConfig | null>(null);
	const [switchState, setSwitchState] = useState<boolean>(false);
	const [changeMode, setChangeMode] = useState<TChangeMode>("auto");
	const [fanInSpeed, setFanInSpeed] = useState<number>(0);
	const [fanOutSpeed, setFanOutSpeed] = useState<number>(0);
	const [connectionStatus, setConnectionStatus] =
		useState<TConnectionStatus>("Offline");
	const [error, setError] = useState<string | null>(null);

	const url = import.meta.env.VITE_WEBSOCKET_URL;
	const maxReconnectAttempts = 5;
	const reconnectDelay = 3000;

	const cleanup = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}
		if (socketRef.current) {
			socketRef.current.close();
			socketRef.current = null;
		}
	}, []);

	const connect = useCallback(() => {
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			return;
		}

		cleanup();
		setError(null);

		try {
			const socket = new WebSocket(url);
			socketRef.current = socket;

			socket.addEventListener("open", () => {
				console.log("✅ WebSocket connected");
				setError(null);
				reconnectAttemptsRef.current = 0;

				// Ідентифікуємо себе як web клієнт
				socket.send(JSON.stringify({ device: "web", type: "identify" }));
			});

			socket.addEventListener("message", (event) => {
				try {
					const message: TMessagePayload = JSON.parse(event.data);
					console.log("📨 Message from server:", message);

					if (message.device === "server") {
						switch (message.type) {
							case "setup":
								if (message.data as TWebSocketSetupData) {
									setIndicatorConfig(
										(message.data as TWebSocketSetupData).metrics
									);
									setSwitchState(
										(message.data as TWebSocketSetupData).switchState
									);
									setChangeMode((message.data as TWebSocketSetupData).mode);
									setFanInSpeed((message.data as TWebSocketSetupData).fanInSpd);
									setFanOutSpeed(
										(message.data as TWebSocketSetupData).fanOutSpd
									);
								}
								break;
							case "update":
								if (message.data) {
									setSensorData(message.data as TSensorData);
								}
								break;
							case "status":
								if (message.data) {
									setConnectionStatus(message.data as TConnectionStatus);
								}
								break;
							case "switchState":
								setSwitchState(message.data as boolean);
								break;
							case "changeMode":
								setChangeMode(message.data as TChangeMode);
								break;
							case "changeFanInSpd":
								setFanInSpeed(message.data as number);
								break;
							case "changeFanOutSpd":
								setFanOutSpeed(message.data as number);
								break;
							case "pong":
								break;
							default:
								console.log("Unknown message type:", message.type);
						}
					}
				} catch (error) {
					console.warn(`⚠️ Received non-JSON message: ${error}`, event.data);
				}
			});

			socket.addEventListener("close", (event) => {
				console.log("❌ WebSocket disconnected", event.code, event.reason);
				socketRef.current = null;

				if (reconnectAttemptsRef.current < maxReconnectAttempts) {
					reconnectAttemptsRef.current++;
					console.log(
						`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
					);

					reconnectTimeoutRef.current = setTimeout(() => {
						connect();
					}, reconnectDelay);
				} else {
					setError("Максимальна кількість спроб підключення вичерпана");
				}
			});

			socket.addEventListener("error", (event) => {
				console.error("❌ WebSocket error:", event);
				setError("Помилка з'єднання з сервером");
			});
		} catch (err) {
			console.error("❌ Failed to create WebSocket:", err);
			setError("Не вдалося створити з'єднання");
		}
	}, [url, cleanup]);

	const sendMessage = useCallback((type: string, data?: unknown) => {
		const message: TMessagePayload = {
			device: "web",
			type,
			data,
		};

		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify(message));
		} else {
			console.warn("⚠️ Cannot send message: socket not connected");
			setError("Неможливо відправити повідомлення: немає з'єднання");
		}
	}, []);

	const reconnect = useCallback(() => {
		reconnectAttemptsRef.current = 0;
		connect();
	}, [connect]);

	// Ping/keepalive механізм
	// useEffect(() => {
	// 	const pingInterval = setInterval(() => {
	// 		if (socketRef.current?.readyState === WebSocket.OPEN) {
	// 			sendMessage("ping");
	// 		}
	// 	}, 30000); // Ping кожні 30 секунд

	// 	return () => clearInterval(pingInterval);
	// }, [sendMessage]);

	useEffect(() => {
		connect();
		return cleanup;
	}, [connect, cleanup]);

	const contextValue: TWebSocketContextType = {
		sensorData,
		switchState,
		changeMode,
		fanInSpeed,
		fanOutSpeed,
		indicatorConfig,
		connectionStatus,
		error,
		sendMessage,
		reconnect,
	};

	return React.createElement(
		WebSocketContext.Provider,
		{ value: contextValue },
		children
	);
}
