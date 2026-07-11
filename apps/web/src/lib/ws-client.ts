/**
 * WebSocket client wrapper — T23 (Phase 5).
 *
 * Factory `createWSClient` que:
 *  - abre WebSocket na URL (default `import.meta.env.VITE_WS_URL` ou `ws://localhost:3001/ws`)
 *  - valida cada evento recebido com Zod (rejeita malformed → `console.warn`, drop)
 *  - expõe `send(event)` que valida com Zod antes de enviar
 *  - auto-reconnect com backoff exponencial (1s, 2s, 4s, …, max 30s)
 *  - heartbeat: envia `ping` a cada 30s; se `pong` não chega em 5s, fecha + reconnect
 *  - `status: 'idle' | 'connecting' | 'open' | 'closed' | 'error'`
 *  - `close()` para heartbeat e fecha WS sem reconnect
 *
 * @see .specs/features/planning-poker-v1/tasks.md T23
 * @see docs/adr/0008-zustand-zod-shared-schemas.md
 */

import {
	ClientToServerEventSchema,
	ServerToClientEventSchema,
	type ClientToServerEvent,
	type ServerToClientEvent,
} from "@planning-poker/shared";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/** Status observável do WebSocket. */
export type WSStatus = "idle" | "connecting" | "open" | "closed" | "error";

/** Opções da factory. */
export type CreateWSClientOptions = {
	/** URL do WS. Default: `import.meta.env.VITE_WS_URL ?? "ws://localhost:3001/ws"`. */
	url?: string;
	/** Callback invocado para cada evento S→C validado pelo Zod. */
	onEvent: (e: ServerToClientEvent) => void;
	/**
	 * Função de schedule de timers (default: `setTimeout`). Injetável pra testes
	 * com fake timers (ex: `bun:test` `setSystemTime`/`useFakeTimers`).
	 */
	setTimeoutFn?: typeof setTimeout;
	/**
	 * Função de clear de timers (default: `clearTimeout`). Injetável pra testes.
	 */
	clearTimeoutFn?: typeof clearTimeout;
	/**
	 * Override do constructor `WebSocket`. Injetável pra testes com mock
	 * (em runtime, default = `globalThis.WebSocket`).
	 */
	WebSocketCtor?: typeof WebSocket;
	/**
	 * Cap de retries de reconnect. `Infinity` (default) = reconecta sempre.
	 */
	maxReconnectRetries?: number;
	/** Override do intervalo de heartbeat (ms). Default: 30000. */
	heartbeatIntervalMs?: number;
	/** Override do timeout pra esperar pong (ms). Default: 5000. */
	heartbeatTimeoutMs?: number;
	/**
	 * Callback invocado em toda mudança de status. Default: noop.
	 * Útil para hooks upstream que precisam reagir a open/closed/error
	 * (ex: resetar flags de dedup apos reconexao).
	 */
	onStatusChange?: (status: WSStatus) => void;
	/**
	 * Callback invocado toda vez que o WS abre (inclui reconnects).
	 * Útil para handlers tipo "envia `hello` após WS ficar `open`" que
	 * precisam disparar tanto no 1º connect quanto após reconnect. Se
	 * throwar, é engolido com `console.warn` (não derruba o cliente).
	 */
	onOpen?: () => void;
};

