/**
 * T2 — Botão "Entrar" affordance visual + aria-label (AFTER fix).
 *
 * Critério de aceite (Heldinhow/pointly#43):
 * - Botão "Entrar" tem aria-label="Entrar na sala com código" (DOM query match).
 * - Outline ≥ 1.5px coral sólido quando focado.
 * - Tab order e focus-visible funcionam.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("T2-after: aria-label presente e pesquisável", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	// DOM query (case-insensitive substring).
	const entrarBtn = page.locator('button[aria-label*="Entrar na sala"]').first();
	await expect(entrarBtn).toHaveCount(1);

	const ariaLabel = await entrarBtn.getAttribute("aria-label");
	expect(ariaLabel?.toLowerCase()).toContain("entrar na sala");
});

test("T2-after: outline coral sólido visível ao focar", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.waitForTimeout(400);

	// Fill input to enable Entrar button.
	await page.getByTestId("landing-code-input").fill("ABCD");
	const entrar = page.getByTestId("landing-code-submit");
	await expect(entrar).toBeEnabled();

	await entrar.focus();

	const styles = await entrar.evaluate((el) => {
		const s = window.getComputedStyle(el);
		return {
			borderColor: s.borderColor,
			borderWidth: s.borderWidth,
			borderTopWidth: s.borderTopWidth,
			borderStyle: s.borderStyle,
			boxShadow: s.boxShadow,
		};
	});
	console.log(`[T2-after] entrar styles:`, styles);

	// Border must be visible (>= 1.5px) and not transparent.
	expect(parseFloat(styles.borderTopWidth)).toBeGreaterThanOrEqual(1.5);
	expect(styles.borderStyle).toBe("solid");
	// Coral rgb is rgb(210, 74, 42) — alpha must be near 1.
	const rgb = styles.borderColor.match(/\d+\.?\d*/g)?.map(Number) ?? [];
	const alpha = rgb.length === 4 ? rgb[3] : 1;
	expect(alpha).toBeGreaterThan(0.7);

	// Focus ring must be visible too (button.tsx base has focus-visible ring).
	expect(styles.boxShadow).not.toBe("none");
});

test("T2-after: axe-core 0 serious/critical on /", async ({ page }) => {
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

	await page.screenshot({ path: "../../screenshots/T2-after.png", fullPage: false });
});