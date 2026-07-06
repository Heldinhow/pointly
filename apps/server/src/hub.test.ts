/**
 * Hub tests — T01 verify (per-room tick aggregation).
 *
 * Cobre:
 *  - tickAllTimers() retorna array vazio quando sem salas
 *  - tickAllTimers() agrega per-room com TickResult correto
 *  - tickAllTimers() não confunde salas (independência)
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "./hub";
import type { Player } from "@planning-poker/shared";
import { SALA_DISCONNECT_GRACE_MS } from "./sala";

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
// Hub — tickAllTimers
// ---------------------------------------------------------------------------

describe("Hub — tickAllTimers", () => {
	test("retorna array vazio quando não há salas", () => {
		expect(hub.tickAllTimers()).toEqual([]);
	});

	test("retorna 'idle' para sala em phase=idle (sem voto)", () => {
		hub.createSala(makePlayer("p1", "Ana", "host"));
		const results = hub.tickAllTimers();
		expect(results).toHaveLength(1);
		expect(results[0]?.tick).toBe("idle");
	});

	test("retorna 'ticking' para sala em voting", () => {
		const { sala } = hub.createSala(makePlayer("p1", "Ana", "host"));
		const p2 = makePlayer("p2", "Bob", "player");
		hub.addPlayer(sala.code, p2);
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("voting");

		const results = hub.tickAllTimers();
		expect(results).toHaveLength(1);
		expect(results[0]?.tick).toBe("ticking");
	});

	test("retorna 'fired' quando auto-reveal dispara", () => {
		const { sala } = hub.createSala(makePlayer("p1", "Ana", "host"));
		const p2 = makePlayer("p2", "Bob", "player");
		hub.addPlayer(sala.code, p2);
		sala.castVote("p1", "5");
		sala.timer = 1;

		const results = hub.tickAllTimers();
		expect(results).toHaveLength(1);
		expect(results[0]?.tick).toBe("fired");
		expect(sala.phase).toBe("revealed");
	});

	test("agrega per-room sem conflating (independência entre salas)", () => {
		const { sala: sala1 } = hub.createSala(makePlayer("p1", "Ana", "host"));
		const { sala: sala2 } = hub.createSala(
			makePlayer("p3", "Carlos", "host"),
		);

		// sala1: idle → 'idle'
		// sala2: 2 players, p3 vota → voting → 'ticking'
		hub.addPlayer(sala2.code, makePlayer("p4", "Diana", "player"));
		sala2.castVote("p3", "8");
		expect(sala2.phase).toBe("voting");

		const results = hub.tickAllTimers();
		expect(results).toHaveLength(2);

		const r1 = results.find((r) => r.code === sala1.code);
		const r2 = results.find((r) => r.code === sala2.code);
		expect(r1?.tick).toBe("idle");
		expect(r2?.tick).toBe("ticking");
	});

	test("agrega 'fired' e 'ticking' em tick único", () => {
		const { sala: sala1 } = hub.createSala(makePlayer("p1", "Ana", "host"));
		const { sala: sala2 } = hub.createSala(
			makePlayer("p3", "Carlos", "host"),
		);

		// sala1: voting, pronta para fire
		hub.addPlayer(sala1.code, makePlayer("p2", "Bob", "player"));
		sala1.castVote("p1", "5");
		sala1.timer = 1;

		// sala2: voting, não vai fire
		hub.addPlayer(sala2.code, makePlayer("p4", "Diana", "player"));
		sala2.castVote("p3", "8");

		const results = hub.tickAllTimers();
		const r1 = results.find((r) => r.code === sala1.code);
		const r2 = results.find((r) => r.code === sala2.code);
		expect(r1?.tick).toBe("fired");
		expect(r2?.tick).toBe("ticking");
	});
});

// ---------------------------------------------------------------------------
// Reg 2026-07-06: byUUID leak — `removePlayer`/`tickGracePeriod`/`reconnect`
// não limpavam `byUUID` consistentemente, prendendo UUIDs órfãos no Map.
// ---------------------------------------------------------------------------

describe("Hub — byUUID cleanup (reg 2026-07-06)", () => {
	test("removePlayer limpa byUUID para player DISCONNECTED (leak fix)", () => {
		// Antes do fix: `if (player && player.status === "connected")` era
		// sempre false porque `sala.removePlayer` já tinha deletado o player.
		// byUUID ficava órfão e hello subsequente com mesmo UUID batia no
		// "UUID em uso".
		const { playerId, sala } = hub.createSala(makePlayer("p1", "Ana", "host"));
		const code = sala.code;
		hub.markDisconnected(playerId, 1_000);
		const salaState = hub.getSala(code)!;
		expect(salaState.getPlayer(playerId)?.status).toBe("disconnected");

		hub.removePlayer(playerId);

		// byUUID limpo → novo hello com mesmo UUID (criando nova sala) funciona
		const recreate = hub.createSala(makePlayer("p1", "Ana", "host"));
		expect(recreate.playerId).toBe("p1");
		expect(recreate.sala.getPlayer("p1")?.uuid).toBe("00000000-0000-4000-8000-0000000000p1");
	});

	test("tickGracePeriod limpa byUUID após grace period expirar (regression)", () => {
		const { playerId, sala } = hub.createSala(makePlayer("p1", "Ana", "host"));
		hub.markDisconnected(playerId, 1_000);

		// Antes do grace period expirar: byUUID ainda tem o UUID
		hub.tickGracePeriod(1_000 + 30_000);
		expect(hub.getSala(sala.code)).not.toBeNull();
		expect(hub.getCodeForUUID("00000000-0000-4000-8000-0000000000p1")).toBe(
			sala.code,
		);

		// Após 60s: tickGracePeriod remove o player E o byUUID
		hub.tickGracePeriod(1_000 + SALA_DISCONNECT_GRACE_MS + 1);
		expect(hub.getSala(sala.code)).toBeNull();
		expect(
			hub.getCodeForUUID("00000000-0000-4000-8000-0000000000p1"),
		).toBeNull();
	});

	test("reconnect NÃO chama markConnected (sem side-effect)", () => {
		// Antes do fix: hub.reconnect invocava sala.markConnected(uuid),
		// deletando disconnectedAt. Caller que abortasse o reconnect
		// (ex: código diferente) deixava player órfão sem WS real.
		const { playerId, sala } = hub.createSala(makePlayer("p1", "Ana", "host"));
		hub.markDisconnected(playerId, 1_000);
		const salaState = hub.getSala(sala.code)!;
		expect(salaState.getPlayer(playerId)?.status).toBe("disconnected");

		const result = hub.reconnect("00000000-0000-4000-8000-0000000000p1");
		expect(result).not.toBeNull();

		// Status deve permanecer disconnected (caller é quem commita)
		expect(salaState.getPlayer(playerId)?.status).toBe("disconnected");
	});
});