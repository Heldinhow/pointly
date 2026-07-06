/**
 * T12 — Copiar link: feedback pós-clique (AFTER — Playwright a11y side).
 *
 * Critério (Heldinhow/pointly#48):
 * - Após click, texto muda para "Copiado ✓" e reverte após 2s.
 * - aria-live="polite" presente.
 * - Cor muda para olive durante o estado "Copiado ✓".
 * - axe-core 0 violações serious/critical.
 *
 * EmptyOverlay só renderiza nativamente quando há WS ativo + sala com 1
 * player (isOnlyPlayer && code). A validação de DOM real do componente
 * (texto Copiar → Copiado ✓ → Copiar, classe border-olive, aria-live=polite,
 * auto-reset 2s) está em:
 *   apps/web/src/components/empty-overlay.copy-feedback.test.tsx (Bun test).
 *
 * Aqui no Playwright validamos:
 *   1. compiled source contém os tokens esperados (regression guard).
 *   2. axe-core 0 violações serious/critical em /arena (rota do overlay).
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("T12-after: compiled source contém auto-reset + olive + aria-live", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const compiled = await page.evaluate(async () => {
		const res = await fetch("/src/components/empty-overlay.tsx");
		return await res.text();
	});

	// Compiled output usa setTimeout(...2000) — regex tolerante a minificação.
	expect(compiled).toContain("setCopied(false)");
	expect(compiled).toMatch(/setTimeout\([^,]+,\s*(?:2000|2e3|2_000)\)/);
	expect(compiled).toContain("border-olive");
	// compiled: `"aria-live": "polite"` (JSX prop → object key).
	expect(compiled).toMatch(/aria-live[^\n]{0,12}polite/);
});

test("T12-after: axe-core 0 serious/critical em /arena", async ({ page }) => {
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
		path: "../../screenshots/T12-after.png",
		fullPage: false,
	});
});
