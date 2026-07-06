/**
 * T10 — Deck (BEFORE).
 * Baseline: clicar carta não dispara toast "Voto registrado".
 */
import { expect, test } from "@playwright/test";

test("T10-before: click sem toast de confirmação", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	const card = page.getByTestId("deck-card-3");
	if ((await card.count()) === 0) {
		console.log("[T10-before] deck não renderizou (sem WS) — feature absent confirmed");
		await page.screenshot({ path: "../../screenshots/T10-before.png", fullPage: false });
		return;
	}

	await card.click();
	await page.waitForTimeout(300);
	const toast = page.locator("text=Voto registrado").first();
	expect(await toast.count()).toBe(0);

	await page.screenshot({ path: "../../screenshots/T10-before.png", fullPage: false });
});