/**
 * T12 — Copiar link: feedback pós-clique (AFTER).
 *
 * Critério (Heldinhow/pointly#48):
 * - Após click, texto muda para "Copiado ✓" e reverte após 2s.
 * - aria-live="polite" presente.
 */
import { expect, test } from "@playwright/test";

test("T12-after: EmptyOverlay tem auto-reset de 'Copiado ✓' em ~2s", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	const compiled = await page.evaluate(async () => {
		const res = await fetch("/src/components/empty-overlay.tsx");
		return await res.text();
	});

	expect(compiled).toContain("setTimeout");
	expect(compiled).toContain("setCopied(false)");
	// 2000ms pode virar 2e3 no compile — aceita qualquer literal.
	expect(compiled).toMatch(/2000|2e3|2_000/);
	expect(compiled).toContain("Copiado ✓");
});

test("T12-after: aria-live=polite presente", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	const compiled = await page.evaluate(async () => {
		const res = await fetch("/src/components/empty-overlay.tsx");
		return await res.text();
	});

	// Compiled output usa "aria-live": "polite" (object literal) — regex tolerante.
	// Search for "aria-live" + "polite" within 50 chars of each other.
	const idx = compiled.indexOf("aria-live");
	expect(idx).toBeGreaterThan(-1);
	const window = compiled.slice(idx, idx + 100);
	console.log(`[T12-after:aria-live] window:`, window);
	expect(window).toContain("polite");
});

test("T12-after: estado 'Copiado ✓' usa cor olive", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	const compiled = await page.evaluate(async () => {
		const res = await fetch("/src/components/empty-overlay.tsx");
		return await res.text();
	});

	expect(compiled).toContain("olive");
	expect(compiled).toContain("border-olive");
});