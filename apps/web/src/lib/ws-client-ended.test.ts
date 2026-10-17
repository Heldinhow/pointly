import { expect, test } from "bun:test";
import { ClientToServerEventSchema, type SalaEndedReason, type SalaState } from "@planning-poker/shared";
import { PointlySocket } from "./ws-client";

type Reason = SalaEndedReason | "missing";

for (const reason of ["server_restart", "replaced", "last_left", "missing"] as const) {
	test(`encerramento ${reason} é terminal`, async () => {
		let helloCount = 0;
		const state: SalaState = {
			code: "AB12", hostId: "p_fixture", phase: "idle", round: 1, votes: {}, createdAt: 1,
			players: [{ id: "p_fixture", nick: "Ana", role: "host", seatIndex: 0,
				hasVoted: false, value: null, status: "connected", joinedAt: 1 }],
		};
		const server = Bun.serve({
			hostname: "127.0.0.1",
			port: 0,
			fetch(request, srv) {
				if (srv.upgrade(request)) return;
				return new Response("not found", { status: 404 });
			},
			websocket: {
				message(ws, raw: string | Buffer) {
					const text = typeof raw === "string" ? raw : raw.toString("utf-8");
					const message = ClientToServerEventSchema.parse(JSON.parse(text));
					if (message.type !== "hello") return;
					helloCount += 1;
					if (reason === "missing" && helloCount > 1) {
						ws.send(JSON.stringify({ type: "error", payload: { code: "sala_nao_encontrada" } }));
						ws.close(1008, "missing");
						return;
					}
					ws.send(JSON.stringify({ type: "welcome", payload: {
						playerId: "p_fixture", role: "host", sala: state,
					} }));
					if (reason === "missing") {
						ws.close(1001, "test network close");
					} else {
						ws.send(JSON.stringify({ type: "sala_ended", payload: { reason } }));
						ws.close(1012, reason);
					}
				},
			},
		});
		let timer: ReturnType<typeof setTimeout> | undefined;
		let signal: ((value: Reason) => void) | undefined;
		const ended = new Promise<Reason>((resolve, reject) => {
			signal = resolve;
			timer = setTimeout(() => reject(new Error("onSalaEnded não foi chamado")), 2_000);
		});
		const events = {
			onReconnecting: () => {},
			onSalaEnded: (value: Reason) => signal?.(value),
		};
		const client = new PointlySocket(events, {
			reconnectBaseDelayMs: 10, reconnectMaxDelayMs: 10, reconnectWindowMs: 1_000,
		});
		try {
			const [, observed] = await Promise.all([
				client.connect(`ws://127.0.0.1:${server.port}/ws`, {
					uuid: crypto.randomUUID(), nick: "Ana", code: "AB12",
				}),
				ended,
			]);
			expect(observed).toBe(reason);
			expect(client.getStatus()).toBe("closed");
			client.retryNow();
			expect(client.getStatus()).toBe("closed");
			expect(helloCount).toBe(reason === "missing" ? 2 : 1);
		} finally {
			if (timer) clearTimeout(timer);
			client.close({ silent: true });
			server.stop(true);
		}
	});
}

for (const initial of [true, false]) {
	test(`terminal antes do welcome em conexão ${initial ? "inicial" : "recuperada"} não reanima o cliente`, async () => {
		let helloCount = 0;
		let genericClose = 0;
		let genericFailure = 0;
		const reasons: Reason[] = [];
		const state: SalaState = {
			code: "AB12", hostId: "p_fixture", phase: "idle", round: 1, votes: {}, createdAt: 1,
			players: [{ id: "p_fixture", nick: "Ana", role: "host", seatIndex: 0,
				hasVoted: false, value: null, status: "connected", joinedAt: 1 }],
		};
		const server = Bun.serve({
			hostname: "127.0.0.1",
			port: 0,
			fetch(request, srv) {
				if (srv.upgrade(request)) return;
				return new Response("not found", { status: 404 });
			},
			websocket: {
				message(ws, raw: string | Buffer) {
					const text = typeof raw === "string" ? raw : raw.toString("utf-8");
					const event = ClientToServerEventSchema.parse(JSON.parse(text));
					if (event.type !== "hello") return;
					helloCount += 1;
					if (!initial && helloCount === 1) {
						ws.send(JSON.stringify({ type: "welcome", payload: { playerId: "p_fixture", role: "host", sala: state } }));
						ws.close(1001, "test network close");
						return;
					}
					ws.send(JSON.stringify({ type: "sala_ended", payload: { reason: "replaced" } }));
					ws.close(1012, "replaced");
				},
			},
		});
		let timer: ReturnType<typeof setTimeout> | undefined;
		let signal: (() => void) | undefined;
		const ended = new Promise<void>((resolve, reject) => {
			signal = resolve;
			timer = setTimeout(() => reject(new Error("término pré-welcome ausente")), 2_000);
		});
		const client = new PointlySocket({
			onClose: () => { genericClose += 1; },
			onReconnectFailed: () => { genericFailure += 1; },
			onSalaEnded: (reason) => { reasons.push(reason); signal?.(); },
		}, { reconnectBaseDelayMs: 10, reconnectMaxDelayMs: 10, reconnectWindowMs: 1_000 });
		try {
			const connected = client.connect(`ws://127.0.0.1:${server.port}/ws`, {
				uuid: crypto.randomUUID(), nick: "Ana", code: "AB12",
			});
			if (initial) await expect(connected).rejects.toMatchObject({ code: "connection_failed" });
			else await connected;
			await ended;
			expect(reasons).toEqual(["replaced"]);
			expect(genericClose).toBe(0);
			expect(genericFailure).toBe(0);
			client.setAutoReconnect(true);
			client.retryNow();
			expect(client.getStatus()).toBe("closed");
			expect(helloCount).toBe(initial ? 1 : 2);
		} finally {
			if (timer) clearTimeout(timer);
			client.close({ silent: true });
			server.stop(true);
		}
	});
}
