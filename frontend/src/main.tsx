import { createRoot } from "react-dom/client";
import { WebSocketProvider } from "./context/WebSocketProvider.ts";
import "./index.css";
import App from "./App.tsx";

import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")!).render(
	<WebSocketProvider>
		<App />
	</WebSocketProvider>
);

registerSW({ immediate: true });
