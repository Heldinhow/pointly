/**
 * T6 — CTA "Pronto pra começar?": pulse + social proof (AFTER).
 *
 * Critério (Heldinhow/pointly#42):
 * - CTA ribbon (cta-ribbon-create) tem animation-name 'cta-pulse' quando
 *   prefers-reduced-motion: no-preference.
 * - Social proof indicator visível acima do CTA.
 * - Respeita prefers-reduced-motion: reduce (animation: none).
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("T6-after: CTA ribbon tem cta-pulse class + animation ativa", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto("/");
	await page.waitForTimeout(400);

	// Scroll to ribbon.
	await page.locator("#cta-final").scrollIntoViewIfNeeded();
	await page.waitForTimeout(200);

	const cta = page.getByTestId("cta-ribbon-create");
	await expect(cta).toBeVisible();
	const className = await cta.getAttribute("class");
	expect(className).toContain("cta-pulse");

	const animationName = await cta.evaluate(
		(el) => window.getComputedStyle(el).animationName,
	);
	console.log(`[T6-after] cta-ribbon animation-name: ${animationName}`);
	expect(animationName).toBe("cta-pulse");
});

test("T6-after: prefers-reduced-motion: reduce → animation: none", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	await page.waitForTimeout(400);
	await page.locator("#cta-final").scrollIntoViewIfNeeded();

	const cta = page.getByTestId("cta-ribbon-create");
	const animationName = await cta.evaluate(
		(el) => window.getComputedStyle(el).animationName,
	);
	console.log(`[T6-after:reduced] animation-name: ${animationName}`);
	expect(animationName).toBe("none");
});

test("T6-after: social proof visível acima do CTA", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);
	await page.locator("#cta-final").scrollIntoViewIfNeeded();

	const proof = page.getByTestId("cta-social-proof");
	await expect(proof).toBeVisible();
	const text = await proof.textContent();
	console.log(`[T6-after] social proof text: ${text}`);
	expect(text?.toLowerCase()).toContain("times");
});

test("T6-after: axe-core 0 serious/critical em /", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
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
	await page.locator("#cta-final").scrollIntoViewIfNeeded();
	await page.screenshot({
		path: "../../screenshots/T6-after.png",
		fullPage: false,
	});
});
