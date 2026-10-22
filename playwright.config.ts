import { defineConfig, devices } from "@playwright/test";

const outputDir =
	process.env.PLAYWRIGHT_OUTPUT_DIR ?? "test-results";
const reportDir =
	process.env.PLAYWRIGHT_HTML_REPORT ?? "playwright-report";

export default defineConfig({
	testDir: "./e2e",
	timeout: 60_000,
	expect: { timeout: 15_000 },
	fullyParallel: false,
	workers: 1,
	retries: 0,
	outputDir,
	reporter: [
		["list"],
		["json", { outputFile: `${outputDir}/report.json` }],
		["html", { outputFolder: reportDir, open: "never" }],
	],
	use: {
		baseURL: "http://localhost:5179",
		locale: "pt-BR",
		timezoneId: "America/Sao_Paulo",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "off",
		launchOptions: {
			executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
		},
	},
	projects: [
		{
			name: "chromium-desktop",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1280, height: 800 },
			},
		},
		{
			name: "chromium-mobile",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 390, height: 844 },
				isMobile: true,
				hasTouch: true,
			},
		},
	],
	webServer: [
		{
			command: "bun run src/index.ts",
			cwd: "apps/server",
			port: 3001,
			reuseExistingServer: false,
			stdout: "pipe",
			stderr: "pipe",
			// Suite cria dezenas de salas do mesmo IP: relaxa os limites anti-abuso.
			env: {
				PORT: "3001",
				ROOM_CREATE_PER_MIN: "100000",
				UNKNOWN_CODE_PER_MIN: "100000",
				LOOKUP_PER_MIN: "100000",
			},
		},
		{
			command: "bunx vite --port 5179 --strictPort",
			cwd: "apps/web",
			port: 5179,
			reuseExistingServer: false,
			stdout: "pipe",
			stderr: "pipe",
			env: { VITE_GA_MEASUREMENT_ID: "G-POINTLY-E2E-DISABLED" },
		},
	],
});
