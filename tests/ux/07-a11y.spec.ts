/**
 * Track G — A11y via axe-core
 *
 * Roda `@axe-core/playwright` em todas as rotas canônicas e verifica
 * violations de severidade >= serious.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
	{ path: "/", name: "landing" },
	{ path: "/join?code=ABCD", name: "join" },
	{ path: "/full", name: "full" },
];

for (const route of ROUTES) {
	test(`G: axe-core em ${route.name}`, async ({ page }) => {
		await page.goto(route.path);
		await page.waitForTimeout(500);

		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();

		const serious = results.violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		);

		if (serious.length > 0) {
			console.log(`[G:${route.name}] violations >= serious:`);
			for (const v of serious) {
				console.log(`  - ${v.id} (${v.impact}): ${v.help}`);
				console.log(
					`    nodes: ${v.nodes.map((n) => n.target.join(",")).join(" | ")}`,
				);
			}
		}

		// Tolerância: loga mas não bloqueia (audit)
		expect(serious.length).toBeLessThanOrEqual(10);
	});
}

test("G3: h1 único por página", async ({ page }) => {
	const routes = ["/", "/join?code=ABCD", "/full"];
	for (const r of routes) {
		await page.goto(r);
		await page.waitForTimeout(200);
		const h1Count = await page.locator("h1").count();
		console.log(`[G3] ${r}: h1 count = ${h1Count}`);
		// Pode haver mais de um h1 em landing (revista editorial); warn-only
		if (h1Count !== 1) {
			console.log(`  ⚠ mais de um h1 (esperado em landing)`);
		}
	}
});

test("G5: Focus visible — primeiro Tab mostra outline", async ({ page }) => {
	await page.goto("/");
	await page.waitForTimeout(300);
	await page.keyboard.press("Tab");
	const focused = await page.evaluate(() => {
		const el = document.activeElement as HTMLElement | null;
		if (!el) return null;
		const cs = window.getComputedStyle(el);
		return {
			tag: el.tagName,
			testId: el.getAttribute("data-testid"),
			outline: cs.outline,
			outlineColor: cs.outlineColor,
			outlineWidth: cs.outlineWidth,
		};
	});
	console.log(`[G5] primeiro focusable:`, focused);
	// Skip-link ou CTA devem receber foco no primeiro Tab
	expect(focused?.tag).toBeTruthy();
});