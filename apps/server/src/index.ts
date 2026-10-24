/**
 * Pointly — Planning Poker backend entry point.
 *
 * Stack: Bun runtime · Hono HTTP · Bun.serve WebSocket
 * State: in-memory (ADR-0005). Sala efêmera; removida quando último sai.
 *
 * Phase 3 (T2 + T17 + T18 glue):
 *  - HTTP /health (T2)
 *  - /api/v1/health (T6)
 *  - WebSocket /ws (T17): dispatch handlers (T13/T14/T15/T16)
 *  - Cleanup service (T18): periodic tick + SIGTERM handler
 *  - Heartbeat: WS service tick() verifica timeout + tickGracePeriod
 *
 * Documentação de referência:
 * - ADR-0005  In-memory state, sem DB/Redis
 * - ADR-0006  Bun + Hono + Bun.serve
 * - ADR-0007  React + Vite + TS no frontend
 * - ADR-0008  Zustand + Zod shared schemas
 * - ADR-0009  Reconnect strategy (UUID client-side)
 * - CONTEXT.md Glossário de domínio (12 termos)
 */

import { Hono } from "hono";
import { RoomCodeSchema } from "@planning-poker/shared";
import { Hub } from "./hub";
import { WSService } from "./ws";
import { Logger } from "./ws-logger";
import { CleanupService, installSignalHandlers } from "./cleanup";
import {
	LIMITS,
	WindowLimiter,
	clientIpFrom,
	envInt,
	isOriginAllowed,
	parseAllowedOrigins,
} from "./security";
import {
	MAX_BEACON_BYTES,
	VisitCounter,
	visitsDataFile,
} from "./visits";

// ---------------------------------------------------------------------------
// HTTP (Hono)
// ---------------------------------------------------------------------------

/**
 * Hub singleton do processo. Levantado no module scope (não dentro do
 * `if (import.meta.main)`) para que a rota `GET /api/v1/salas/:code`
 * possa fechar sobre a mesma instância — e para que testes importem
 * `hub` e façam mutações (createSala/addPlayer) sem precisar injetar.
 *
 * O `Bun.serve` e os serviços pesados (`WSService`, `CleanupService`)
 * continuam restritos ao runtime `import.meta.main`.
 */
export const hub = new Hub();

/**
 * Reseta estado in-memory entre testes. Mantido neste módulo para evitar
 * testes terem que conhecer internals do Hub.
 */
export function __resetHubForTests(): void {
	hub.shutdown();
	lookupLimiter = new WindowLimiter(LOOKUP_PER_MIN, 60_000);
	__resetVisitsForTests();
}

/** Bindings que o entrypoint passa para o Hono (IP real do cliente). */
type Bindings = { ip?: string };

const LOOKUP_PER_MIN = envInt(process.env.LOOKUP_PER_MIN, LIMITS.lookupPerMin);
/** Anti-enumeração do código de sala (por IP, janela de 1min). */
let lookupLimiter = new WindowLimiter(LOOKUP_PER_MIN, 60_000);

const PAGEVIEW_PER_MIN = envInt(
	process.env.PAGEVIEW_PER_MIN,
	LIMITS.pageviewPerMin,
);
const VISITS_GET_PER_MIN = envInt(
	process.env.VISITS_GET_PER_MIN,
	LIMITS.visitsPerMin,
);
/** Beacon e leitura de stats (por IP, janela de 1min). */
let pageviewLimiter = new WindowLimiter(PAGEVIEW_PER_MIN, 60_000);
let visitsLimiter = new WindowLimiter(VISITS_GET_PER_MIN, 60_000);

/** Contador first-party (dedupe em memória, totais em `VISITS_DATA_FILE`). */
export let visits = new VisitCounter({ dataFile: visitsDataFile() });

/** Recria o contador em modo memória (sem arquivo) — SÓ para testes. */
export function __resetVisitsForTests(): void {
	visits = new VisitCounter();
	pageviewLimiter = new WindowLimiter(PAGEVIEW_PER_MIN, 60_000);
	visitsLimiter = new WindowLimiter(VISITS_GET_PER_MIN, 60_000);
}

