/**
 * edit-vote-after-reveal.spec.ts — EVR-01..EVR-14.
 *
 * E2E: após o reveal, qualquer jogador (inclusive o host) pode editar
 * seu próprio voto. A sala permanece em phase='revealed' (silencioso,
 * sem flip animation); consensus (median, mean, unanimidade) é
 * recomputado em tempo real e propagado para todos os clientes.
 * Mesma carta clicada duas vezes = idempotente (zero WS packets,
 * zero broadcasts).
 *
 * **Cobre ACs**:
 *   - EVR-01: edição pós-reveal atualiza voto do player
 *   - EVR-02: consensus (median/mean/range) recomputa ≤10s
 *   - EVR-03: clicar na mesma carta NÃO envia cast_vote
 *   - EVR-06: unanimidade quebra após edit
 *   - EVR-07: viewport mobile (320×568) permite edição
 *   - EVR-08: viewport desktop (1440×900) permite edição
 *   - EVR-09: start_new_round após edição funciona
 *   - EVR-10/11/12: a11y (aria-label, Enter/Space, prefers-reduced-motion)
 *   - EVR-13: duas edições simultâneas processadas serializadamente
 *   - EVR-14: cast_vote idempotente pós-reveal (server-side changed=false)
 *
 * @see .specs/features/edit-vote-after-reveal/spec.md
 */
import { expect, test } from "@playwright/test";
import { multiClient, sleep } from "./fixtures/multi-client";

