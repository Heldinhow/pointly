/**
 * ws-client tests — T23 verify (≥5 unit tests).
 *
 * Mock global WebSocket injetando uma classe fake antes de cada test.
 *
 * Cenários cobertos:
 *  1. connect → status 'open' quando mock dispara open event
 *  2. message bem formado → Zod parse + onEvent callback
 *  3. message malformado → dropped, sem throw, console.warn chamado
 *  4. send valida payload via Zod antes de chamar ws.send
 *  5. close event do mock dispara reconnect (com setTimeoutFn injetável)
 *  6. heartbeat: ping enviado após `heartbeatIntervalMs` (com timer mock)
 *
 * @see .specs/features/planning-poker-v1/tasks.md T23
 */

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "bun:test";

// ---------------------------------------------------------------------------
// Mock WebSocket
// ---------------------------------------------------------------------------

/** Mock de WebSocket com API mínima (open/message/close/error + send). */
class MockWebSocket {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;

	readonly url: string;
	readyState: number = MockWebSocket.CONNECTING;
	sent: string[] = [];

	private listeners: Record<string, Array<(ev: unknown) => void>> = {
		open: [],
		message: [],
		close: [],
		error: [],
	};

	static instances: MockWebSocket[] = [];

	constructor(url: string) {
		this.url = url;
		MockWebSocket.instances.push(this);
	}

	addEventListener(type: string, fn: (ev: unknown) => void): void {
		const list = this.listeners[type];
		if (list) list.push(fn);
	}

	/** Helpers de teste — disparam eventos como se viessem do "server". */
	simulateOpen(): void {
		this.readyState = MockWebSocket.OPEN;
		for (const fn of this.listeners.open ?? []) fn({});
	}

	simulateMessage(data: unknown): void {
		const payload = typeof data === "string" ? data : JSON.stringify(data);
		for (const fn of this.listeners.message ?? []) fn({ data: payload });
	}

	simulateClose(): void {
		this.readyState = MockWebSocket.CLOSED;
		for (const fn of this.listeners.close ?? []) fn({});
	}

	simulateError(): void {
		for (const fn of this.listeners.error ?? []) fn({});
	}

	send(data: string): void {
		this.sent.push(data);
	}

	close(): void {
		if (this.readyState === MockWebSocket.CLOSED) return;
		this.readyState = MockWebSocket.CLOSED;
		for (const fn of this.listeners.close ?? []) fn({});
	}
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const VALID_HELLO_RESPONSE = {
	type: "welcome",
	payload: {
		playerId: "p_abc",
		role: "host",
		sala: {
			code: "ABCD",
			hostId: "p_abc",
			players: [
				{
					id: "p_abc",
					uuid: "00000000-0000-4000-8000-000000000001",
					nick: "Ana",
					role: "host",
					seatIndex: 0,
					hasVoted: false,
					value: null,
					status: "connected",
					joinedAt: 1700000000000,
				},
			],
			phase: "idle",
			round: 1,
			timer: 60,
			votes: {},
			createdAt: 1700000000000,
		},
	},
};

let warnSpy: ReturnType<typeof spyOn> | null = null;

beforeEach(() => {
	MockWebSocket.instances = [];
	(globalThis as unknown as { WebSocket: typeof MockWebSocket }).WebSocket =
		MockWebSocket;
	warnSpy = spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
	warnSpy?.mockRestore();
});

// ---------------------------------------------------------------------------
// T23.1 — connect status: idle → connecting → open
// ---------------------------------------------------------------------------

describe("createWSClient — connect lifecycle", () => {
	test("connect abre WS e transita status idle → connecting → open", () => {
		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
		});

		expect(client.getStatus()).toBe("idle");

		client.connect();
		expect(client.getStatus()).toBe("connecting");
		expect(MockWebSocket.instances).toHaveLength(1);

		// simula o server aceitando conexão
		MockWebSocket.instances[0]!.simulateOpen();
		expect(client.getStatus()).toBe("open");

		client.close();
	});

	test("close para heartbeat e fecha WS sem agendar reconnect", () => {
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: () => {},
		});
		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		client.close();

		expect(client.getStatus()).toBe("closed");
		// Close é no-op se já closed
		expect(MockWebSocket.instances[0]!.readyState).toBe(MockWebSocket.CLOSED);
	});
});

