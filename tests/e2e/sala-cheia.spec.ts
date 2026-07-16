/**
 * sala-cheia.spec.ts — T44.
 *
 * E2E: 12 jogadores ocupam uma sala, 13º é rejeitado com redirect /full.
 *
 * **Cenário** (vide spec F-005, F-007):
 *  1. Browser A cria sala
 *  2. Browsers B-K (10 mais) entram na sala → 11/12
 *  3. Browser L entra → 12/12
 *  4. Browser M tenta entrar → `error { code: 'sala_cheia' }` → redirect /full
 *  5. Page /full mostra "12/12 · máximo atingido" + botão "Criar nova sala"
 *
 * **Por que 13 clients?** A spec define MAX_PLAYERS=12. Sala cheia
 * acontece quando o 13º tenta entrar. Cada client é um context isolado
 * (cookies + localStorage), simulando 13 usuários reais.
 *
 * **Performance**: criar 13 contexts sequentially. Vite + Bun são
 * rápidos o suficiente; cada context leva ~100ms para criar.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T44
 */
import { expect, test } from "@playwright/test";
import { multiClient } from "./fixtures/multi-client";

test.describe("T44: E2E sala cheia", () => {
	test("13º client rejeitado com redirect /full", async ({ browser }) => {
		// 13 clients: A (host) + B..L (11 players) + M (rejeitado)
		const suite = await multiClient(browser, {
			clientCount: 13,
			nicks: [
				"Host",
				"P2",
				"P3",
				"P4",
				"P5",
				"P6",
				"P7",
				"P8",
				"P9",
				"P10",
				"P11",
				"P12", // 12º (sala cheia)
				"Reject13", // 13º (rejeitado)
			],
		});
		try {
			// 1. Host cria a sala
			const code = await suite.createRoom(0);
			expect(code).toMatch(/^[A-Z0-9]{4}$/);

			// 2. B..L (clients 1..11) entram na sala → 12/12 total
			for (let i = 1; i <= 11; i++) {
				await suite.joinRoom(code, i);
			}

			// Confirma que A vê 12 jogadores
			const salaA = await suite.waitForSala(
				0,
				(s) => s.players.length === 12,
				20_000,
			);
			expect(salaA.players).toHaveLength(12);

			// 3. M (client 12) tenta entrar — DEVE ser redirecionado para /full
			//    O fluxo: navega para /join?code=XXXX, preenche nick, submete.
			//    O ws-client envia `hello`, server retorna `error { code: 'sala_cheia' }`,
			//    o sala-end-loop dispara `setSalaEnded` e navega para /full.
			const rejected = suite.clients[12]!;
			await rejected.page.goto(`/join?code=${code}`);
			await rejected.page.waitForSelector('[data-testid="page-join"]');
			await rejected.page.getByTestId("nick-input").fill(rejected.nick);
			await rejected.page.getByTestId("join-submit").click();

			// 4. Aguarda redirect para /full
			await rejected.page.waitForURL(/\/full$/, { timeout: 10_000 });
			await rejected.page.waitForSelector('[data-testid="page-full"]');

			// 5. Verifica conteúdo da página /full
			const pageText =
				(await rejected.page.getByTestId("page-full").textContent()) ?? "";
			expect(pageText).toContain("Sala cheia");
			// Contagem 12/12
			expect(pageText).toContain("12");
			// Botão "Criar sala nova"
			const createNewBtn = rejected.page.getByTestId("full-create-new");
			expect(await createNewBtn.textContent()).toContain("Criar sala nova");

			// 6. Garantia: o host (A) ainda vê 12/12 — ninguém foi removido.
			const salaAfter = await suite.salaState(0);
			expect(salaAfter?.players).toHaveLength(12);
		} finally {
			await suite.dispose();
		}
	});
});
