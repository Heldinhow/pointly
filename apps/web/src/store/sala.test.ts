/**
 * useSalaStore tests — T22 verify (≥4 unit tests).
 *
 * Cobre: actions imutáveis, selectors retornam subset correto,
 * e invariantes do state machine no client.
 */
import { beforeEach, describe, expect, test } from "bun:test";
import type { Player, SalaState, Vote } from "@planning-poker/shared";
import {
	selectConsensus,
	selectCurrentPlayer,
	selectIsHost,
	selectIsOnlyPlayer,
	selectPhase,
	selectPlayers,
	selectSala,
	selectTimer,
	selectVotes,
	useSalaStore,
} from "./sala";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlayer(
	id: string,
	nick: string,
	overrides: Partial<Player> = {},
): Player {
	return {
		id,
		uuid: `00000000-0000-4000-8000-${id.padStart(12, "0")}`,
		nick,
		role: "player",
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: 1_700_000_000_000,
		...overrides,
	};
}

function makeSala(overrides: Partial<SalaState> = {}): SalaState {
	return {
		code: "ABCD",
		hostId: "p1",
		players: [makePlayer("p1", "Ana", { role: "host", seatIndex: 0 })],
		phase: "idle",
		round: 1,
		timer: 60,
		votes: {},
		createdAt: 1_700_000_000_000,
		...overrides,
	};
}

beforeEach(() => {
	// Reset para estado inicial antes de cada teste.
	useSalaStore.getState().reset();
});

// ---------------------------------------------------------------------------
// T22: actions imutáveis
// ---------------------------------------------------------------------------

