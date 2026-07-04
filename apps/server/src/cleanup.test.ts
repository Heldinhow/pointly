/**
 * Cleanup tests — T18 verify (≥2 unit tests).
 */
import { describe, expect, test } from "bun:test";
import { Hub } from "./hub";
import { handleHello } from "./handlers/hello";
import { CleanupService } from "./cleanup";
import { MemorySink, Logger } from "./ws-logger";
import { SALA_DISCONNECT_GRACE_MS } from "./sala";

function create2Players() {
	const hub = new Hub();
	const r1 = handleHello(hub, {
		uuid: "00000000-0000-4000-8000-000000000001",
		nick: "Ana",
	});
	if (!r1.ok) throw new Error("ana failed");
	const code = hub.activeCodes()[0]!;
	const r2 = handleHello(hub, {
		uuid: "00000000-0000-4000-8000-000000000002",
		nick: "Bob",
		code,
	});
	if (!r2.ok) throw new Error("bob failed");
	return { hub, code, anaId: r1.playerId, bobId: r2.playerId };
}

// ---------------------------------------------------------------------------
// T18: sala removida do Map quando último sai (F-036)
// ---------------------------------------------------------------------------

describe("CleanupService — sala removida quando vazia (F-036)", () => {
	test("remove sala do Map após todos desconectarem + grace expiry", () => {
		const { hub, code, anaId, bobId } = create2Players();
		const ended: { code: string; reason: string }[] = [];
		const cleanup = new CleanupService(
			hub,
			new Logger(new MemorySink()),
			(c, r) => ended.push({ code: c, reason: r }),
		);

		hub.markDisconnected(anaId, 1_000);
		hub.markDisconnected(bobId, 1_000);
		cleanup.tick(1_000 + SALA_DISCONNECT_GRACE_MS + 1);
		expect(hub.activeCodes()).not.toContain(code);
	});

	test("host sai com 2+ players → promote + sala continua", () => {
		const { hub, code, anaId, bobId } = create2Players();
		const cleanup = new CleanupService(
			hub,
			new Logger(new MemorySink()),
			() => {},
		);

		// ana (host) sai
		hub.removePlayer(anaId);

		// sala ainda existe com bob (agora host)
		expect(hub.activeCodes()).toContain(code);
		const sala = hub.getSala(code);
		expect(sala?.hostId).toBe(bobId);
		expect(sala?.getPlayer(bobId)?.role).toBe("host");
		cleanup.stop();
	});

	test("shutdown chama callback sala_ended com reason=server_restart para todas salas", () => {
		const { hub, code } = create2Players();
		const ended: { code: string; reason: string }[] = [];
		const cleanup = new CleanupService(
			hub,
			new Logger(new MemorySink()),
			(c, r) => ended.push({ code: c, reason: r }),
		);

		cleanup.shutdown();
		expect(ended).toContainEqual({ code, reason: "server_restart" });
		expect(hub.activeCodes()).toEqual([]);
	});
});
