/**
 * T9 — Arena (BEFORE).
 * Baseline: arena sem skeleton placeholders.
 */
import { expect, test } from "@playwright/test";

test("T9-before: /arena sem slot placeholders", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	const slots = page.locator('[aria-label="Slot aguardando jogador"]');
	expect(await slots.count()).toBe(0);

	await page.screenshot({ path: "../../screenshots/T9-before.png", fullPage: false });
});