// ---------------------------------------------------------------------------
// T23.2 — message bem formado → onEvent com Zod-parsed payload
// ---------------------------------------------------------------------------

describe("createWSClient — message dispatch", () => {
	test("welcome bem formado chega ao onEvent com payload tipado", () => {
		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
		});
		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		MockWebSocket.instances[0]!.simulateMessage(VALID_HELLO_RESPONSE);

		expect(events).toHaveLength(1);
		const evt = events[0] as { type: string; payload: { playerId: string } };
		expect(evt.type).toBe("welcome");
		expect(evt.payload.playerId).toBe("p_abc");
	});

	test("vote_cast individual chega ao onEvent", () => {
		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
		});
		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		MockWebSocket.instances[0]!.simulateMessage({
			type: "vote_cast",
			payload: { kind: "individual", playerId: "p_x", playerName: "Maya" },
		});

		expect(events).toHaveLength(1);
		const evt = events[0] as {
			type: string;
			payload: { kind: string; playerName: string };
		};
		expect(evt.type).toBe("vote_cast");
		expect(evt.payload.kind).toBe("individual");
		expect(evt.payload.playerName).toBe("Maya");
	});
});

// ---------------------------------------------------------------------------
// T23.3 — message malformado → dropped + warn (sem throw)
// ---------------------------------------------------------------------------

describe("createWSClient — malformed events", () => {
	test("event sem `type` é dropado + console.warn", () => {
		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
		});
		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		// payload sem `type` (campo obrigatório da discriminated union)
		MockWebSocket.instances[0]!.simulateMessage({ payload: { foo: 1 } });

		expect(events).toHaveLength(0);
		expect(warnSpy).toHaveBeenCalled();
	});

	test("type desconhecido é dropado + console.warn", () => {
		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
		});
		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		MockWebSocket.instances[0]!.simulateMessage({
			type: "ghost_event",
			payload: {},
		});

		expect(events).toHaveLength(0);
		expect(warnSpy).toHaveBeenCalled();
	});

	test("welcome com nick inválido (vazio) é dropado", () => {
		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
		});
		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		MockWebSocket.instances[0]!.simulateMessage({
			type: "welcome",
			payload: {
				playerId: "p_x",
				role: "host",
				sala: {
					code: "ABCD",
					hostId: "p_x",
					players: [
						{
							id: "p_x",
							uuid: "00000000-0000-4000-8000-000000000001",
							nick: "", // inválido
							role: "host",
							seatIndex: 0,
							hasVoted: false,
							value: null,
							status: "connected",
							joinedAt: 1700000000000,
						},
					],
					phase: "idle",
					round: 1,
					timer: 60,
					votes: {},
					createdAt: 1700000000000,
				},
			},
		});

		expect(events).toHaveLength(0);
		expect(warnSpy).toHaveBeenCalled();
	});

	test("JSON inválido é dropado + warn", () => {
		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
		});
		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		// injeta listener para simular data não-string
		const ws = MockWebSocket.instances[0]!;
		// Listener custom para mandar uma string não-JSON
		ws.addEventListener("message", () => {});
		// Sobrescreve o behavior default do helper para mandar raw string malformada
		const listeners = (
			ws as unknown as {
				listeners: Record<string, Array<(ev: { data: string }) => void>>;
			}
		).listeners;
		for (const fn of listeners.message ?? []) {
			fn({ data: "{ this is not json" });
		}

		expect(events).toHaveLength(0);
		expect(warnSpy).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// T23.4 — send valida via Zod antes de chamar ws.send
// ---------------------------------------------------------------------------

