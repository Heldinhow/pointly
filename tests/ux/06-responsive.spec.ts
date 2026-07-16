/**
 * Track F — Responsividade
 *
 * Audita onde o layout quebra em viewports fora do alvo (1440×900).
 * v1 declara "desktop only" — então em mobile, é aceitável overflow.
 * Documentamos onde quebra.
 */
import { expect, test } from "@playwright/test";

const VIEWPORTS = [
	{ name: "mobile-360", width: 360, height: 800 },
	{ name: "mobile-390", width: 390, height: 844 },
	{ name: "tablet-820", width: 820, height: 1180 },
	{ name: "laptop-1024", width: 1024, height: 768 },
	{ name: "desktop-1440", width: 1440, height: 900 },
	{ name: "wide-1920", width: 1920, height: 1080 },
];

const ROUTES = [
	{ path: "/", name: "landing", testid: "page-landing" },
	{ path: "/full", name: "full", testid: "page-full" },
];

for (const vp of VIEWPORTS) {
	for (const route of ROUTES) {
		test(`F: ${vp.name} (${vp.width}×${vp.height}) em ${route.name}`, async ({
			browser,
		}) => {
			const ctx = await browser.newContext({ viewport: vp });
			const page = await ctx.newPage();
			try {
				await page.goto(route.path);
				await page.waitForSelector(`[data-testid="${route.testid}"]`, {
					timeout: 8_000,
				});
				await page.waitForTimeout(500);

				// Screenshot pra auditoria visual
				await page.screenshot({
					path: `tests/ux/screenshots/responsive/${route.name}-${vp.name}.png`,
					fullPage: true,
				});

				// Detecta horizontal scroll
				const scrollWidth = await page.evaluate(
					() => document.documentElement.scrollWidth,
				);
				const innerWidth = await page.evaluate(() => window.innerWidth);
				const hasOverflow = scrollWidth > innerWidth + 2; // 2px tolera subpixel

				console.log(
					`[F] ${route.name} @ ${vp.name}: scrollWidth=${scrollWidth}, innerWidth=${innerWidth}, overflow=${hasOverflow}`,
				);

				// Em 1440 (alvo) e acima: NÃO deve ter overflow
				if (vp.width >= 1440) {
					expect(hasOverflow).toBe(false);
				}
			} finally {
				await ctx.close();
			}
		});
	}
}
