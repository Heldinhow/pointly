/**
 * start_new_round loop tests — T40 verify (≥1 integration test).
 */
import { beforeEach, describe, expect, test } from "bun:test";
import {
	applyRoundStartedEvent,
	createNewRoundLoop,
	requestNewRound,
} from "./new-round-loop";
import type { WSClient } from "./ws-client";
import { useSalaStore } from "../store/sala";
import type { SalaState } from "@planning-poker/shared";

function makeMockWS(): WSClient & {
	sent: Array<{ type: string; payload: unknown }>;
} {
	const sent: Array<{ type: string; payload: unknown }> = [];
	return {
		sent,
		connect: () => {},
		close: () => {},
		getStatus: () => "open" as const,
		send: (event) => {
			sent.push({ type: event.type, payload: event.payload });
		},
	};
}

function makeSalaRevealed(): SalaState {
	return {
		code: "9B9F",
		hostId: "p_helder",
		players: [
			{
				id: "p_helder",
				uuid: "00000000-0000-4000-8000-000000000000",
				nick: "Helder",
				role: "host",
				seatIndex: 0,
				hasVoted: true,
				value: "5",
				status: "connected",
				joinedAt: 1_000_000,
			},
		],
		phase: "revealed",
		round: 1,
		timer: 0,
		votes: { p_helder: "5" },
		createdAt: 1_000_000,
	};
}

describe("requestNewRound — T40", () => {
	test("envia { type: 'start_new_round', payload: {} } via WS", () => {
		const ws = makeMockWS();
		requestNewRound(ws);
		expect(ws.sent[0]).toEqual({ type: "start_new_round", payload: {} });
	});
});

describe("applyRoundStartedEvent — T40", () => {
	beforeEach(() => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSalaRevealed());
		// Aplica reveal state no store
		useSalaStore
			.getState()
			.applyReveal(
				{ p_helder: "5" },
				{ median: 5, mean: 5, range: [5, 5], unanimous: true },
			);
	});

	test("incrementa round + limpa votes + reseta timer", () => {
		applyRoundStartedEvent(useSalaStore.getState(), { round: 2 });

		const sala = useSalaStore.getState().sala;
		expect(sala?.round).toBe(2);
		expect(sala?.votes).toEqual({});
		expect(sala?.timer).toBe(60);
		expect(sala?.phase).toBe("voting"); // pós-reset
	});

	test("reseta hasVoted=false em todos os players", () => {
		applyRoundStartedEvent(useSalaStore.getState(), { round: 2 });
		const helder = useSalaStore
			.getState()
			.sala?.players.find((p) => p.id === "p_helder");
		expect(helder?.hasVoted).toBe(false);
		expect(helder?.value).toBeNull();
	});

	test("limpa consensus (null pós-reset)", () => {
		// Pre-condition: consensus existe (do reveal anterior)
		expect(useSalaStore.getState().consensus).not.toBeNull();
		applyRoundStartedEvent(useSalaStore.getState(), { round: 2 });
		expect(useSalaStore.getState().consensus).toBeNull();
	});
});

describe("createNewRoundLoop — T40", () => {
	beforeEach(() => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSalaRevealed());
	});

	test("dispatch: round_started aplica no store", () => {
		const ws = makeMockWS();
		const loop = createNewRoundLoop(ws, useSalaStore.getState());

		loop.dispatch({ type: "round_started", payload: { round: 5 } });

		expect(useSalaStore.getState().sala?.round).toBe(5);
		expect(useSalaStore.getState().sala?.phase).toBe("voting");
	});

	test("dispatch: ignora outros eventos", () => {
		const ws = makeMockWS();
		const loop = createNewRoundLoop(ws, useSalaStore.getState());
		const roundBefore = useSalaStore.getState().sala?.round;

		loop.dispatch({
			type: "votes_revealed",
			payload: {
				votes: {},
				median: null,
				mean: null,
				range: null,
				unanimous: false,
			},
		});

		// votes_revealed não é round_started → round inalterado
		expect(useSalaStore.getState().sala?.round).toBe(roundBefore);
	});
});
