/**
 * reveal_votes handler tests — T15 verify (≥3 unit tests).
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "../hub";
import { handleCastVote } from "./cast-vote";
import { handleHello } from "./hello";
import { handleRevealVotes } from "./reveal-votes";

let hub: Hub;

beforeEach(() => {
	hub = new Hub();
});

function addHost(uuid: string, nick: string) {
	const r = handleHello(hub, { uuid, nick });
	if (!r.ok) throw new Error("expected host ok");
	return { id: r.playerId, code: hub.activeCodes()[0]! };
}

function addJoin(uuid: string, nick: string, code: string) {
	const r = handleHello(hub, { uuid, nick, code });
	if (!r.ok) throw new Error(`expected join ok, got ${r.code}`);
	return r.playerId;
}

// ---------------------------------------------------------------------------
// T15: reveal normal
// ---------------------------------------------------------------------------

describe("handleRevealVotes — reveal normal (F-015, F-019, F-020, F-021)", () => {
	test("calcula stats a partir dos votos", () => {
		const { id: hostId, code } = addHost(
			"00000000-0000-4000-8000-000000000001",
			"Ana",
		);
		const bobId = addJoin("00000000-0000-4000-8000-000000000002", "Bob", code);
		handleCastVote(hub, hostId, { value: "5" });
		handleCastVote(hub, bobId, { value: "8" });

		const result = handleRevealVotes(hub, hostId);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.votes[hostId]).toBe("5");
			expect(result.votes[bobId]).toBe("8");
			expect(result.median).toBe(6.5);
			expect(result.unanimous).toBe(false);
		}
	});

	test("detecta unanimous quando todos os votos são iguais", () => {
		const { id: hostId, code } = addHost(
			"00000000-0000-4000-8000-000000000001",
			"Ana",
		);
		const bobId = addJoin("00000000-0000-4000-8000-000000000002", "Bob", code);
		handleCastVote(hub, hostId, { value: "5" });
		handleCastVote(hub, bobId, { value: "5" });

		const result = handleRevealVotes(hub, bobId); // player (não host) revela
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.median).toBe(5);
			expect(result.unanimous).toBe(true);
		}
	});

	test("qualquer player (não host) pode revelar — ADR-0002", () => {
		const { code } = addHost("00000000-0000-4000-8000-000000000001", "Ana");
		const bobId = addJoin("00000000-0000-4000-8000-000000000002", "Bob", code);
		handleCastVote(hub, bobId, { value: "5" });
		const result = handleRevealVotes(hub, bobId);
		expect(result.ok).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// T15: rejeições
// ---------------------------------------------------------------------------

describe("handleRevealVotes — rejeições", () => {
	test("rejeita reveal em fase idle (invalid_phase)", () => {
		const { id } = addHost("00000000-0000-4000-8000-000000000001", "Ana");
		// sem votos — phase ainda idle
		const result = handleRevealVotes(hub, id);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_phase");
	});

	test("rejeita reveal de player não em sala", () => {
		const result = handleRevealVotes(hub, "ghost");
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_phase");
	});

	test("rejeita segundo reveal (fase=revealed)", () => {
		const { id } = addHost("00000000-0000-4000-8000-000000000001", "Ana");
		handleCastVote(hub, id, { value: "5" });
		handleRevealVotes(hub, id);
		// tenta revelar de novo
		const second = handleRevealVotes(hub, id);
		expect(second.ok).toBe(false);
		if (!second.ok) expect(second.code).toBe("invalid_phase");
	});
});
