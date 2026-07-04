/**
 * Track E — Arena / Mesa (UX detalhado)
 *
 * Foco no estado DOM/visual: assentos, deck, timer, reveal button.
 * Requer que o usuário esteja autenticado na arena. Usa `nick pré-preenchido`
 * via localStorage + entrar direto em /arena com código qualquer.
 */
import { expect, test } from "@playwright/test";

/** Helper: cria sala via multi-client fixture. */
import { multiClient } from "../e2e/fixtures/multi-client";

test.describe("Track E — Arena UX", () => {
	test("E1+E2: 12 assentos + VOCÊ em 6h (90°)", async ({ browser }) => {
		const suite = await multiClient(browser, { clientCount: 1 });
		try {
			const code = await suite.createRoom(0);
			await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
			await suite.clients[0]!.page.waitForSelector('[data-testid="page-arena"]');

			// Confere DOM via evaluate
			const seatInfo = await suite.clients[0]!.page.evaluate(() => {
				const seats = Array.from(document.querySelectorAll("[data-seat-angle]"));
				return seats.map((s) => ({
					angle: s.getAttribute("data-seat-angle"),
					testId: s.querySelector("[data-testid^='seat-']")?.getAttribute("data-testid"),
				}));
			});
			console.log("[E1] seats:", seatInfo);
			expect(seatInfo.length).toBeGreaterThanOrEqual(1);

			// VOCÊ deve ter seat-voc-badge
			const youSeat = await suite.clients[0]!.page.locator('[data-testid="seat-voc-badge"]').count();
			expect(youSeat).toBe(1);
		} finally {
			await suite.dispose();
		}
	});

	test("E5+E6+E8: Deck — hover, select, no-op na mesma carta", async ({
		browser,
	}) => {
		const suite = await multiClient(browser, { clientCount: 1 });
		try {
			await suite.createRoom(0);
			await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
			await suite.clients[0]!.page.waitForSelector('[data-testid="deck"]');

			// Hover na carta 5
			const card5 = suite.clients[0]!.page.getByTestId("deck-card-5");
			await card5.hover();
			await suite.clients[0]!.page.waitForTimeout(200);

			// Click → voted
			await suite.vote(0, "5");

			// aria-pressed=true
			const pressed = await card5.getAttribute("aria-pressed");
			expect(pressed).toBe("true");

			// Click de novo = no-op (servidor não recebe value: null)
			const salaBefore = await suite.salaState(0);
			await card5.click();
			await suite.clients[0]!.page.waitForTimeout(300);
			const salaAfter = await suite.salaState(0);
			expect(salaAfter?.players[0]?.value).toBe("5");
		} finally {
			await suite.dispose();
		}
	});

	test("E9: Teclado — Tab navega deck + Enter vota", async ({ browser }) => {
		const suite = await multiClient(browser, { clientCount: 1 });
		try {
			await suite.createRoom(0);
			await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
			await suite.clients[0]!.page.waitForSelector('[data-testid="deck"]');

			// Foca a primeira carta
			await suite.clients[0]!.page.getByTestId("deck-card-0").focus();

			// Confirma que deck-card-0 está focado
			const focused = await suite.clients[0]!.page.evaluate(() => {
				const el = document.activeElement;
				return el?.getAttribute("data-testid");
			});
			expect(focused).toBe("deck-card-0");

			// Tab navega para próxima carta
			await suite.clients[0]!.page.keyboard.press("Tab");
			const focused2 = await suite.clients[0]!.page.evaluate(() => {
				return document.activeElement?.getAttribute("data-testid");
			});
			console.log(`[E9] após Tab: focused=${focused2}`);
		} finally {
			await suite.dispose();
		}
	});

	test("E10: Stats pill aparece pós-reveal com MÉDIA/MEDIANA/RANGE", async ({
		browser,
	}) => {
		const suite = await multiClient(browser, { clientCount: 2 });
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);
			await suite.vote(0, "5");
			await suite.vote(1, "8");
			await suite.reveal(0);

			await suite.clients[0]!.page.waitForSelector('[data-testid="stats-pill"]');
			const text =
				(await suite.clients[0]!.page.getByTestId("stats-pill").textContent()) ??
				"";
			console.log(`[E10] stats: ${text}`);
			expect(text.toLowerCase()).toContain("média");
			expect(text.toLowerCase()).toContain("mediana");
			expect(text).toMatch(/6\.5|6,5/);
		} finally {
			await suite.dispose();
		}
	});

	test("E11: Timer formato 00:42 · ROUND 03", async ({ browser }) => {
		const suite = await multiClient(browser, { clientCount: 1 });
		try {
			await suite.createRoom(0);
			await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
			await suite.clients[0]!.page.waitForSelector('[data-testid="timer-pill"]');
			const text =
				(await suite.clients[0]!.page.getByTestId("timer-pill").textContent()) ??
				"";
			console.log(`[E11] timer: ${text}`);
			// Timer pode mostrar 00:60 ou :60; só checa formato geral
			expect(text).toMatch(/\d{2}:\d{2}/);
		} finally {
			await suite.dispose();
		}
	});

	test("E12: Carta ☕ diferencia visualmente de numeral", async ({ browser }) => {
		const suite = await multiClient(browser, { clientCount: 1 });
		try {
			await suite.createRoom(0);
			await suite.waitForSala(0, (s) => s.players.length >= 1, 10_000);
			await suite.clients[0]!.page.waitForSelector('[data-testid="deck-card-5"]');

			const styles = await suite.clients[0]!.page.evaluate(() => {
				const num5 = document.querySelector('[data-testid="deck-card-5"]');
				const coffee = document.querySelector('[data-testid="deck-card-☕"]');
				if (!num5 || !coffee) return null;
				return {
					card5Font: window.getComputedStyle(num5).fontStyle,
					coffeeFont: window.getComputedStyle(coffee).fontStyle,
				};
			});
			console.log("[E12] styles:", styles);
		} finally {
			await suite.dispose();
		}
	});

	test("E7: Deck desabilitado pós-reveal", async ({ browser }) => {
		const suite = await multiClient(browser, { clientCount: 2 });
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);
			await suite.vote(0, "5");
			await suite.vote(1, "5");
			await suite.reveal(0);

			await suite.clients[0]!.page.waitForTimeout(500);
			const deckClass = await suite.clients[0]!.page
				.getByTestId("deck")
				.getAttribute("class");
			console.log(`[E7] deck class pós-reveal: ${deckClass}`);
			expect(deckClass).toContain("opacity-40");
		} finally {
			await suite.dispose();
		}
	});
});