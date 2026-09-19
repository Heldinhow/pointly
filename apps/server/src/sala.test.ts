/**
 * Sala tests — T12 verify (≥8 unit tests).
 *
 * Cobre state machine e regras de negócio (sem timer: reveal só manual).
 */
import { beforeEach, describe, expect, test } from "bun:test";
import {
	Sala,
	SALA_DISCONNECT_GRACE_MS,
	SALA_SEAT_COUNT,
	SalaError,
} from "./sala";
import type { Player } from "@planning-poker/shared";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlayer(
	id: string,
	nick: string,
	role: "host" | "player" | "spectator" = "player",
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

// ---------------------------------------------------------------------------
// Constructor + initial state
// ---------------------------------------------------------------------------

describe("Sala — constructor", () => {
	test("cria sala com host e estado idle", () => {
		expect(sala.code).toBe("ABCD");
		expect(sala.hostId).toBe("p1");
		expect(sala.phase).toBe("idle");
		expect(sala.round).toBe(1);
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
	test("primeiro voto: idle → voting (ou revealable, se 1 só player) (F-013)", () => {
		sala.castVote("p1", "5");
		// com 1 só player, vai direto voting → revealable
		expect(["voting", "revealable"]).toContain(sala.phase);
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

	test("espectador não conta para o quórum do revealable", () => {
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		sala.addPlayer({ ...makePlayer("p3", "Olho", "spectator", 1_002), seatIndex: -1 });
		sala.castVote("p1", "5");
		sala.castVote("p2", "5");
		expect(sala.phase).toBe("revealable");
	});

	test("voto de espectador é rejeitado com role_denied", () => {
		sala.addPlayer({ ...makePlayer("p3", "Olho", "spectator", 1_002), seatIndex: -1 });
		expect(() => sala.castVote("p3", "5")).toThrow(SalaError);
		try {
			sala.castVote("p3", "5");
		} catch (e) {
			expect((e as SalaError).code).toBe("role_denied");
		}
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
		// Voto único não é unanimidade (gate ≥2 numéricos do sinal).
		expect(outcome.unanimous).toBe(false);
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
});

// ---------------------------------------------------------------------------
// Post-reveal edit (EVR-01 / EVR-04 / EVR-06 / EVR-13 / EVR-14)
// ---------------------------------------------------------------------------

describe("Sala — post-reveal edit", () => {
	test("EVR-01: castVote em revealed mantém phase revealed", () => {
		// Setup: 2 players, voting → reveal
		sala.addPlayer(makePlayer("p2", "Bia"));
		sala.castVote("p1", "5");
		sala.castVote("p2", "5");
		expect(sala.phase).toBe("revealable");
		sala.reveal("p1");
		expect(sala.phase).toBe("revealed");
		// Act: edit pós-reveal
		const result = sala.castVote("p1", "8");
		// Assert
		expect(result).toEqual({ changed: true });
		expect(sala.phase).toBe("revealed");
	});

	test("EVR-14: castVote em revealed com mesmo valor retorna { changed: false } sem mutação", () => {
		sala.addPlayer(makePlayer("p2", "Bia"));
		sala.castVote("p1", "5");
		sala.castVote("p2", "5");
		sala.reveal("p1");
		const voteBefore = sala.getPlayer("p1")?.value;
		expect(voteBefore).toBe("5");
		// Act: clicar a mesma carta
		const result = sala.castVote("p1", "5");
		// Assert
		expect(result).toEqual({ changed: false });
		expect(sala.getPlayer("p1")?.value).toBe("5");
	});

	test("EVR-04: castVote em revealed com valor diferente retorna { changed: true } e marca consensusDirty", () => {
		sala.addPlayer(makePlayer("p2", "Bia"));
		sala.castVote("p1", "5");
		sala.castVote("p2", "5");
		sala.reveal("p1");
		// Primeira chamada após revelar marca dirty
		const result = sala.castVote("p1", "8");
		expect(result).toEqual({ changed: true });
		// consume retorna true uma vez
		expect(sala.consumeConsensusDirty()).toBe(true);
		// segunda chamada retorna false (foi limpo)
		expect(sala.consumeConsensusDirty()).toBe(false);
	});

	test("EVR-06: recomputeConsensus reflete unanimidade quebrada após edição", () => {
		sala.addPlayer(makePlayer("p2", "Bia"));
		sala.castVote("p1", "5");
		sala.castVote("p2", "5");
		sala.reveal("p1");
		// Antes: unanimous
		const before = sala.recomputeConsensus();
		expect(before.unanimous).toBe(true);
		expect(before.median).toBe(5);
		// Edit quebra unanimidade
		sala.castVote("p1", "8");
		const after = sala.recomputeConsensus();
		expect(after.unanimous).toBe(false);
		expect(after.median).toBe(6.5);
		expect(after.range).toEqual([5, 8]);
	});

	test("edit pós-reveal mantém phase revealed", () => {
		sala.addPlayer(makePlayer("p2", "Bia"));
		sala.castVote("p1", "5");
		sala.castVote("p2", "5");
		sala.reveal("p1");
		expect(sala.phase).toBe("revealed");
		// Edit pós-reveal não muda a fase
		sala.castVote("p1", "8");
		expect(sala.phase).toBe("revealed");
	});
});

// ---------------------------------------------------------------------------
// Constantes exportadas
// ---------------------------------------------------------------------------

describe("Constantes exportadas", () => {
	test("SALA_SEAT_COUNT = 12", () => {
		expect(SALA_SEAT_COUNT).toBe(12);
	});

	test("SALA_DISCONNECT_GRACE_MS = 360_000 (cobre backoff 5min)", () => {
		expect(SALA_DISCONNECT_GRACE_MS).toBe(360_000);
	});
});
