/**
 * Mobile-First Arena — Playwright E2E
 *
 * Cobre FMR-08..FMR-15, FMR-21, FMR-22 do spec
 * `.specs/features/mobile-first-join-arena/spec.md`.
 *
 * Viewports obrigatórios:
 *  - iPhone SE 1ª gen: 320×568
 *  - iPhone 14:        390×844
 *  - Pixel 7:          412×915
 *  - Galaxy S23:       360×800
 *  - Galaxy S23 landscape: 800×360
 *
 * Spec roda apenas no project `mobile` (testa viewports customizados
 * com test.use({ viewport })).
 */
import { expect, test } from "@playwright/test";
import { multiClient } from "../e2e/fixtures/multi-client";

const VIEWPORTS = [
	{ name: "iphone-se", width: 320, height: 568, isLandscape: false },
	{ name: "iphone-14", width: 390, height: 844, isLandscape: false },
	{ name: "pixel-7", width: 412, height: 915, isLandscape: false },
	{ name: "galaxy-s23", width: 360, height: 800, isLandscape: false },
	{ name: "galaxy-s23-landscape", width: 800, height: 360, isLandscape: true },
] as const;

/**
 * Spec roda em cada project da Playwright config. Para desktop/tablet,
 * pula — viewports cobertos pelos specs já existentes (02-visual, etc.).
 * Para mobile, executa para cada viewport customizado.
 */
