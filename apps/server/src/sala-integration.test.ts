/**
 * Sala integration tests — T19 verify (≥3 integration tests).
 *
 * Cobre o state machine completo do Hub, exercitando handlers encadeados:
 *  - hello (cria + join + sala_cheia)
 *  - cast_vote (registro + primeiro voto + transição idle→voting)
 *  - reveal_votes (transição voting→revealed + stats)
 *  - start_new_round (limpa + incrementa + volta para voting)
 *
 * @see .specs/features/planning-poker-v1/tasks.md T19
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "./hub";
import { handleCastVote } from "./handlers/cast-vote";
import { handleHello } from "./handlers/hello";
import { handleRevealVotes } from "./handlers/reveal-votes";
import { handleStartNewRound } from "./handlers/start-new-round";
import { SALA_SEAT_COUNT } from "./sala";

let hub: Hub;

beforeEach(() => {
	hub = new Hub();
});

afterEach(() => {
	// Limpa timers ativos em todas as salas (evita handles zumbis).
	for (const sala of hub.salas.values()) {
		sala["stopTimer"](); // acesso por index — só usado nos testes
	}
});

// ---------------------------------------------------------------------------
// Helpers — orquestração de cenários multi-player
// ---------------------------------------------------------------------------

/** Cria host + N players via handlers reais e devolve mapa `nick → playerId`. */
function bootSalaWithPlayers(count: number): {
	code: string;
	players: Record<string, string>;
} {
	if (count < 1 || count > SALA_SEAT_COUNT) {
		throw new Error(`count deve estar em [1, ${SALA_SEAT_COUNT}]`);
	}
	const players: Record<string, string> = {};
	const hostUuid = "00000000-0000-4000-8000-000000000001";
	const hostResult = handleHello(hub, { uuid: hostUuid, nick: "Host" });
	if (!hostResult.ok) throw new Error(`host falhou: ${hostResult.code}`);
	players.Host = hostResult.playerId;
	const code = hub.activeCodes()[0]!;

	for (let i = 2; i <= count; i++) {
		const uuid = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
		const nick = `P${i}`;
		const join = handleHello(hub, { uuid, nick, code });
		if (!join.ok) throw new Error(`join ${nick} falhou: ${join.code}`);
		players[nick] = join.playerId;
	}

	return { code, players };
}

// ---------------------------------------------------------------------------
// T19 — Cenário 1: happy path completo
// ---------------------------------------------------------------------------

describe("T19 — happy path: criar → join → vote → reveal", () => {
	test("criar sala → 2 players entram → 1º vota → 2º vota → reveal → todos veem stats", () => {
		// 1. Host cria sala
		const hostResult = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: "Ana",
		});
		expect(hostResult.ok).toBe(true);
		if (!hostResult.ok) return;
		expect(hostResult.role).toBe("host");
		const code = hub.activeCodes()[0]!;
		const anaId = hostResult.playerId;
		expect(code).toMatch(/^[A-Z0-9]{4}$/);

		// 2. Bob entra
		const bobResult = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000002",
			nick: "Bob",
			code,
		});
		expect(bobResult.ok).toBe(true);
		if (!bobResult.ok) return;
		expect(bobResult.role).toBe("player");
		const bobId = bobResult.playerId;

		// Sala em idle, 2 jogadores, sem votos
		let sala = hub.getSala(code)!;
		expect(sala.phase).toBe("idle");
		expect(sala.playerCount).toBe(2);
		expect(sala.votes.size).toBe(0);

		// 3. Ana vota 5
		const anaVote = handleCastVote(hub, anaId, { value: "5" });
		expect(anaVote.ok).toBe(true);
		if (anaVote.ok) expect(anaVote.isFirstVoteOfRound).toBe(true);

		sala = hub.getSala(code)!;
		expect(sala.phase).toBe("voting"); // idle → voting
		expect(sala.getPlayer(anaId)?.value).toBe("5");
		expect(sala.getPlayer(anaId)?.hasVoted).toBe(true);
		expect(sala.getPlayer(bobId)?.hasVoted).toBe(false);

		// 4. Bob vota 8 → todos votaram, phase → revealable
		const bobVote = handleCastVote(hub, bobId, { value: "8" });
		expect(bobVote.ok).toBe(true);

		sala = hub.getSala(code)!;
		expect(sala.phase).toBe("revealable");
		expect(sala.getPlayer(bobId)?.value).toBe("8");

		// 5. Qualquer um revela — Ana usa o botão Reveal
		const reveal = handleRevealVotes(hub, anaId);
		expect(reveal.ok).toBe(true);
		if (reveal.ok) {
			expect(reveal.votes[anaId]).toBe("5");
			expect(reveal.votes[bobId]).toBe("8");
			expect(reveal.median).toBe(6.5); // (5 + 8) / 2
			expect(reveal.mean).toBe(6.5);
			expect(reveal.range).toEqual([5, 8]);
			expect(reveal.unanimous).toBe(false);
		}

		// Sala agora em revealed
		sala = hub.getSala(code)!;
		expect(sala.phase).toBe("revealed");

		// 6. Snapshot inclui ambos jogadores, votos, fase
		const state = sala.toState();
		expect(state.players).toHaveLength(2);
		expect(state.votes[anaId]).toBe("5");
		expect(state.votes[bobId]).toBe("8");
		expect(state.phase).toBe("revealed");
		expect(state.round).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// T19 — Cenário 2: timer expira sem todos votarem → auto-reveal (F-015)