export type WSClient = {
	connect: () => void;
	send: (event: ClientToServerEvent) => void;
	close: () => void;
	getStatus: () => WSStatus;
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Backoff exponencial: 1s, 2s, 4s, 8s, 16s, 30s (cap). */
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
/** Heartbeat ping a cada 30s. */
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;
/**
 * Se pong não chega em 15s, fecha + reconnect.
 *
 * Root cause do flicker visual (issue #59): timeout de 5s era agressivo
 * demais — redes normais (Wi-Fi compartilhado, mobile, hotel) podem ter
 * picos de latência de 6-10s. Cada "pong atrasado" causava reconnect →
 * peers viam flash disconnected.
 *
 * 15s é tolerante para ~99% das latências reais (mobile 4G/5G, Wi-Fi
 * instável) sem mascarar desconexões reais (>30s tipicamente significa
 * rede caiu). Ping continua sendo enviado a cada 30s, então 15s de pong
 * timeout = 50% da janela entre pings — generoso.
 *
 * Trade-off: usuário pode demorar até 15s para perceber que perdeu
 * conexão. Aceitável dado que flicker era pior UX.
 */
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Backoff exponencial capado em 30s. */
function reconnectDelay(attempt: number): number {
	const exp = RECONNECT_BASE_MS * 2 ** attempt;
	return Math.min(exp, RECONNECT_MAX_MS);
}

/** Lê env var com fallback (Vite injeta `import.meta.env.VITE_*`). */
function defaultURL(): string {
	try {
		// `import.meta.env` é resolvido por Vite em build; em testes Bun, pode
		// ser `undefined`. Try/catch protege.
		const env = (import.meta as { env?: Record<string, string | undefined> })
			.env;
		const fromEnv = env?.VITE_WS_URL;
		if (typeof fromEnv === "string" && fromEnv.length > 0) return fromEnv;
		// Em dev, o Vite roda em :5173 e o server Bun em :3001. Conexão WS
		// relativa (`/ws`) é resolvida pelo Vite proxy, mas o proxy de WS
		// do Vite 6 é instável — pode deixar conexões penduradas em
		// "connecting" se o target não responde rápido. Solução pragmática:
		// conectar direto em `ws://localhost:3001/ws` no dev (WS não tem
		// CORS). Em prod (server serve estáticos), mesma origin resolve.
		const devFlag = env?.DEV;
		if (devFlag) {
			return "ws://localhost:3001/ws";
		}
	} catch {
		// ignore — import.meta indisponível
	}
	// Default prod: URL relativa `/ws` no mesmo origin.
	if (typeof window !== "undefined" && window.location) {
		const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
		return `${proto}//${window.location.host}/ws`;
	}
	return "ws://localhost:3001/ws";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Cria wrapper de WebSocket com reconnect + heartbeat + validação Zod.
 *
 * O client gerencia internamente:
 *  - reconexão automática em `close`/`error`
 *  - heartbeat ping/pong
 *  - estado `status` observável
 *
 * Caller controla ciclo de vida:
 *  - `connect()` para iniciar
 *  - `close()` para parar (sem reconnect)
 */
export function createWSClient(options: CreateWSClientOptions): WSClient {
	const {
		url: urlOpt,
		onEvent,
		onOpen,
		onStatusChange,
		setTimeoutFn = setTimeout,
		clearTimeoutFn = clearTimeout,
		WebSocketCtor,
		maxReconnectRetries = Number.POSITIVE_INFINITY,
		heartbeatIntervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS,
		heartbeatTimeoutMs = DEFAULT_HEARTBEAT_TIMEOUT_MS,
	} = options;

	const url = urlOpt ?? defaultURL();

	let ws: WebSocket | null = null;
	let status: WSStatus = "idle";
	let reconnectAttempt = 0;
	let reconnectHandle: ReturnType<typeof setTimeout> | null = null;
	let heartbeatHandle: ReturnType<typeof setTimeout> | null = null;
	let pongTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
	let explicitlyClosed = false;

	function setStatus(next: WSStatus): void {
		status = next;
		onStatusChange?.(next);
	}

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
		heartbeatHandle = setTimeoutFn(() => {
			// Envia ping (validado por Zod em `send`)
			try {
				send({ type: "ping", payload: {} });
			} catch {
				// Falha de validação é improvável (PingPayloadSchema é vazio).
				// Ignora.
			}
			// Espera pong em 5s
			pongTimeoutHandle = setTimeoutFn(() => {
				// Pong não chegou — fecha + reconecta
				if (ws && ws.readyState === WebSocket.OPEN) {
					try {
						ws.close();
					} catch {
						// ignore
					}
				}
			}, heartbeatTimeoutMs);
		}, heartbeatIntervalMs);
	}

	function scheduleReconnect(): void {
		if (explicitlyClosed) return;
		if (reconnectAttempt >= maxReconnectRetries) return;
		clearReconnect();
		const delay = reconnectDelay(reconnectAttempt);
		reconnectAttempt += 1;
		reconnectHandle = setTimeoutFn(() => {
			openSocket();
		}, delay);
	}

	function openSocket(): void {
		const Ctor = WebSocketCtor ?? globalThis.WebSocket;
		if (!Ctor) {
			// Sem WebSocket (SSR / Node sem polyfill) — vai pra error.
			setStatus("error");
			return;
		}
		setStatus("connecting");
		try {
			ws = new Ctor(url);
		} catch (e) {
			console.warn("[ws-client] constructor threw:", e);
			setStatus("error");
			scheduleReconnect();
			return;
		}

		ws.addEventListener("open", () => {
			setStatus("open");
			reconnectAttempt = 0; // reset backoff on successful connect
			scheduleHeartbeat();
			// T42+ — external handlers precisam reagir a CADA 'open'
			// (inclui reconnects). Caller pode throwar; isolamos para não
			// quebrar o agendamento de heartbeat.
			if (onOpen) {
				try {
					onOpen();
				} catch (e) {
					console.warn("[ws-client] onOpen threw:", e);
				}
			}
		});

		ws.addEventListener("message", (ev: MessageEvent) => {
			let raw: unknown;
			try {
				raw = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
			} catch (e) {
				console.warn("[ws-client] failed to parse message:", e);
				return;
			}
			const parsed = ServerToClientEventSchema.safeParse(raw);
			if (!parsed.success) {
				console.warn(
					"[ws-client] malformed event dropped:",
					parsed.error.issues,
				);
				return;
			}
			// Reset pong timeout (server respondeu) e re-agenda heartbeat.
			if (parsed.data.type === "pong") {
				if (pongTimeoutHandle !== null) {
					clearTimeoutFn(pongTimeoutHandle);
					pongTimeoutHandle = null;
				}
				scheduleHeartbeat();
				return;
			}
			// Reset heartbeat em qualquer evento válido (mantém conexão viva).
			scheduleHeartbeat();
			try {
				onEvent(parsed.data);
			} catch (e) {
				console.warn("[ws-client] onEvent threw:", e);
			}
		});

		ws.addEventListener("close", () => {
			setStatus("closed");
			clearHeartbeat();
			ws = null;
			scheduleReconnect();
		});

		ws.addEventListener("error", () => {
			setStatus("error");
			// O evento `close` vai disparar logo após — reconnect vem dali.
		});
	}

	function send(event: ClientToServerEvent): void {
		// Validação defensiva (Zod) — caller deveria ter tipado corretamente,
		// mas protege contra payload inválido.
		const parsed = ClientToServerEventSchema.safeParse(event);
		if (!parsed.success) {
			// UX-006: serializa issues para que apareçam em console.warn/.text(),
			// não fiquem como "[Object]" em Playwright/Chromium.
			const issues = parsed.error.issues
				.map((i) => {
					const path = i.path.join(".") || "(root)";
					const received =
						"received" in i && i.received !== undefined
							? ` (got ${JSON.stringify(i.received)})`
							: "";
					return `${path}: ${i.message}${received}`;
				})
				.join("; ");
			console.warn(
				`[ws-client] refusing to send invalid event type="${event.type ?? "?"}": ${issues}`,
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
		setStatus("closed");
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
