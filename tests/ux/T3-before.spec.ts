/**
 * T3 — Apelido input (BEFORE fix).
 *
 * Baseline: pre-fix the help text <p> had no id, input had no aria-describedby
 * linking to it. (label htmlFor já estava implementado — esse aspect já passava.)
 */
import { expect, test } from "@playwright/test";

test("T3-before: input sem aria-describedby para texto de ajuda", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/join?code=ABCD");
	await page.waitForTimeout(400);

	const input = page.getByTestId("nick-input");
	const describedBy = await input.getAttribute("aria-describedby");
	console.log(`[T3-before] aria-describedby pre-fix: ${describedBy ?? "(none)"}`);
	// Antes da fix: ou undefined, ou só "nick-error" (não "nick-help").
	if (describedBy) {
		expect(describedBy).not.toContain("nick-help");
	}

	await page.screenshot({ path: "../../screenshots/T3-before.png", fullPage: false });
});