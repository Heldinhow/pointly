/**
 * T11 — Topbar (BEFORE).
 * Baseline: <span>-only, sem <dl>.
 */
import { expect, test } from "@playwright/test";

test("T11-before: topbar sem <dl>", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	const dl = page.locator("header dl");
	expect(await dl.count()).toBe(0);

	await page.screenshot({
		path: "../../screenshots/T11-before.png",
		fullPage: false,
	});
});
