/**
 * WebSocket client — factory com reconnect + heartbeat + validação Zod.
 *
 * - URL: `VITE_WS_URL` > dev `ws://localhost:3001/ws` > `wss://<host>/ws`
 * - Valida S→C com `ServerToClientEventSchema` (malformed → warn + drop)
 * - Valida C→S com `ClientToServerEventSchema` antes de enviar
 * - Reconnect com backoff exponencial 1s,2s,4s…cap 30s
 * - Heartbeat: `ping` a cada 5s com socket aberto; sem `pong` em 5s → close + reconnect
 * - `onOpen` dispara a cada (re)connect — loops enviam `hello` ali (uma vez por conexão)
 */
import {
	type ClientToServerEvent,
	ClientToServerEventSchema,
	type ServerToClientEvent,
	ServerToClientEventSchema,
} from "@planning-poker/shared";

export type WSStatus = "idle" | "connecting" | "open" | "closed" | "error";

export type CreateWSClientOptions = {
	/** URL do WS. Default: `resolveWsUrl()`. */
	url?: string;
	/** Callback para cada evento S→C validado. */
	onEvent: (e: ServerToClientEvent) => void;
	/** Callback a cada (re)connect com socket aberto. */
	onOpen?: () => void;
	/** Schedule de timers (default `setTimeout`). Injetável pra testes. */
	setTimeoutFn?: typeof setTimeout;
	/** Clear de timers (default `clearTimeout`). Injetável pra testes. */
	clearTimeoutFn?: typeof clearTimeout;
	/** Override do constructor WebSocket (mock em testes). */
	WebSocketCtor?: typeof WebSocket;
	/** Cap de retries. Default `Infinity`. */
	maxReconnectRetries?: number;
	/** Intervalo do heartbeat em ms. Default 5000. */
	heartbeatIntervalMs?: number;
	/** Timeout de espera do pong em ms. Default 5000. */
	heartbeatTimeoutMs?: number;
};

export type WSClient = {
	connect: () => void;
	send: (event: ClientToServerEvent) => void;
	close: () => void;
	getStatus: () => WSStatus;
};

export const RECONNECT_BASE_MS = 1_000;
export const RECONNECT_MAX_MS = 30_000;
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 5_000;
export const DEFAULT_HEARTBEAT_TIMEOUT_MS = 5_000;

/** Backoff exponencial capado em 30s: 1s,2s,4s,8s,16s,30s,… */
export function reconnectDelay(attempt: number): number {
	return Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
}

/**
 * Resolve a URL do WS.
 *
 * IMPORTANTE: acesso direto a `import.meta.env.*` (nunca alias) — o
 * define do Vite só substitui acesso direto em build.
 */
export function resolveWsUrl(): string {
	try {
		const fromEnv = import.meta.env.VITE_WS_URL;
		if (typeof fromEnv === "string" && fromEnv.length > 0) return fromEnv;
		if (import.meta.env.DEV) return "ws://localhost:3001/ws";
	} catch {
		// import.meta indisponível (bun test) — segue pros fallbacks
	}
	if (typeof window !== "undefined" && window.location) {
		const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
		return `${proto}//${window.location.host}/ws`;
	}
	return "ws://localhost:3001/ws";
}

