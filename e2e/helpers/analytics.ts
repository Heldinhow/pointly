import type { Page } from "@playwright/test";

const ANALYTICS_HOSTS = [
	"googletagmanager.com",
	"google-analytics.com",
	"doubleclick.net",
] as const;

export function isAnalyticsHost(host: string): boolean {
	return ANALYTICS_HOSTS.some(
		(domain) => host === domain || host.endsWith(`.${domain}`),
	);
}

/** Captura tentativas de rede para hosts de analytics sem sair para a internet. */
export async function stubAnalyticsNetwork(page: Page): Promise<string[]> {
	const attempts: string[] = [];
	page.on("request", (request) => {
		if (isAnalyticsHost(new URL(request.url()).hostname)) {
			attempts.push(request.url());
		}
	});
	await page.route("**/googletagmanager.com/**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/javascript",
			body: "/* stub */",
		}),
	);
	await page.route("**/google-analytics.com/**", (route) =>
		route.fulfill({ status: 204, body: "" }),
	);
	return attempts;
}
