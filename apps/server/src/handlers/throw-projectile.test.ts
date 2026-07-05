import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "../hub";
import { handleThrowProjectile } from "./throw-projectile";
import { handleHello } from "./hello";
import type { ThrowProjectilePayload } from "@planning-poker/shared";

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

	test("arremesso viola cooldown de 5s", () => {
		const player1 = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		const player2 = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000002",
			nick: "Beto",
			code: player1.code,
		});
		if (!player2.ok) throw new Error("expected player2 ok");

		const payload: ThrowProjectilePayload = {
			targetPlayerId: player2.playerId,
			projectileType: "coffee",
		};

		// Primeiro arremesso
		const t0 = 10000;
		const r1 = handleThrowProjectile(hub, player1.id, payload, t0);
		expect(r1.ok).toBe(true);

		// Segundo arremesso 2s depois (deve falhar)
		const r2 = handleThrowProjectile(hub, player1.id, payload, t0 + 2000);
		expect(r2.ok).toBe(false);
		if (!r2.ok) {
			expect(r2.code).toBe("invalid_phase");
			expect(r2.message).toContain("cooldown");
		}

		// Terceiro arremesso 6s depois do primeiro (deve passar)
		const r3 = handleThrowProjectile(hub, player1.id, payload, t0 + 6000);
		expect(r3.ok).toBe(true);
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
