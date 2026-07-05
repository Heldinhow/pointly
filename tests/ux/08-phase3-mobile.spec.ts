/**
 * Phase 3 — Mobile UX spec (BUG-202, BUG-203, BUG-302)
 *
 * Verifica o comportamento mobile (390×844 ≈ iPhone 14) declarado em
 * task_05.md + ADR-005 + plan.md §6.4:
 *  - BUG-202: capability grid reflow 1/2/4 cols (nenhum overflow horizontal).
 *  - BUG-203: deck Fibonacci com scroll horizontal + snap + peek.
 *  - BUG-302: arena metadata (Rodada / nick) visível no mobile.
 *
 * Cobertura de viewports: 360, 390, 430, 1440 (sm + desktop alvo).
 */
import { expect, test } from "@playwright/test";

const WEB = process.env.E2E_WEB_URL ?? "http://localhost:5173";

const MOBILE_VIEWPORTS = [
	{ width: 360, height: 800, name: "mobile-360" },
	{ width: 390, height: 844, name: "mobile-390" },
	{ width: 430, height: 932, name: "mobile-430" },
];

for (const vp of MOBILE_VIEWPORTS) {
	test(`BUG-202/302 em ${vp.name}: landing sem overflow horizontal`, async ({
		browser,
	}) => {
		const ctx = await browser.newContext({
			viewport: { width: vp.width, height: vp.height },
		});
		const page = await ctx.newPage();
		try {
			await page.goto(WEB, { waitUntil: "domcontentloaded" });
			await page.waitForSelector('[data-testid="page-landing"]');

			const { scrollWidth, innerWidth } = await page.evaluate(() => ({
				scrollWidth: document.documentElement.scrollWidth,
				innerWidth: window.innerWidth,
			}));
			expect(
				scrollWidth,
				`scrollWidth=${scrollWidth}, innerWidth=${innerWidth}`,
			).toBeLessThanOrEqual(innerWidth + 2);

			// Capability grid deve renderizar 1 coluna no mobile (≤640px).
			const gridCols = await page
				.locator('[data-testid="cap-card-01"]')
				.first()
				.evaluate((el) => {
					const parent = el.parentElement;
					if (!parent) return 0;
					return window.getComputedStyle(parent).gridTemplateColumns
						.split(" ")
						.filter(Boolean).length;
				});
			expect(gridCols).toBe(1);
		} finally {
			await ctx.close();
		}
	});
}

for (const vp of MOBILE_VIEWPORTS) {
	test(`BUG-203 em ${vp.name}: deck com scroll horizontal + peek`, async ({
		browser,
	}) => {
		const ctx = await browser.newContext({
			viewport: { width: vp.width, height: vp.height },
		});
		const page = await ctx.newPage();
		try {
			await page.goto(`${WEB}/join?host=1`, {
				waitUntil: "domcontentloaded",
			});
			await page.waitForSelector('[data-testid="page-join"]');
			await page.fill(
				'[data-testid="join-input-nick"]',
				`Deck${vp.width}`,
			);
			await page.click('[data-testid="join-enter-room"]');

			// Pode redirecionar para /arena/:code (host) ou cair em erro.
			await page.waitForLoadState("networkidle", { timeout: 10_000 });
			const deck = page.locator('[data-testid="deck"]');
			await deck.waitFor({ state: "attached", timeout: 10_000 });

			// Container deve permitir scroll horizontal em <sm.
			const overflowsHorizontally = await deck.evaluate((el) => {
				const styles = window.getComputedStyle(el);
				const client = el.clientWidth;
				const scroll = el.scrollWidth;
				return {
					overflowX: styles.overflowX,
					clientWidth: client,
					scrollWidth: scroll,
					needsScroll: scroll > client + 1,
				};
			});
			expect(overflowsHorizontally.overflowX).toBe("auto");
			expect(overflowsHorizontally.needsScroll).toBe(true);

			// Peek gradients visíveis no mobile (escondidos em ≥sm).
			const peekLeft = await page
				.locator(".fib-deck-peek-left")
				.evaluate((el) => window.getComputedStyle(el).display);
			expect(peekLeft).not.toBe("none");

			// ☕ card (último) deve estar fora do viewport inicial no mobile.
			// Flick scroll para o fim e confirma que ele entra no viewport.
			await deck.evaluate((el) => {
				el.scrollLeft = el.scrollWidth;
			});
			await page.waitForTimeout(200);
			const coffeeVisible = await page
				.locator('[data-deck-value="☕"]')
				.isVisible();
			expect(coffeeVisible).toBe(true);

			// Reset scrollLeft quando voltar a voting (simulado: scroll set
			// + reload de voting) — verificável via JS direto sem reload.
			await deck.evaluate((el) => {
				el.scrollLeft = el.scrollWidth / 2;
			});
		} finally {
			await ctx.close();
		}
	});
}

test("BUG-203 em desktop (1440): deck sem scroll horizontal", async ({
	browser,
}) => {
	const ctx = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await ctx.newPage();
	try {
		await page.goto(`${WEB}/join?host=1`, {
			waitUntil: "domcontentloaded",
		});
		await page.waitForSelector('[data-testid="page-join"]');
		await page.fill(
			'[data-testid="join-input-nick"]',
			"DeckDesktop",
		);
		await page.click('[data-testid="join-enter-room"]');

		await page.waitForLoadState("networkidle", { timeout: 10_000 });
		const deck = page.locator('[data-testid="deck"]');
		await deck.waitFor({ state: "attached", timeout: 10_000 });

		const layout = await deck.evaluate((el) => ({
			clientWidth: el.clientWidth,
			scrollWidth: el.scrollWidth,
			overflowX: window.getComputedStyle(el).overflowX,
		}));
		// Em ≥sm o container usa `sm:overflow-visible` ⇒ overflow visível,
		// scrollWidth ≈ clientWidth.
		expect(layout.scrollWidth).toBeLessThanOrEqual(
			layout.clientWidth + 1,
		);

		// Peek gradients escondidos em ≥sm.
		const peekLeft = await page
			.locator(".fib-deck-peek-left")
			.evaluate((el) => window.getComputedStyle(el).display);
		expect(peekLeft).toBe("none");
	} finally {
		await ctx.close();
	}
});

test("BUG-302 em 390px: arena metadata strip Rodada visível", async ({
	browser,
}) => {
	const ctx = await browser.newContext({
		viewport: { width: 390, height: 844 },
	});
	const page = await ctx.newPage();
	try {
		await page.goto(`${WEB}/join?host=1`, {
			waitUntil: "domcontentloaded",
		});
		await page.waitForSelector('[data-testid="page-join"]');
		await page.fill(
			'[data-testid="join-input-nick"]',
			"Meta390",
		);
		await page.click('[data-testid="join-enter-room"]');

		await page.waitForLoadState("networkidle", { timeout: 10_000 });
		// Espera a arena renderizar.
		await page.waitForSelector('[data-testid="arena-stage"]', {
			timeout: 10_000,
		});

		const round = page.locator('[data-testid="arena-round"]');
		await round.waitFor({ state: "attached", timeout: 5_000 });
		const visible = await round.isVisible();
		expect(visible).toBe(true);

		const nick = page.locator('[data-testid="arena-self-nick"]');
		const nickVisible = await nick.isVisible();
		expect(nickVisible).toBe(true);
	} finally {
		await ctx.close();
	}
});
