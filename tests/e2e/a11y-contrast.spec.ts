/**
 * a11y-contrast.spec.ts — T6 do loop de melhorias de UX da home.
 *
 * Verifica que a home do Pointly (/) passa em axe-core com WCAG 2.1 AA,
 * especialmente o critério color-contrast para texto informativo.
 *
 * Gate: `bunx playwright test a11y-contrast.spec.ts` deve passar.
 *
 * @see docs/issues T6 — Contraste de texto secundário
 */
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("T6: contraste WCAG AA na home", () => {
	test("home não tem violações de color-contrast (WCAG 2.1 AA)", async ({ page }) => {
		await page.goto("/", { waitUntil: "networkidle" });

		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();

		const contrast = results.violations.filter((v) => v.id === "color-contrast");

		// T6 — critério: 0 falhas de contraste em texto informativo
		expect(
			contrast,
			`Encontradas ${contrast.length} violações de contraste:\n` +
				contrast
					.map(
						(v) =>
							`  - ${v.nodes.length} nodes — ${v.help}\n` +
							v.nodes
								.slice(0, 5)
								.map((n) => `    ${n.html.slice(0, 120)}`)
								.join("\n"),
					)
					.join("\n"),
		).toHaveLength(0);
	});
});