import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
	plugins: [
		react(),
		svgr(), // removed invalid exportAsDefault option
		VitePWA({
			registerType: "autoUpdate",
			workbox: { globPatterns: ["**/*.{js,css,html,ico,png,svg}"] },
			manifest: {
				name: "SmartRecu",
				short_name: "SmartRecu",
				start_url: "/",
				display: "standalone",
				background_color: "#ffffff",
				theme_color: "#ffffff",
				icons: [
					{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
					{ src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
				],
			},
		}),
	],
	resolve: {
		alias: {
			"~": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
