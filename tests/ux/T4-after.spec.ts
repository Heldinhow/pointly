/**
 * T4 — Header do lobby: hierarquia tipográfica consistente + aria-hidden (AFTER).
 *
 * Critério (Heldinhow/pointly#51):
 * - Texto vertical lateral (side-rail) tem aria-hidden="true" no DOM.
 * - Tipografia usa font-family mono consistente.
 */
import { expect, test } from "@playwright/test";

test("T4-after: side-rails decorativos têm aria-hidden", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const rails = page.locator(".side-rail");
	const count = await rails.count();
	expect(count).toBeGreaterThanOrEqual(2);

	for (let i = 0; i < count; i++) {
		const ariaHidden = await rails.nth(i).getAttribute("aria-hidden");
		expect(ariaHidden).toBe("true");
	}
});

test("T4-after: rail-text usa font-mono", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const railTexts = page.locator(".rail-text");
	const count = await railTexts.count();
	expect(count).toBeGreaterThanOrEqual(2);

	const fontFamily = await railTexts.first().evaluate(
		(el) => window.getComputedStyle(el).fontFamily,
	);
	console.log(`[T4-after] rail-text font-family: ${fontFamily}`);
	expect(fontFamily.toLowerCase()).toMatch(/mono|jetbrains|courier|ui-monospace/);
});

test("T4-after: screenshot", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);
	await page.screenshot({ path: "../../screenshots/T4-after.png", fullPage: false });
});