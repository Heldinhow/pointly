/**
 * cast_vote loop tests — T38 verify (≥2 integration tests com mock WS).
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { applyVoteCastEvent, castVote, createVoteLoop } from "./vote-loop";
import type { WSClient } from "./ws-client";
import { useSalaStore } from "../store/sala";
import type { SalaState, VoteCastEvent } from "@planning-poker/shared";

/** Mock minimal WSClient que captura `send` calls. */
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

/** Sala com 2 players (Helder host, Maya player). */
function makeSala(): SalaState {
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
				hasVoted: false,
				value: null,
				status: "connected",
				joinedAt: 1_000_000,
			},
			{
				id: "p_maya",
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Maya",
				role: "player",
				seatIndex: 1,
				hasVoted: false,
				value: null,
				status: "connected",
				joinedAt: 1_000_001,
			},
		],
		phase: "voting",
		round: 1,
		timer: 60,
		votes: {},
		createdAt: 1_000_000,
	};
}

describe("castVote — T38", () => {
	let ws: ReturnType<typeof makeMockWS>;

	beforeEach(() => {
		ws = makeMockWS();
	});

	test("castVote envia { type: 'cast_vote', payload: { value } } via WS", () => {
		castVote(ws, "5");
		expect(ws.sent).toHaveLength(1);
		expect(ws.sent[0]).toEqual({ type: "cast_vote", payload: { value: "5" } });
	});

	test("castVote funciona com cada carta do deck (incl. ☕)", () => {
		castVote(ws, "0");
		castVote(ws, "½");
		castVote(ws, "13");
		castVote(ws, "☕");
		expect(ws.sent).toHaveLength(4);
		expect(ws.sent.map((s) => s.payload)).toEqual([
			{ value: "0" },
			{ value: "½" },
			{ value: "13" },
			{ value: "☕" },
		]);
	});
});

describe("applyVoteCastEvent — T38", () => {
	beforeEach(() => {
		// Reseta store e popula com sala base
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala());
	});

	test("individual: marca hasVoted=true no playerId (sem expor value)", () => {
		const event: VoteCastEvent = {
			kind: "individual",
			playerId: "p_maya",
			playerName: "Maya",
		};
		applyVoteCastEvent(useSalaStore.getState(), event);

		const maya = useSalaStore
			.getState()
			.sala?.players.find((p) => p.id === "p_maya");
		expect(maya?.hasVoted).toBe(true);
		// CRÍTICO: value NÃO é exposto pré-reveal (F-010)
		expect(maya?.value).toBeNull();
	});

	test("aggregate: no-op no store (apenas toast via T37)", () => {
		const event: VoteCastEvent = { kind: "aggregate", count: 3 };
		const salaBefore = useSalaStore.getState().sala;
		applyVoteCastEvent(useSalaStore.getState(), event);
		const salaAfter = useSalaStore.getState().sala;
		// Sala inalterada
		expect(salaAfter).toBe(salaBefore);
	});

	test("individual idempotente: marcar 2x mantém hasVoted=true", () => {
		const event: VoteCastEvent = {
			kind: "individual",
			playerId: "p_helder",
			playerName: "Helder",
		};
		applyVoteCastEvent(useSalaStore.getState(), event);
		applyVoteCastEvent(useSalaStore.getState(), event);
		const helder = useSalaStore
			.getState()
			.sala?.players.find((p) => p.id === "p_helder");
		expect(helder?.hasVoted).toBe(true);
	});
});

describe("createVoteLoop — T38", () => {
	beforeEach(() => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala());
	});

	test("castVote via loop envia via WS", () => {
		const ws = makeMockWS();
		const loop = createVoteLoop(ws, useSalaStore.getState());
		loop.castVote("8");
		expect(ws.sent[0]).toEqual({ type: "cast_vote", payload: { value: "8" } });
	});

	test("dispatch: vote_cast individual aplica no store", () => {
		const ws = makeMockWS();
		const loop = createVoteLoop(ws, useSalaStore.getState());

		// Simula evento S→C chegando
		loop.dispatch({
			type: "vote_cast",
			payload: { kind: "individual", playerId: "p_maya", playerName: "Maya" },
		});

		const maya = useSalaStore
			.getState()
			.sala?.players.find((p) => p.id === "p_maya");
		expect(maya?.hasVoted).toBe(true);
	});

	test("dispatch: ignora outros eventos (não é vote_cast)", () => {
		const ws = makeMockWS();
		const loop = createVoteLoop(ws, useSalaStore.getState());
		const salaBefore = useSalaStore.getState().sala;

		// welcome, room_state, etc — não devem modificar sala
		loop.dispatch({
			type: "welcome",
			payload: {
				playerId: "p_x",
				role: "player",
				sala: makeSala(),
			},
		});

		// welcome não é tratado pelo vote-loop → sala inalterada
		expect(useSalaStore.getState().sala).toBe(salaBefore);
	});
});
