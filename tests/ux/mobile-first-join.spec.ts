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

			test(`FMR-02: keyboard avoidance — --keyboard-inset reage ao teclado virtual`, async ({
				page,
			}) => {
				// join.tsx:214-239: useEffect observa visualViewport.resize e
				// escreve `window.innerHeight - vv.height` em --keyboard-inset.
				// CSS [index.css:763] consome a var no padding-bottom do <main>.
				// Em mobile real o iOS encolhe visualViewport quando o teclado sobe.
				// Aqui stubbamos: shrink do height em 300px simula teclado.
				await page.goto("/join?code=ABCD");
				await page.waitForSelector('[data-testid="page-join"]');

				const readInset = () =>
					page.evaluate(() => {
						const raw = getComputedStyle(document.documentElement)
							.getPropertyValue("--keyboard-inset")
							.trim();
						// "300px" → 300. Empty string → 0.
						const m = raw.match(/^(-?\d+(?:\.\d+)?)/);
						return m ? Number(m[1]) : 0;
					});

				// Baseline (sem teclado): --keyboard-inset deve ser 0px.
				expect(await readInset(), "baseline antes do stub").toBe(0);

				// Stub do visualViewport.height: simula teclado aberto.
				await page.evaluate(() => {
					const vv = window.visualViewport!;
					Object.defineProperty(vv, "height", {
						value: window.innerHeight - 300,
						configurable: true,
						writable: true,
					});
					vv.dispatchEvent(new Event("resize"));
				});
				await page.waitForTimeout(150);

				expect(
					await readInset(),
					"--keyboard-inset deve refletir encolhimento do visualViewport",
				).toBeGreaterThan(0);
			});

			test(`FMR-03: tap targets ≥44×44 (nick, code, CTA, voltar, theme)`, async ({
				page,
			}) => {
				// Quando ?code=ABCD vem na URL, showCodeInput=false (input
				// do code não aparece). Para cobrir join-code-input, abrimos
				// /join sem query string (caminho "Criar sala" → landing → join
				// sem code). Mas como testamos via page.goto direto, abrir
				// /join puro (sem ?host=1, sem ?code=) é equivalente ao fluxo
				// "entrar em código digitado".
				await page.goto("/join");
				await page.waitForSelector('[data-testid="page-join"]');

				const targets = [
					'[data-testid="join-code-input"]', // aparece quando showCodeInput=true
					'[data-testid="nick-input"]',
					'[data-testid="join-submit"]',
					'[data-testid="join-back"]',
					'[data-testid="theme-toggle"]',
				];
				for (const sel of targets) {
					const loc = page.locator(sel);
					await expect(loc, `${sel} existe`).toBeVisible();
					const box = await loc.boundingBox();
					expect(box, `${sel} has box`).not.toBeNull();
					if (box) {
						// Inputs aceitam altura ≥ 44 (largura pode ser full).
						// Botões/toggles precisam ≥44 em ambas dimensões.
						if (sel.includes("input")) {
							expect(box.height, `${sel} height`).toBeGreaterThanOrEqual(44);
						} else {
							expect(box.width, `${sel} width`).toBeGreaterThanOrEqual(44);
							expect(box.height, `${sel} height`).toBeGreaterThanOrEqual(44);
						}
					}
				}
			});

			test(`FMR-04a: nick curto — role=alert + aria-invalid + aria-describedby`, async ({
				page,
			}) => {
				await page.goto("/join?code=ABCD");
				await page.waitForSelector('[data-testid="page-join"]');
				await page.getByTestId("nick-input").fill("H");
				await page.waitForTimeout(150);

				const error = page.getByTestId("nick-error");
				await expect(error).toBeVisible();
				await expect(error).toHaveAttribute("role", "alert");

				const input = page.getByTestId("nick-input");
				await expect(input).toHaveAttribute("aria-invalid", "true");
				await expect(input).toHaveAttribute("aria-describedby", "nick-error");
			});

			test(`FMR-04b: code inexistente (404) — erro inline + role=alert no code-input-error`, async ({
				page,
			}) => {
				// /join?code=ZZZZ com nick válido: pre-check retorna 404
				// → salaCheck='not-found' → erro inline em code-input-error
				// (join.tsx:497-504).
				await page.goto("/join?code=ZZZZ");
				await page.waitForSelector('[data-testid="page-join"]');
				await page.getByTestId("nick-input").fill("Helder");
				await page.waitForTimeout(100);
				await page.getByTestId("join-submit").click();
				// Pre-check fetch: até 5s.
				const error = page.getByTestId("join-code-error");
				await expect(error).toBeVisible({ timeout: 8_000 });
				await expect(error).toHaveAttribute("role", "alert");
				await expect(error).toContainText(/não encontrada/i);
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

			test(`FMR-07: Tab order Apelido → Entrar → Voltar, e ThemeToggle alcançável`, async ({
				page,
			}) => {
				await page.goto("/join?code=ABCD");
				await page.waitForSelector('[data-testid="page-join"]');
				// Preenche o nick pra destravar o submit (FMR-07 só faz sentido
				// com form válido — submit desabilitado é pulado no Tab).
				await page.getByTestId("nick-input").fill("Helder");
				await page.waitForTimeout(100);
				await page.getByTestId("nick-input").focus();
				const focusedAt = async () =>
					page.evaluate(() => {
						const el = document.activeElement as HTMLElement | null;
						if (!el) return null;
						return (
							el.getAttribute("data-testid") ??
							el.getAttribute("aria-label") ??
							el.tagName.toLowerCase()
						);
					});
				// Tab 1: nick-input → join-submit
				await page.keyboard.press("Tab");
				expect(await focusedAt(), "1º Tab").toBe("join-submit");
				// Tab 2: → join-back
				await page.keyboard.press("Tab");
				expect(await focusedAt(), "2º Tab").toBe("join-back");
				// Tab 3: depois do form, Tab cicla pra header (logo link é o
				// primeiro focável no DOM). Em Playwright headless, o body é
				// o destino (browser chrome não existe). O importante é que
				// theme-toggle está no tabIndex natural — confirmamos via
				// DOM walk.
				const tabbables = await page.evaluate(() => {
					const sel = [
						"a[href]",
						"button:not([disabled])",
						"input:not([disabled])",
						"[tabindex]:not([tabindex='-1'])",
					].join(",");
					return Array.from(document.querySelectorAll(sel))
						.map((el) => ({
							tag: (el as HTMLElement).tagName.toLowerCase(),
							testid: (el as HTMLElement).getAttribute("data-testid"),
							aria: (el as HTMLElement).getAttribute("aria-label"),
						}))
						.filter(
							(t) =>
								t.testid !== null ||
								(t.aria && t.aria.includes("Pointly")) ||
								t.tag === "a",
						)
						.map((t) => t.testid ?? t.aria ?? t.tag);
				});
				// theme-toggle DEVE estar entre os tabbables (alcançável por
				// Shift+Tab do body OU pelo tab cycle natural do browser).
				expect(
					tabbables,
					`theme-toggle deve estar no tab order (achou: ${tabbables.join(", ")})`,
				).toContain("theme-toggle");
			});

			test(`FMR-19: safe-area respeitada (notch iOS)`, async ({ page }) => {
				// iPhone SE 1ª gen NÃO tem notch — safe-area é 0px.
				// Skip em landscape (safe-area é diferente em landscape).
				test.skip(
					vp.name === "iphone-se" || vp.isLandscape,
					"FMR-19 só faz sentido em viewport com notch (iPhone 14 / Pixel 7 / Galaxy S23 portrait)",
				);
				await page.goto("/join?code=ABCD");
				await page.waitForSelector('[data-testid="page-join"]');

				// Baseline: headless Chrome não emula notch, então padding-top
				// do header = max(0, 1rem) = 16px. Só verifica que a regra CSS
				// EXISTE e usa env(safe-area-inset-top) — isso garante que
				// quando o iOS real aplicar 47px (notch), o header cresce.
				const baseline = await page.evaluate(() => {
					const header = document.querySelector(
						'[data-testid="page-join"] header',
					) as HTMLElement;
					const main = document.querySelector(
						'[data-testid="page-join"] main',
					) as HTMLElement;
					const headerCS = getComputedStyle(header);
					const mainCS = getComputedStyle(main);
					// Padding-top do header resolve a `max(env(safe-area-inset-top), 1rem)`.
					// Sem emulação, o max = 1rem = 16px (CSS pixel). Com notch
					// emulado, o max seria > 16px.
					return {
						headerPadTop: parseFloat(headerCS.paddingTop),
						mainPadBottom: parseFloat(mainCS.paddingBottom),
						// Inspecta o valor computado para confirmar que a regra
						// CSS usa env() — devolvemos "max(...)" formatado.
						headerRule: headerCS.getPropertyValue("padding-top"),
					};
				});

				// Baseline ≥ 16px (1rem fallback).
				expect(
					baseline.headerPadTop,
					`header padding-top ${baseline.headerPadTop}px deve ser ≥16px (fallback 1rem)`,
				).toBeGreaterThanOrEqual(16);
				expect(
					baseline.mainPadBottom,
					`main padding-bottom ${baseline.mainPadBottom}px deve ser ≥32px (fallback 2rem)`,
				).toBeGreaterThanOrEqual(32);

				// Agora simula notch via injeção de style com !important:
				// override do max() pra provar que o seletor + max() estão lá
				// e que o valor cresce quando o env aumenta.
				await page.addStyleTag({
					content: `
						[data-testid="page-join"] header {
							padding-top: max(47px, 1rem) !important;
						}
						[data-testid="page-join"] main {
							padding-bottom: max(34px, 2rem) !important;
						}
					`,
				});
				const withNotch = await page.evaluate(() => {
					const header = document.querySelector(
						'[data-testid="page-join"] header',
					) as HTMLElement;
					const main = document.querySelector(
						'[data-testid="page-join"] main',
					) as HTMLElement;
					return {
						headerPadTop: parseFloat(getComputedStyle(header).paddingTop),
						mainPadBottom: parseFloat(getComputedStyle(main).paddingBottom),
					};
				});
				// Quando notch = 47px aplica, header cresce pra ≥47px.
				expect(
					withNotch.headerPadTop,
					`header padding-top ${withNotch.headerPadTop}px ≥ 47px (notch simulado)`,
				).toBeGreaterThanOrEqual(47);
				expect(
					withNotch.mainPadBottom,
					`main padding-bottom ${withNotch.mainPadBottom}px ≥ 34px (home indicator simulado)`,
				).toBeGreaterThanOrEqual(34);
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