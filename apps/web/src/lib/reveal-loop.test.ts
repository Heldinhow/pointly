/**
 * reveal_votes loop tests — T39 verify (≥1 integration test).
 */
import { beforeEach, describe, expect, test } from "bun:test";
import type { SalaState, VotesRevealedEvent } from "@planning-poker/shared";
import { useSalaStore } from "../store/sala";
import {
	applyVotesRevealedEvent,
	createRevealLoop,
	requestReveal,
} from "./reveal-loop";
import type { WSClient } from "./ws-client";

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
				hasVoted: true,
				value: "5",
				status: "connected",
				joinedAt: 1_000_000,
			},
			{
				id: "p_maya",
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Maya",
				role: "player",
				seatIndex: 1,
				hasVoted: true,
				value: "5",
				status: "connected",
				joinedAt: 1_000_001,
			},
		],
		phase: "revealable",
		round: 1,
		timer: 30,
		votes: { p_helder: "5", p_maya: "5" },
		createdAt: 1_000_000,
	};
}

describe("requestReveal — T39", () => {
	test("envia { type: 'reveal_votes', payload: {} } via WS", () => {
		const ws = makeMockWS();
		requestReveal(ws);
		expect(ws.sent).toHaveLength(1);
		expect(ws.sent[0]).toEqual({ type: "reveal_votes", payload: {} });
	});
});

describe("applyVotesRevealedEvent — T39", () => {
	beforeEach(() => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala());
	});

	test("aplica phase='revealed' + votes no store + consensus", () => {
		const event: VotesRevealedEvent = {
			votes: { p_helder: "5", p_maya: "5" },
			median: 5,
			mean: 5,
			range: [5, 5],
			unanimous: true,
		};
		applyVotesRevealedEvent(useSalaStore.getState(), event);

		const sala = useSalaStore.getState().sala;
		const consensus = useSalaStore.getState().consensus;

		expect(sala?.phase).toBe("revealed");
		expect(sala?.votes).toEqual({ p_helder: "5", p_maya: "5" });
		expect(consensus?.median).toBe(5);
		expect(consensus?.unanimous).toBe(true);
	});

	test("unanimous=false aplica unanimity flag corretamente (F-049)", () => {
		const event: VotesRevealedEvent = {
			votes: { p_helder: "5", p_maya: "8" },
			median: 6.5,
			mean: 6.5,
			range: [5, 8],
			unanimous: false,
		};
		applyVotesRevealedEvent(useSalaStore.getState(), event);
		expect(useSalaStore.getState().consensus?.unanimous).toBe(false);
		expect(useSalaStore.getState().consensus?.median).toBe(6.5);
	});
});

describe("createRevealLoop — T39", () => {
	beforeEach(() => {
		useSalaStore.getState().reset();
		useSalaStore.getState().setSala(makeSala());
	});

	test("requestReveal via loop envia via WS", () => {
		const ws = makeMockWS();
		const loop = createRevealLoop(ws, useSalaStore.getState());
		loop.requestReveal();
		expect(ws.sent[0]?.type).toBe("reveal_votes");
	});

	test("dispatch: votes_revealed aplica no store", () => {
		const ws = makeMockWS();
		const loop = createRevealLoop(ws, useSalaStore.getState());

		loop.dispatch({
			type: "votes_revealed",
			payload: {
				votes: { p_helder: "5", p_maya: "5" },
				median: 5,
				mean: 5,
				range: [5, 5],
				unanimous: true,
			},
		});

		expect(useSalaStore.getState().sala?.phase).toBe("revealed");
		expect(useSalaStore.getState().consensus?.unanimous).toBe(true);
	});

	test("dispatch: ignora outros eventos", () => {
		const ws = makeMockWS();
		const loop = createRevealLoop(ws, useSalaStore.getState());
		const phaseBefore = useSalaStore.getState().sala?.phase;

		loop.dispatch({
			type: "vote_cast",
			payload: { kind: "aggregate", count: 2 },
		});

		// vote_cast não modifica phase
		expect(useSalaStore.getState().sala?.phase).toBe(phaseBefore);
	});
});
