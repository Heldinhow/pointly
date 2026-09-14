import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	server: {
		port: 5173,
		proxy: {
			"/api": "http://localhost:3001",
			"/ws": {
				target: "ws://localhost:3001",
				ws: true,
			},
		},
	},
	preview: {
		port: 5199,
		proxy: {
			"/api": "http://localhost:3001",
			"/ws": {
				target: "ws://localhost:3001",
				ws: true,
			},
		},
	},
});
