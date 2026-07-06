/**
 * T12 — Copiar link (BEFORE).
 * Baseline: texto fica em "Copiado ✓" permanentemente (sem auto-reset).
 */
import { expect, test } from "@playwright/test";

test("T12-before: copy state persiste sem auto-reset", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	const btn = page.getByTestId("empty-overlay-copy");
	if ((await btn.count()) === 0) {
		console.log("[T12-before] EmptyOverlay não renderizou");
		await page.screenshot({
			path: "../../screenshots/T12-before.png",
			fullPage: false,
		});
		return;
	}

	await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
	await btn.click();
	await page.waitForTimeout(2500);
	// Sem auto-reset, ainda está "Copiado ✓".
	await expect(btn).toContainText("Copiado ✓");

	await page.screenshot({
		path: "../../screenshots/T12-before.png",
		fullPage: false,
	});
});