// ---------------------------------------------------------------------------

describe("T19 — timer expira → auto-reveal", () => {
	test("auto-reveal dispara quando timer chega a 0 com votos parciais", () => {
		const { code, players } = bootSalaWithPlayers(3);
		const anaId = players.Host!;
		const bobId = players.P2!;

		const sala = hub.getSala(code)!;

		// Apenas Ana vota — Bob fica idle
		const anaVote = handleCastVote(hub, anaId, { value: "5" });
		expect(anaVote.ok).toBe(true);
		expect(sala.phase).toBe("voting");

		// Avança o timer tick a tick — em algum momento deve auto-revelar
		// O sala.tick() retorna true quando o último tick dispara auto-reveal.
		let autoRevealed = false;
		// Budget: 60 ticks (timer começa em 60)
		for (let i = 0; i < 65 && !autoRevealed; i++) {
			if (sala.tick()) {
				autoRevealed = true;
			}
		}

		expect(autoRevealed).toBe(true);
		expect(sala.phase).toBe("revealed");

		// Voto de Ana está preservado no votes Map
		expect(sala.votes.get(anaId)).toBe("5");
		expect(sala.votes.has(bobId)).toBe(false); // Bob nunca votou

		// Stats calculadas com 1 voto — SalaState guarda votes; median vive no
		// snapshot do handler `reveal_votes`, não em toState().
		const state = sala.toState();
		expect(state.votes[anaId]).toBe("5");
		expect(state.votes[bobId]).toBeUndefined();

		// Bob NÃO votou, então hasVoted=false preservado
		expect(sala.getPlayer(bobId)?.hasVoted).toBe(false);
	});

	test("timer não decrementa quando sala está idle (sem votos)", () => {
		const { code } = bootSalaWithPlayers(2);
		const sala = hub.getSala(code)!;
		expect(sala.phase).toBe("idle");

		const initialTimer = sala.timer;
		// ticks antes do primeiro voto não devem ter efeito
		for (let i = 0; i < 5; i++) sala.tick();
		expect(sala.timer).toBe(initialTimer);
		expect(sala.phase).toBe("idle");
	});

	test("isCritical (≤30s) reflete timer ativo", () => {
		const { code, players } = bootSalaWithPlayers(2);
		const anaId = players.Host!;
		const sala = hub.getSala(code)!;

		handleCastVote(hub, anaId, { value: "5" });
		expect(sala.isCritical()).toBe(false);

		// Avança para exatamente 30s
		for (let i = 0; i < 30; i++) sala.tick();
		expect(sala.timer).toBe(30);
		// exatamente 30s = crítico (≤30s)
		expect(sala.isCritical()).toBe(true);

		// Mais um tick → 29s, ainda crítico
		sala.tick();
		expect(sala.timer).toBe(29);
		expect(sala.isCritical()).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// T19 — Cenário 3: new round reseta estado
// ---------------------------------------------------------------------------

describe("T19 — start_new_round reseta estado", () => {
	test("new round limpa votes, incrementa round, phase volta para voting", () => {
		const { code, players } = bootSalaWithPlayers(3);
		const anaId = players.Host!;
		const bobId = players.P2!;
		const carolId = players.P3!;

		// Rodada 1: todos votam
		handleCastVote(hub, anaId, { value: "5" });
		handleCastVote(hub, bobId, { value: "5" });
		handleCastVote(hub, carolId, { value: "8" });

		const sala = hub.getSala(code)!;
		expect(sala.phase).toBe("revealable");
		expect(sala.round).toBe(1);

		// Reveal
		const reveal = handleRevealVotes(hub, anaId);
		expect(reveal.ok).toBe(true);
		if (reveal.ok) {
			expect(reveal.median).toBe(5);
			expect(reveal.unanimous).toBe(false);
		}
		expect(sala.phase).toBe("revealed");

		// New round
		const newRound = handleStartNewRound(hub, bobId); // qualquer player
		expect(newRound.ok).toBe(true);
		if (newRound.ok) expect(newRound.round).toBe(2);

		// Estado resetado
		expect(sala.phase).toBe("voting");
		expect(sala.round).toBe(2);
		expect(sala.votes.size).toBe(0);
		expect(sala.getPlayer(anaId)?.hasVoted).toBe(false);
		expect(sala.getPlayer(anaId)?.value).toBeNull();
		expect(sala.getPlayer(bobId)?.hasVoted).toBe(false);
		expect(sala.getPlayer(bobId)?.value).toBeNull();
		expect(sala.getPlayer(carolId)?.hasVoted).toBe(false);
		expect(sala.getPlayer(carolId)?.value).toBeNull();

		// Rodada 2: votos novos
		handleCastVote(hub, anaId, { value: "13" });
		handleCastVote(hub, bobId, { value: "13" });
		handleCastVote(hub, carolId, { value: "13" });

		const sala2 = hub.getSala(code)!;
		expect(sala2.round).toBe(2);
		expect(sala2.votes.size).toBe(3);

		const reveal2 = handleRevealVotes(hub, carolId);
		expect(reveal2.ok).toBe(true);
		if (reveal2.ok) {
			expect(reveal2.median).toBe(13);
			expect(reveal2.unanimous).toBe(true);
		}
	});

	test("new round NÃO pode ser chamado durante voting (F-026)", () => {
		const { code, players } = bootSalaWithPlayers(2);
		const anaId = players.Host!;
		const sala = hub.getSala(code)!;

		// Sem revelar ainda — phase = voting após primeiro voto
		handleCastVote(hub, anaId, { value: "5" });
		expect(sala.phase).toBe("voting");

		const result = handleStartNewRound(hub, anaId);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_phase");
	});
});

// ---------------------------------------------------------------------------
// T19 — Cenários bônus: invariantes e casos de borda
// ---------------------------------------------------------------------------

describe("T19 — invariantes do state machine", () => {
	test("primeiro voto da rodada transiciona idle → voting e inicia timer", () => {
		const { code, players } = bootSalaWithPlayers(2);
		const anaId = players.Host!;
		const sala = hub.getSala(code)!;

		expect(sala.phase).toBe("idle");
		expect(sala.timer).toBe(60);

		const result = handleCastVote(hub, anaId, { value: "3" });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.isFirstVoteOfRound).toBe(true);

		expect(sala.phase).toBe("voting");
		// Timer resetado para 60 no primeiro voto da rodada
		expect(sala.timer).toBe(60);
	});

	test("change vote mantém timer rodando (não é novo first vote)", () => {
		const { code, players } = bootSalaWithPlayers(2);
		const anaId = players.Host!;
		const sala = hub.getSala(code)!;

		handleCastVote(hub, anaId, { value: "3" });
		const firstTickBefore = sala.timer;

		// Avança 5 ticks
		for (let i = 0; i < 5; i++) sala.tick();
		const tickAfter = sala.timer;
		expect(tickAfter).toBeLessThan(firstTickBefore);

		// Change vote — NÃO reseta timer, NÃO é first vote
		const change = handleCastVote(hub, anaId, { value: "8" });
		expect(change.ok).toBe(true);
		if (change.ok) expect(change.isFirstVoteOfRound).toBe(false);

		// Timer continuou de onde estava (não resetou pra 60)
		expect(sala.timer).toBe(tickAfter);
		expect(sala.timer).toBeLessThan(60);
	});

	test("todos os conectados votam → voting → revealable (F-014 prep)", () => {
		const { code, players } = bootSalaWithPlayers(3);
		const anaId = players.Host!;
		const bobId = players.P2!;
		const carolId = players.P3!;
		const sala = hub.getSala(code)!;

		// 1º voto
		handleCastVote(hub, anaId, { value: "5" });
		expect(sala.phase).toBe("voting");

		// 2º voto — ainda voting (não é revealable até todos votarem)
		handleCastVote(hub, bobId, { value: "5" });
		expect(sala.phase).toBe("voting");

		// 3º voto — todos votaram, phase → revealable
		handleCastVote(hub, carolId, { value: "5" });
		expect(sala.phase).toBe("revealable");

		// Snapshot tem critical=false (timer > 30)
		const state = sala.toState();
		expect(state.phase).toBe("revealable");
		expect(state.critical).toBe(false);
		expect(state.votes).toEqual({
			[anaId]: "5",
			[bobId]: "5",
			[carolId]: "5",
		});
	});

	test("voto de player disconnected NÃO conta pra allConnectedVoted", () => {
		const { code, players } = bootSalaWithPlayers(3);
		const anaId = players.Host!;
		const bobId = players.P2!;
		const carolId = players.P3!;
		const sala = hub.getSala(code)!;

		// Ana vota
		handleCastVote(hub, anaId, { value: "5" });
		// Bob vota
		handleCastVote(hub, bobId, { value: "5" });
		expect(sala.phase).toBe("voting"); // ainda não é revealable

		// Carol desconecta antes de votar
		hub.markDisconnected(carolId);
		expect(sala.phase).toBe("voting"); // ainda voting — carol é disconnected

		// Carol vota (mesmo disconnected, ainda na sala em grace period)
		handleCastVote(hub, carolId, { value: "5" });

		// Agora todos os CONECTADOS votaram (ana + bob) — carol já votou mas é disconnected
		// phase deve ir para revealable
		expect(sala.phase).toBe("revealable");
	});

	test("snapshot tem formato SalaState válido (validado por Zod)", async () => {
		const { code, players } = bootSalaWithPlayers(2);
		const anaId = players.Host!;
		handleCastVote(hub, anaId, { value: "5" });

		const sala = hub.getSala(code)!;
		const state = sala.toState();

		// Importa lazy pra não criar ciclo
		const { SalaStateSchema } = await import("@planning-poker/shared");
		const parsed = SalaStateSchema.safeParse({
			code: state.code,
			hostId: state.hostId,
			players: state.players,
			phase: state.phase,
			round: state.round,
			timer: state.timer,
			votes: state.votes,
			createdAt: state.createdAt,
		});
		expect(parsed.success).toBe(true);
	});

	test("UUIDs gerados pelo servidor seguem padrão p_xxxxxxxxxxxx", () => {
		const { players } = bootSalaWithPlayers(2);
		for (const id of Object.values(players)) {
			expect(id).toMatch(/^p_[0-9a-f]{12}$/);
		}
	});

	test("round 1 inicial; só incrementa via start_new_round", () => {
		const { code, players } = bootSalaWithPlayers(2);
		const anaId = players.Host!;
		const sala = hub.getSala(code)!;
		expect(sala.round).toBe(1);

		handleCastVote(hub, anaId, { value: "5" });
		handleRevealVotes(hub, anaId);

		// round ainda 1 — reveal não incrementa
		expect(sala.round).toBe(1);

		handleStartNewRound(hub, anaId);
		expect(sala.round).toBe(2);
	});
});
