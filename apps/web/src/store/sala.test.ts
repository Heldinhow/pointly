/**
 * Store transitions — colocated (bun:test).
 *
 * Cobre: setSala/applyReveal/resetForNewRound/tickTimer/critical,
 * removePlayerById (+prune votes), markVoted, upsertPlayer, selectors.
 */
import { describe, expect, test } from "bun:test";
import type { Player, SalaState, Vote } from "@planning-poker/shared";
import {
	CRITICAL_THRESHOLD_SECONDS,
	selectIsOnlyPlayer,
	selectMyVote,
	selectVotedCount,
	useSalaStore,
} from "./sala";

function makePlayer(overrides: Partial<Player> = {}): Player {
	return {
		id: "p_1",
		uuid: "00000000-0000-4000-8000-000000000000",
		nick: "Helder",
		role: "host",
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: 1_000_000,
		...overrides,
	};
}

function makeSala(overrides: Partial<SalaState> = {}): SalaState {
	return {
		code: "AB12",
		hostId: "p_1",
		players: [
			makePlayer(),
			makePlayer({
				id: "p_2",
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Maya",
				role: "player",
				seatIndex: 1,
				joinedAt: 1_000_001,
			}),
		],
		phase: "idle",
		round: 1,
		timer: 60,
		votes: {},
		createdAt: 1_000_000,
		...overrides,
	};
}

