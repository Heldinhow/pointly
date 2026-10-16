import { expect, test } from "bun:test";
import { ServerToClientEventSchema } from "@planning-poker/shared";
import { Hub } from "./hub";
import { WSService, type BunWS, type WSContext } from "./ws";
import { Logger, MemorySink } from "./ws-logger";

class Socket implements BunWS {
	remoteAddress = "127.0.0.1";
	data: WSContext = { playerId: null, code: null, ip: this.remoteAddress, lastPongAt: Date.now(), lastPingAt: Date.now() };
	messages: string[] = [];
	send(raw: string | ArrayBuffer | Uint8Array): void { this.messages.push(typeof raw === "string" ? raw : new TextDecoder().decode(raw)); }
	close(): void {}
	ping(): void {}
	subscribe(): void {}
	unsubscribe(): void {}
	events() { return this.messages.map((raw) => ServerToClientEventSchema.parse(JSON.parse(raw))); }
	state() {
		for (const event of this.events().reverse()) {
			if (event.type === "welcome" || event.type === "room_state") return event.payload.sala;
		}
		throw new Error("snapshot ausente");
	}
	id() { if (!this.data.playerId) throw new Error("playerId ausente"); return this.data.playerId; }
}
const UUIDS = [1, 2, 3, 4].map((n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`);
function setup() {
	const hub = new Hub();
	const service = new WSService(hub, new Logger(new MemorySink()));
	function join(index: number, code?: string, spectate = false) {
		const socket = new Socket();
		service.onOpen(socket);
		service.onMessage(socket, JSON.stringify({ type: "hello", payload: { protocolVersion: 2, uuid: UUIDS[index], nick: `Pessoa${index}`, code, spectate } }));
		return socket;
	}
	function send(socket: Socket, type: string, payload: unknown = {}) { service.onMessage(socket, JSON.stringify({ type, payload })); }
	const host = join(0);
	return { hub, service, host, join, send, code: host.state().code };
}
test("WIRE projeta voting, pauta, revealable, revealed e nova rodada por destinatário", () => {
	const { host, join, send, code } = setup();
	const guest = join(1, code);
	const spectator = join(2, code, true);
	send(host, "cast_vote", { value: "8" });
	expect(host.state().votes).toEqual({ [host.id()]: "8" });
	for (const socket of [guest, spectator]) {
		expect(socket.state().votes).toEqual({});
		expect(socket.state().players.find((p) => p.id === host.id())).toMatchObject({ hasVoted: true, value: null });
	}
	send(guest, "historia_add", { titulo: "História privada" });
	for (const socket of [host, guest, spectator]) expect(socket.state().pauta?.[0]?.titulo).toBe("História privada");
	expect(guest.state().votes).toEqual({});
	expect(spectator.state().votes).toEqual({});
	send(guest, "cast_vote", { value: "5" });
	expect(host.state().phase).toBe("revealable");
	expect(host.state().votes).toEqual({ [host.id()]: "8" });
	expect(guest.state().votes).toEqual({ [guest.id()]: "5" });
	expect(spectator.state().votes).toEqual({});
	send(guest, "reveal_votes");
	for (const socket of [host, guest, spectator]) {
		expect(socket.state().phase).toBe("revealed");
		expect(socket.state().votes).toEqual({ [host.id()]: "8", [guest.id()]: "5" });
		expect(socket.state().players.find((p) => p.id === host.id())?.value).toBe("8");
	}
	expect(guest.events().find((event) => event.type === "votes_revealed")?.payload).toMatchObject({ median: 6.5, mean: 6.5, range: [5, 8] });
	send(guest, "start_new_round");
	for (const socket of [host, guest, spectator]) {
		expect(socket.state().votes).toEqual({});
		expect(socket.state().players.every((p) => p.value === null)).toBe(true);
		for (const raw of socket.messages) {
			expect(raw).not.toContain('"uuid"');
			for (const uuid of UUIDS) expect(raw).not.toContain(uuid);
		}
	}
});
test("WIRE welcome de join e reconexão não revela outros votos e preserva identidade legítima", () => {
	const { host, service, join, send, code } = setup();
	send(host, "cast_vote", { value: "8" });
	const guest = join(1, code);
	const spectator = join(2, code, true);
	for (const socket of [guest, spectator]) {
		const welcome = socket.events().find((event) => event.type === "welcome");
		if (!welcome || welcome.type !== "welcome") throw new Error("welcome ausente");
		expect(welcome.payload.sala.votes).toEqual({});
		expect(welcome.payload.sala.players.find((p) => p.id === host.id())?.value).toBeNull();
	}
	send(guest, "cast_vote", { value: "5" });
	const seat = host.state().players.find((p) => p.id === host.id())?.seatIndex;
	service.onClose(host, 1006, "network");
	const reconnected = join(0, code);
	expect(reconnected.id()).toBe(host.id());
	expect(reconnected.state().players.find((p) => p.id === host.id())).toMatchObject({ role: "host", seatIndex: seat, value: "8" });
	expect(reconnected.state().votes).toEqual({ [host.id()]: "8" });
	const newcomer = join(3, code);
	expect(newcomer.id()).not.toBe(host.id());
	expect(newcomer.state().votes).toEqual({});
	for (const socket of [host, guest, spectator, reconnected, newcomer]) for (const raw of socket.messages) {
		expect(raw).not.toContain('"uuid"');
		for (const uuid of UUIDS) expect(raw).not.toContain(uuid);
	}
});
for (const version of [undefined, 1, 3, "2", null]) {
	test(`WIRE rejeita versão ${String(version)} sem criar sala`, () => {
		const hub = new Hub();
		const service = new WSService(hub, new Logger(new MemorySink()));
		const socket = new Socket();
		service.onOpen(socket);
		service.onMessage(socket, JSON.stringify({ type: "hello", payload: { uuid: UUIDS[0], nick: "Ana", protocolVersion: version } }));
		expect(socket.events().some((event) => event.type === "welcome")).toBe(false);
		expect(socket.events().some((event) => event.type === "error")).toBe(true);
		expect(hub.activeCodes()).toEqual([]);
		expect(socket.data.playerId).toBeNull();
	});
}
