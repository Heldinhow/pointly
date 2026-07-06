/**
 * T1 — CTA "Criar sala" focus + disabled states (BEFORE fix).
 *
 * Baseline: documents the pre-fix state to anchor the regression
 * test set. After the fix lands, T1-after.spec.ts validates the
 * observable critério de aceite.
 *
 * Critério de aceite (T1):
 * - focus-visible ring (coral 2px + offset 2px) on Tab navigation
 * - disabled state (opacity 0.4) DURING room creation (latency < 100ms)
 * - aria-busy announced to assistive tech
 * - axe-core: 0 serious/critical violations on /
 *
 * Issue: Heldinhow/pointly#40
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("T1-before: CTA 'Criar sala' anchor — pre-fix baseline", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	const cta = page.getByTestId("cta-create-room");
	await expect(cta).toBeVisible();

	// Screenshot baseline (before-fix state).
	await page.screenshot({
		path: "../../screenshots/T1-before.png",
		fullPage: false,
	});

	// Focus visible state via keyboard.
	await page.keyboard.press("Tab");
	let activeTestId = await page.evaluate(
		() => document.activeElement?.getAttribute("data-testid") ?? null,
	);
	// Press Tab until we land on cta-create-room (skip past header links).
	for (let i = 0; i < 12 && activeTestId !== "cta-create-room"; i++) {
		await page.keyboard.press("Tab");
		activeTestId = await page.evaluate(
			() => document.activeElement?.getAttribute("data-testid") ?? null,
		);
	}
	await expect(cta).toBeFocused();

	// Capture computed box-shadow of the focused button — must show the ring.
	const ringShadow = await cta.evaluate((el) => {
		return window.getComputedStyle(el).boxShadow;
	});
	// After fix: ring-coral + ring-offset-2 produces a non-"none" box-shadow.
	// Before fix: button.tsx already has focus-visible:ring-coral, so this
	// baseline may already show ring; the T1-after spec covers the disabled
	// state which is the genuine gap.
	console.log(`[T1-before] cta-create-room box-shadow on focus: ${ringShadow}`);

	// axe-core: 0 serious/critical (regression guard).
	const axe = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
		.analyze();
	const serious = axe.violations.filter(
		(v) => v.impact === "serious" || v.impact === "critical",
	);
	if (serious.length > 0) {
		console.log(`[T1-before] axe serious/critical violations:`);
		for (const v of serious) {
			console.log(`  - ${v.id}: ${v.help}`);
		}
	}
	expect(serious.length).toBe(0);
});
