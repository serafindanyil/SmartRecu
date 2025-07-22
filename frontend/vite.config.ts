import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import type { ManifestOptions } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";

import path from "path";

const manifest: Partial<ManifestOptions> | false = {
	theme_color: "#ffffff",
	background_color: "#ffffff",
	icons: [
		{
			purpose: "maskable",
			sizes: "512x512",
			src: "icon512_maskable.png",
			type: "image/png",
		},
		{
			purpose: "any",
			sizes: "512x512",
			src: "icon512_rounded.png",
			type: "image/png",
		},
	],
	orientation: "portrait",
	display: "standalone",
	lang: "uk-UA",
	name: "SmartRecuperator",
	short_name: "SmartRecu",
	description:
		"The app for smart recuperator. Created by Serafin Danyil ©2025 SmartRecu - All rights reserved",
};

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			workbox: { globPatterns: ["**/*.{js,css,html,png,svg}"] },
			manifest: manifest,
		}),
		svgr(),
	],
	server: {
		host: true,
		port: 8080,
		strictPort: true,
		watch: {
			usePolling: true,
		},
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "src"),
		},
	},
});
