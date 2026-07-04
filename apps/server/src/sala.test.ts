/**
 * Sala tests — T12 verify (≥8 unit tests).
 *
 * Cobre state machine, timer, e regras de negócio.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	Sala,
	SALA_DISCONNECT_GRACE_MS,
	SALA_SEAT_COUNT,
	SALA_TIMER_SECONDS,
	SalaError,
} from "./sala";
import type { Player } from "@planning-poker/shared";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlayer(
	id: string,
	nick: string,
	role: "host" | "player" = "player",
	joinedAt?: number,
	seatIndex: number | null = null,
): Player {
	return {
		id,
		uuid: `00000000-0000-4000-8000-${id.padStart(12, "0")}`,
		nick,
		role,
		seatIndex: seatIndex ?? 0,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: joinedAt ?? Date.now(),
	};
}

let sala: Sala;

beforeEach(() => {
	const host = makePlayer("p1", "Ana", "host", 1_000);
	sala = new Sala("ABCD", host, 1_000);
});

afterEach(() => {
	// cleanup any active timers
	sala["stopTimer"](); // acesso por index — só usado nos testes
});

// ---------------------------------------------------------------------------
// Constructor + initial state
// ---------------------------------------------------------------------------

describe("Sala — constructor", () => {
	test("cria sala com host e estado idle", () => {
		expect(sala.code).toBe("ABCD");
		expect(sala.hostId).toBe("p1");
		expect(sala.phase).toBe("idle");
		expect(sala.round).toBe(1);
		expect(sala.timer).toBe(SALA_TIMER_SECONDS);
		expect(sala.playerCount).toBe(1);
	});

	test("rejeita primeiro player sem role host", () => {
		const p = makePlayer("p1", "Ana", "player");
		expect(() => new Sala("ABCD", p, 1_000)).toThrow(/must have role: 'host'/);
	});
});

// ---------------------------------------------------------------------------
// addPlayer / sala_cheia
// ---------------------------------------------------------------------------

describe("Sala — addPlayer", () => {
	test("atribui seatIndex no primeiro livre (F-027)", () => {
		const p2 = makePlayer("p2", "Bob", "player", 1_001, null);
		const seated = sala.addPlayer(p2);
		expect(seated.seatIndex).toBe(1);
		expect(sala.playerCount).toBe(2);
	});

	test("rejeita player 13 (sala_cheia)", () => {
		// preenche 12
		for (let i = 2; i <= SALA_SEAT_COUNT; i++) {
			sala.addPlayer(makePlayer(`p${i}`, `P${i}`, "player", i, i - 1));
		}
		expect(sala.playerCount).toBe(SALA_SEAT_COUNT);
		const overflow = makePlayer("p13", "Late", "player");
		expect(() => sala.addPlayer(overflow)).toThrow(SalaError);
		try {
			sala.addPlayer(overflow);
		} catch (e) {
			expect((e as SalaError).code).toBe("sala_cheia");
		}
	});
});

// ---------------------------------------------------------------------------
// castVote + phase transitions
// ---------------------------------------------------------------------------

describe("Sala — castVote", () => {
	test("primeiro voto: idle → voting (ou revealable, se 1 só player) + timer 60s (F-013)", () => {
		sala.castVote("p1", "5");
		// com 1 só player, vai direto voting → revealable
		expect(["voting", "revealable"]).toContain(sala.phase);
		expect(sala.timer).toBe(SALA_TIMER_SECONDS);
	});

	test("change vote in-place (idempotência F-011)", () => {
		sala.castVote("p1", "5");
		sala.castVote("p1", "8");
		const p = sala.getPlayer("p1")!;
		expect(p.value).toBe("8");
		expect(p.hasVoted).toBe(true);
	});

	test("rejeita un-vote (invalid_vote)", () => {
		expect(() => sala.castVote("p1", null)).toThrow(SalaError);
		try {
			sala.castVote("p1", null);
		} catch (e) {
			expect((e as SalaError).code).toBe("invalid_vote");
		}
	});

	test("rejeita valor fora do deck (invalid_vote)", () => {
		expect(() => sala.castVote("p1", "42" as unknown as never)).toThrow(
			SalaError,
		);
	});

	test("permite cast_vote em fase revealed", () => {
		// simulando fase revealed
		sala["phase"] = "revealed"; // acesso de teste
		expect(() => sala.castVote("p1", "5")).not.toThrow();
	});

	test("rejeita player que não está na sala", () => {
		expect(() => sala.castVote("ghost", "5")).toThrow(/não está na sala/);
	});

	test("todos conectados votaram → voting → revealable", () => {
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("voting");
		sala.castVote("p2", "5");
		expect(sala.phase).toBe("revealable");
	});
});

// ---------------------------------------------------------------------------
// reveal (democratizado)
// ---------------------------------------------------------------------------

describe("Sala — reveal", () => {
	test("calcula stats e phase → revealed (F-020)", () => {
		sala.castVote("p1", "5");
		const outcome = sala.reveal("p1");
		expect(sala.phase).toBe("revealed");
		expect(outcome.median).toBe(5);
		expect(outcome.mean).toBe(5);
		expect(outcome.range).toEqual([5, 5]);
		expect(outcome.unanimous).toBe(true);
	});

	test("qualquer player pode revelar (sem role check — ADR-0002)", () => {
		// adiciona Bob, faz ele votar, Bob revela
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		sala.castVote("p1", "5");
		sala.castVote("p2", "5");
		expect(sala.phase).toBe("revealable");
		const outcome = sala.reveal("p2"); // player (não host) revela
		expect(sala.phase).toBe("revealed");
		expect(outcome.unanimous).toBe(true);
	});

	test("rejeita reveal em fase idle (invalid_phase)", () => {
		expect(() => sala.reveal("p1")).toThrow(/invalid_phase/);
	});
});

// ---------------------------------------------------------------------------
// startNewRound
// ---------------------------------------------------------------------------

describe("Sala — startNewRound", () => {
	test("limpa votes e incrementa round (F-026)", () => {
		sala.castVote("p1", "5");
		sala.reveal("p1");
		expect(sala.phase).toBe("revealed");
		sala.startNewRound();
		expect(sala.phase).toBe("voting");
		expect(sala.round).toBe(2);
		expect(sala.getPlayer("p1")!.hasVoted).toBe(false);
		expect(sala.getPlayer("p1")!.value).toBeNull();
		expect(sala.votes.size).toBe(0);
	});

	test("qualquer player pode iniciar nova rodada (sem role check)", () => {
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		sala.castVote("p1", "5");
		sala.reveal("p1");
		// p2 (player) inicia nova rodada
		expect(sala.phase).toBe("revealed");
		sala.startNewRound();
		expect(sala.phase).toBe("voting");
		const p2after = sala.getPlayer("p2");
		expect(p2after?.role).toBe("player"); // sem promoção
	});

	test("rejeita start_new_round fora de revealed", () => {
		expect(() => sala.startNewRound()).toThrow(/invalid_phase/);
	});
});

// ---------------------------------------------------------------------------
// Timer (tick + auto-reveal)
// ---------------------------------------------------------------------------

describe("Sala — tick + auto-reveal", () => {
	test("tick decrementa 1s e dispara auto-reveal em 0 (F-015)", () => {
		sala.castVote("p1", "5");
		// 1 player: phase vai direto voting → revealable
		expect(["voting", "revealable"]).toContain(sala.phase);
		// avança manualmente para reduzir duração do teste
		sala.timer = 2;
		// phase='revealable' → tick retorna 'idle' (mas ainda decrementa o timer)
		expect(sala.tick()).toBe("idle");
		expect(["voting", "revealable"]).toContain(sala.phase);
		expect(sala.timer).toBe(1);
		expect(sala.tick()).toBe("fired");
		expect(sala.phase).toBe("revealed");
	});

	test("isCritical: true quando timer ≤ 30 e > 0 (F-014)", () => {
		sala.castVote("p1", "5");
		sala.timer = 30;
		expect(sala.isCritical()).toBe(true);
		sala.timer = 31;
		expect(sala.isCritical()).toBe(false);
		sala.timer = 1;
		expect(sala.isCritical()).toBe(true);
	});

	test("isCritical: false quando timer parado (idle)", () => {
		// sem cast_vote, timer não está ativo
		expect(sala.isCritical()).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// TickResult enum (T01)
// ---------------------------------------------------------------------------

describe("Sala — tick returns TickResult", () => {
	test("retorna 'ticking' quando phase='voting' e timer entre 0 e 60", () => {
		// 2 players: p1 vota, p2 não vota → phase fica em 'voting'
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("voting");
		expect(sala.tick()).toBe("ticking");
		expect(sala.timer).toBe(59);
		expect(sala.tick()).toBe("ticking");
		expect(sala.timer).toBe(58);
	});

	test("retorna 'fired' quando timer decrementa de 1 para 0", () => {
		// 2 players: p1 vota, p2 não vota → phase 'voting'
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("voting");
		sala.timer = 1;
		expect(sala.tick()).toBe("fired");
		expect(sala.phase).toBe("revealed");
		expect(sala.timer).toBe(0);
	});

	test("retorna 'idle' quando phase='revealable'", () => {
		// 1 player: phase vai direto voting → revealable
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("revealable");
		sala.timer = 30;
		expect(sala.tick()).toBe("idle");
		expect(sala.timer).toBe(29);
	});

	test("retorna 'idle' quando phase='revealed'", () => {
		sala.castVote("p1", "5");
		sala.reveal("p1");
		expect(sala.phase).toBe("revealed");
		expect(sala.tick()).toBe("idle");
	});

	test("retorna 'idle' quando phase='idle' (sem voto)", () => {
		expect(sala.phase).toBe("idle");
		expect(sala.tick()).toBe("idle");
		expect(sala.timer).toBe(60);
	});
});

// ---------------------------------------------------------------------------
// toState + SalaState snapshot
// ---------------------------------------------------------------------------

describe("Sala — toState", () => {
	test("snapshot inclui players, phase, votes", () => {
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		sala.castVote("p1", "5");
		sala.castVote("p2", "8");
		const state = sala.toState();
		expect(state.code).toBe("ABCD");
		expect(state.hostId).toBe("p1");
		expect(state.players.length).toBe(2);
		expect(state.votes).toEqual({ p1: "5", p2: "8" });
		expect(state.phase).toBe("revealable");
	});

	test("critical flag é true quando timer ≤ 30 e > 0", () => {
		sala.castVote("p1", "5");
		sala.timer = 25;
		const state = sala.toState();
		expect(state.critical).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Constantes exportadas
// ---------------------------------------------------------------------------

describe("Constantes exportadas", () => {
	test("SALA_SEAT_COUNT = 12", () => {
		expect(SALA_SEAT_COUNT).toBe(12);
	});

	test("SALA_TIMER_SECONDS = 60", () => {
		expect(SALA_TIMER_SECONDS).toBe(60);
	});

	test("SALA_DISCONNECT_GRACE_MS = 60_000", () => {
		expect(SALA_DISCONNECT_GRACE_MS).toBe(60_000);
	});
});
