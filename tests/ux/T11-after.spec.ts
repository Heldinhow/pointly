/**
 * T11 — Topbar de sala: <dl>/<dt>/<dd> semântica (AFTER).
 *
 * Critério (Heldinhow/pointly#49):
 * - Topbar usa <dl> com <dt>/<dd> para cada par label/valor.
 * - Separador · entre grupos.
 * - axe-core definition-list não reporta issues.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("T11-after: topbar usa <dl>/<dt>/<dd>", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	// Procura o topbar com role=status. O topbar está dentro de <header>.
	const topbar = page.locator("header dl").first();
	const dlCount = await topbar.count();
	console.log(`[T11-after] <dl> in header count: ${dlCount}`);
	expect(dlCount).toBeGreaterThanOrEqual(1);

	const dtCount = await topbar.locator("dt").count();
	const ddCount = await topbar.locator("dd").count();
	console.log(`[T11-after] dt=${dtCount} dd=${ddCount}`);
	expect(dtCount).toBeGreaterThanOrEqual(3);
	expect(ddCount).toBeGreaterThanOrEqual(3);

	// data-testids preservados.
	const code = page.getByTestId("arena-code");
	const round = page.getByTestId("arena-round");
	const self = page.getByTestId("arena-self-nick");
	await expect(code).toBeVisible();
	await expect(round).toBeVisible();
	await expect(self).toBeVisible();
});

test("T11-after: axe-core 0 serious/critical em /arena", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);
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
		path: "../../screenshots/T11-after.png",
		fullPage: false,
	});
});