export function createWSClient(options: CreateWSClientOptions): WSClient {
	const {
		url: urlOpt,
		onEvent,
		onOpen,
		setTimeoutFn = setTimeout,
		clearTimeoutFn = clearTimeout,
		WebSocketCtor,
		maxReconnectRetries = Number.POSITIVE_INFINITY,
		heartbeatIntervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS,
		heartbeatTimeoutMs = DEFAULT_HEARTBEAT_TIMEOUT_MS,
	} = options;

	const url = urlOpt ?? resolveWsUrl();

	let ws: WebSocket | null = null;
	let status: WSStatus = "idle";
	let reconnectAttempt = 0;
	let reconnectHandle: ReturnType<typeof setTimeout> | null = null;
	let heartbeatHandle: ReturnType<typeof setTimeout> | null = null;
	let pongTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
	let explicitlyClosed = false;

	function clearReconnect(): void {
		if (reconnectHandle !== null) {
			clearTimeoutFn(reconnectHandle);
			reconnectHandle = null;
		}
	}

	function clearHeartbeat(): void {
		if (heartbeatHandle !== null) {
			clearTimeoutFn(heartbeatHandle);
			heartbeatHandle = null;
		}
		if (pongTimeoutHandle !== null) {
			clearTimeoutFn(pongTimeoutHandle);
			pongTimeoutHandle = null;
		}
	}

	function scheduleHeartbeat(): void {
		clearHeartbeat();
		heartbeatHandle = setTimeoutFn(onHeartbeat, heartbeatIntervalMs);
	}

	function onHeartbeat(): void {
		if (explicitlyClosed || !ws || ws.readyState !== WebSocket.OPEN) return;
		try {
			send({ type: "ping", payload: {} });
		} catch {
			// PingPayload é vazio — validação não falha na prática
		}
		pongTimeoutHandle = setTimeoutFn(() => {
			if (ws && ws.readyState === WebSocket.OPEN) {
				try {
					ws.close();
				} catch {
					// ignore — o `close` agenda o reconnect
				}
			}
		}, heartbeatTimeoutMs);
		// Reagenda o próximo ping (heartbeat contínuo enquanto aberto)
		heartbeatHandle = setTimeoutFn(onHeartbeat, heartbeatIntervalMs);
	}

	function scheduleReconnect(): void {
		if (explicitlyClosed) return;
		if (reconnectAttempt >= maxReconnectRetries) return;
		clearReconnect();
		const delay = reconnectDelay(reconnectAttempt);
		reconnectAttempt += 1;
		reconnectHandle = setTimeoutFn(() => {
			reconnectHandle = null;
			openSocket();
		}, delay);
	}

	function handleMessage(ev: MessageEvent): void {
		let raw: unknown;
		try {
			raw = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
		} catch (e) {
			console.warn("[ws-client] failed to parse message:", e);
			return;
		}
		const parsed = ServerToClientEventSchema.safeParse(raw);
		if (!parsed.success) {
			console.warn("[ws-client] malformed event dropped:", parsed.error.issues);
			return;
		}
		if (parsed.data.type === "pong") {
			if (pongTimeoutHandle !== null) {
				clearTimeoutFn(pongTimeoutHandle);
				pongTimeoutHandle = null;
			}
			return;
		}
		try {
			onEvent(parsed.data);
		} catch (e) {
			console.warn("[ws-client] onEvent threw:", e);
		}
	}

	function openSocket(): void {
		const Ctor = WebSocketCtor ?? globalThis.WebSocket;
		if (!Ctor) {
			status = "error";
			return;
		}
		status = "connecting";
		try {
			ws = new Ctor(url);
		} catch (e) {
			console.warn("[ws-client] constructor threw:", e);
			status = "error";
			scheduleReconnect();
			return;
		}

		ws.addEventListener("open", () => {
			status = "open";
			reconnectAttempt = 0;
			scheduleHeartbeat();
			try {
				onOpen?.();
			} catch (e) {
				console.warn("[ws-client] onOpen threw:", e);
			}
		});
		ws.addEventListener("message", handleMessage);
		ws.addEventListener("close", () => {
			status = "closed";
			clearHeartbeat();
			ws = null;
			scheduleReconnect();
		});
		ws.addEventListener("error", () => {
			status = "error";
			// `close` dispara em seguida — reconnect vem dali
		});
	}

	function send(event: ClientToServerEvent): void {
		const parsed = ClientToServerEventSchema.safeParse(event);
		if (!parsed.success) {
			console.warn(
				"[ws-client] refusing to send invalid event:",
				parsed.error.issues,
			);
			return;
		}
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			console.warn("[ws-client] cannot send — socket not open:", event.type);
			return;
		}
		try {
			ws.send(JSON.stringify(parsed.data));
		} catch (e) {
			console.warn("[ws-client] send failed:", e);
		}
	}

	function close(): void {
		explicitlyClosed = true;
		clearReconnect();
		clearHeartbeat();
		if (ws) {
			try {
				ws.close();
			} catch {
				// ignore
			}
			ws = null;
		}
		status = "closed";
	}

	function connect(): void {
		explicitlyClosed = false;
		reconnectAttempt = 0;
		openSocket();
	}

	function getStatus(): WSStatus {
		return status;
	}

	return { connect, send, close, getStatus };
}
