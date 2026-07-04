/**
 * Playwright config — Pointly multi-client E2E tests.
 *
 * Phase 8 (T42): webServer spawns BOTH the Bun server (port 3001) and the
 * Vite dev server (port 5173) via `bun run dev`, proxied through Vite's
 * `/ws` and `/api` rewrites.
 *
 * Reference: ADR-0006 (Bun + Hono + Bun.serve), ADR-0007 (Vite dev server).
 */
import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = Number(process.env.WEB_PORT ?? 5173);
const BASE_URL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
	testDir: "./",
	testMatch: /.*\.spec\.ts/,
	// Multi-client specs (T43) compartilham uma sala, então NÃO paralelizar.
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	timeout: 30_000,
	expect: { timeout: 5_000 },

	use: {
		baseURL: BASE_URL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},

	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1440, height: 900 },
			},
		},
	],

	webServer: {
		// Sobe Vite (porta 5173) + Bun server (porta 3001) em paralelo.
		// Vite faz proxy de /ws e /api → 3001, então o browser só precisa
		// falar com 5173. Isso espelha a experiência real do dev workflow.
		command: "cd ../.. && bun run dev",
		url: BASE_URL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});
