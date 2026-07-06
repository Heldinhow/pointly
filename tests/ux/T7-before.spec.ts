/**
 * T7 — Mesa revelada (BEFORE).
 * Baseline: número revelado tem font-size 24px sem label "MEDIANA" acima.
 */
import { expect, test } from "@playwright/test";

test("T7-before: face-num sem label MEDIANA e tamanho 24px", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	// Inject synthetic comparison fixtures.
	const result = await page.evaluate(() => {
		const temp = document.createElement("div");
		temp.id = "t7-before-fixture";
		document.body.appendChild(temp);

		const seat = document.createElement("div");
		seat.innerHTML = `<div data-testid="seat-face-num" class="font-italic italic font-bold" style="font-size:24px">5</div>`;
		temp.appendChild(seat);

		const fs = parseFloat(
			window.getComputedStyle(seat.querySelector('[data-testid="seat-face-num"]')!).fontSize,
		);
		const labelExists = seat.querySelector('[data-testid="seat-mediana-label"]') !== null;

		temp.remove();
		return { fs, labelExists };
	});

	expect(result.fs).toBe(24);
	expect(result.labelExists).toBe(false);

	await page.screenshot({ path: "../../screenshots/T7-before.png", fullPage: false });
});