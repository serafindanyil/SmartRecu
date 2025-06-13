import { useContext } from "react";
import type { TWebSocketContextType } from "../types/TWebSocket";
import { WebSocketContext } from "../context/WebSocketProvider";

function useWebSocket(): TWebSocketContextType {
	const context = useContext(WebSocketContext);
	if (context === undefined) {
		throw new Error("useWebSocket must be used within a WebSocketProvider");
	}
	return context;
}

export default useWebSocket;