export const app = new Hono<{ Bindings: Bindings }>();

app.get("/health", (c) =>
	c.json({
		status: "ok",
		service: "pointly-server",
		version: "0.2.0",
		timestamp: new Date().toISOString(),
	}),
);

app.get("/api/v1/health", (c) =>
	c.json({
		status: "ok",
		api: "v1",
		timestamp: new Date().toISOString(),
	}),
);

/**
 * `GET /api/v1/salas/:code` — pre-check de existência pra tela Join.
 *
 *  - 200 `{ code, exists: true }` quando a sala existe.
 *  - 429 `{ error: 'rate_limited' }` acima de LOOKUP_PER_MIN por IP.
 *  - 404 `{ code, exists: false }` quando não existe.
 *  - 400 `{ error: 'invalid_code' }` quando code não bate `[A-Z0-9]{4}`.
 *
 * Defesa em profundidade: o handler WS `hello` ainda lança
 * `sala_nao_encontrada` se a sala sumir entre este check e o `hello`
 * (race). Custo: 1 GET por submit; resposta cacheável por segundo
 * pelo browser, mas rooms são efêmeras então cache não vale o bytes.
 *
 * @see .specs/features/validate-room-existence/spec.md AC-1..AC-3
 */
app.get("/api/v1/salas/:code", (c) => {
	const ip = c.env?.ip ?? "unknown";
	if (!lookupLimiter.hit(ip)) {
		c.header("Retry-After", "60");
		return c.json({ error: "rate_limited" }, 429);
	}
	const code = c.req.param("code").toUpperCase();
	// SSOT: mesmo RoomCodeSchema do contrato compartilhado (antes regex duplicado).
	if (!RoomCodeSchema.safeParse(code).success) {
		return c.json({ error: "invalid_code" }, 400);
	}
	const sala = hub.getSala(code);
	if (!sala) {
		return c.json({ code, exists: false }, 404);
	}
	// Só existência: contagem/fase não são necessárias pro Join e ajudavam
	// a mapear salas ativas.
	return c.json({ code, exists: true });
});

app.notFound((c) => c.json({ error: "not_found" }, 404));

/**
 * `POST /api/stats/pageview` — beacon first-party (sendBeacon no web,
 * sem consentimento GA: nenhum dado pessoal é armazenado).
 *
 * - Corpo sempre ignorado (nunca contém — nem persistimos — códigos de sala).
 * - Bot por UA responde 204 sem contar (sem revelar a classificação).
 * - 429 acima de PAGEVIEW_PER_MIN por IP; 413 acima de 1KB.
 */
app.post("/api/stats/pageview", async (c) => {
	const ip = c.env?.ip ?? "unknown";
	if (!pageviewLimiter.hit(ip)) {
		c.header("Retry-After", "60");
		return c.json({ error: "rate_limited" }, 429);
	}
	const ua = c.req.header("user-agent") ?? "";
	const declared = Number(c.req.header("content-length") ?? "0");
	if (Number.isFinite(declared) && declared > MAX_BEACON_BYTES) {
		return c.json({ error: "payload_too_large" }, 413);
	}
	const body = await c.req.text();
	if (body.length > MAX_BEACON_BYTES) {
		return c.json({ error: "payload_too_large" }, 413);
	}
	visits.record(ip, ua);
	return new Response(null, {
		status: 204,
		headers: { "Cache-Control": "no-store" },
	});
});

/**
 * `GET /api/stats/visits` — resumo público pro display do ESP32
 * (`{"today","last7d","live5m","updatedAt"}`). Polling com
 * `Cache-Control: public, max-age=30`; CORS aberto (`*`).
 */
app.get("/api/stats/visits", (c) => {
	const ip = c.env?.ip ?? "unknown";
	if (!visitsLimiter.hit(ip)) {
		c.header("Retry-After", "60");
		return c.json({ error: "rate_limited" }, 429);
	}
	c.header("Access-Control-Allow-Origin", "*");
	c.header("Cache-Control", "public, max-age=30");
	return c.json(visits.snapshot());
});

