/**
 * WS service tests — T17 verify (≥4 unit tests).
 *
 * Cobre:
 *  - Conexão aberta / fechada / dispatch
 *  - Ping/pong com heartbeat timeout
 *  - Mock BunWS dispatcha handlers corretos
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Hub } from "./hub";
import { Hub as HubClass } from "./hub";
import type { ServerToClientEvent } from "@planning-poker/shared";
import { ServerToClientEventSchema } from "@planning-poker/shared";
import { MemorySink } from "./ws-logger";
import { Logger } from "./ws-logger";
import { WSService, type BunWS, type WSContext } from "./ws";

// ---------------------------------------------------------------------------
// Mock BunWS
// ---------------------------------------------------------------------------

class MockBunWS implements BunWS {
	remoteAddress = "127.0.0.1";
	data: WSContext;
	messages: string[] = [];
	closed = false;
	closeCode: number | null = null;
	closeReason: string | null = null;
	private subs = new Set<string>();

	pings = 0;

	constructor(ip = "127.0.0.1") {
		this.remoteAddress = ip;
		this.data = {
			playerId: null,
			code: null,
			ip,
			lastPongAt: Date.now(),
			lastPingAt: Date.now(),
		};
	}

	send(message: string | ArrayBuffer | Uint8Array): void {
		this.messages.push(
			typeof message === "string" ? message : new TextDecoder().decode(message),
		);
	}

	ping(): void {
		this.pings += 1;
	}

	close(code?: number, reason?: string): void {
		this.closed = true;
		if (code !== undefined) this.closeCode = code;
		if (reason !== undefined) this.closeReason = reason;
	}

	subscribe(topic: string): void {
		this.subs.add(topic);
	}
	unsubscribe(topic: string): void {
		this.subs.delete(topic);
	}

	// Helpers ---------------------------------------------------------------

	/** Retorna último evento como parsed object. */
	lastEvent(): ServerToClientEvent | null {
		const last = this.messages[this.messages.length - 1];
		if (!last) return null;
		try {
			return JSON.parse(last) as ServerToClientEvent;
		} catch {
			return null;
		}
	}

	/** Retorna eventos filtrados por type. */
	eventsOfType<T extends ServerToClientEvent["type"]>(
		type: T,
	): Extract<ServerToClientEvent, { type: T }>[] {
		const out: Extract<ServerToClientEvent, { type: T }>[] = [];
		for (const m of this.messages) {
			try {
				const ev = JSON.parse(m) as ServerToClientEvent;
				if (ev.type === type) {
					out.push(ev as Extract<ServerToClientEvent, { type: T }>);
				}
			} catch {
				// skip unparseable
			}
		}
		return out;
	}
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let hub: Hub;
let logger: Logger;
let memorySink: MemorySink;
let service: WSService;
let ws: MockBunWS;

beforeEach(() => {
	hub = new HubClass();
	memorySink = new MemorySink();
	logger = new Logger(memorySink);
	service = new WSService(hub, logger);
	ws = new MockBunWS();
});

afterEach(() => {
	// cleanup
});

// ---------------------------------------------------------------------------
// T17: connect + dispatch + send
// ---------------------------------------------------------------------------

describe("WSService — onOpen", () => {
	test("registra conexão e metadata", () => {
		service.onOpen(ws);
		expect(service.connectionCount).toBe(1);
		expect(ws.data.ip).toBe("127.0.0.1");
		const connectLog = memorySink.entries.find(
			(e) => e.event.type === "ws.connect",
		);
		expect(connectLog).toBeDefined();
	});

	test("fecha conexão se rate limit excedido", () => {
		// cria 6 conexões rápidas do mesmo IP
		const ws6 = new MockBunWS("1.2.3.4");
		// simula 5 já conectadas
		for (let i = 0; i < 5; i++) {
			const w = new MockBunWS("1.2.3.4");
			service.onOpen(w);
		}
		service.onOpen(ws6);
		expect(ws6.closed).toBe(true);
		expect(ws6.closeCode).toBe(1013);
	});
});

