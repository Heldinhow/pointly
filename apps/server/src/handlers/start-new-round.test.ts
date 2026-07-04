/**
 * start_new_round handler tests — T16 verify (≥2 unit tests).
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "../hub";
import { handleCastVote } from "./cast-vote";
import { handleHello } from "./hello";
import { handleRevealVotes } from "./reveal-votes";
import { handleStartNewRound } from "./start-new-round";

let hub: Hub;

beforeEach(() => {
	hub = new Hub();
});

function addHost(uuid: string, nick: string) {
	const r = handleHello(hub, { uuid, nick });
	if (!r.ok) throw new Error("host ok expected");
	return { id: r.playerId, code: hub.activeCodes()[0]! };
}

function addJoin(uuid: string, nick: string, code: string) {
	const r = handleHello(hub, { uuid, nick, code });
	if (!r.ok) throw new Error(`join ok expected, got ${r.code}`);
	return r.playerId;
}

// ---------------------------------------------------------------------------
// T16: new round normal (F-026)
// ---------------------------------------------------------------------------

describe("handleStartNewRound — new round normal", () => {
	test("limpa votes, incrementa round, fase → voting", () => {
		const { id, code } = addHost("00000000-0000-4000-8000-000000000001", "Ana");
		const bobId = addJoin("00000000-0000-4000-8000-000000000002", "Bob", code);
		handleCastVote(hub, id, { value: "5" });
		handleCastVote(hub, bobId, { value: "8" });
		const reveal = handleRevealVotes(hub, id);
		expect(reveal.ok).toBe(true);

		const result = handleStartNewRound(hub, id);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.round).toBe(2);

		const sala = hub.getSala(code)!;
		expect(sala.phase).toBe("voting");
		expect(sala.votes.size).toBe(0);
		expect(sala.getPlayer(id)?.hasVoted).toBe(false);
		expect(sala.getPlayer(bobId)?.hasVoted).toBe(false);
	});

	test("qualquer player (não host) pode iniciar nova rodada", () => {
		const { id, code } = addHost("00000000-0000-4000-8000-000000000001", "Ana");
		const bobId = addJoin("00000000-0000-4000-8000-000000000002", "Bob", code);
		handleCastVote(hub, id, { value: "5" });
		handleRevealVotes(hub, id);

		const result = handleStartNewRound(hub, bobId);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.round).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// T16: rejeições
// ---------------------------------------------------------------------------

describe("handleStartNewRound — rejeições", () => {
	test("rejeita fora de phase=revealed", () => {
		const { id } = addHost("00000000-0000-4000-8000-000000000001", "Ana");
		// sem votos → phase idle
		const result = handleStartNewRound(hub, id);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_phase");
	});

	test("rejeita player não em sala", () => {
		const result = handleStartNewRound(hub, "ghost");
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_phase");
	});
});
