/**
 * T8 — Footer (BEFORE).
 * Baseline: 3 colunas sem <nav> wrapper.
 */
import { expect, test } from "@playwright/test";

test("T8-before: footer sem <nav aria-label='Rodapé'>", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const nav = page.locator('nav[aria-label="Rodapé"]');
	expect(await nav.count()).toBe(0);

	await page.screenshot({ path: "../../screenshots/T8-before.png", fullPage: false });
});