describe("WSService — onMessage (hello + cast_vote + reveal + new_round)", () => {
	test("hello cria sala e envia welcome + broadcast room_state", () => {
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);

		const welcomes = ws.eventsOfType("welcome");
		expect(welcomes).toHaveLength(1);
		const welcome = welcomes[0];
		expect(welcome?.payload.role).toBe("host");
		expect(welcome?.payload.playerId).not.toBeNull();
		expect(ws.data.playerId).not.toBeNull();
		expect(ws.data.code).not.toBeNull();
		expect(String(welcome?.payload.playerId)).toBe(String(ws.data.playerId));
	});

	test("hello inválido (nick ruim) envia error", () => {
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "A" },
			}),
		);

		const errors = ws.eventsOfType("error");
		expect(errors).toHaveLength(1);
		expect(errors[0]?.payload.code).toBe("invalid_nick");
	});

	test("cast_vote → vote_cast + room_state broadcast", () => {
		// Ana cria sala
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);
		// Ana vota
		service.onMessage(
			ws,
			JSON.stringify({ type: "cast_vote", payload: { value: "5" } }),
		);

		const voteCasts = ws.eventsOfType("vote_cast");
		expect(voteCasts.length).toBeGreaterThanOrEqual(1);
		expect(voteCasts[0]?.payload).toMatchObject({
			kind: "individual",
			playerName: "Ana",
		});
	});

	test("reveal_votes → votes_revealed broadcast", () => {
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);
		service.onMessage(
			ws,
			JSON.stringify({ type: "cast_vote", payload: { value: "5" } }),
		);
		service.onMessage(
			ws,
			JSON.stringify({ type: "reveal_votes", payload: {} }),
		);

		const reveals = ws.eventsOfType("votes_revealed");
		expect(reveals.length).toBeGreaterThanOrEqual(1);
		if (reveals[0]) {
			expect(reveals[0].payload.unanimous).toBe(true);
			expect(reveals[0].payload.median).toBe(5);
		}
	});

	test("ping app-level responde pong (compat)", () => {
		service.onOpen(ws);
		const before = Date.now();
		service.onMessage(ws, JSON.stringify({ type: "ping", payload: {} }));
		const pongs = ws.eventsOfType("pong");
		expect(pongs).toHaveLength(1);
		expect(ws.data.lastPongAt).toBeGreaterThanOrEqual(before);
	});

	test("onPong de protocolo renova o liveness", () => {
		service.onOpen(ws);
		ws.data.lastPongAt = Date.now() - 80_000;
		service.onPong(ws);
		expect(Date.now() - ws.data.lastPongAt).toBeLessThan(1000);
	});

	test("onPong ignora conexão desconhecida", () => {
		const ghost = new MockBunWS("9.9.9.9");
		expect(() => service.onPong(ghost)).not.toThrow();
		expect(ghost.data.lastPongAt).toBeLessThanOrEqual(Date.now());
	});

	test("reveal e nova rodada enviam o estado atualizado também a quem acionou", () => {
		service.onOpen(ws);
		service.onMessage(ws, JSON.stringify({ type: "hello", payload: {
			uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana",
		} }));
		service.onMessage(ws, JSON.stringify({ type: "cast_vote", payload: { value: "5" } }));
		service.onMessage(ws, JSON.stringify({ type: "reveal_votes", payload: {} }));
		expect(ws.eventsOfType("room_state").at(-1)?.payload.sala.phase).toBe("revealed");
		expect(ws.eventsOfType("room_state").at(-1)?.payload.sala.votes[ws.data.playerId!]).toBe("5");
		service.onMessage(ws, JSON.stringify({ type: "start_new_round", payload: {} }));
		const next = ws.eventsOfType("room_state").at(-1)?.payload.sala;
		expect(next?.round).toBe(2);
		expect(next?.phase).toBe("voting");
		expect(next?.votes).toEqual({});
	});

	test("EVR-03: cast_vote em revealed com mesmo valor NÃO envia nenhum broadcast", () => {
		// Setup: 2 players, vote, reveal (phase revealed)
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);
		const ws2 = new MockBunWS("127.0.0.2");
		service.onOpen(ws2);
		service.onMessage(
			ws2,
			JSON.stringify({
				type: "hello",
				payload: {
					uuid: "00000000-0000-4000-8000-000000000002",
					nick: "Bob",
					code: ws.data.code,
				},
			}),
		);
		service.onMessage(
			ws,
			JSON.stringify({ type: "cast_vote", payload: { value: "5" } }),
		);
		service.onMessage(
			ws2,
			JSON.stringify({ type: "cast_vote", payload: { value: "5" } }),
		);
		service.onMessage(
			ws,
			JSON.stringify({ type: "reveal_votes", payload: {} }),
		);
		const sala = hub.getSalaForPlayer(ws.data.playerId!)!;
		expect(sala.phase).toBe("revealed");

		// Baseline: contar broadcasts após o reveal
		const roomStateBeforeRe = ws.eventsOfType("room_state").length;
		const votesRevealedBeforeRe = ws.eventsOfType("votes_revealed").length;
		const voteCastBefore = ws.eventsOfType("vote_cast").length;

		// Act: Ana re-clica na MESMA carta "5"
		service.onMessage(
			ws,
			JSON.stringify({ type: "cast_vote", payload: { value: "5" } }),
		);

		// Assert: ZERO broadcasts novos (no-op path early-return)
		expect(ws.eventsOfType("room_state").length).toBe(roomStateBeforeRe);
		expect(ws.eventsOfType("votes_revealed").length).toBe(votesRevealedBeforeRe);
		expect(ws.eventsOfType("vote_cast").length).toBe(voteCastBefore);
	});
});