app.onError((err, c) => {
	console.error("[server] unhandled error", err);
	return c.json({ error: "internal_server_error" }, 500);
});

// ---------------------------------------------------------------------------
// Server entry — only when run directly (not when imported by tests).
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 3001);
/** Atrás do Traefik: confiar no hop mais à direita do X-Forwarded-For. */
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

if (import.meta.main) {
	const logger = new Logger();
	const wsService = new WSService(hub, logger, undefined, {
		maxSalas: envInt(process.env.MAX_SALAS, LIMITS.maxSalas),
		roomCreatePerMin: envInt(
			process.env.ROOM_CREATE_PER_MIN,
			LIMITS.roomCreatePerMin,
		),
		unknownCodePerMin: envInt(
			process.env.UNKNOWN_CODE_PER_MIN,
			LIMITS.unknownCodePerMin,
		),
	});

	// Cleanup: job periódico + SIGTERM handler
	const cleanup = new CleanupService(hub, logger, () => {
		// WS layer é responsável por mandar sala_ended ANTES do processo morrer.
		// Aqui só logamos.
		logger.shutdown(hub.activeCodes().length);
	});
	cleanup.start();

	// Heartbeat: tick verifica heartbeat timeout + grace period
	const heartbeat = setInterval(() => wsService.tick(), 1000);
	if (typeof heartbeat.unref === "function") heartbeat.unref();

	// Signal handlers — graceful shutdown
	installSignalHandlers(cleanup, () => {
		wsService.gracefulShutdown();
	});

	Bun.serve<{ ip: string }>({
		port: PORT,
		fetch(req, srv) {
			let url: URL;
			try {
				url = new URL(req.url);
			} catch {
				return new Response("Bad Request", { status: 400 });
			}

			const ip = clientIpFrom(
				req.headers.get("x-forwarded-for"),
				srv.requestIP(req)?.address,
				TRUST_PROXY,
			);

			// WebSocket upgrade em /ws
			if (url.pathname === "/ws") {
				// Anti-CSWSH: browser de outro site não abre WS no nosso backend.
				if (!isOriginAllowed(req.headers.get("origin"), ALLOWED_ORIGINS)) {
					return new Response("Forbidden origin", { status: 403 });
				}
				// IP real segue no `data`; o resto do contexto nasce no onOpen.
				const ok = srv.upgrade(req, { data: { ip } });
				if (ok) return undefined;
				return new Response("WebSocket upgrade failed", { status: 400 });
			}

			// HTTP via Hono
			return app.fetch(req, { ip });
		},
		websocket: {
			// Frame maior que isso é recusado pelo Bun (avatar ≤40KB + folga).
			maxPayloadLength: LIMITS.maxPayloadBytes,
			open(ws) {
				wsService.onOpen(ws as unknown as import("./ws").BunWS);
			},
			pong(ws) {
				wsService.onPong(ws as unknown as import("./ws").BunWS);
			},
			message(ws, message) {
				const text =
					typeof message === "string"
						? message
						: new TextDecoder().decode(message);
				wsService.onMessage(ws as unknown as import("./ws").BunWS, text);
			},
			close(ws, code, reason) {
				wsService.onClose(
					ws as unknown as import("./ws").BunWS,
					code,
					typeof reason === "string" ? reason : "",
				);
			},
		},
	});

	console.log(`[server] listening on http://localhost:${PORT}`);
	console.log(`[server] WS endpoint: ws://localhost:${PORT}/ws`);
	console.log(`[server] health: curl http://localhost:${PORT}/health`);
}

export const SERVER_PORT = PORT;

// Re-exports para testes
export { Hub } from "./hub";
export { WSService } from "./ws";
export { Logger, MemorySink } from "./ws-logger";
export { CleanupService, installSignalHandlers } from "./cleanup";
