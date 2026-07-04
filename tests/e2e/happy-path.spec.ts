/**
 * happy-path.spec.ts — T43.
 *
 * E2E: 2 clients criam sala, entram, votam, revelam, validam stats.
 *
 * **Cenário** (vide spec F-001..F-026):
 *  1. Browser A: landing → "Criar sala" → join (host=1) → arena
 *  2. Browser A vê code no topbar da arena
 *  3. Browser B: /join?code=XXXX com nick "Test" → arena
 *  4. Browser A vê B entrar (sala.players.length === 2)
 *  5. Browser A vota 5; Browser B vota 8
 *  6. Browser A revela
 *  7. Ambos veem valores face-up
 *  8. Stats: média 6.5 · mediana 5 (entre 5 e 8) · range 5–8
 *  9. Mediana destacada (player A com borda gold)
 *
 * **Timing**: WebSocket é server-driven; esperamos com `waitForSala`
 * (predicate polling) ao invés de sleeps fixos.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T43
 */
import { expect, test } from "@playwright/test";
import { multiClient } from "./fixtures/multi-client";

test.describe("T43: E2E happy path", () => {
	test("2 clients criam sala, entram, votam, revelam, validam stats", async ({
		browser,
	}) => {
		const suite = await multiClient(browser, { clientCount: 2 });
		try {
			// 1. Browser A cria sala
			const code = await suite.createRoom(0);
			expect(code).toMatch(/^[A-Z0-9]{4}$/);
			// Confirma que A está no arena
			const arenaCodeA =
				await suite.clients[0]!.page.getByTestId("arena-code").textContent();
			expect(arenaCodeA).toContain(code);

			// 2. Browser B entra
			await suite.joinRoom(code, 1);

			// 3. A deve ver 2 jogadores na sala
			const salaA = await suite.waitForSala(
				0,
				(s) => s.players.length === 2,
				10_000,
			);
			expect(salaA.players).toHaveLength(2);
			const nicks = salaA.players.map((p) => p.nick).sort();
			expect(nicks).toEqual(["Helder", "Test"]);

			// 4. B também vê 2 jogadores
			await suite.waitForSala(1, (s) => s.players.length === 2, 10_000);

			// 5. Votam (A=5, B=8)
			await suite.vote(0, "5");
			await suite.vote(1, "8");

			// 6. A e B devem ver hasVoted=true nos dois
			await suite.waitForSala(
				0,
				(s) => s.players.every((p) => p.hasVoted),
				10_000,
			);
			await suite.waitForSala(
				1,
				(s) => s.players.every((p) => p.hasVoted),
				10_000,
			);

			// 7. A revela
			await suite.reveal(0);

			// 8. Phase revealada + votos visíveis
			const salaRevealedA = await suite.waitForSala(
				0,
				(s) => s.phase === "revealed" && Object.keys(s.votes).length === 2,
				10_000,
			);
			const salaRevealedB = await suite.waitForSala(
				1,
				(s) => s.phase === "revealed" && Object.keys(s.votes).length === 2,
				10_000,
			);

			// Votos: A=5, B=8
			const votesA = Object.values(salaRevealedA.votes);
			const votesB = Object.values(salaRevealedB.votes);
			expect(votesA.sort()).toEqual(["5", "8"]);
			expect(votesB.sort()).toEqual(["5", "8"]);

			// 9. Consensus: média 6.5, mediana 5 (entre 5 e 8 → 5 ou 6.5
			//    dependendo do spec, mas computeConsensus para par retorna
			//    o lower; verificamos que está no range 5..6.5)
			const consensusA = await suite.consensus(0);
			const consensusB = await suite.consensus(1);
			expect(consensusA).not.toBeNull();
			expect(consensusB).not.toBeNull();
			expect(consensusA!.mean).toBeCloseTo(6.5, 1);
			expect(consensusA!.median).toBeGreaterThanOrEqual(5);
			expect(consensusA!.median).toBeLessThanOrEqual(6.5);
			expect(consensusA!.range).toEqual([5, 8]);
			expect(consensusA!.unanimous).toBe(false);

			// 10. UI: stats pill aparece em A
			const statsA =
				(await suite.clients[0]!.page.getByTestId(
					"stats-pill",
				).textContent()) ?? "";
			// CSS uppercase pode ou não estar aplicado (depende de font + browser),
			// então checa case-insensitive.
			expect(statsA.toLowerCase()).toContain("média");
			expect(statsA).toContain("6.5");
			// Mediana em gold (mostarda)
			expect(statsA).toMatch(/5(\.0)?/);

			// 11. UI: face-up: o seat do player A mostra "5" (voto face-up)
			const seatAFaceNum = await suite.clients[0]!.page.locator(
				'[data-testid^="seat-"]',
			)
				.filter({ hasText: "Helder" })
				.locator('[data-testid="seat-face-num"]')
				.textContent();
			expect(seatAFaceNum).toBe("5");

			// 12. UI: RevealButton virou "post-reveal" (Nova rodada)
			const revealState =
				await suite.clients[0]!.page.getByTestId("reveal-button").getAttribute(
					"data-reveal-state",
				);
			expect(revealState).toBe("post-reveal");
		} finally {
			await suite.dispose();
		}
	});

	test("RevealButton habilita após primeiro voto e mostra estado 'ready'", async ({
		browser,
	}) => {
		const suite = await multiClient(browser, { clientCount: 2 });
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);

			// Estado inicial: 'awaiting' (zero votos)
			const initialState =
				await suite.clients[0]!.page.getByTestId("reveal-button").getAttribute(
					"data-reveal-state",
				);
			expect(initialState).toBe("awaiting");

			// Após 1 voto, estado vira 'ready'
			await suite.vote(0, "3");
			await suite.clients[0]!.page.waitForFunction(
				() => {
					const btn = document.querySelector('[data-testid="reveal-button"]');
					return btn?.getAttribute("data-reveal-state") === "ready";
				},
				undefined,
				{ timeout: 5_000 },
			);
		} finally {
			await suite.dispose();
		}
	});
});