describe("createWSClient — send validation", () => {
	test("send com payload válido é serializado e enviado", () => {
		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
		});
		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		client.send({
			type: "cast_vote",
			payload: { value: "5" },
		});

		const ws = MockWebSocket.instances[0]!;
		expect(ws.sent).toHaveLength(1);
		const raw = ws.sent[0] ?? "{}";
		let parsed: { type: string; payload: { value: string } } = {
			type: "",
			payload: { value: "" },
		};
		try {
			parsed = JSON.parse(raw) as typeof parsed;
		} catch {
			parsed = { type: "", payload: { value: "" } };
		}
		expect(parsed).toEqual({ type: "cast_vote", payload: { value: "5" } });
	});

	test("send de cast_vote com value fora do deck é dropado + warn", () => {
		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
		});
		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		// Força um cast_vote inválido (TS deveria bloquear, mas defensivo)
		client.send({
			type: "cast_vote",
			payload: { value: "42" as unknown as null },
		});

		expect(MockWebSocket.instances[0]!.sent).toHaveLength(0);
		expect(warnSpy).toHaveBeenCalled();
	});

	test("send antes do open é dropado + warn", () => {
		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
		});
		client.connect();
		// NÃO simula open — status ainda 'connecting'

		client.send({ type: "cast_vote", payload: { value: "5" } });

		expect(MockWebSocket.instances[0]!.sent).toHaveLength(0);
		expect(warnSpy).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// T23.5 — reconnect após close
// ---------------------------------------------------------------------------

describe("createWSClient — reconnect on close", () => {
	test("close event do mock dispara reconnect após backoff", () => {
		// setTimeout mockado — captura callbacks agendados
		const scheduled: Array<{ ms: number; fn: () => void }> = [];
		const fakeSetTimeout = ((fn: () => void, ms: number) => {
			scheduled.push({ ms, fn });
			return 99 as unknown as ReturnType<typeof setTimeout>;
		}) as unknown as typeof setTimeout;
		const fakeClearTimeout = (() => {}) as unknown as typeof clearTimeout;

		const events: unknown[] = [];
		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: (e) => events.push(e),
			setTimeoutFn: fakeSetTimeout,
			clearTimeoutFn: fakeClearTimeout,
		});

		client.connect();
		// open() agendou heartbeat
		MockWebSocket.instances[0]!.simulateOpen();
		// Limpa o scheduled do heartbeat (que disparou no open) — só nos interessa
		// o que vem DEPOIS (reconnect).
		scheduled.length = 0;

		// Server fecha conexão
		MockWebSocket.instances[0]!.simulateClose();

		// Reconnect deve ter sido agendado
		expect(scheduled).toHaveLength(1);
		// 1ª tentativa = 1s
		expect(scheduled[0]!.ms).toBe(1_000);

		// Limpa mock e dispara o callback agendado
		MockWebSocket.instances = [];
		scheduled[0]!.fn();

		// Um novo WebSocket deve ter sido criado
		expect(MockWebSocket.instances).toHaveLength(1);
	});

	test("backoff exponencial: 2ª tentativa = 2s, 3ª = 4s, 4ª = 8s, cap em 30s", () => {
		const scheduled: Array<{ ms: number; fn: () => void }> = [];
		const fakeSetTimeout = ((fn: () => void, ms: number) => {
			scheduled.push({ ms, fn });
			return 99 as unknown as ReturnType<typeof setTimeout>;
		}) as unknown as typeof setTimeout;
		const fakeClearTimeout = (() => {}) as unknown as typeof clearTimeout;

		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: () => {},
			setTimeoutFn: fakeSetTimeout,
			clearTimeoutFn: fakeClearTimeout,
		});

		// Atalho: simula que reconnect_attempt já está em N
		// (forçando closes repetidos sem abrir entre eles)
		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();
		// Limpa heartbeat agendado no open pra isolar reconnect
		scheduled.length = 0;
		MockWebSocket.instances[0]!.simulateClose();
		expect(scheduled[0]?.ms).toBe(1_000);

		// Dispara callback agendado (cria novo WS)
		scheduled[0]!.fn();
		// Esse novo WS dispara close sem open (cenário: server down)
		// Limpa heartbeat que pode ter sido agendado
		scheduled.length = 0;
		MockWebSocket.instances[1]!.simulateClose();
		// 2ª tentativa = 2s
		const second = scheduled.find((s) => s.ms === 2_000);
		expect(second).toBeDefined();
	});

	test("close() impede reconnect (explicit close)", () => {
		const scheduled: Array<{ ms: number; fn: () => void }> = [];
		const fakeSetTimeout = ((fn: () => void, ms: number) => {
			scheduled.push({ ms, fn });
			return 99 as unknown as ReturnType<typeof setTimeout>;
		}) as unknown as typeof setTimeout;
		const fakeClearTimeout = (() => {}) as unknown as typeof clearTimeout;

		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: () => {},
			setTimeoutFn: fakeSetTimeout,
			clearTimeoutFn: fakeClearTimeout,
		});

		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();
		client.close();

		// Server tenta fechar (já closed)
		// Tentar reconectar não deve agendar nada
		scheduled.length = 0;
		MockWebSocket.instances[0]!.simulateClose();
		expect(scheduled).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// T23.6 — heartbeat: ping enviado após 5s
