/**
 * T3 — Apelido input label/aria-describedby (AFTER fix).
 *
 * Critério (Heldinhow/pointly#46):
 * - <label htmlFor="nick-input">APELIDO</label> presente.
 * - input#nick-input tem aria-describedby apontando para texto de ajuda
 *   "#nick-help" (e "#nick-error" quando há erro de validação).
 * - axe-core label rule passa.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("T3-after: label htmlFor associado ao input", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/join?code=ABCD");
	await page.waitForTimeout(400);

	const input = page.getByTestId("nick-input");
	await expect(input).toBeVisible();

	// input has id="nick-input".
	const inputId = await input.getAttribute("id");
	expect(inputId).toBe("nick-input");

	// <label htmlFor="nick-input"> exists.
	const label = page.locator('label[for="nick-input"]');
	await expect(label).toHaveCount(1);
	const labelText = await label.textContent();
	expect(labelText?.toLowerCase()).toContain("apelido");
});

test("T3-after: aria-describedby inclui texto de ajuda", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/join?code=ABCD");
	await page.waitForTimeout(400);

	const input = page.getByTestId("nick-input");
	const describedBy = await input.getAttribute("aria-describedby");
	console.log(`[T3-after] aria-describedby: ${describedBy}`);
	expect(describedBy).toContain("nick-help");

	// Texto de ajuda programaticamente referenciado existe.
	const helpText = page.locator("#nick-help");
	await expect(helpText).toHaveCount(1);
});

test("T3-after: axe-core 0 serious/critical em /join", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/join?code=ABCD");
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

	await page.screenshot({ path: "../../screenshots/T3-after.png", fullPage: false });
});