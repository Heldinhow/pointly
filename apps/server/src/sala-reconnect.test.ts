/**
 * Sala reconnect + host promotion + ghost status tests — T12a verify (≥5 tests).
 *
 * Cobre findByUUID, markDisconnected/markConnected, grace period expiry,
 * promoteOldestPlayer (cenários: 1 player, 3 players com joinedAt distintos,
 * sala vazia).
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { Sala, SALA_DISCONNECT_GRACE_MS } from "./sala";
import type { Player } from "@planning-poker/shared";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlayer(
	id: string,
	nick: string,
	role: "host" | "player" = "player",
	joinedAt?: number,
	uuid?: string,
): Player {
	return {
		id,
		uuid: uuid ?? `00000000-0000-4000-8000-${id.padStart(12, "0")}`,
		nick,
		role,
		seatIndex: 0,
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
// findByUUID (F-037)
// ---------------------------------------------------------------------------

describe("Sala — findByUUID", () => {
	test("retorna player cujo uuid está na sala", () => {
		const bob = makePlayer("p2", "Bob");
		sala.addPlayer(bob);
		const found = sala.findByUUID(bob.uuid);
		expect(found).not.toBeNull();
		expect(found?.id).toBe("p2");
		expect(found?.nick).toBe("Bob");
	});

	test("retorna null quando uuid não está na sala", () => {
		const ghost = "00000000-0000-4000-8000-000000000000";
		expect(sala.findByUUID(ghost)).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// markDisconnected + markConnected (F-050)
// ---------------------------------------------------------------------------

describe("Sala — markDisconnected/markConnected", () => {
	test("markDisconnected seta status='disconnected' e mantém voto/seat", () => {
		sala.castVote("p1", "5");
		const updated = sala.markDisconnected("p1");
		expect(updated?.status).toBe("disconnected");
		expect(updated?.hasVoted).toBe(true);
		expect(updated?.value).toBe("5");
		expect(updated?.seatIndex).toBe(0);
	});

	test("markConnected por UUID reativa player", () => {
		const p2 = makePlayer("p2", "Bob");
		sala.addPlayer(p2);
		sala.markDisconnected("p2", 1_000);
		const reactivated = sala.markConnected(p2.uuid);
		expect(reactivated?.status).toBe("connected");
	});

	test("markDisconnected em ID inexistente retorna null", () => {
		expect(sala.markDisconnected("ghost")).toBeNull();
	});

	test("markConnected em UUID inexistente retorna null", () => {
		expect(
			sala.markConnected("00000000-0000-4000-8000-999999999999"),
		).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// tickGracePeriod (F-050 — remove após 60s disconnected)
// ---------------------------------------------------------------------------

describe("Sala — tickGracePeriod", () => {
	test("remove player disconnected há mais de 60s", () => {
		const p2 = makePlayer("p2", "Bob");
		sala.addPlayer(p2);
		// disconnect 100 segundos atrás
		sala.markDisconnected("p2", 1_000);
		const removed = sala.tickGracePeriod(
			1_000 + SALA_DISCONNECT_GRACE_MS + 100,
		);
		expect(removed).toContain("p2");
		expect(sala.playerCount).toBe(1);
	});

	test("NÃO remove player ainda dentro do grace period", () => {
		const p2 = makePlayer("p2", "Bob");
		sala.addPlayer(p2);
		sala.markDisconnected("p2", 1_000);
		const removed = sala.tickGracePeriod(1_000 + 30_000); // 30s depois
		expect(removed).toEqual([]);
		expect(sala.playerCount).toBe(2);
	});

	test("NÃO remove player conectado", () => {
		const p2 = makePlayer("p2", "Bob");
		sala.addPlayer(p2);
		// nunca desconectou
		const removed = sala.tickGracePeriod(
			Date.now() + SALA_DISCONNECT_GRACE_MS * 2,
		);
		expect(removed).toEqual([]);
		expect(sala.playerCount).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// promoteOldestPlayer (F-048)
// ---------------------------------------------------------------------------

describe("Sala — promoteOldestPlayer", () => {
	test("promove player com menor joinedAt (3 players)", () => {
		// joinedAt distintos: p2=2000, p3=3000 (p1=1000 é host)
		const p2 = makePlayer("p2", "Bob", "player", 2_000);
		const p3 = makePlayer("p3", "Cal", "player", 3_000);
		sala.addPlayer(p2);
		sala.addPlayer(p3);

		// host sai → promoteOldestPlayer encontra menor joinedAt (excluindo host)
		sala.removePlayer("p1");
		expect(sala.hostId).toBe("p2"); // Bob (joinedAt=2000) < Cal (3000)
		const host = sala.getPlayer("p2");
		expect(host?.role).toBe("host");
	});

	test("com 1 só player após host sair, sala fica vazia (remove do Map)", () => {
		// só host na sala
		sala.removePlayer("p1");
		expect(sala.hostId).toBeNull();
		expect(sala.playerCount).toBe(0);
	});

	test("sala vazia: promoteOldestPlayer retorna null", () => {
		// cria sala e remove host
		sala.removePlayer("p1");
		expect(sala.promoteOldestPlayer()).toBeNull();
	});

	test("se host ainda é válido, promoteOldestPlayer é idempotente", () => {
		const p2 = makePlayer("p2", "Bob", "player", 2_000);
		sala.addPlayer(p2);
		// host válido, não promove
		const promoted = sala.promoteOldestPlayer();
		expect(promoted?.id).toBe("p1"); // host original
		expect(sala.hostId).toBe("p1");
		expect(sala.getPlayer("p1")?.role).toBe("host");
		expect(sala.getPlayer("p2")?.role).toBe("player");
	});
});

// ---------------------------------------------------------------------------
// Integração: disconnect → reconnect preserva voto (F-038)
// ---------------------------------------------------------------------------

describe("Sala — disconnect+reconnect preserva voto", () => {
	test("disconnect+reconnect mantém hasVoted e value inalterados", () => {
		const p2 = makePlayer("p2", "Bob", "player", 2_000);
		sala.addPlayer(p2);
		sala.castVote("p2", "8");
		const before = sala.getPlayer("p2");
		expect(before?.hasVoted).toBe(true);
		expect(before?.value).toBe("8");

		// disconnect
		sala.markDisconnected("p2", 2_000);
		const disconnected = sala.getPlayer("p2");
		expect(disconnected?.status).toBe("disconnected");
		expect(disconnected?.hasVoted).toBe(true); // voto preservado
		expect(disconnected?.value).toBe("8");

		// reconnect
		const reconnected = sala.markConnected(p2.uuid);
		expect(reconnected?.status).toBe("connected");
		expect(reconnected?.hasVoted).toBe(true); // ainda preservado
		expect(reconnected?.value).toBe("8");
	});
});
