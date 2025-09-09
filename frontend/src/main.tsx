import App from "./App.tsx";
import "./index.css";

import { createRoot } from "react-dom/client";
import { WebSocketProvider } from "./context/WebSocketProvider.ts";
import { TimerProvider } from "./context/TimerProvider.ts";

import { registerSW } from "virtual:pwa-register";
registerSW();

createRoot(document.getElementById("root")!).render(
	<WebSocketProvider>
		<TimerProvider>
			<App />
		</TimerProvider>
	</WebSocketProvider>
);