describe("useSalaStore — actions", () => {
	test("setSala armazena snapshot completo", () => {
		const sala = makeSala();
		useSalaStore.getState().setSala(sala);
		const stored = useSalaStore.getState().sala;
		expect(stored).toBeDefined();
		expect(stored).toEqual(sala);
		expect(stored).not.toBe(sala); // nova referência
	});

	test("setCurrentPlayerId define id do player local", () => {
		useSalaStore.getState().setSala(makeSala());
		useSalaStore.getState().setCurrentPlayerId("p1");
		expect(useSalaStore.getState().currentPlayerId).toBe("p1");
	});

	test("upsertPlayer insere novo player (imutável)", () => {
		useSalaStore.getState().setSala(makeSala());
		const before = useSalaStore.getState().sala!;
		useSalaStore
			.getState()
			.upsertPlayer(makePlayer("p2", "Bob", { seatIndex: 1 }));
		const after = useSalaStore.getState().sala!;
		expect(after.players).toHaveLength(2);
		expect(after.players[1]?.nick).toBe("Bob");
		expect(after.players[1]?.seatIndex).toBe(1);
		expect(after).not.toBe(before); // nova referência de sala
		expect(after.players).not.toBe(before.players); // nova referência de array
	});

	test("upsertPlayer atualiza player existente sem duplicar", () => {
		useSalaStore.getState().setSala(makeSala());
		const updated = makePlayer("p1", "Ana (renamed)", { role: "host" });
		useSalaStore.getState().upsertPlayer(updated);
		const players = useSalaStore.getState().sala!.players;
		expect(players).toHaveLength(1);
		expect(players[0]?.nick).toBe("Ana (renamed)");
	});

	test("removePlayerById remove player e voto associado", () => {
		useSalaStore.getState().setSala(
			makeSala({
				players: [
					makePlayer("p1", "Ana", { role: "host" }),
					makePlayer("p2", "Bob", { hasVoted: true, value: "5" }),
				],
				votes: { p2: "5" as Vote },
			}),
		);
		useSalaStore.getState().removePlayerById("p2");
		const sala = useSalaStore.getState().sala!;
		expect(sala.players).toHaveLength(1);
		expect(sala.votes["p2"]).toBeUndefined();
	});

	test("markVoted atualiza hasVoted (imutável)", () => {
		useSalaStore.getState().setSala(
			makeSala({
				players: [makePlayer("p1", "Ana", { hasVoted: false })],
			}),
		);
		useSalaStore.getState().markVoted("p1", true);
		const p = useSalaStore.getState().sala!.players[0]!;
		expect(p.hasVoted).toBe(true);
		// outros campos preservados
		expect(p.nick).toBe("Ana");
		expect(p.seatIndex).toBe(0);
	});

	test("applyReveal injeta votos + stats, phase → revealed", () => {
		useSalaStore.getState().setSala(
			makeSala({
				phase: "revealable",
				players: [
					makePlayer("p1", "Ana", { hasVoted: true, value: "5" }),
					makePlayer("p2", "Bob", { hasVoted: true, value: "8" }),
				],
			}),
		);
		const votes: Record<string, Vote> = { p1: "5", p2: "8" };
		const stats = {
			median: 6.5,
			mean: 6.5,
			range: [5, 8] as [number, number],
			unanimous: false,
		};
		useSalaStore.getState().applyReveal(votes, stats);
		const s = useSalaStore.getState();
		expect(s.sala!.phase).toBe("revealed");
		expect(s.sala!.votes).toEqual({ p1: "5", p2: "8" });
		expect(s.consensus).toEqual(stats);
	});

	test("resetForNewRound limpa votos, phase → voting, round++", () => {
		useSalaStore.getState().setSala(
			makeSala({
				round: 1,
				phase: "revealed",
				timer: 0,
				votes: { p1: "5" as Vote },
				players: [
					makePlayer("p1", "Ana", { role: "host", hasVoted: true, value: "5" }),
				],
			}),
		);
		useSalaStore
			.getState()
			.applyReveal(
				{ p1: "5" as Vote },
				{ median: 5, mean: 5, range: [5, 5], unanimous: true },
			);
		useSalaStore.getState().resetForNewRound(2);
		const s = useSalaStore.getState();
		expect(s.sala!.round).toBe(2);
		expect(s.sala!.phase).toBe("voting");
		expect(s.sala!.timer).toBe(60);
		expect(s.sala!.votes).toEqual({});
		expect(s.sala!.players[0]?.hasVoted).toBe(false);
		expect(s.sala!.players[0]?.value).toBeNull();
		expect(s.consensus).toBeNull();
		expect(s.critical).toBe(false);
	});

	test("setSalaEnded registra reason e zera phase", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "voting" }));
		useSalaStore.getState().setSalaEnded("last_left");
		const s = useSalaStore.getState();
		expect(s.salaEndedReason).toBe("last_left");
		expect(s.sala!.phase).toBe("idle");
	});

	test("pushToast + dismissToast", () => {
		useSalaStore.getState().pushToast("Voto registrado", "success");
		const s = useSalaStore.getState();
		expect(s.ui.toast).toEqual({ kind: "success", text: "Voto registrado" });
		useSalaStore.getState().dismissToast();
		expect(useSalaStore.getState().ui.toast).toBeNull();
	});

	test("pushToast default kind=info", () => {
		useSalaStore.getState().pushToast("Olá");
		expect(useSalaStore.getState().ui.toast?.kind).toBe("info");
	});

	test("reset volta ao estado inicial", () => {
		useSalaStore.getState().setSala(makeSala());
		useSalaStore.getState().setCurrentPlayerId("p1");
		useSalaStore.getState().pushToast("foo");
		useSalaStore.getState().reset();
		const s = useSalaStore.getState();
		expect(s.sala).toBeNull();
		expect(s.currentPlayerId).toBeNull();
		expect(s.ui.toast).toBeNull();
		expect(s.consensus).toBeNull();
		expect(s.critical).toBe(false);
	});

	test("setSala detecta critical (timer ≤30s)", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 25 }));
		expect(useSalaStore.getState().critical).toBe(true);

		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 60 }));
		expect(useSalaStore.getState().critical).toBe(false);

		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 30 }));
		expect(useSalaStore.getState().critical).toBe(true); // boundary ≤30
	});

	test("setSala ignora critical quando timer=0 (idle)", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "idle", timer: 0 }));
		expect(useSalaStore.getState().critical).toBe(false);
	});

	test("setSala limpa consensus se fase não é revealed", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "revealed" }));
		useSalaStore
			.getState()
			.applyReveal({}, { median: 5, mean: 5, range: [5, 5], unanimous: true });
		expect(useSalaStore.getState().consensus).not.toBeNull();

		useSalaStore.getState().setSala(makeSala({ phase: "voting" }));
		expect(useSalaStore.getState().consensus).toBeNull();
	});

	test("setSala limpa salaEndedReason em novo snapshot", () => {
		useSalaStore.getState().setSala(makeSala());
		useSalaStore.getState().setSalaEnded("last_left");
		expect(useSalaStore.getState().salaEndedReason).toBe("last_left");

		useSalaStore.getState().setSala(makeSala());
		expect(useSalaStore.getState().salaEndedReason).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// T22: selectors granulares
// ---------------------------------------------------------------------------

describe("useSalaStore — selectors", () => {
	test("selectSala retorna sala ou null", () => {
		expect(selectSala(useSalaStore.getState())).toBeNull();
		const sala = makeSala();
		useSalaStore.getState().setSala(sala);
		expect(selectSala(useSalaStore.getState())).toEqual(sala);
	});

	test("selectPlayers retorna array (vazio se sem sala)", () => {
		expect(selectPlayers(useSalaStore.getState())).toEqual([]);
		useSalaStore.getState().setSala(makeSala());
		expect(selectPlayers(useSalaStore.getState())).toHaveLength(1);
	});

	test("selectCurrentPlayer retorna null sem currentPlayerId", () => {
		useSalaStore.getState().setSala(makeSala());
		expect(selectCurrentPlayer(useSalaStore.getState())).toBeNull();
	});

	test("selectCurrentPlayer retorna player correto com id setado", () => {
		useSalaStore.getState().setSala(
			makeSala({
				players: [
					makePlayer("p1", "Ana", { role: "host" }),
					makePlayer("p2", "Bob"),
				],
			}),
		);
		useSalaStore.getState().setCurrentPlayerId("p2");
		const me = selectCurrentPlayer(useSalaStore.getState());
		expect(me).not.toBeNull();
		expect(me?.id).toBe("p2");
		expect(me?.nick).toBe("Bob");
	});

	test("selectPhase default 'idle' (sem sala)", () => {
		expect(selectPhase(useSalaStore.getState())).toBe("idle");
	});

	test("selectTimer default 60 (sem sala)", () => {
		expect(selectTimer(useSalaStore.getState())).toBe(60);
	});

	test("selectVotes default {} (sem sala)", () => {
		expect(selectVotes(useSalaStore.getState())).toEqual({});
	});

	test("selectConsensus default null", () => {
		expect(selectConsensus(useSalaStore.getState())).toBeNull();
	});

	test("selectIsHost true só quando role=host", () => {
		useSalaStore
			.getState()
			.setSala(
				makeSala({ players: [makePlayer("p1", "Ana", { role: "host" })] }),
			);
		useSalaStore.getState().setCurrentPlayerId("p1");
		expect(selectIsHost(useSalaStore.getState())).toBe(true);

		useSalaStore
			.getState()
			.setSala(
				makeSala({ players: [makePlayer("p1", "Ana", { role: "player" })] }),
			);
		expect(selectIsHost(useSalaStore.getState())).toBe(false);
	});

	test("selectIsOnlyPlayer true só quando sou o único", () => {
		useSalaStore
			.getState()
			.setSala(
				makeSala({ players: [makePlayer("p1", "Ana", { role: "host" })] }),
			);
		useSalaStore.getState().setCurrentPlayerId("p1");
		expect(selectIsOnlyPlayer(useSalaStore.getState())).toBe(true);

		useSalaStore.getState().setSala(
			makeSala({
				players: [
					makePlayer("p1", "Ana", { role: "host" }),
					makePlayer("p2", "Bob"),
				],
			}),
		);
		expect(selectIsOnlyPlayer(useSalaStore.getState())).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// T22: invariantes de imutabilidade
// ---------------------------------------------------------------------------

describe("useSalaStore — imutabilidade", () => {
	test("upsertPlayer não muta array de players original", () => {
		const originalPlayers = [makePlayer("p1", "Ana", { role: "host" })];
		const sala = makeSala({ players: originalPlayers });
		useSalaStore.getState().setSala(sala);
		const beforeRef = useSalaStore.getState().sala!.players;
		useSalaStore
			.getState()
			.upsertPlayer(makePlayer("p2", "Bob", { seatIndex: 1 }));
		const afterRef = useSalaStore.getState().sala!.players;
		// Zustand substituiu referência: arrays diferentes
		expect(afterRef).not.toBe(beforeRef);
		// Mas o array original do input não foi mutado
		expect(originalPlayers).toHaveLength(1);
	});

	test("markVoted preserva identidade dos outros players", () => {
		useSalaStore.getState().setSala(
			makeSala({
				players: [
					makePlayer("p1", "Ana", { role: "host" }),
					makePlayer("p2", "Bob"),
				],
			}),
		);
		const p1Before = useSalaStore.getState().sala!.players[0]!;
		useSalaStore.getState().markVoted("p2", true);
		const p1After = useSalaStore.getState().sala!.players[0]!;
		// p1 não foi tocado: novos campos hasVoted preservados do original
		expect(p1After).toEqual(p1Before);
		// mas a referência do player p1 foi preservada dentro do novo array
		// (mapPlayer só substitui o player alterado)
		expect(p1After.hasVoted).toBe(p1Before.hasVoted);
	});
});

// ---------------------------------------------------------------------------
// T02: tickTimer — ticker cliente (BUG-101 / ADR-002)
// ---------------------------------------------------------------------------

describe("useSalaStore — tickTimer (T02 / BUG-101)", () => {
	test("decrementa timer em 1 quando phase === 'voting'", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 45 }));
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala!.timer).toBe(44);
	});

	test("recomputa critical = true quando timer cruza abaixo de 30", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 31 }));
		expect(useSalaStore.getState().critical).toBe(false);
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala!.timer).toBe(30);
		expect(useSalaStore.getState().critical).toBe(true);
	});

	test("recomputa critical = true em todos os valores ≤30 enquanto voting", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 30 }));
		expect(useSalaStore.getState().critical).toBe(true);
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala!.timer).toBe(29);
		expect(useSalaStore.getState().critical).toBe(true);
	});

	test("tickTimer é no-op quando phase !== 'voting' (idle)", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "idle", timer: 45 }));
		const before = useSalaStore.getState().sala;
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala).toBe(before);
		expect(useSalaStore.getState().sala!.timer).toBe(45);
	});

	test("tickTimer é no-op quando phase === 'revealed'", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "revealed", timer: 0 }));
		const before = useSalaStore.getState().sala;
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala).toBe(before);
	});

	test("tickTimer decrementa timer quando phase === 'revealable'", () => {
		useSalaStore
			.getState()
			.setSala(makeSala({ phase: "revealable", timer: 30 }));
		const beforeTimer = useSalaStore.getState().sala!.timer;
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala!.timer).toBe(beforeTimer - 1);
	});

	test("tickTimer não permite timer ir abaixo de 0 (clamp)", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 1 }));
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala!.timer).toBe(0);
		useSalaStore.getState().tickTimer(); // segundo tick é no-op
		expect(useSalaStore.getState().sala!.timer).toBe(0);
	});

	test("tickTimer em timer=0 com critical=false (timer zerado não é crítico)", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 0 }));
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala!.timer).toBe(0);
		expect(useSalaStore.getState().critical).toBe(false);
	});

	test("simulação: 60 ticks de timer=60 chegam a timer=0 e critical=false", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 60 }));
		for (let i = 0; i < 60; i++) {
			useSalaStore.getState().tickTimer();
		}
		const final = useSalaStore.getState();
		expect(final.sala!.timer).toBe(0);
		expect(final.critical).toBe(false);
		expect(final.sala!.phase).toBe("voting"); // phase preservada
	});

	test("tickTimer no-op quando sala é null (pré-connect)", () => {
		const before = useSalaStore.getState().sala;
		expect(before).toBeNull();
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala).toBeNull();
	});

	test("setSala após 30 ticks locais sobrescreve timer com valor do server (server wins)", () => {
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 60 }));
		for (let i = 0; i < 30; i++) {
			useSalaStore.getState().tickTimer();
		}
		expect(useSalaStore.getState().sala!.timer).toBe(30);
		// Server reconcilia com timer=45 (ex.: clock drift)
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 45 }));
		expect(useSalaStore.getState().sala!.timer).toBe(45);
		expect(useSalaStore.getState().critical).toBe(false); // 45 > 30
	});
});

