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
