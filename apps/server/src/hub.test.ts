/**
 * Hub tests — lifecycle das salas (sem timer: reveal só manual).
 *
 * Cobre:
 *  - createSala registra sala e roteia por playerId
 *  - addPlayer em sala existente
 *  - removePlayer remove sala vazia do Map
 *  - salas independentes (sem cross-talk)
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "./hub";
import type { Player } from "@planning-poker/shared";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlayer(
	id: string,
	nick: string,
	role: "host" | "player" = "player",
	joinedAt?: number,
): Player {
	return {
		id,
		uuid: `00000000-0000-4000-8000-${id.padStart(12, "0")}`,
		nick,
		role,
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: joinedAt ?? Date.now(),
	};
}

let hub: Hub;

beforeEach(() => {
	hub = new Hub();
});

// ---------------------------------------------------------------------------
// Hub — lifecycle
// ---------------------------------------------------------------------------

describe("Hub — lifecycle", () => {
	test("createSala registra sala e roteia por playerId", () => {
		const { sala, playerId } = hub.createSala(makePlayer("p1", "Ana", "host"));
		expect(hub.getSala(sala.code)).toBe(sala);
		expect(hub.getSalaForPlayer(playerId)).toBe(sala);
	});

	test("addPlayer entra em sala existente", () => {
		const { sala } = hub.createSala(makePlayer("p1", "Ana", "host"));
		const p2 = makePlayer("p2", "Bob", "player");
		const { playerId } = hub.addPlayer(sala.code, p2);
		expect(hub.getSalaForPlayer(playerId)).toBe(sala);
		expect(sala.playerCount).toBe(2);
	});

	test("removePlayer esvazia e remove sala do Map", () => {
		const { sala, playerId } = hub.createSala(makePlayer("p1", "Ana", "host"));
		const { code } = hub.removePlayer(playerId);
		expect(code).toBe(sala.code);
		expect(hub.getSala(sala.code)).toBeNull();
	});

	test("salas independentes sem cross-talk", () => {
		const { sala: sala1 } = hub.createSala(makePlayer("p1", "Ana", "host"));
		const { sala: sala2 } = hub.createSala(makePlayer("p3", "Carlos", "host"));

		hub.addPlayer(sala2.code, makePlayer("p4", "Diana", "player"));
		sala2.castVote("p3", "8");
		expect(sala2.phase).toBe("voting");

		expect(sala1.phase).toBe("idle");
		expect(sala1.playerCount).toBe(1);
		expect(sala2.playerCount).toBe(2);
	});

	test("voto parcial não revela sozinho (reveal só manual)", () => {
		const { sala } = hub.createSala(makePlayer("p1", "Ana", "host"));
		hub.addPlayer(sala.code, makePlayer("p2", "Bob", "player"));
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("voting");
		sala.reveal("p1");
		expect(sala.phase).toBe("revealed");
	});
});
