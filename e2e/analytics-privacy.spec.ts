import { expect, test } from "@playwright/test";
import { newPlayer, wirePlayer } from "./helpers/room";

const CONSENT_KEY = "pointly.analytics-consent";

function isAnalyticsHost(host: string): boolean {
	return ["googletagmanager.com", "google-analytics.com", "doubleclick.net"]
		.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** Captura tentativas de rede para hosts de analytics sem sair para a internet. */
async function stubAnalyticsNetwork(page: import("@playwright/test").Page): Promise<string[]> {
	const attempts: string[] = [];
	page.on("request", (request) => {
		if (isAnalyticsHost(new URL(request.url()).hostname)) attempts.push(request.url());
	});
	await page.route("**/googletagmanager.com/**", (route) =>
		route.fulfill({ status: 200, contentType: "application/javascript", body: "/* stub */" }),
	);
	await page.route("**/google-analytics.com/**", (route) =>
		route.fulfill({ status: 204, body: "" }),
	);
	return attempts;
}

test("sem escolha ou após Recusar, zero requests a analytics e banner persistente", async ({ browser }, testInfo) => {
	const { page, ctx } = await newPlayer(browser, testInfo);
	const player = wirePlayer(page, "PrivacyAudit");
	const attempts = await stubAnalyticsNetwork(page);
	const banner = page.getByTestId("analytics-consent-banner");
	const script = page.locator('script[src*="googletagmanager.com/gtag/js"]');
	try {
		await page.goto("/");
		await expect(banner).toBeVisible();
		await expect(page.getByTestId("analytics-consent-accept")).toBeVisible();
		await expect(page.getByTestId("analytics-consent-reject")).toBeVisible();
		await expect(script).toHaveCount(0);
		expect(await page.evaluate(() => ("gtag" in window ? typeof window.gtag : "undefined"))).toBe("undefined");

		await page.getByRole("link", { name: /^(Criar sala|Create room)$/ }).first().click();
		await page.locator("#nick").fill("PrivacyAudit");
		await page.goto("/join?code=ABCD");
		await expect(page.locator("#nick")).toBeVisible();
		await expect(banner).toBeVisible();
		expect(attempts).toEqual([]);

		await page.getByTestId("analytics-consent-reject").click();
		await expect(banner).toHaveCount(0);
		expect(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY)).toBe("denied");
		await expect(script).toHaveCount(0);
		expect(await page.evaluate(() => ("gtag" in window ? typeof window.gtag : "undefined"))).toBe("undefined");

		await page.reload();
		await expect(page.locator("#nick")).toBeVisible();
		await expect(banner).toHaveCount(0);
		await expect(script).toHaveCount(0);
		expect(attempts).toEqual([]);

		await page.getByTestId("analytics-consent-open").click();
		await expect(banner).toBeVisible();
		await expect(page.getByTestId("analytics-consent-close")).toBeVisible();
		await page.getByTestId("analytics-consent-close").click();
		await expect(banner).toHaveCount(0);
		expect(attempts).toEqual([]);
		player.guard.assertClean();
	} finally {
		player.guard.detach();
		await ctx.close();
	}
});

test("Aceitar carrega gtag, envia page_view e Recusar depois interrompe a coleta", async ({ browser }, testInfo) => {
	const { page, ctx } = await newPlayer(browser, testInfo);
	const player = wirePlayer(page, "ConsentAudit");
	const attempts = await stubAnalyticsNetwork(page);
	const banner = page.getByTestId("analytics-consent-banner");
	const script = page.locator('script[src*="googletagmanager.com/gtag/js"]');

	function pageViews(): Promise<unknown[]> {
		return page.evaluate(() => {
			const layer =
				(window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];
			return layer
				.filter(
					(entry: unknown) =>
						Object.prototype.toString.call(entry) === "[object Arguments]",
				)
				.map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
				.filter((entry) => entry[1] === "page_view");
		});
	}

	try {
		await page.goto("/");
		await expect(banner).toBeVisible();
		expect(attempts).toEqual([]);

		await page.getByTestId("analytics-consent-accept").click();
		await expect(banner).toHaveCount(0);
		await expect(script).toHaveCount(1);
		expect(await page.evaluate(() => ("gtag" in window ? typeof window.gtag : "undefined"))).toBe("function");
		expect(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY)).toBe("granted");
		await expect.poll(() => attempts.length).toBeGreaterThan(0);
		await expect.poll(() => pageViews()).toContainEqual([
			"event",
			"page_view",
			{
				page_path: "/",
				page_location: "http://localhost:5179/",
			},
		]);
		const entryKinds = await page.evaluate(() =>
			((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []).map(
				(entry) => Object.prototype.toString.call(entry),
			),
		);
		expect(entryKinds.length).toBeGreaterThan(0);
		expect(entryKinds.every((kind) => kind === "[object Arguments]")).toBe(true);

		await page.getByTestId("home-cta-join").click();
		await expect(page.locator("#nick")).toBeVisible();
		await expect.poll(() => pageViews()).toContainEqual([
			"event",
			"page_view",
			{
				page_path: "/join",
				page_location: "http://localhost:5179/join",
			},
		]);

		await page.getByTestId("analytics-consent-open").click();
		await expect(banner).toBeVisible();
		await page.getByTestId("analytics-consent-reject").click();
		await expect(banner).toHaveCount(0);
		expect(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY)).toBe("denied");

		const requestsAtRevoke = attempts.length;
		const viewsAtRevoke = (await pageViews()).length;
		await page.getByRole("link", { name: /^(Guias|Guides)$/ }).click();
		await expect(page).toHaveURL(/\/guias$/);
		await expect.poll(() => pageViews()).toHaveLength(viewsAtRevoke);
		expect(attempts.length).toBe(requestsAtRevoke);

		await page.reload();
		await expect(banner).toHaveCount(0);
		await expect(script).toHaveCount(0);
		expect(await page.evaluate(() => ("gtag" in window ? typeof window.gtag : "undefined"))).toBe("undefined");
		expect(attempts.length).toBe(requestsAtRevoke);
		player.guard.assertClean();
	} finally {
		player.guard.detach();
		await ctx.close();
	}
});
