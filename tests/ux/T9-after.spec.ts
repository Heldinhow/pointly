/**
 * T9 — Arena vazia: skeleton placeholders (AFTER).
 *
 * Critério (Heldinhow/pointly#47):
 * - Quando sala tem 1 jogador (ou 0), DOM tem ≥ 2 elementos com
 *   aria-label="Slot aguardando jogador" (semi-transparentes).
 * - Quando ≥ 2 jogadores, esses elementos somem.
 * - axe-core 0 violações serious/critical em /arena.
 *
 * Sem WS mock, testamos via /arena (sala=null) que cai no branch.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("T9-after: /arena mostra placeholders (sala=null ou 1 player)", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	const slots = page.locator('[aria-label="Slot aguardando jogador"]');
	const count = await slots.count();
	console.log(`[T9-after] slot count: ${count}`);
	expect(count).toBeGreaterThanOrEqual(2);

	// pointer-events: none + opacity baixa.
	const first = slots.first();
	const pe = await first.evaluate(
		(el) => window.getComputedStyle(el).pointerEvents,
	);
	const op = await first.evaluate((el) =>
		Number(window.getComputedStyle(el).opacity),
	);
	console.log(`[T9-after] pointer-events: ${pe}, opacity: ${op}`);
	expect(pe).toBe("none");
	expect(op).toBeLessThan(0.6);

	await page.screenshot({
		path: "../../screenshots/T9-after.png",
		fullPage: false,
	});
});

test("T9-after: axe-core 0 serious/critical em /arena", async ({ page }) => {
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
});
