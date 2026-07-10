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

	constructor(ip = "127.0.0.1") {
		this.remoteAddress = ip;
		this.data = {
			playerId: null,
			code: null,
			ip,
			lastPongAt: Date.now(),
		};
	}

	send(message: string | ArrayBuffer | Uint8Array): void {
		this.messages.push(
			typeof message === "string" ? message : new TextDecoder().decode(message),
		);
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

	test("ping responde pong", () => {
		service.onOpen(ws);
		const before = Date.now();
		service.onMessage(ws, JSON.stringify({ type: "ping", payload: {} }));
		const pongs = ws.eventsOfType("pong");
		expect(pongs).toHaveLength(1);
		expect(ws.data.lastPongAt).toBeGreaterThanOrEqual(before);
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
// Regressão prod (2026-07-10): outros clientes NÃO recebiam `room_state`
// imediato quando um peer desconectava, virando a aparecer "se reconectando"
// (status=connected) até o próximo vote/reconcile/tickGracePeriod (até 60s).
//
// Issue #59: PR #58 introduziu broadcast imediato (sem debounce) que
// causava flicker visível em reconexões rápidas — peer renderizava
// `connected → disconnected → connected` em <1s. Fix #59 introduz
// debounce de 1.5s: se o cliente reconectar dentro da janela, o broadcast
// de disconnect é CANCELADO. Sem cancelamento (= disconnect permanente),
// o peer recebe o status='disconnected' após 1.5s. Estes testes
// verificam o comportamento com debounce (issue #59 fix).
// ---------------------------------------------------------------------------

describe("WSService — onClose broadcast com debounce (issue #59)", () => {
	/**
	 * Helper: cria timer helpers fake para controle determinístico do
	 * debounce sem esperar tempo real.
	 */
	function makeFakeTimers(): {
		setTimeoutFn: typeof setTimeout;
		clearTimeoutFn: typeof clearTimeout;
		runAll: () => void;
	} {
		let nextId = 1;
		const handles = new Map<number, { fn: () => void }>();
		const runAll = () => {
			for (const [, h] of [...handles.entries()]) h.fn();
			handles.clear();
		};
		const setTimeoutFn = ((fn: () => void, _ms: number) => {
			const id = nextId++;
			handles.set(id, { fn });
			return id as unknown as ReturnType<typeof setTimeout>;
		}) as unknown as typeof setTimeout;
		const clearTimeoutFn = ((id: unknown) => {
			handles.delete(id as number);
		}) as unknown as typeof clearTimeout;
		return { setTimeoutFn, clearTimeoutFn, runAll };
	}

	test("disconnect permanente (sem reconnect): peer vê room_state com status='disconnected'", () => {
		const timers = makeFakeTimers();
		const localService = new WSService(
			hub,
			logger,
			undefined,
			timers.setTimeoutFn,
			timers.clearTimeoutFn,
		);

		// Ana cria sala
		localService.onOpen(ws);
		localService.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);
		const code = ws.data.code!;

		// Bob entra
		const bob = new MockBunWS("127.0.0.2");
		localService.onOpen(bob);
		localService.onMessage(
			bob,
			JSON.stringify({
				type: "hello",
				payload: {
					uuid: "00000000-0000-4000-8000-000000000002",
					nick: "Bob",
					code,
				},
			}),
		);
		const bobPlayerId = bob.data.playerId!;

		const baseline = ws.eventsOfType("room_state").length;

		// Bob fecha WS — broadcast agendado (não imediato por causa do debounce).
		localService.onClose(bob, 1006, "abnormal_closure");
		expect(localService.hasPendingDisconnectBroadcast(bobPlayerId)).toBe(true);

		// Antes do debounce expirar, peer NÃO vê broadcast extra.
		const afterImmediate = ws.eventsOfType("room_state").length;
		expect(afterImmediate).toBe(baseline);

		// Debounce expira — peer vê broadcast com Bob disconnected.
		timers.runAll();
		const after = ws.eventsOfType("room_state").length;
		expect(after).toBeGreaterThan(baseline);

		const lastRoomState = ws.eventsOfType("room_state").at(-1)!;
		const bobInState = lastRoomState.payload.sala.players.find(
			(p) => p.id === bobPlayerId,
		);
		expect(bobInState).toBeDefined();
		expect(bobInState?.status).toBe("disconnected");
	});

	test("reconnect dentro da janela: peer NÃO vê o broadcast de disconnect (sem flicker)", () => {
		const timers = makeFakeTimers();
		const localService = new WSService(
			hub,
			logger,
			undefined,
			timers.setTimeoutFn,
			timers.clearTimeoutFn,
		);

		// Ana + Bob na sala
		localService.onOpen(ws);
		localService.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);
		const code = ws.data.code!;
		const bob = new MockBunWS("127.0.0.2");
		localService.onOpen(bob);
		localService.onMessage(
			bob,
			JSON.stringify({
				type: "hello",
				payload: {
					uuid: "00000000-0000-4000-8000-000000000002",
					nick: "Bob",
					code,
				},
			}),
		);

		// Bob desconecta
		localService.onClose(bob, 1006, "abnormal_closure");
		expect(
			localService.hasPendingDisconnectBroadcast(bob.data.playerId!),
		).toBe(true);

		// Bob reconecta (mesmo UUID, mesmo code) via nova conexão ANTES do debounce.
		const bob2 = new MockBunWS("127.0.0.2");
		localService.onOpen(bob2);
		localService.onMessage(
			bob2,
			JSON.stringify({
				type: "hello",
				payload: {
					uuid: "00000000-0000-4000-8000-000000000002",
					nick: "Bob",
					code,
				},
			}),
		);

		// handleHello cancelou o agendamento.
		expect(
			localService.hasPendingDisconnectBroadcast(bob.data.playerId!),
		).toBe(false);

		// Timer expira (sem efeito, foi cancelado).
		timers.runAll();

		// Peer (Ana) NÃO viu o broadcast de disconnect — só vê o do reconnect.
		// Sem isso, haveria flicker `connected → disconnected → connected`.
		const lastRoomState = ws.eventsOfType("room_state").at(-1)!;
		const bobInState = lastRoomState.payload.sala.players.find(
			(p) => p.id === bob.data.playerId,
		);
		expect(bobInState?.status).toBe("connected");
	});
});

// ---------------------------------------------------------------------------
// T01: reconciliation cadence (10s) per ADR-002
// ---------------------------------------------------------------------------

describe("WSService — tick reconciliation cadence (10s)", () => {
	function setupVotingSala(): string {
		service.onOpen(ws);
		service.onMessage(
			ws,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000001", nick: "Ana" },
			}),
		);
		// 2º player para que phase fique 'voting' (1 só player → revealable)
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
		// só Ana votou → phase permanece 'voting' (Bob ainda não votou)
		const sala = hub.getSalaForPlayer(ws.data.playerId!)!;
		expect(sala.phase).toBe("voting");
		sala.timer = 50; // impede auto-reveal durante o teste
		return sala.code;
	}

	test("broadcasta room_state imediatamente quando timer 'fired' (auto-reveal)", () => {
		const code = setupVotingSala();
		const sala = hub.getSala(code)!;
		sala.timer = 1; // próximo tick → fired

		const before = ws.eventsOfType("room_state").length;
		service.tick(Date.now());
		const after = ws.eventsOfType("room_state").length;

		// 'fired' deve gerar pelo menos um room_state extra
		expect(after).toBeGreaterThan(before);
		expect(sala.phase).toBe("revealed");
	});

	test("broadcasta room_state para sala 'ticking' quando >= 10s se passaram", () => {
		const code = setupVotingSala();
		const sala = hub.getSala(code)!;
		sala.timer = 50;

		const t1 = 1_000_000;
		service.tick(t1); // primeiro tick: lastBroadcastAt=0, então now-0 >= 10000 → broadcast
		const baseline = ws.eventsOfType("room_state").length;

		// avança 9s: ainda não deve broadcastar (9 < 10)
		service.tick(t1 + 9_000);
		expect(ws.eventsOfType("room_state").length).toBe(baseline);

		// avança mais 2s (total 11s): deve broadcastar
		service.tick(t1 + 11_000);
		expect(ws.eventsOfType("room_state").length).toBeGreaterThan(baseline);
	});

	test("NÃO broadcasta room_state para sala 'ticking' quando < 10s se passaram", () => {
		const code = setupVotingSala();
		const sala = hub.getSala(code)!;
		sala.timer = 50;

		const t1 = 2_000_000;
		service.tick(t1); // primeiro tick: broadcast (lastBroadcastAt era 0)
		const after1 = ws.eventsOfType("room_state").length;

		// 5 ticks de 1s cada — todos < 10s desde t1
		for (let i = 1; i <= 5; i++) {
			service.tick(t1 + i * 1000);
		}
		const after5 = ws.eventsOfType("room_state").length;
		expect(after5).toBe(after1); // sem broadcasts extras
	});

	test("timestamps de broadcast são independentes por sala", () => {
		// sala A: host (Ana) + player (Cris). Cris não vota → phase 'voting'
		const wsA = new MockBunWS("127.0.0.1");
		service.onOpen(wsA);
		service.onMessage(
			wsA,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000002", nick: "Ana" },
			}),
		);
		const codeA = wsA.data.code!;
		const wsA2 = new MockBunWS("127.0.0.3");
		service.onOpen(wsA2);
		service.onMessage(
			wsA2,
			JSON.stringify({
				type: "hello",
				payload: {
					uuid: "00000000-0000-8000-0000-000000000004",
					nick: "Cris",
					code: codeA,
				},
			}),
		);
		service.onMessage(
			wsA,
			JSON.stringify({ type: "cast_vote", payload: { value: "5" } }),
		);
		const salaA = hub.getSala(codeA)!;
		expect(salaA.phase).toBe("voting");
		salaA.timer = 50;

		// sala B: host (Bob) + player (Diana). Diana não vota → phase 'voting'
		const wsB = new MockBunWS("127.0.0.2");
		service.onOpen(wsB);
		service.onMessage(
			wsB,
			JSON.stringify({
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000003", nick: "Bob" },
			}),
		);
		const codeB = wsB.data.code!;
		const wsB2 = new MockBunWS("127.0.0.4");
		service.onOpen(wsB2);
		service.onMessage(
			wsB2,
			JSON.stringify({
				type: "hello",
				payload: {
					uuid: "00000000-0000-8000-0000-000000000005",
					nick: "Diana",
					code: codeB,
				},
			}),
		);
		service.onMessage(
			wsB,
			JSON.stringify({ type: "cast_vote", payload: { value: "8" } }),
		);
		const salaB = hub.getSala(codeB)!;
		expect(salaB.phase).toBe("voting");
		salaB.timer = 50;

		// t=10000: ambos broadcastam (lastBroadcastAt=0 para ambos)
		service.tick(10_000);
		const a1 = wsA.eventsOfType("room_state").length;
		const b1 = wsB.eventsOfType("room_state").length;
		expect(a1).toBeGreaterThan(0);
		expect(b1).toBeGreaterThan(0);

		// t=15000 (5s depois): nenhum deve broadcastar
		service.tick(15_000);
		expect(wsA.eventsOfType("room_state").length).toBe(a1);
		expect(wsB.eventsOfType("room_state").length).toBe(b1);

		// t=21000 (11s após último broadcast da A, 11s após último da B):
		// ambos devem broadcastar
		service.tick(21_000);
		expect(wsA.eventsOfType("room_state").length).toBeGreaterThan(a1);
		expect(wsB.eventsOfType("room_state").length).toBeGreaterThan(b1);
	});

	test("NÃO broadcasta para sala em fase 'idle' (sem voting)", () => {
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
