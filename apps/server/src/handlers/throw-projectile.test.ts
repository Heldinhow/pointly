import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "../hub";
import { handleThrowProjectile } from "./throw-projectile";
import { handleHello } from "./hello";
import { ProjectileTypeSchema, type ThrowProjectilePayload } from "@planning-poker/shared";

let hub: Hub;

beforeEach(() => {
	hub = new Hub();
});

function addPlayer(uuid: string, nick: string): { id: string; code: string } {
	const create = handleHello(hub, { uuid, nick });
	if (!create.ok) throw new Error("expected create ok");
	const code = hub.activeCodes()[0]!;
	return { id: create.playerId, code };
}

describe("handleThrowProjectile", () => {
	test("arremesso com sucesso e sorteia desfecho válido", () => {
		const player1 = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		const player2 = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000002",
			nick: "Beto",
			code: player1.code,
		});
		if (!player2.ok) throw new Error("expected player2 ok");

		const payload: ThrowProjectilePayload = {
			targetPlayerId: player2.playerId,
			projectileType: "tomato",
		};

		const result = handleThrowProjectile(hub, player1.id, payload);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(["hit", "dodge", "deflect"]).toContain(result.outcome);
		}
	});

	test("cooldown é compartilhado entre tipos e libera exatamente em 2s", () => {
		const player1 = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		const player2 = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000002",
			nick: "Beto",
			code: player1.code,
		});
		if (!player2.ok) throw new Error("expected player2 ok");

		const payload: ThrowProjectilePayload = {
			targetPlayerId: player2.playerId,
			projectileType: "paper_plane",
		};

		// Primeiro arremesso
		const t0 = 0;
		const r1 = handleThrowProjectile(hub, player1.id, payload, t0);
		expect(r1.ok).toBe(true);

		// Mesmo trocando de projétil, 1999ms ainda é cooldown.
		const r2 = handleThrowProjectile(hub, player1.id, { ...payload, projectileType: "brick" }, t0 + 1999);
		expect(r2.ok).toBe(false);
		if (!r2.ok) {
			expect(r2.code).toBe("invalid_phase");
			expect(r2.message).toContain("cooldown");
		}

		const r3 = handleThrowProjectile(hub, player1.id, payload, t0 + 2000);
		expect(r3.ok).toBe(true);
	});

	test("os cinco tipos funcionam em qualquer fase, incluindo espectadores", () => {
		const host = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		const spectator = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000002", nick: "Beto", code: host.code, spectate: true,
		});
		if (!spectator.ok) throw new Error("expected spectator ok");
		const sala = hub.getSala(host.code)!;
		expect(ProjectileTypeSchema.options).toEqual(["paper_ball", "paper_plane", "rock", "brick", "tomato"]);
		let now = 0;
		for (const phase of ["idle", "voting", "revealable", "revealed"] as const) {
			sala.phase = phase;
			for (const projectileType of ProjectileTypeSchema.options) {
				expect(handleThrowProjectile(hub, host.id, { targetPlayerId: spectator.playerId, projectileType }, now).ok).toBe(true);
				expect(handleThrowProjectile(hub, spectator.playerId, { targetPlayerId: host.id, projectileType }, now).ok).toBe(true);
				expect(sala.phase).toBe(phase);
				expect(sala.votes.size).toBe(0);
				now += 2000;
			}
		}
	});

	test("recusa autoarremesso, alvo de outra sala e desconectado sem consumir cooldown", () => {
		const host = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		const other = addPlayer("00000000-0000-4000-8000-000000000003", "Caio");
		const guest = handleHello(hub, { uuid: "00000000-0000-4000-8000-000000000002", nick: "Beto", code: host.code });
		if (!guest.ok) throw new Error("expected guest ok");
		const throwAt = (id: string) => handleThrowProjectile(hub, host.id, { targetPlayerId: id, projectileType: "rock" }, 10000);
		expect(throwAt(host.id).ok).toBe(false);
		expect(throwAt(other.id).ok).toBe(false);
		const sala = hub.getSala(host.code)!;
		sala.markDisconnected(guest.playerId);
		expect(throwAt(guest.playerId).ok).toBe(false);
		sala.markConnected("00000000-0000-4000-8000-000000000002");
		expect(throwAt(guest.playerId).ok).toBe(true);
	});

	test("arremesso para jogador não existente na sala", () => {
		const player1 = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		const payload: ThrowProjectilePayload = {
			targetPlayerId: "non-existent-id",
			projectileType: "paper_ball",
		};

		const result = handleThrowProjectile(hub, player1.id, payload);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("invalid_phase");
		}
	});
});