describe("sala store", () => {
	test("setSala guarda snapshot e limpa consensus fora de revealed", () => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 55 }));
		const s = useSalaStore.getState();
		expect(s.sala?.phase).toBe("voting");
		expect(s.consensus).toBeNull();
		expect(s.critical).toBe(false);
	});

	test("setSala computa critical em (0,30]", () => {
		useSalaStore.getState().reset();
		useSalaStore
			.getState()
			.setSala(makeSala({ phase: "voting", timer: CRITICAL_THRESHOLD_SECONDS }));
		expect(useSalaStore.getState().critical).toBe(true);
		useSalaStore
			.getState()
			.setSala(makeSala({ phase: "voting", timer: 31 }));
		expect(useSalaStore.getState().critical).toBe(false);
		useSalaStore
			.getState()
			.setSala(makeSala({ phase: "voting", timer: 0 }));
		expect(useSalaStore.getState().critical).toBe(false);
	});

	test("setSala revealed sem consensus prévio deriva stats dos votos", () => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(
			makeSala({
				phase: "revealed",
				votes: { p_1: "5" as Vote, p_2: "8" as Vote },
			}),
		);
		const c = useSalaStore.getState().consensus;
		expect(c).not.toBeNull();
		expect(c?.median).toBe(6.5);
		expect(c?.mean).toBe(6.5);
		expect(c?.range).toEqual([5, 8]);
		expect(c?.unanimous).toBe(false);
	});

	test("setSala revealed preserva consensus já aplicado", () => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala({ phase: "voting" }));
		useSalaStore
			.getState()
			.applyReveal({ p_1: "5" as Vote }, { median: 5, mean: 5, range: [5, 5], unanimous: true });
		useSalaStore.getState().setSala(makeSala({ phase: "revealed" }));
		expect(useSalaStore.getState().consensus?.unanimous).toBe(true);
	});

	test("applyReveal injeta votos + stats e vira revealed", () => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala({ phase: "voting" }));
		useSalaStore.getState().applyReveal(
			{ p_1: "3" as Vote, p_2: "3" as Vote },
			{ median: 3, mean: 3, range: [3, 3], unanimous: true },
		);
		const s = useSalaStore.getState();
		expect(s.sala?.phase).toBe("revealed");
		expect(s.sala?.votes).toEqual({ p_1: "3", p_2: "3" });
		expect(s.consensus?.unanimous).toBe(true);
	});

	test("resetForNewRound limpa votos, volta voting/60 e zera consensus", () => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala({ phase: "voting" }));
		useSalaStore.getState().markVoted("p_1", true);
		useSalaStore.getState().applyReveal(
			{ p_1: "5" as Vote },
			{ median: 5, mean: 5, range: [5, 5], unanimous: true },
		);
		useSalaStore.getState().resetForNewRound(2);
		const s = useSalaStore.getState();
		expect(s.sala?.round).toBe(2);
		expect(s.sala?.phase).toBe("voting");
		expect(s.sala?.timer).toBe(60);
		expect(s.sala?.votes).toEqual({});
		expect(s.sala?.players.every((p) => !p.hasVoted && p.value === null)).toBe(true);
		expect(s.consensus).toBeNull();
		expect(s.critical).toBe(false);
	});

	test("tickTimer decrementa só em voting|revealable com piso 0", () => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 31 }));
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala?.timer).toBe(30);
		expect(useSalaStore.getState().critical).toBe(true);

		useSalaStore.getState().setSala(makeSala({ phase: "idle", timer: 60 }));
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala?.timer).toBe(60);

		useSalaStore.getState().setSala(makeSala({ phase: "revealed", timer: 42 }));
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala?.timer).toBe(42);

		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 0 }));
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala?.timer).toBe(0);
	});

	test("timer gate: fresh round (60, sem votos) não tika até o primeiro voto", () => {
		useSalaStore.getState().reset();
		useSalaStore
			.getState()
			.setSala(makeSala({ phase: "voting", timer: 60 }));
		expect(useSalaStore.getState().timerActive).toBe(false);
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala?.timer).toBe(60);

		// primeiro voto liga o countdown
		useSalaStore.getState().setTimerActive(true);
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala?.timer).toBe(59);
	});

	test("timer gate: room_state com votos deriva ativo; reveal/new-round zeram", () => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(
			makeSala({
				phase: "voting",
				timer: 60,
				votes: { p_1: "5" as Vote },
				players: [
					makePlayer({ hasVoted: true }),
					makePlayer({
						id: "p_2",
						uuid: "00000000-0000-4000-8000-000000000001",
						nick: "Maya",
						role: "player",
						seatIndex: 1,
						joinedAt: 1_000_001,
					}),
				],
			}),
		);
		expect(useSalaStore.getState().timerActive).toBe(true);

		useSalaStore
			.getState()
			.applyReveal({ p_1: "5" as Vote }, { median: 5, mean: 5, range: [5, 5], unanimous: true });
		expect(useSalaStore.getState().timerActive).toBe(false);
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala?.timer).toBe(60);

		useSalaStore.getState().setTimerActive(true);
		useSalaStore.getState().resetForNewRound(2);
		expect(useSalaStore.getState().timerActive).toBe(false);
		useSalaStore.getState().tickTimer();
		expect(useSalaStore.getState().sala?.timer).toBe(60);
	});

	test("critical: passthrough do server vence o recompute local", () => {
		useSalaStore.getState().reset();
		// server diz crítico mesmo com timer alto → obedece
		useSalaStore
			.getState()
			.setSala(makeSala({ phase: "voting", timer: 45 }), { critical: true });
		expect(useSalaStore.getState().critical).toBe(true);
		// server diz NÃO-crítico com timer baixo (timer parado) → obedece
		useSalaStore
			.getState()
			.setSala(makeSala({ phase: "voting", timer: 20 }), { critical: false });
		expect(useSalaStore.getState().critical).toBe(false);
		// sem hint → fallback local (0,30]
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 20 }));
		expect(useSalaStore.getState().critical).toBe(true);
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 45 }));
		expect(useSalaStore.getState().critical).toBe(false);
	});

	test("room_state reconcilia hasVoted (N-de-M, incl. aggregate sem playerId)", () => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala({ phase: "voting", timer: 60 }));
		expect(selectVotedCount(useSalaStore.getState())).toBe(0);
		// broadcast do server após votos: snapshot completo com flags
		useSalaStore.getState().setSala(
			makeSala({
				phase: "voting",
				timer: 58,
				players: [
					makePlayer({ hasVoted: true }),
					makePlayer({
						id: "p_2",
						uuid: "00000000-0000-4000-8000-000000000001",
						nick: "Maya",
						role: "player",
						seatIndex: 1,
						joinedAt: 1_000_001,
						hasVoted: true,
					}),
				],
			}),
		);
		expect(selectVotedCount(useSalaStore.getState())).toBe(2);
	});

	test("removePlayerById remove + prune votes", () => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(
			makeSala({
				phase: "revealed",
				votes: { p_1: "5" as Vote, p_2: "8" as Vote },
			}),
		);
		useSalaStore.getState().removePlayerById("p_2");
		const s = useSalaStore.getState();
		expect(s.sala?.players.map((p) => p.id)).toEqual(["p_1"]);
		expect(s.sala?.votes).toEqual({ p_1: "5" });
	});

	test("markVoted/upsertPlayer + selectors", () => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala());
		useSalaStore.getState().setCurrentPlayerId("p_1");
		useSalaStore.getState().markVoted("p_1", true);
		const s = useSalaStore.getState();
		expect(selectVotedCount(s)).toBe(1);
		expect(selectIsOnlyPlayer(s)).toBe(false);
		useSalaStore.getState().removePlayerById("p_2");
		expect(selectIsOnlyPlayer(useSalaStore.getState())).toBe(true);
		expect(selectMyVote(useSalaStore.getState())).toBeNull();
	});
});
