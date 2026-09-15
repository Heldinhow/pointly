/**
 * update_avatar handler + dispatch tests — avatar-perfil-mesa T4 (AV-06/AV-07).
 *
 * Cobre: set, clear (null), sem auth (invalid_phase), teto/formato
 * ignorados sem broadcast, e broadcast room_state via WS dispatch.
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "../hub";
import { handleHello } from "./hello";
import { handleUpdateAvatar } from "./update-avatar";
import { WSService, type BunWS, type WSContext } from "../ws";
import { Logger, MemorySink } from "../ws-logger";

const UUID_P1 = "00000000-0000-4000-8000-000000000001";
const UUID_P2 = "00000000-0000-4000-8000-000000000002";
const UUID_P3 = "00000000-0000-4000-8000-000000000003";
const JPEG = "data:image/jpeg;base64,/9j/4AAQ";
const PNG = "data:image/png;base64,iVBORw0KGgo=";

let hub: Hub;

beforeEach(() => {
	hub = new Hub();
});

function createSalaWithPlayer(uuid: string, nick: string): string {
	const result = handleHello(hub, { uuid, nick });
	expect(result.ok).toBe(true);
	if (!result.ok) throw new Error("setup falhou");
	return result.playerId;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

describe("handleUpdateAvatar", () => {
	test("set com avatar válido atualiza Player e aparece no toState", () => {
		const playerId = createSalaWithPlayer(UUID_P1, "Ana");
		const outcome = handleUpdateAvatar(hub, playerId, { avatar: JPEG });
		expect(outcome.ok).toBe(true);
		const code = hub.activeCodes()[0]!;
		const player = hub.getSala(code)!.getPlayer(playerId)!;
		expect(player.avatar).toBe(JPEG);
		expect(
			hub
				.getSala(code)!
				.toState()
				.players.find((p) => p.id === playerId)?.avatar,
		).toBe(JPEG);
	});

	test("avatar null limpa e volta a iniciais no snapshot", () => {
		const playerId = createSalaWithPlayer(UUID_P1, "Ana");
		expect(handleUpdateAvatar(hub, playerId, { avatar: PNG }).ok).toBe(true);
		const outcome = handleUpdateAvatar(hub, playerId, { avatar: null });
		expect(outcome.ok).toBe(true);
		const code = hub.activeCodes()[0]!;
		const avatar = hub
			.getSala(code)!
			.toState()
			.players.find((p) => p.id === playerId)?.avatar;
		expect(avatar ?? null).toBeNull();
	});

	test("sem playerId retorna invalid_phase", () => {
		const outcome = handleUpdateAvatar(hub, "p_fantasma", { avatar: JPEG });
		expect(outcome.ok).toBe(false);
		if (!outcome.ok) expect(outcome.code).toBe("invalid_phase");
	});

	test("avatar acima do teto aceita sem aplicar (changed false)", () => {
		const playerId = createSalaWithPlayer(UUID_P1, "Ana");
		const oversized = `data:image/jpeg;base64,${"A".repeat(40000)}`;
		const outcome = handleUpdateAvatar(hub, playerId, { avatar: oversized });
		expect(outcome.ok).toBe(true);
		if (outcome.ok) expect(outcome.changed).toBe(false);
		const code = hub.activeCodes()[0]!;
		const avatar = hub.getSala(code)!.getPlayer(playerId)!.avatar;
		expect(avatar ?? null).toBeNull();
	});

	test("formato fora do v1 aceita sem aplicar (changed false)", () => {
		const playerId = createSalaWithPlayer(UUID_P1, "Ana");
		const outcome = handleUpdateAvatar(hub, playerId, {
			avatar: "data:image/gif;base64,R0lGODlh",
		});
		expect(outcome.ok).toBe(true);
		if (outcome.ok) expect(outcome.changed).toBe(false);
	});

	test("mesmo apelido não mistura avatar entre players (edge E2)", () => {
		const first = handleHello(hub, { uuid: UUID_P1, nick: "Beto" });
		expect(first.ok).toBe(true);
		if (!first.ok) throw new Error("setup falhou");
		const second = handleHello(hub, {
			uuid: UUID_P3,
			nick: "Beto",
			code: first.sala.code,
		});
		expect(second.ok).toBe(true);
		if (!second.ok) throw new Error("setup falhou");
		expect(second.playerId).not.toBe(first.playerId);

		expect(handleUpdateAvatar(hub, first.playerId, { avatar: JPEG }).ok).toBe(
			true,
		);
		const code = hub.activeCodes()[0]!;
		expect(hub.getSala(code)!.getPlayer(second.playerId)!.avatar).toBeUndefined();
		const state = hub.getSala(code)!.toState();
		expect(
			state.players.find((p) => p.id === first.playerId)?.avatar,
		).toBe(JPEG);
		expect(
			state.players.find((p) => p.id === second.playerId)?.avatar ?? null,
		).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// WS dispatch (case + broadcast)
// ---------------------------------------------------------------------------

class MockBunWS implements BunWS {
	remoteAddress = "127.0.0.1";
	data: WSContext = {
		playerId: null,
		code: null,
		ip: "127.0.0.1",
		lastPongAt: Date.now(),
	};
	messages: string[] = [];
	send(message: string | ArrayBuffer | Uint8Array): void {
		this.messages.push(
			typeof message === "string" ? message : new TextDecoder().decode(message),
		);
	}
	close(): void {}
	subscribe(): void {}
	unsubscribe(): void {}
	types(): string[] {
		return this.messages.map((m) => {
			try {
				return (JSON.parse(m) as { type: string }).type;
			} catch {
				return "unparseable";
			}
		});
	}
}

function authedWs(
	service: WSService,
	hub: Hub,
	uuid: string,
	nick: string,
	code?: string,
): { ws: MockBunWS; playerId: string; roomCode: string } {
	const result = handleHello(hub, code ? { uuid, nick, code } : { uuid, nick });
	expect(result.ok).toBe(true);
	if (!result.ok) throw new Error("setup falhou");
	const ws = new MockBunWS();
	service.onOpen(ws);
	ws.data.playerId = result.playerId;
	ws.data.code = result.sala.code;
	return { ws, playerId: result.playerId, roomCode: result.sala.code };
}

describe("WSService update_avatar dispatch", () => {
	test("válido atualiza e broadcast room_state com novo avatar p/ sala", () => {
		const service = new WSService(hub, new Logger(new MemorySink()));
		const { roomCode } = authedWs(service, hub, UUID_P1, "Ana");
		const bob = authedWs(service, hub, UUID_P2, "Bob", roomCode);
		bob.ws.messages.length = 0;

		service.onMessage(
			bob.ws,
			JSON.stringify({ type: "update_avatar", payload: { avatar: JPEG } }),
		);

		const states = bob.ws.messages
			.map((m) => JSON.parse(m) as { type: string; payload: { sala: { players: { id: string; avatar?: string }[] } } })
			.filter((e) => e.type === "room_state");
		expect(states.length).toBeGreaterThan(0);
		const last = states[states.length - 1]!;
		expect(
			last.payload.sala.players.find((p) => p.id === bob.playerId)?.avatar,
		).toBe(JPEG);
	});

	test("sem playerId retorna invalid_phase sem broadcast", () => {
		const service = new WSService(hub, new Logger(new MemorySink()));
		const ws = new MockBunWS();
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({ type: "update_avatar", payload: { avatar: JPEG } }),
		);
		expect(ws.messages).toHaveLength(1);
		const event = JSON.parse(ws.messages[0]!) as {
			type: string;
			payload: { code: string };
		};
		expect(event.type).toBe("error");
		expect(event.payload.code).toBe("invalid_phase");
	});
});
