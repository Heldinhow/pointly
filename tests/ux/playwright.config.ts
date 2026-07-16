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
		// Mobile portrait — um projeto por viewport do brief. Mantém
		// `Desktop Chrome` (não devices[...]) porque emulamos por viewport
		// puro: o engine de touch já é simulado via media queries.
		{
			name: "mobile-iphone-se",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 375, height: 667 },
			},
		},
		{
			name: "mobile-iphone-14",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 390, height: 844 },
			},
		},
		{
			name: "mobile-pixel-7",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 412, height: 915 },
			},
		},
		{
			name: "mobile-galaxy-s23",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 360, height: 800 },
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