// ---------------------------------------------------------------------------
// T17: graceful shutdown
// ---------------------------------------------------------------------------

describe("WSService — gracefulShutdown", () => {
	test("broadcasts sala_ended com reason=server_restart e fecha conexões", () => {
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);

		service.gracefulShutdown();

		const salaEnded = ws.eventsOfType("sala_ended");
		expect(salaEnded.length).toBeGreaterThanOrEqual(1);
		expect(salaEnded[0]?.payload.reason).toBe("server_restart");
		expect(ws.closed).toBe(true);
		expect(service.connectionCount).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// T17: validate wire format (Zod parse)
// ---------------------------------------------------------------------------

describe("WSService — wire format validation", () => {
	test("toda mensagem enviada passa pelo ServerToClientEventSchema", () => {
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);
		for (const msg of ws.messages) {
			let parsed: ReturnType<
				typeof ServerToClientEventSchema.safeParse
			> | null = null;
			try {
				parsed = ServerToClientEventSchema.safeParse(JSON.parse(msg));
			} catch {
				parsed = null;
			}
			expect(parsed?.success).toBe(true);
		}
	});
});

// ---------------------------------------------------------------------------
// Tick: heartbeat + grace period (sem timer)
// ---------------------------------------------------------------------------

describe("WSService — tick heartbeat + grace period", () => {
	test("tolera 60s sem pong (aba oculta) e fecha após 90s (morte real)", () => {
		service.onOpen(ws);
		ws.data.lastPongAt = Date.now() - 60_000;
		service.tick(Date.now());
		expect(ws.closed).toBe(false);

		ws.data.lastPongAt = Date.now() - 95_000;
		service.tick(Date.now());
		expect(ws.closed).toBe(true);
		expect(ws.closeCode).toBe(1011);
	});

	test("tick pinga conexão com hello após 25s, mas não antes nem pré-hello", () => {
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);
		const t = Date.now();
		service.tick(t);
		expect(ws.pings).toBe(0);

		service.tick(t + 26_000);
		expect(ws.pings).toBe(1);

		// Pré-hello nunca recebe ping de protocolo.
		const fresh = new MockBunWS("127.0.0.3");
		service.onOpen(fresh);
		service.tick(t + 60_000);
		expect(fresh.pings).toBe(0);
	});

	test("tick sozinho não broadcasta room_state (só eventos disparam)", () => {
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);
		const ws2 = new MockBunWS("127.0.0.2");
		service.onOpen(ws2);
		service.onMessage(
			ws2,
			JSON.stringify({
				type: "hello",
				payload: {
					uuid: "00000000-0000-4000-8000-000000000002",
					nick: "Bob",
					code: ws.data.code,
				},
			}),
		);
		service.onMessage(
			ws,
			JSON.stringify({ type: "cast_vote", payload: { value: "5" } }),
		);
		const sala = hub.getSalaForPlayer(ws.data.playerId!)!;
		expect(sala.phase).toBe("voting");

		const baseline = ws.eventsOfType("room_state").length;
		const t = Date.now();
		service.tick(t);
		service.tick(t + 1_000);
		service.tick(t + 11_000);
		expect(ws.eventsOfType("room_state").length).toBe(baseline);
		expect(sala.phase).toBe("voting");
	});

	test("NÃO broadcasta para sala em fase 'idle' via tick", () => {
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);
		// sem cast_vote — sala em idle; hello não broadcasta room_state pro sender
		const baseline = ws.eventsOfType("room_state").length;
		const code = ws.data.code!;
		const sala = hub.getSala(code)!;
		expect(sala.phase).toBe("idle");

		const t = 5_000_000;
		service.tick(t);
		expect(ws.eventsOfType("room_state").length).toBe(baseline);

		// mesmo após 10s, idle continua sem broadcastar via tick
		service.tick(t + 10_000);
		expect(ws.eventsOfType("room_state").length).toBe(baseline);
	});
});
