/**
 * Playwright UX test runner — Pointly
 *
 * Sobe Vite (5173) + Bun server (3001) via webServer, executa os testes em
 * paralelo e expõe relatório HTML + screenshots.
 */
import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = Number(process.env.WEB_PORT ?? 5173);
const BASE_URL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
	testDir: "./",
	testMatch: /.*\.spec\.ts$/,
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: [["list"], ["html", { open: "never", outputFolder: "./report" }]],
	timeout: 45_000,
	expect: { timeout: 8_000 },

	use: {
		baseURL: BASE_URL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		viewport: { width: 1440, height: 900 },
	},

	projects: [
		{
			name: "desktop",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1440, height: 900 },
			},
		},
		{
			name: "tablet",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 820, height: 1180 },
			},
		},
		{
			name: "mobile",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 390, height: 844 },
			},
		},
	],

	webServer: {
		command: "cd ../.. && bun run dev",
		url: BASE_URL,
		reuseExistingServer: true,
		timeout: 120_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});