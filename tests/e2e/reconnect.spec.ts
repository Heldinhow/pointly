/**
 * reconnect.spec.ts — T45.
 *
 * E2E: client desconecta mid-rodada, reconecta com mesmo UUID, voto preservado.
 *
 * **Cenário** (vide spec F-037, F-038):
 *  1. Browser A entra na sala, vota 5
 *  2. Browser A fecha (simula disconnect — WS close)
 *  3. Server marca A como `disconnected` (não remove — grace 60s)
 *  4. Browser A reabre com mesmo UUID (localStorage preserva)
 *  5. Sala é reidratada com voto 5 preservado
 *
 * **Como simular disconnect sem perder localStorage?**
 *  - Fechar só a página (`page.close()`) também limpa localStorage do
 *    context. Para preservar, usamos o `playwright.context().clearCookies()`
 *    + `context.clearStorageData()` apenas do WebSocket — mas isso não
 *    é granular o suficiente.
 *  - Solução pragmática: simular disconnect via WS direto. O page mantém
 *    localStorage; só o WS fecha. O server marca como disconnected.
 *  - Alternativa: usar 2 contexts com mesmo UUID (via seed de localStorage
 *    antes do load). Isso preserva o teste do spec.
 *
 * **Implementação escolhida**: 2 contexts. Context1 entra + vota, depois
 * é fechado. Context2 é criado com mesmo UUID (via init script), entra
 * no mesmo code → server reidrata pelo UUID → voto 5 preservado.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T45
 */
import { expect, test } from "@playwright/test";
import { multiClient } from "./fixtures/multi-client";

test.describe("T45: E2E reconnect", () => {
	test("reconnect preserva voto via UUID", async ({ browser }) => {
		test.setTimeout(60_000);
		// 1. Setup: client 0 cria a sala, B entra antes do voto
		//    (evita o EmptyOverlay quando só tem Helder na sala).
		const suite = await multiClient(browser, { clientCount: 2 });
		try {
			const code = await suite.createRoom(0);
			const uuidA = await suite.clients[0]!.page.evaluate(() => {
				return localStorage.getItem("pointly.uuid");
			});
			expect(uuidA).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			);

			// B entra ANTES de A votar → sala tem 2 jogadores, sem overlay.
			await suite.joinRoom(code, 1);
			await suite.waitForSala(0, (s) => s.players.length === 2, 10_000);

			// 2. A vota 5
			await suite.vote(0, "5");
			await suite.waitForSala(
				0,
				(s) =>
					s.players.find((p) => p.nick === "Helder")?.value === "5" &&
					s.players.find((p) => p.nick === "Helder")?.hasVoted === true,
				5_000,
			);

			// 3. Simula disconnect: fecha o context A. localStorage some
			//    com o context — então não podemos reabrir o mesmo context.
			//    Solução: criar context A2 com o mesmo UUID via addInitScript.
			await suite.clients[0]!.context.close();

			// Pequena pausa para o server marcar disconnected (heartbeat tick).
			await suite.clients[1]!.page.waitForTimeout(500);

			// 4. Cria novo context com mesmo UUID (reconnect)
			const contextA2 = await browser.newContext({
				viewport: { width: 1440, height: 900 },
				locale: "pt-BR",
			});
			// Injeta UUID no localStorage ANTES de qualquer script da página rodar.
			await contextA2.addInitScript((uuid: string) => {
				try {
					localStorage.setItem("pointly.uuid", uuid);
					localStorage.setItem("pointly.nick", "Helder");
				} catch {
					// ignore
				}
			}, uuidA!);
			const pageA2 = await contextA2.newPage();

			// 5. Navega direto para /arena?code=XXXX com mesmo nick
			//    Usamos goto direto pra /arena pra evitar o join screen,
			//    simplificando o flow (A2 só precisa reconectar via WS).
			await pageA2.goto(`/arena?code=${code}`);
			await pageA2.waitForSelector('[data-testid="page-arena"]', {
				timeout: 10_000,
			});

			// 6. Aguarda o store ser populado com a sala (welcome do server).
			await pageA2.waitForFunction(
				() => {
					const w = window as unknown as {
						__POINTLY_SALA__?: {
							players?: Array<{ value: string | null; nick: string }>;
						};
					};
					const players = w.__POINTLY_SALA__?.players ?? [];
					// Helder reidratado com value="5" preservado
					return players.some((p) => p.nick === "Helder" && p.value === "5");
				},
				undefined,
				{ timeout: 15_000 },
			);

			// 7. Confirma que B (testemunha) vê o voto de A preservado também
			const salaBAfter = await suite.waitForSala(
				1,
				(s) =>
					s.players.length === 2 &&
					s.players.some((p) => p.value === "5" && p.hasVoted),
				10_000,
			);
			expect(salaBAfter.players.find((p) => p.nick === "Helder")?.value).toBe(
				"5",
			);

			// Cleanup A2
			await contextA2.close();
		} finally {
			await suite.dispose();
		}
	});
});
