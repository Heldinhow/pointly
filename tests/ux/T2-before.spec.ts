/**
 * T2 — Botão "Entrar" (BEFORE fix) baseline.
 *
 * Documents the pre-fix state: outline was ink/20 (low contrast),
 * no aria-label so screen readers only announced "Entrar".
 */
import { expect, test } from "@playwright/test";

test("T2-before: aria-label ausente (pre-fix baseline)", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const entrar = page.getByTestId("landing-code-submit");
	await page.getByTestId("landing-code-input").fill("ABCD");
	await expect(entrar).toBeEnabled();

	const ariaLabel = await entrar.getAttribute("aria-label");
	// Antes da fix: sem aria-label descritivo.
	expect(ariaLabel).toBeNull();

	await page.screenshot({ path: "../../screenshots/T2-before.png", fullPage: false });
});