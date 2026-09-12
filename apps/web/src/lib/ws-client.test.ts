/**
 * ws-client — colocated (bun:test). WebSocket mockado via injeção.
 *
 * Cobre: hello-on-open, backoff exponencial, ping a cada 5s,
 * validação Zod in/out, sem reconnect após close().
 */
import { afterEach, describe, expect, mock, test } from "bun:test";
import {
	createWSClient,
	DEFAULT_HEARTBEAT_INTERVAL_MS,
	reconnectDelay,
} from "./ws-client";

// ---------------------------------------------------------------------------
// Mock WebSocket
// ---------------------------------------------------------------------------

class MockWebSocket {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;

	readonly url: string;
	readyState: number = MockWebSocket.CONNECTING;
	sent: string[] = [];

	private listeners: Record<string, Array<(ev: never) => void>> = {
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

	addEventListener(type: string, fn: (ev: never) => void): void {
		this.listeners[type]?.push(fn);
	}

	removeEventListener(): void {
		// no-op pro mock
	}

	simulateOpen(): void {
		this.readyState = MockWebSocket.OPEN;
		for (const fn of this.listeners.open ?? []) fn({} as never);
	}

	simulateMessage(data: unknown): void {
		const payload = typeof data === "string" ? data : JSON.stringify(data);
		for (const fn of this.listeners.message ?? []) fn({ data: payload } as never);
	}

	simulateClose(): void {
		this.readyState = MockWebSocket.CLOSED;
		for (const fn of this.listeners.close ?? []) fn({} as never);
	}

	send(data: string): void {
		this.sent.push(data);
	}

	close(): void {
		if (this.readyState === MockWebSocket.CLOSED) return;
		this.readyState = MockWebSocket.CLOSED;
		for (const fn of this.listeners.close ?? []) fn({} as never);
	}
}

const MockCtor = MockWebSocket as unknown as typeof WebSocket;

afterEach(() => {
	MockWebSocket.instances = [];
});

/** Scheduler manual: handles estáveis, captura callbacks + delays. */
function makeScheduler() {
	const pending: Array<{ id: number; cb: () => void; delay: number }> = [];
	let nextHandle = 1;
	const setTimeoutFn = ((cb: () => void, delay?: number) => {
		const id = nextHandle++;
		pending.push({ id, cb, delay: delay ?? 0 });
		return id as unknown as ReturnType<typeof setTimeout>;
	}) as typeof setTimeout;
	const clearTimeoutFn = ((handle: unknown) => {
		const idx = pending.findIndex((p) => p.id === (handle as number));
		if (idx >= 0) pending.splice(idx, 1);
	}) as typeof clearTimeout;
	return { pending, setTimeoutFn, clearTimeoutFn };
}

describe("ws-client", () => {
	test("hello-on-open: onOpen envia hello uma vez por conexão", () => {
		const onEvent = mock(() => {});
		const client = createWSClient({
			url: "ws://localhost:3001/ws",
			onEvent,
			WebSocketCtor: MockCtor,
			onOpen: () => {
				client.send({
					type: "hello",
					payload: {
						uuid: "00000000-0000-4000-8000-000000000000",
						nick: "Helder",
						code: "AB12",
					},
				});
			},
		});
		client.connect();
		expect(client.getStatus()).toBe("connecting");
		MockWebSocket.instances[0]?.simulateOpen();
		expect(client.getStatus()).toBe("open");
		const sent = MockWebSocket.instances[0]?.sent ?? [];
		expect(sent).toHaveLength(1);
		expect(JSON.parse(sent[0] ?? "{}")).toEqual({
			type: "hello",
			payload: {
				uuid: "00000000-0000-4000-8000-000000000000",
				nick: "Helder",
				code: "AB12",
			},
		});
		client.close();
	});

	test("backoff exponencial 1s,2s,4s…cap 30s", () => {
		expect(reconnectDelay(0)).toBe(1_000);
		expect(reconnectDelay(1)).toBe(2_000);
		expect(reconnectDelay(2)).toBe(4_000);
		expect(reconnectDelay(5)).toBe(30_000);
		expect(reconnectDelay(10)).toBe(30_000);

		const sched = makeScheduler();
		const client = createWSClient({
			url: "ws://x/ws",
			onEvent: () => {},
			WebSocketCtor: MockCtor,
			setTimeoutFn: sched.setTimeoutFn,
			clearTimeoutFn: sched.clearTimeoutFn,
		});
		client.connect();
		expect(MockWebSocket.instances).toHaveLength(1);
		MockWebSocket.instances[0]?.simulateClose();
		expect(sched.pending.map((p) => p.delay)).toContain(1_000);
		// Dispara o reconnect agendado → 2ª tentativa abre novo socket
		const first = sched.pending.find((p) => p.delay === 1_000);
		first?.cb();
		expect(MockWebSocket.instances).toHaveLength(2);
		MockWebSocket.instances[1]?.simulateClose();
		expect(sched.pending.map((p) => p.delay)).toContain(2_000);
		client.close();
	});

	test("ping a cada heartbeat quando aberto; pong cancela timeout", () => {
		const sched = makeScheduler();
		const client = createWSClient({
			url: "ws://x/ws",
			onEvent: () => {},
			WebSocketCtor: MockCtor,
			setTimeoutFn: sched.setTimeoutFn,
			clearTimeoutFn: sched.clearTimeoutFn,
			heartbeatIntervalMs: DEFAULT_HEARTBEAT_INTERVAL_MS,
			heartbeatTimeoutMs: 5_000,
		});
		client.connect();
		MockWebSocket.instances[0]?.simulateOpen();
		const heartbeat = sched.pending.find(
			(p) => p.delay === DEFAULT_HEARTBEAT_INTERVAL_MS,
		);
		expect(heartbeat).toBeDefined();
		// Consome o timer disparado (como o runtime faria) e executa
		sched.pending.splice(sched.pending.indexOf(heartbeat!), 1);
		heartbeat?.cb();
		const sent = MockWebSocket.instances[0]?.sent ?? [];
		expect(sent.map((s) => JSON.parse(s).type)).toContain("ping");
		// ping armou: 1 pong-timeout + 1 próximo heartbeat
		expect(sched.pending.filter((p) => p.delay === 5_000)).toHaveLength(2);
		// pong do server cancela só o timeout (heartbeat segue)
		MockWebSocket.instances[0]?.simulateMessage({ type: "pong", payload: {} });
		expect(sched.pending.filter((p) => p.delay === 5_000)).toHaveLength(1);
		client.close();
	});

	test("mensagem malformada é descartada sem throw; válida chega ao onEvent", () => {
		const seen: unknown[] = [];
		const client = createWSClient({
			url: "ws://x/ws",
			onEvent: (e) => seen.push(e),
			WebSocketCtor: MockCtor,
		});
		client.connect();
		MockWebSocket.instances[0]?.simulateOpen();
		MockWebSocket.instances[0]?.simulateMessage("not-json{{{");
		MockWebSocket.instances[0]?.simulateMessage({ type: "nope", payload: {} });
		expect(seen).toHaveLength(0);
		MockWebSocket.instances[0]?.simulateMessage({
			type: "player_left",
			payload: { playerId: "p_9" },
		});
		expect(seen).toHaveLength(1);
		client.close();
	});

	test("close() explícito não reagenda reconnect", () => {
		const sched = makeScheduler();
		const client = createWSClient({
			url: "ws://x/ws",
			onEvent: () => {},
			WebSocketCtor: MockCtor,
			setTimeoutFn: sched.setTimeoutFn,
			clearTimeoutFn: sched.clearTimeoutFn,
		});
		client.connect();
		client.close();
		expect(client.getStatus()).toBe("closed");
		expect(sched.pending).toHaveLength(0);
		expect(MockWebSocket.instances).toHaveLength(1);
	});
});
