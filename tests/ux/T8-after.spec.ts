/**
 * T8 — Footer: semântica contentinfo + nav (AFTER).
 *
 * Critério (Heldinhow/pointly#41):
 * - <footer role="contentinfo"> existe no DOM.
 * - <nav aria-label="Rodapé"> agrupa os 3 grupos (Pointly / Produto / Código Aberto).
 * - axe-core region rule passa.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("T8-after: <footer role=contentinfo>", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const footer = page.locator("footer[role='contentinfo'], footer").first();
	await expect(footer).toBeVisible();
	const role = await footer.getAttribute("role");
	// <footer> tem role=contentinfo implícito; aceitar ambos.
	expect(["contentinfo", null]).toContain(role);
});

test("T8-after: <nav aria-label='Rodapé'> agrupa colunas", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const nav = page.locator('nav[aria-label="Rodapé"]');
	await expect(nav).toHaveCount(1);
	await expect(nav).toBeVisible();

	// 3 grupos (Pointly / Produto / Código Aberto) dentro do nav.
	const groups = nav.locator(":scope > div");
	const count = await groups.count();
	expect(count).toBeGreaterThanOrEqual(3);
});

test("T8-after: axe-core 0 serious/critical em /", async ({ page }) => {
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
	await page.screenshot({ path: "../../screenshots/T8-after.png", fullPage: false });
});