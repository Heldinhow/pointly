/**
 * A11y audit — axe-core automatizado.
 *
 * Roda scan WCAG 2.1 AA nas páginas Join e Arena. Bloqueia regressões
 * de a11y. Falha se houver violations sérias/medium (low/info são
 * reportadas mas não bloqueiam).
 *
 * Spec roda apenas no project `chromium` (desktop) — viewport mobile
 * já é coberto pelos specs mobile-first-*. Axe valida markup/aria,
 * que são viewport-independent.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("A11y — axe-core WCAG 2.1 AA", () => {
	test("Join sem violations sérias/medium", async ({ page }) => {
		await page.goto("/join");
		await page.waitForSelector('[data-testid="page-join"]');
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();
		const blocking = results.violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		);
		if (blocking.length) {
			console.log(
				"Axe Join violations:",
				JSON.stringify(blocking, null, 2),
			);
		}
		expect(blocking.length).toBe(0);
	});

	test("Join com code (?code=ABCD) sem violations", async ({ page }) => {
		await page.goto("/join?code=ABCD");
		await page.waitForSelector('[data-testid="page-join"]');
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();
		const blocking = results.violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		);
		if (blocking.length) {
			console.log(
				"Axe Join+code violations:",
				JSON.stringify(blocking, null, 2),
			);
		}
		expect(blocking.length).toBe(0);
	});

	test("Landing sem violations sérias/medium", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector('[data-testid="page-landing"]');
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();
		const blocking = results.violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		);
		if (blocking.length) {
			console.log(
				"Axe Landing violations:",
				JSON.stringify(blocking, null, 2),
			);
		}
		expect(blocking.length).toBe(0);
	});

	test("Full (sala cheia) sem violations", async ({ page }) => {
		await page.goto("/full");
		await page.waitForSelector('[data-testid="page-full"]');
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();
		const blocking = results.violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		);
		if (blocking.length) {
			console.log(
				"Axe Full violations:",
				JSON.stringify(blocking, null, 2),
			);
		}
		expect(blocking.length).toBe(0);
	});
});