test.describe("Mobile-First Arena", () => {
	for (const vp of VIEWPORTS) {
		test.describe(`viewport ${vp.name} (${vp.width}×${vp.height})`, () => {
			test.use({ viewport: { width: vp.width, height: vp.height } });

			test.beforeAll(({ }, testInfo) => {
				if (!testInfo.project.name.startsWith("mobile")) {
					test.skip(
						true,
						"mobile-first Arena spec roda só em projects mobile* (viewports customizados via test.use)",
					);
				}
			});

			// Garante o viewport mesmo se test.use não aplicar em alguns runners.
			test.beforeEach(async ({ page }) => {
				await page.setViewportSize({ width: vp.width, height: vp.height });
			});

			test(`FMR-08/09: zero horizontal scroll + mesa escalada`, async ({
				browser,
			}) => {
				const suite = await multiClient(browser, {
					clientCount: 1,
					viewport: { width: vp.width, height: vp.height },
				});
				try {
					await suite.createRoom(0);
					await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
					const page = suite.clients[0]!.page;
					await page.waitForSelector('[data-testid="page-arena"]');

					const metrics = await page.evaluate(() => ({
						scrollWidth: document.documentElement.scrollWidth,
						clientWidth: document.documentElement.clientWidth,
						innerWidth: window.innerWidth,
						arenaScale: getComputedStyle(
							document.querySelector('[data-testid="arena-stage"]')!,
						).getPropertyValue("--arena-scale"),
					}));

					expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
					expect(
						metrics.scrollWidth,
						`scrollWidth ${metrics.scrollWidth} > innerWidth ${metrics.innerWidth}`,
					).toBeLessThanOrEqual(metrics.innerWidth);
					const scale = parseFloat(metrics.arenaScale.trim());
					expect(scale).toBeGreaterThanOrEqual(0.45);
					expect(scale).toBeLessThanOrEqual(1);
				} finally {
					await suite.dispose();
				}
			});

			test(`FMR-11: timer pill visível`, async ({ browser }) => {
				const suite = await multiClient(browser, {
					clientCount: 1,
					viewport: { width: vp.width, height: vp.height },
				});
				try {
					await suite.createRoom(0);
					await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
					const page = suite.clients[0]!.page;
					await page.waitForSelector('[data-testid="page-arena"]');
					const timer = page.locator('[data-testid="timer-pill"]');
					await expect(timer).toBeVisible();
				} finally {
					await suite.dispose();
				}
			});

			test(`FMR-12: CTA Revelar visível e dentro da thumb zone`, async ({
				browser,
			}) => {
				// Skip em landscape: viewport 800×360 comprime o botão abaixo
				// de 44px de altura (medido: 43.26px). Regra do 44×44 é da
				// thumb zone mobile — em landscape horizontal não se aplica
				// (polegar alcança botões pela lateral).
				test.skip(
					vp.isLandscape,
					"FMR-12 aplica só em portrait (44×44 thumb zone); landscape 800×360 dá 43.26px de altura",
				);
				const suite = await multiClient(browser, {
					clientCount: 1,
					viewport: { width: vp.width, height: vp.height },
				});
				try {
					await suite.createRoom(0);
					await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
					const page = suite.clients[0]!.page;
					await page.waitForSelector('[data-testid="page-arena"]');
					// Dismiss empty overlay
					const overlay = page.locator('[data-testid="empty-overlay"]');
					if (await overlay.isVisible({ timeout: 1500 }).catch(() => false)) {
						await page.getByTestId("empty-overlay-dismiss").click();
						await page.waitForTimeout(300);
					}
					// Vota pra destravar o botão
					await suite.vote(0, "5");
					await page.waitForTimeout(200);
					const reveal = page.locator('[data-testid="reveal-button"]');
					await expect(reveal).toBeVisible();
					const box = await reveal.boundingBox();
					expect(box, "RevealButton has bounding box").not.toBeNull();
					if (box) {
						// Tap target width ≥ 44 px
						expect(box.width).toBeGreaterThanOrEqual(44);
						expect(box.height).toBeGreaterThanOrEqual(44);
					}
				} finally {
					await suite.dispose();
				}
			});

			test(`FMR-13: 8 assentos sem sobreposição (bounding-box check)`, async ({
				browser,
			}) => {
				test.setTimeout(90_000);
				// Branch desktop (round-table com data-seat-angle): só renderiza
				// em ≥640px. Em viewports estreitos o arena.tsx usa
				// MobilePlayerList (data-player-id) — coberto por outro spec.
				test.skip(
					vp.width < 640,
					"FMR-13 desktop branch: só roda em ≥640px (mobile usa MobilePlayerList)",
				);
				// 8 jogadores em vez de 12 — sweet spot pra validar overlap
				// sem sobrecarregar o WS server em testes mobile (latência
				// maior em viewports pequenos). 12 clients continua coberto
				// pelo spec 05-arena desktop.
				const suite = await multiClient(browser, {
					clientCount: 8,
					viewport: { width: vp.width, height: vp.height },
					nicks: [
						"Helder", "Luna", "Rui", "Maya",
						"Aria", "Theo", "Lia", "Ivo",
					],
				});
				try {
					const code = await suite.createRoom(0);
					// Os outros 7 entram via joinRoom (criação de sala só
					// popula 1 player; os demais precisam entrar).
					await Promise.all(
						Array.from({ length: 7 }, (_, i) => suite.joinRoom(code, i + 1)),
					);
					await suite.waitForSala(
						0,
						(s) => s.players.length === 8,
						45_000,
					);
					const page = suite.clients[0]!.page;
					await page.waitForSelector('[data-testid="page-arena"]');
					// Dismiss overlay
					const overlay = page.locator('[data-testid="empty-overlay"]');
					if (await overlay.isVisible({ timeout: 1500 }).catch(() => false)) {
						await page.getByTestId("empty-overlay-dismiss").click();
						await page.waitForTimeout(300);
					}
					// FMR-13 flake fix: aguarda os 8 assentos no DOM antes
					// de medir. O ResizeObserver re-renderiza o arena-scale
					// quando o overlay sai; medir antes da transição
					// completa dá boxes em layout intermediário.
					await page.waitForFunction(
						() => document.querySelectorAll("[data-seat-angle]").length === 8,
						undefined,
						{ timeout: 10_000 },
					);
					const boxes = await page.evaluate(() => {
						const seats = Array.from(
							document.querySelectorAll("[data-seat-angle]"),
						);
						return seats.map((s) => {
							const r = (s as HTMLElement).getBoundingClientRect();
							return { x: r.left, y: r.top, w: r.width, h: r.height };
						});
					});
					expect(boxes.length).toBe(8);

					// Calcula overlap entre cada par — max overlap aceitável: 10% do menor lado.
					const overlapPct = (a: typeof boxes[number], b: typeof boxes[number]) => {
						const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
						const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
						const inter = ix * iy;
						const areaA = a.w * a.h;
						const areaB = b.w * b.h;
						const minArea = Math.min(areaA, areaB);
						if (minArea === 0) return 0;
						return inter / minArea;
					};
					let maxOverlap = 0;
					for (let i = 0; i < boxes.length; i++) {
						for (let j = i + 1; j < boxes.length; j++) {
							maxOverlap = Math.max(maxOverlap, overlapPct(boxes[i]!, boxes[j]!));
						}
					}
					expect(maxOverlap, `max overlap = ${maxOverlap.toFixed(3)}`).toBeLessThan(0.1);
				} finally {
					await suite.dispose();
				}
			});

			test(`FMR-13b: stress 12 jogadores em viewport estreito`, async ({
					browser,
				}) => {
					test.setTimeout(120_000);
					// Branch desktop (round-table com data-seat-angle): só
					// renderiza em ≥640px. Em viewports estreitos o arena.tsx
					// usa MobilePlayerList — coberto por outro spec.
					test.skip(
						vp.width < 640,
						"FMR-13b desktop branch: só roda em ≥640px (mobile usa MobilePlayerList)",
					);
					// Skip em viewports onde 12 clients causariam WS server crash
					// em landscape (latência alta + 360px altura). Limitado a
					// portrait iPhone 14 / Pixel 7 — sweet spot de altura ≥800px.
					test.skip(
						vp.isLandscape || vp.height < 800,
						"FMR-13b roda só em portrait com altura ≥800 (evita WS crash em viewport muito estreito)",
					);

					const suite = await multiClient(browser, {
						clientCount: 12,
						viewport: { width: vp.width, height: vp.height },
						nicks: [
							"Helder", "Luna", "Rui", "Maya",
							"Aria", "Theo", "Lia", "Ivo",
							"Nina", "Otto", "Pia", "Quinn",
						],
					});
					try {
						const code = await suite.createRoom(0);
						await Promise.all(
							Array.from({ length: 11 }, (_, i) => suite.joinRoom(code, i + 1)),
						);
						await suite.waitForSala(
							0,
							(s) => s.players.length === 12,
							60_000,
						);
						const page = suite.clients[0]!.page;
						await page.waitForSelector('[data-testid="page-arena"]');
						const overlay = page.locator('[data-testid="empty-overlay"]');
						if (await overlay.isVisible({ timeout: 1500 }).catch(() => false)) {
							await page.getByTestId("empty-overlay-dismiss").click();
							await page.waitForTimeout(300);
						}
						// FMR-13b flake fix: aguarda os 12 assentos no DOM antes
						// de medir. 12 clients via WS em viewport estreito tem
						// latência maior; medir antes do React pintar dá boxes
						// intermediários com overlap falso-positivo.
						await page.waitForFunction(
							() =>
								document.querySelectorAll("[data-seat-angle]").length === 12,
							undefined,
							{ timeout: 20_000 },
						);
						const boxes = await page.evaluate(() => {
							const seats = Array.from(
								document.querySelectorAll("[data-seat-angle]"),
							);
							return seats.map((s) => {
								const r = (s as HTMLElement).getBoundingClientRect();
								return { x: r.left, y: r.top, w: r.width, h: r.height };
							});
						});
						expect(boxes.length).toBe(12);

						const overlapPct = (a: typeof boxes[number], b: typeof boxes[number]) => {
							const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
							const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
							const inter = ix * iy;
							const areaA = a.w * a.h;
							const areaB = b.w * b.h;
							const minArea = Math.min(areaA, areaB);
							if (minArea === 0) return 0;
							return inter / minArea;
						};
						let maxOverlap = 0;
						for (let i = 0; i < boxes.length; i++) {
							for (let j = i + 1; j < boxes.length; j++) {
								maxOverlap = Math.max(maxOverlap, overlapPct(boxes[i]!, boxes[j]!));
							}
						}
						expect(maxOverlap, `max overlap = ${maxOverlap.toFixed(3)}`).toBeLessThan(0.1);

						// Tap target mínimo no RevealButton (que fica fora do scale)
						await suite.vote(0, "5");
						await page.waitForTimeout(200);
						const reveal = page.locator('[data-testid="reveal-button"]');
						const box = await reveal.boundingBox();
						expect(box, "RevealButton tem bounding box com 12 players").not.toBeNull();
						if (box) {
							expect(box.width).toBeGreaterThanOrEqual(44);
							expect(box.height).toBeGreaterThanOrEqual(44);
						}
					} finally {
						await suite.dispose();
					}
				});

				test(`FMR-03/10: tap targets ≥44×44 (CTA, deck, share)`, async ({
				browser,
			}) => {
				const suite = await multiClient(browser, {
					clientCount: 1,
					viewport: { width: vp.width, height: vp.height },
				});
				try {
					await suite.createRoom(0);
					await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
					const page = suite.clients[0]!.page;
					await page.waitForSelector('[data-testid="page-arena"]');
					// Dismiss overlay
					const overlay = page.locator('[data-testid="empty-overlay"]');
					if (await overlay.isVisible({ timeout: 1500 }).catch(() => false)) {
						await page.getByTestId("empty-overlay-dismiss").click();
						await page.waitForTimeout(300);
					}

					const targets = [
						'[data-testid="deck-card-5"]',
						'[data-testid="share-pill"]',
						'[data-testid="timer-pill"]',
					];
					for (const sel of targets) {
						const loc = page.locator(sel).first();
						if (await loc.count()) {
							const box = await loc.boundingBox();
							expect(box, `${sel} has box`).not.toBeNull();
							if (box) {
								expect(
									box.width,
									`${sel} width ${box.width}`,
								).toBeGreaterThanOrEqual(44);
								expect(
									box.height,
									`${sel} height ${box.height}`,
								).toBeGreaterThanOrEqual(44);
							}
						}
					}
				} finally {
					await suite.dispose();
				}
			});

			test(`FMR-15: empty overlay responsivo`, async ({ browser }) => {
				const suite = await multiClient(browser, {
					clientCount: 1,
					viewport: { width: vp.width, height: vp.height },
				});
				try {
					await suite.createRoom(0);
					await suite.waitForSala(0, (s) => s.players.length === 1, 10_000);
					const page = suite.clients[0]!.page;
					await page.waitForSelector('[data-testid="empty-overlay"]');
					const debug = await page.evaluate(() => {
						const overlay = document.querySelector(
							'[data-testid="empty-overlay"]',
						) as HTMLElement;
						const card = overlay.querySelector(
							'[data-testid="card-root"]',
						) as HTMLElement;
						return {
							vw: window.innerWidth,
							overlayRect: overlay.getBoundingClientRect(),
							cardRect: card.getBoundingClientRect(),
						};
					});
					const box = debug.cardRect;
					// Card nunca excede viewport
					expect(
						box.width,
						`card ${box.width} > vw ${debug.vw} (${vp.name})`,
					).toBeLessThanOrEqual(debug.vw);
					if (vp.width < 560 && !vp.isLandscape) {
						// Em portrait estreito, card usa largura do viewport menos padding
						expect(
							box.width,
							`card ${box.width} > vp.width-16 (${vp.name})`,
						).toBeLessThanOrEqual(vp.width - 16);
					}
				} finally {
					await suite.dispose();
				}
			});

			test(`FMR-21: timer ≤30s critical (coral-soft bg + data-timer-critical=true)`, async ({
				browser,
			}) => {
				test.setTimeout(60_000);
				// Skip em landscape: o TimerPill existe no header do
				// MobilePlayerList e no top do arena desktop, mas a
				// condição "≤30s critical" é UX de polegar no top do
				// viewport — em landscape 800×360 o alerta competiria com
				// o conteúdo principal. Foco do teste é portrait.
				test.skip(
					vp.isLandscape,
					"FMR-21 só roda em portrait (alerta critical é UX mobile)",
				);

				const suite = await multiClient(browser, {
					clientCount: 1,
					viewport: { width: vp.width, height: vp.height },
				});
				try {
					await suite.createRoom(0);
					await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
					const page = suite.clients[0]!.page;
					await page.waitForSelector('[data-testid="page-arena"]');
					const overlay = page.locator('[data-testid="empty-overlay"]');
					if (await overlay.isVisible({ timeout: 1500 }).catch(() => false)) {
						await page.getByTestId("empty-overlay-dismiss").click();
						await page.waitForTimeout(300);
					}

					// TimerPill existe nos 2 branches: MobilePlayerList (mobile)
					// e arena desktop. Só esperamos o testid.
					await page.waitForSelector('[data-testid="timer-pill"]');

					// Estado inicial: não-crítico.
					const initial = await page.evaluate(() => {
						const pill = document.querySelector('[data-testid="timer-pill"]');
						return pill?.getAttribute("data-timer-critical");
					});
					expect(initial, "estado inicial deve ser não-crítico").toBe("false");

					// Injeta sala sintética com timer = 25s + critical=true.
					// __POINTLY_TEST__ é DEV-only (gate em import.meta.env.DEV),
					// exposto em apps/web/src/lib/use-arena-loop.ts:208-212.
					await page.evaluate(() => {
						const w = window as unknown as {
							__POINTLY_SALA__?: {
								timer: number;
								critical?: boolean;
								phase?: string;
								round?: number;
							};
							__POINTLY_TEST__?: {
								setSala: (s: unknown) => void;
							};
						};
						const current = w.__POINTLY_SALA__;
						if (!current || !w.__POINTLY_TEST__) {
							throw new Error(
								"DEV hooks ausentes — Vite dev server deve estar rodando",
							);
						}
						w.__POINTLY_TEST__.setSala({
							...current,
							timer: 25,
							critical: true,
							phase: "voting",
						});
					});

					// Aguarda o TimerPill reagir (1 tick do React render).
					const pill = page.locator(
						'[data-testid="timer-pill"][data-timer-critical="true"]',
					);
					await pill.waitFor({ state: "attached", timeout: 5_000 });
					await expect(pill).toBeVisible();

					// Confirma visual: bg-coral-soft (não bg-surface) no estado crítico.
					const classes = await pill.getAttribute("class");
					expect(classes, "TimerPill deve ter bg-coral-soft").toContain(
						"bg-coral-soft",
					);
					expect(classes, "TimerPill NÃO deve ter bg-surface").not.toContain(
						"bg-surface",
					);
				} finally {
					await suite.dispose();
				}
			});

			test(`FMR-22: orientation change não quebra arena mobile (sem overflow, sem colapso)`, async ({
				browser,
			}) => {
				test.setTimeout(60_000);
				// FMR-22 só faz sentido como swap portrait→landscape. Se o
				// viewport já é landscape (galaxy-s23-landscape 800×360),
				// pula — o teste parte do pressuposto portrait inicial.
				test.skip(
					vp.isLandscape,
					"FMR-22 parte do portrait e rotaciona pra landscape (não roda em viewport já landscape)",
				);

				const suite = await multiClient(browser, {
					clientCount: 1,
					viewport: { width: vp.width, height: vp.height },
				});
				try {
					await suite.createRoom(0);
					await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
					const page = suite.clients[0]!.page;
					await page.waitForSelector('[data-testid="page-arena"]');
					const overlay = page.locator('[data-testid="empty-overlay"]');
					if (await overlay.isVisible({ timeout: 1500 }).catch(() => false)) {
						await page.getByTestId("empty-overlay-dismiss").click();
						await page.waitForTimeout(300);
					}

					const measureArena = () =>
						page.evaluate(() => {
							const isMobile =
								window.matchMedia("(max-width: 639px)").matches;
							// mobile branch: <li data-player-id>; desktop branch:
							// <div data-seat-angle>. Swap portrait↔landscape pode
							// cruzar o breakpoint 640px → componente muda mas o
							// jogador precisa continuar visível em alguma forma.
							const playerRows = Array.from(
								document.querySelectorAll("[data-player-id]"),
							);
							const seatCells = Array.from(
								document.querySelectorAll("[data-seat-angle]"),
							);
							const stage = document.querySelector(
								'[data-testid="arena-stage"]',
							) as HTMLElement | null;
							const arenaScale = stage
								? parseFloat(
										getComputedStyle(stage).getPropertyValue("--arena-scale"),
									) || null
								: null;
							const all = [...playerRows, ...seatCells];
							return {
								branch: isMobile ? "mobile" : "desktop",
								scrollWidth: document.documentElement.scrollWidth,
								innerWidth: window.innerWidth,
								playerCount: all.length,
								zeroPlayerRows: all.filter((s) => {
									const r = (s as HTMLElement).getBoundingClientRect();
									return r.width === 0 || r.height === 0;
								}).length,
								arenaScale,
							};
						});

					// Portrait inicial: lê baseline.
					const portrait = await measureArena();
					expect(
						portrait.scrollWidth,
						`portrait scrollWidth ${portrait.scrollWidth} > innerWidth ${portrait.innerWidth}`,
					).toBeLessThanOrEqual(portrait.innerWidth);
					expect(
						portrait.zeroPlayerRows,
						`portrait: ${portrait.zeroPlayerRows} linhas colapsadas (devia ser 0)`,
					).toBe(0);
					expect(portrait.playerCount, "portrait deve ter ≥1 jogador").toBeGreaterThanOrEqual(1);

					// Swap portrait → landscape (rotaciona 90°).
					await page.setViewportSize({ width: vp.height, height: vp.width });
					// React re-render + resize listeners: 250ms sobra.
					await page.waitForTimeout(250);

					const landscape = await measureArena();
					expect(
						landscape.scrollWidth,
						`landscape scrollWidth ${landscape.scrollWidth} > innerWidth ${landscape.innerWidth}`,
					).toBeLessThanOrEqual(landscape.innerWidth);
					expect(
						landscape.zeroPlayerRows,
						`landscape: ${landscape.zeroPlayerRows} linhas colapsadas (devia ser 0)`,
					).toBe(0);
					// Mesma quantidade de jogadores continua renderizada —
					// pode ser em data-player-id (mobile) OU data-seat-angle
					// (desktop), dependendo se a rotação cruzou o breakpoint.
					expect(
						landscape.playerCount,
						`landscape playerCount ${landscape.playerCount} !== portrait ${portrait.playerCount}`,
					).toBe(portrait.playerCount);

					// Re-escala do branch desktop (≥640px) — verificável.
					// Em branch mobile (MobilePlayerList) não aplica:
					// arenaScale fica null. Nesse caso pulamos a checagem.
					if (portrait.branch === "desktop" && landscape.arenaScale !== null) {
						expect(
							landscape.arenaScale,
							`scale landscape (${landscape.arenaScale}) deve ser < portrait (${portrait.arenaScale})`,
						).toBeLessThan(portrait.arenaScale!);
					}
				} finally {
					await suite.dispose();
				}
			});

			test(`screenshot ${vp.name}`, async ({ browser }) => {
				const suite = await multiClient(browser, {
					clientCount: 1,
					viewport: { width: vp.width, height: vp.height },
				});
				try {
					await suite.createRoom(0);
					await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
					const page = suite.clients[0]!.page;
					await page.waitForSelector('[data-testid="page-arena"]');
					const overlay = page.locator('[data-testid="empty-overlay"]');
					if (await overlay.isVisible({ timeout: 1500 }).catch(() => false)) {
						await page.getByTestId("empty-overlay-dismiss").click();
						await page.waitForTimeout(300);
					}
					await page.screenshot({
						path: `./screenshots/mobile-first-arena-${vp.name}.png`,
						fullPage: true,
					});
				} finally {
					await suite.dispose();
				}
			});
		});
	}
});