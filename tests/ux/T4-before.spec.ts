/**
 * T4 — Header (BEFORE).
 * Baseline: side-rails sem aria-hidden, font-family Inter Tight (não mono).
 */
import { expect, test } from "@playwright/test";

test("T4-before: side-rails expostos a screen readers", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const rails = page.locator(".side-rail");
	const ariaHidden = await rails.first().getAttribute("aria-hidden");
	expect(ariaHidden).toBeNull();

	await page.screenshot({ path: "../../screenshots/T4-before.png", fullPage: false });
});