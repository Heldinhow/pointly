import { expect, test } from "@playwright/test";
import { newPlayer, wirePlayer } from "./helpers/room";

function isAnalyticsHost(host: string): boolean {
	return ["googletagmanager.com", "google-analytics.com", "doubleclick.net"]
		.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

test("navegar não tenta carregar analytics mesmo com ID de build", async ({ browser }, testInfo) => {
	const { page, ctx } = await newPlayer(browser, testInfo);
	const player = wirePlayer(page, "PrivacyAudit");
	const attempts: string[] = [];
	page.on("request", (request) => {
		if (isAnalyticsHost(new URL(request.url()).hostname)) attempts.push(request.url());
	});
	try {
		await page.goto("/");
		await page.getByRole("link", { name: /^(Criar sala|Create room)$/ }).first().click();
		await page.locator("#nick").fill("PrivacyAudit");
		await page.goto("/join?code=ABCD");
		await expect(page.locator("#nick")).toBeVisible();
		await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
		expect(await page.evaluate(() => "gtag" in window ? typeof window.gtag : "undefined")).toBe("undefined");
		expect(attempts).toEqual([]);
		player.guard.assertClean();
	} finally {
		player.guard.detach();
		await ctx.close();
	}
});