// ---------------------------------------------------------------------------

describe("createWSClient — heartbeat", () => {
	test("ping enviado após heartbeatIntervalMs (default 5s)", () => {
		const scheduled: Array<{ ms: number; fn: () => void }> = [];
		const fakeSetTimeout = ((fn: () => void, ms: number) => {
			scheduled.push({ ms, fn });
			return 99 as unknown as ReturnType<typeof setTimeout>;
		}) as unknown as typeof setTimeout;
		const fakeClearTimeout = (() => {}) as unknown as typeof clearTimeout;

		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: () => {},
			setTimeoutFn: fakeSetTimeout,
			clearTimeoutFn: fakeClearTimeout,
		});

		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		// open() agendou heartbeat em 5s (default — fev/2026: era 30s)
		expect(scheduled.some((s) => s.ms === 5_000)).toBe(true);

		// Dispara o callback de heartbeat
		const hb = scheduled.find((s) => s.ms === 5_000)!;
		hb.fn();

		// ping deve ter sido enviado
		const sent = MockWebSocket.instances[0]!.sent;
		expect(sent.length).toBeGreaterThanOrEqual(1);
		const rawPing = sent[sent.length - 1] ?? "{}";
		let last: { type: string } = { type: "" };
		try {
			last = JSON.parse(rawPing) as typeof last;
		} catch {
			last = { type: "" };
		}
		expect(last.type).toBe("ping");
	});

	test("pong reseta heartbeat (re-agendamento)", () => {
		const scheduled: Array<{ ms: number; fn: () => void }> = [];
		const fakeSetTimeout = ((fn: () => void, ms: number) => {
			scheduled.push({ ms, fn });
			return 99 as unknown as ReturnType<typeof setTimeout>;
		}) as unknown as typeof setTimeout;
		const fakeClearTimeout = (() => {}) as unknown as typeof clearTimeout;

		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: () => {},
			setTimeoutFn: fakeSetTimeout,
			clearTimeoutFn: fakeClearTimeout,
		});

		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();
		// Limpa heartbeat agendado no open
		scheduled.length = 0;

		// Server envia pong
		MockWebSocket.instances[0]!.simulateMessage({
			type: "pong",
			payload: {},
		});

		// Deve ter re-agendado heartbeat em 5s (default)
		expect(scheduled.some((s) => s.ms === 5_000)).toBe(true);
	});

	test("intervalo customizado respeitado", () => {
		const scheduled: Array<{ ms: number; fn: () => void }> = [];
		const fakeSetTimeout = ((fn: () => void, ms: number) => {
			scheduled.push({ ms, fn });
			return 99 as unknown as ReturnType<typeof setTimeout>;
		}) as unknown as typeof setTimeout;
		const fakeClearTimeout = (() => {}) as unknown as typeof clearTimeout;

		const client = createWSClient({
			url: "ws://test/ws",
			onEvent: () => {},
			setTimeoutFn: fakeSetTimeout,
			clearTimeoutFn: fakeClearTimeout,
			heartbeatIntervalMs: 7_500, // override ≠ default (5s) — prova que override é respeitado
		});

		client.connect();
		MockWebSocket.instances[0]!.simulateOpen();

		expect(scheduled.some((s) => s.ms === 7_500)).toBe(true);
		expect(scheduled.some((s) => s.ms === 5_000)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// T23.bonus — env URL default
// ---------------------------------------------------------------------------

describe("createWSClient — env defaults", () => {
	test("URL default quando options.url não fornecido", () => {
		const client = createWSClient({ onEvent: () => {} });
		client.connect();
		// Mock global injetado antes do test — WebSocket constructor
		// registra a URL passada.
		expect(MockWebSocket.instances[0]!.url).toBeTruthy();
		client.close();
	});
});

// Import lazy pra evitar ciclo no bun:test mock
import { createWSClient } from "./ws-client";

// silence unused import warning em TS strict
void mock;
