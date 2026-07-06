/**
 * T5 — Feature cards (BEFORE).
 * Baseline: cada card tem só número + label "Feature" + título + body, sem ícone.
 */
import { expect, test } from "@playwright/test";

test("T5-before: feature cards sem svg", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const card = page.getByTestId("cap-card-01");
	const svgCount = await card.locator("svg").count();
	expect(svgCount).toBe(0);

	await page.screenshot({ path: "../../screenshots/T5-before.png", fullPage: false });
});