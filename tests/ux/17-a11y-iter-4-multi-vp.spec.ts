/**
 * 17-a11y-iter-4-multi-vp.spec.ts -- axe-core WCAG 2 AA sweep em 3 viewports.
 *
 * Cobre Landing e NotFound em vp-360, vp-768, vp-1440. Atende verification
 * contract: "axe-core probe in `13-audit-elements.spec.ts` for Landing +
 * NotFound at 3 viewports returns `{violations: 0}`."
 *
 * Axe-core e executado em 6 cenarios (2 rotas x 3 viewports). Cada um
 * valida 0 violations (WCAG 2 AA + WCAG 2.1 AA). Screenshots salvos em
 * docs/ux-review/screenshots/after/UX-017-a11y-{landing,notfound}-vp-{w}.png
 * como evidencia.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const AFTER_DIR =
	"/Users/helder/last-chance/planning/docs/ux-review/screenshots/after";
mkdirSync(AFTER_DIR, { recursive: true });

const VIEWPORTS = [
	{ width: 360, height: 800, label: "360" },
	{ width: 768, height: 1024, label: "768" },
	{ width: 1440, height: 900, label: "1440" },
] as const;

const BASE = "http://localhost:5173";

async function probeAxe(page: Page, label: string) {
	const results = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
		.analyze();
	const serious = results.violations.filter((v) =>
		["critical", "serious"].includes(v.impact ?? ""),
	);
	test.info().annotations.push({
		type: `a11y-${label}`,
		description: JSON.stringify({
			total: results.violations.length,
			seriousOrCritical: serious.length,
			violations: results.violations.map((v) => ({
				id: v.id,
				impact: v.impact,
				help: v.help,
				nodes: v.nodes.length,
			})),
		}),
	});
	return results.violations;
}

for (const vp of VIEWPORTS) {
	test(`a11y iter-4 Landing @ vp-${vp.label} -- axe-core 0 violations`, async ({
		page,
		baseURL,
	}) => {
		const url = baseURL ?? BASE;
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await page.goto(`${url}/`, { waitUntil: "networkidle" });
		await page.waitForTimeout(800);
		const violations = await probeAxe(page, `landing-vp-${vp.label}`);
		await page.screenshot({
			path: `${AFTER_DIR}/UX-017-a11y-landing-vp-${vp.label}.png`,
			fullPage: true,
		});
		expect(violations).toHaveLength(0);
	});

	test(`a11y iter-4 NotFound @ vp-${vp.label} -- axe-core 0 violations`, async ({
		page,
		baseURL,
	}) => {
		const url = baseURL ?? BASE;
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await page.goto(`${url}/rota-inexistente`, { waitUntil: "networkidle" });
		await page.waitForTimeout(800);
		const violations = await probeAxe(page, `notfound-vp-${vp.label}`);
		await page.screenshot({
			path: `${AFTER_DIR}/UX-017-a11y-notfound-vp-${vp.label}.png`,
			fullPage: true,
		});
		expect(violations).toHaveLength(0);
	});
}