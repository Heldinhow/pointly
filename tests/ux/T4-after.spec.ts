/**
 * T4 — Header do lobby: hierarquia tipográfica consistente + aria-hidden (AFTER).
 *
 * Critério (Heldinhow/pointly#51):
 * - Texto vertical lateral (side-rail) tem aria-hidden="true" no DOM.
 * - Tipografia usa font-family mono consistente.
 * - axe-core 0 violações serious/critical em /.
 */
import AxeBuilder from "@axe-core/playwright";
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

test("T4-after: axe-core 0 serious/critical em /", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const axe = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
		.analyze();
	const serious = axe.violations.filter(
		(v) => v.impact === "serious" || v.impact === "critical",
	);
	if (serious.length > 0) {
		for (const v of serious) console.log(`  - ${v.id}: ${v.help}`);
	}
	expect(serious.length).toBe(0);
});

test("T4-after: screenshot", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);
	await page.screenshot({ path: "../../screenshots/T4-after.png", fullPage: false });
});