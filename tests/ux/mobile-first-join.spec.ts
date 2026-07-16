/**
 * Mobile-First Join — Playwright E2E
 *
 * Cobre FMR-01..FMR-07 do spec
 * `.specs/features/mobile-first-join-arena/spec.md`.
 *
 * Viewports obrigatórios:
 *  - iPhone SE 1ª gen: 320×568
 *  - iPhone 14:        390×844
 *  - Pixel 7:          412×915
 *  - Galaxy S23:       360×800
 *  - Galaxy S23 landscape: 800×360
 */
import { expect, test } from "@playwright/test";

const VIEWPORTS = [
	{ name: "iphone-se", width: 320, height: 568, isLandscape: false },
	{ name: "iphone-14", width: 390, height: 844, isLandscape: false },
	{ name: "pixel-7", width: 412, height: 915, isLandscape: false },
	{ name: "galaxy-s23", width: 360, height: 800, isLandscape: false },
	{ name: "galaxy-s23-landscape", width: 800, height: 360, isLandscape: true },
] as const;

test.describe("Mobile-First Join", () => {
	for (const vp of VIEWPORTS) {
		test.describe(`viewport ${vp.name} (${vp.width}×${vp.height})`, () => {
			test.use({ viewport: { width: vp.width, height: vp.height } });

			test.beforeAll(({ }, testInfo) => {
				if (!testInfo.project.name.startsWith("mobile")) {
					test.skip(
						true,
						"mobile-first Join spec roda só em projects mobile*",
					);
				}
			});

			// Garante viewport mesmo se test.use for ignorado pelo runner.
			test.beforeEach(async ({ page }) => {
				await page.setViewportSize({ width: vp.width, height: vp.height });
			});

			test(`FMR-01/05: zero horizontal scroll + form completo visível`, async ({
				page,
			}) => {
				await page.goto("/join?code=ABCD");
				await page.waitForSelector('[data-testid="page-join"]');

				const metrics = await page.evaluate(() => ({
					scrollWidth: document.documentElement.scrollWidth,
					innerWidth: window.innerWidth,
					innerHeight: window.innerHeight,
				}));

				expect(metrics.scrollWidth, "zero overflow horizontal").toBeLessThanOrEqual(
					metrics.innerWidth,
				);

				// Header + nick input + CTA visíveis
				await expect(page.getByTestId("nick-input")).toBeVisible();
				await expect(page.getByTestId("join-submit")).toBeVisible();
				await expect(page.getByTestId("join-back")).toBeVisible();
			});

			test(`FMR-03: tap targets ≥44×44 (nick input, CTA Entrar, Voltar)`, async ({
				page,
			}) => {
				await page.goto("/join?code=ABCD");
				await page.waitForSelector('[data-testid="page-join"]');

				const targets = [
					'[data-testid="nick-input"]',
					'[data-testid="join-submit"]',
					'[data-testid="join-back"]',
				];
				for (const sel of targets) {
					const loc = page.locator(sel);
					const box = await loc.boundingBox();
					expect(box, `${sel} has box`).not.toBeNull();
					if (box) {
						// Allow input to be ≥44 tall (width can be full)
						if (sel.includes("input")) {
							expect(box.height).toBeGreaterThanOrEqual(44);
						} else {
							expect(box.width).toBeGreaterThanOrEqual(44);
							expect(box.height).toBeGreaterThanOrEqual(44);
						}
					}
				}
			});

			test(`FMR-04: erro de apelido curto visível e acessível`, async ({
				page,
			}) => {
				await page.goto("/join?code=ABCD");
				await page.waitForSelector('[data-testid="page-join"]');
				await page.getByTestId("nick-input").fill("H");
				await page.waitForTimeout(150);
				const error = page.getByTestId("nick-error");
				await expect(error).toBeVisible();
				const text = await error.textContent();
				expect(text?.toLowerCase()).toContain("2");
			});

			test(`FMR-06: landscape — card rola verticalmente`, async ({ page }) => {
				if (!vp.isLandscape) {
					test.skip(true, "Landscape-only check");
				}
				await page.goto("/join?code=ABCD");
				await page.waitForSelector('[data-testid="page-join"]');
				// Em landscape muito curto (altura 360), o card não cabe inteiro.
				// Verifica que o stage é scrollable (overflow-y-auto no main ou page inteira).
				const isScrollable = await page.evaluate(() => {
					const main = document.querySelector("main");
					if (!main) return false;
					const cs = getComputedStyle(main);
					const root = document.documentElement;
					return (
						cs.overflowY === "auto" ||
						cs.overflowY === "scroll" ||
						root.scrollHeight > root.clientHeight
					);
				});
				expect(isScrollable).toBeTruthy();
			});

			test(`FMR-07: Tab order Apelido → Entrar → Voltar`, async ({ page }) => {
				await page.goto("/join?code=ABCD");
				await page.waitForSelector('[data-testid="page-join"]');
				// Preenche o nick pra destravar o submit (FMR-07 só faz sentido
				// com form válido — submit desabilitado é pulado no Tab).
				await page.getByTestId("nick-input").fill("Helder");
				await page.waitForTimeout(100);
				await page.getByTestId("nick-input").focus();
				await page.keyboard.press("Tab");
				// O próximo focável deve ser o submit Entrar
				const focused = await page.evaluate(() => {
					const el = document.activeElement as HTMLElement | null;
					return el ? el.getAttribute("data-testid") : null;
				});
				expect(focused, "first Tab from nick-input").toBe("join-submit");
				await page.keyboard.press("Tab");
				const focused2 = await page.evaluate(() => {
					const el = document.activeElement as HTMLElement | null;
					return el ? el.getAttribute("data-testid") : null;
				});
				expect(focused2, "second Tab").toBe("join-back");
			});

			test(`screenshot ${vp.name}`, async ({ page }) => {
				await page.goto("/join?code=ABCD");
				await page.waitForSelector('[data-testid="page-join"]');
				await page.screenshot({
					path: `./screenshots/mobile-first-join-${vp.name}.png`,
					fullPage: true,
				});
			});
		});
	}
});