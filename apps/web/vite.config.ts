/**
 * Vite config — Pointly web app
 *
 * Phase 1 (T6): proxy `/api` and `/ws` → :3001 server.
 * Phase 6+: Tailwind tokens + shadcn/ui (T25/T26).
 *
 * Reference: ADR-0007 (React+Vite+TS), ADR-0010 (shadcn/ui).
 *
 * Tests are run via `bun test` (apps/web/package.json). No vitest dependency.
 */
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "src"),
			"@planning-poker/shared": path.resolve(
				import.meta.dirname,
				"../../packages/shared/src/index.ts",
			),
		},
	},
	server: {
		port: 5173,
		strictPort: true,
		proxy: {
			"/api": {
				target: "http://localhost:3001",
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: "dist",
		sourcemap: true,
		target: "es2022",
	},
});
