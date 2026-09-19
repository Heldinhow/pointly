import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "../hub";
import { handleSendNudge } from "./send-nudge";
import { handleHello } from "./hello";
import { handleThrowProjectile } from "./throw-projectile";

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

describe("handleSendNudge", () => {
	test("cutucada com sucesso entre player e espectador", () => {
		const host = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		const spectator = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000002",
			nick: "Beto",
			code: host.code,
			spectate: true,
		});
		if (!spectator.ok) throw new Error("expected spectator ok");

		expect(
			handleSendNudge(hub, host.id, {
				targetPlayerId: spectator.playerId,
				nudgeId: "bora",
			}).ok,
		).toBe(true);
		expect(
			handleSendNudge(hub, spectator.playerId, {
				targetPlayerId: host.id,
				nudgeId: "cafe",
			}).ok,
		).toBe(true);
	});

	test("recusa auto-cutucada, alvo de outra sala e desconectado sem consumir cooldown", () => {
		const host = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		const other = addPlayer("00000000-0000-4000-8000-000000000003", "Caio");
		const guest = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000002",
			nick: "Beto",
			code: host.code,
		});
		if (!guest.ok) throw new Error("expected guest ok");

		const nudgeAt = (id: string) =>
			handleSendNudge(
				hub,
				host.id,
				{ targetPlayerId: id, nudgeId: "confia" },
				10_000,
			);
		expect(nudgeAt(host.id).ok).toBe(false);
		expect(nudgeAt(other.id).ok).toBe(false);

		const sala = hub.getSala(host.code)!;
		sala.markDisconnected(guest.playerId);
		expect(nudgeAt(guest.playerId).ok).toBe(false);
		sala.markConnected("00000000-0000-4000-8000-000000000002");
		// Falhas não consumiram o cooldown — libera no mesmo instante.
		expect(nudgeAt(guest.playerId).ok).toBe(true);
	});

	test("cooldown compartilhado bloqueia arremesso logo após a cutucada", () => {
		const host = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		const guest = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000002",
			nick: "Beto",
			code: host.code,
		});
		if (!guest.ok) throw new Error("expected guest ok");

		const t0 = 0;
		expect(
			handleSendNudge(
				hub,
				host.id,
				{ targetPlayerId: guest.playerId, nudgeId: "polemica" },
				t0,
			).ok,
		).toBe(true);

		const blocked = handleThrowProjectile(
			hub,
			host.id,
			{ targetPlayerId: guest.playerId, projectileType: "tomato" },
			t0 + 999,
		);
		expect(blocked.ok).toBe(false);
		if (!blocked.ok) {
			expect(blocked.code).toBe("invalid_phase");
			expect(blocked.message).toContain("cooldown");
		}

		expect(
			handleThrowProjectile(
				hub,
				host.id,
				{ targetPlayerId: guest.playerId, projectileType: "tomato" },
				t0 + 1000,
			).ok,
		).toBe(true);
	});
});