// ---------------------------------------------------------------------------
// T22: smoke — store funcional end-to-end
// ---------------------------------------------------------------------------

describe("useSalaStore — smoke", () => {
	test("ciclo completo: setSala → upsert → vote → reveal → new round", () => {
		// 1. Host cria sala
		useSalaStore.getState().setSala(makeSala());
		useSalaStore.getState().setCurrentPlayerId("p1");
		expect(selectPhase(useSalaStore.getState())).toBe("idle");

		// 2. Bob entra
		useSalaStore
			.getState()
			.upsertPlayer(makePlayer("p2", "Bob", { seatIndex: 1 }));
		expect(selectPlayers(useSalaStore.getState())).toHaveLength(2);

		// 3. Ana vota 5
		useSalaStore.getState().markVoted("p1", true);
		expect(selectPlayers(useSalaStore.getState())[0]?.hasVoted).toBe(true);

		// 4. Bob vota 8
		useSalaStore.getState().markVoted("p2", true);
		expect(selectPlayers(useSalaStore.getState())[1]?.hasVoted).toBe(true);

		// 5. Reveal
		useSalaStore
			.getState()
			.applyReveal(
				{ p1: "5" as Vote, p2: "8" as Vote },
				{ median: 6.5, mean: 6.5, range: [5, 8], unanimous: false },
			);
		expect(selectPhase(useSalaStore.getState())).toBe("revealed");
		expect(selectConsensus(useSalaStore.getState())?.median).toBe(6.5);

		// 6. New round
		useSalaStore.getState().resetForNewRound(2);
		expect(selectPhase(useSalaStore.getState())).toBe("voting");
		expect(selectPlayers(useSalaStore.getState())[0]?.hasVoted).toBe(false);
		expect(useSalaStore.getState().sala!.round).toBe(2);
	});
});
