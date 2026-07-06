/**
 * T6 — CTA ribbon (BEFORE).
 * Baseline: botão CTA sem pulse class, sem social proof indicator.
 */
import { expect, test } from "@playwright/test";

test("T6-before: CTA ribbon sem pulse + sem social proof", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto("/");
	await page.waitForTimeout(400);
	await page.locator("#cta-final").scrollIntoViewIfNeeded();

	const cta = page.getByTestId("cta-ribbon-create");
	const animationName = await cta.evaluate(
		(el) => window.getComputedStyle(el).animationName,
	);
	expect(animationName).toBe("none");

	const proof = page.locator('[data-testid="cta-social-proof"]');
	expect(await proof.count()).toBe(0);

	await page.screenshot({ path: "../../screenshots/T6-before.png", fullPage: false });
});