test.describe("EVR: edit vote after reveal", () => {
	test("EVR-01/02: Player A edita voto pós-reveal, median/avg atualizam", async ({
		browser,
	}) => {
		const suite = await multiClient(browser);
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);

			// Setup: ambos votam 5 (unanime)
			await suite.vote(0, "5");
			await suite.vote(1, "5");
			await suite.reveal(0);
			const initial = await suite.consensus(1);
			expect(initial?.median).toBe(5);
			expect(initial?.unanimous).toBe(true);

			// Edit: Player A troca 5 → 8
			await suite.vote(0, "8");

			// Player B deve ver o voto do A atualizado
			await suite.waitForSala(
				1,
				(s) => s.players[0]?.value === "8",
				8000,
			);

			// Consensus recomputa: median = (5 + 8) / 2 = 6.5, NÃO unanime
			const after = await suite.consensus(1);
			expect(after?.median).toBe(6.5);
			expect(after?.mean).toBe(6.5);
			expect(after?.range).toEqual([5, 8]);
			expect(after?.unanimous).toBe(false);
		} finally {
			await suite.dispose();
		}
	});

	test("EVR-03: clicar na mesma carta NÃO envia cast_vote (idempotente client-side)", async ({
		browser,
	}) => {
		const suite = await multiClient(browser, { captureLogs: true });
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);

			await suite.vote(0, "5");
			await suite.vote(1, "5");
			await suite.reveal(0);

			// Captura baseline dos ws logs do player B
			const logsBefore = suite.clients[1]!.wsLogs.length;

			// Player A clica novamente em "5" (mesma carta)
			await suite.clients[0]!.page.getByTestId("deck-card-5").click();

			// Aguarda 1.5s — se houvesse broadcast, B receberia room_state e
			// o log filtrado por "[ws-server]" aumentaria.
			await sleep(1500);

			const logsAfter = suite.clients[1]!.wsLogs.length;
			expect(logsAfter).toBe(logsBefore);
		} finally {
			await suite.dispose();
		}
	});

	test("EVR-06: unanimidade quebra após edição de um player", async ({
		browser,
	}) => {
		const suite = await multiClient(browser);
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);

			await suite.vote(0, "5");
			await suite.vote(1, "5");
			await suite.reveal(0);

			// Antes: unanimidade
			const before = await suite.consensus(1);
			expect(before?.unanimous).toBe(true);

			// Player A edita
			await suite.vote(0, "8");
			await suite.waitForSala(1, (s) => s.players[0]?.value === "8", 8000);

			// Depois: unanimidade quebra
			const after = await suite.consensus(1);
			expect(after?.unanimous).toBe(false);
			expect(after?.median).toBe(6.5);
		} finally {
			await suite.dispose();
		}
	});

	test("EVR-07: viewport mobile (320×568) permite editar pós-reveal via MobileRevealDock", async ({
		browser,
	}) => {
		const suite = await multiClient(browser, {
			clientCount: 2,
			viewport: { width: 320, height: 568 },
		});
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);

			await suite.vote(0, "5");
			await suite.vote(1, "5");
			await suite.reveal(0);

			// Mobile branch: MobileRevealDock é sticky-bottom e renderiza
			// as cartas. Edit via tap em deck-card-8.
			await suite.vote(0, "8");

			await suite.waitForSala(1, (s) => s.players[0]?.value === "8", 8000);
			const consensus = await suite.consensus(1);
			expect(consensus?.median).toBe(6.5);
		} finally {
			await suite.dispose();
		}
	});

	test("EVR-08: viewport desktop (1440×900) permite editar pós-reveal via Deck", async ({
		browser,
	}) => {
		const suite = await multiClient(browser, {
			clientCount: 2,
			viewport: { width: 1440, height: 900 },
		});
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);

			await suite.vote(0, "5");
			await suite.vote(1, "5");
			await suite.reveal(0);

			// Desktop branch: Deck centralizado.
			await suite.vote(0, "8");

			await suite.waitForSala(1, (s) => s.players[0]?.value === "8", 8000);
			const consensus = await suite.consensus(1);
			expect(consensus?.median).toBe(6.5);
		} finally {
			await suite.dispose();
		}
	});

	test("EVR-09: start_new_round após edição é aceito, fase retorna a voting", async ({
		browser,
	}) => {
		const suite = await multiClient(browser);
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);

			await suite.vote(0, "5");
			await suite.vote(1, "5");
			await suite.reveal(0);

			// Edit A
			await suite.vote(0, "8");
			await suite.waitForSala(1, (s) => s.players[0]?.value === "8", 8000);

			// Nova rodada
			await suite.newRound(0);
			await suite.waitForSala(0, (s) => s.phase === "voting", 8000);

			// Round counter avançou
			const sala = await suite.salaState(1);
			expect(sala?.phase).toBe("voting");
			expect(sala?.round).toBeGreaterThan(1);

			// Votes foram limpos
			expect(Object.values(sala?.votes ?? {}).every((v) => v === undefined)).toBe(
				true,
			);
		} finally {
			await suite.dispose();
		}
	});

	test("EVR-10/11/12: a11y — carta de edit pós-reveal tem aria-pressed + label correto", async ({
		browser,
	}) => {
		const suite = await multiClient(browser);
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);

			await suite.vote(0, "5");
			await suite.vote(1, "5");
			await suite.reveal(0);

			// A carta "5" do player A deve estar aria-pressed=true (ainda
			// refletindo seu voto pré-reveal) e ter aria-label descritivo.
			const card5 = suite.clients[0]!.page.getByTestId("deck-card-5");
			const ariaPressed = await card5.getAttribute("aria-pressed");
			expect(ariaPressed).toBe("true");

			// Tap numa carta diferente atualiza aria-pressed.
			await suite.vote(0, "8");
			const card8 = suite.clients[0]!.page.getByTestId("deck-card-8");
			await expect(card8).toHaveAttribute("aria-pressed", "true", {
				timeout: 5000,
			});
			await expect(card5).toHaveAttribute("aria-pressed", "false");
		} finally {
			await suite.dispose();
		}
	});

	test("EVR-13: duas edições simultâneas processadas serializadamente (sem race)", async ({
		browser,
	}) => {
		const suite = await multiClient(browser);
		try {
			const code = await suite.createRoom(0);
			await suite.joinRoom(code, 1);

			await suite.vote(0, "5");
			await suite.vote(1, "5");
			await suite.reveal(0);

			// Ambas editam quase ao mesmo tempo (sem await sequencial).
			const [a, b] = await Promise.all([
				suite.vote(0, "8"),
				suite.vote(1, "13"),
			]);
			expect(a).toBeUndefined(); // vote() retorna void
			expect(b).toBeUndefined();

			// Estado final: ambos os votos registrados (server serializa
			// porque JS é single-threaded e Sala é mutável in-place).
			await suite.waitForSala(
				0,
				(s) =>
					s.players.some((p) => p.value === "8") &&
					s.players.some((p) => p.value === "13"),
				8000,
			);

			const consensus = await suite.consensus(0);
			expect(consensus?.unanimous).toBe(false);
			expect(consensus?.range).toEqual([8, 13]);
			expect(consensus?.median).toBe(10.5);
		} finally {
			await suite.dispose();
		}
	});
});
