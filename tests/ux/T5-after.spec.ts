/**
 * T5 — Feature cards: ícone visual (AFTER fix).
 *
 * Critério (Heldinhow/pointly#44):
 * - Cada .feature-card (cap-card-{n}) contém <svg aria-hidden="true">.
 * - Ícone tem class="text-coral w-5 h-5" (ou similar — testa cor coral e 20px).
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("T5-after: cada feature card tem SVG aria-hidden", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	for (const n of ["01", "02", "03", "04"]) {
		const card = page.getByTestId(`cap-card-${n}`);
		await expect(card).toBeVisible();
		const svg = card.locator("svg[aria-hidden='true']");
		await expect(svg).toHaveCount(1);
	}
});

test("T5-after: ícones renderizam 20px coral", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const card = page.getByTestId("cap-card-01");
	const svg = card.locator("svg[aria-hidden='true']").first();
	const box = await svg.boundingBox();
	expect(box).not.toBeNull();
	// SVG element should be ~20x20 (allow ±2px for sub-pixel rounding).
	expect(box!.width).toBeGreaterThanOrEqual(18);
	expect(box!.width).toBeLessThanOrEqual(22);
	expect(box!.height).toBeGreaterThanOrEqual(18);
	expect(box!.height).toBeLessThanOrEqual(22);

	// Cor via stroke ou fill — Lucide usa currentColor + stroke.
	const stroke = await svg.evaluate((el) => window.getComputedStyle(el).color);
	console.log(`[T5-after] svg color: ${stroke}`);
	// Tailwind text-coral resolve para var(--accent) que é coral rgb.
	expect(stroke).toMatch(/rgb\(210,\s*74,\s*42\)|rgb\(2[0-5]\d/);
});

test("T5-after: axe-core 0 serious/critical em /", async ({ page }) => {
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

	await page.screenshot({
		path: "../../screenshots/T5-after.png",
		fullPage: false,
	});
});
