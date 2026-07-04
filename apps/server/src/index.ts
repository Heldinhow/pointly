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
 *  - Heartbeat: WS service tick() chama Hub.tickAllTimers + tickGracePeriod
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
import { Hub } from "./hub";
import { WSService } from "./ws";
import { Logger } from "./ws-logger";
import { CleanupService, installSignalHandlers } from "./cleanup";

// ---------------------------------------------------------------------------
// HTTP (Hono)
// ---------------------------------------------------------------------------

export const app = new Hono();

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

app.notFound((c) => c.json({ error: "not_found" }, 404));

app.onError((err, c) => {
	console.error("[server] unhandled error", err);
	return c.json({ error: "internal_server_error" }, 500);
});

// ---------------------------------------------------------------------------
// Server entry — only when run directly (not when imported by tests).
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 3001);

if (import.meta.main) {
	const hub = new Hub();
	const logger = new Logger();
	const wsService = new WSService(hub, logger);

	// Cleanup: job periódico + SIGTERM handler
	const cleanup = new CleanupService(hub, logger, () => {
		// WS layer é responsável por mandar sala_ended ANTES do processo morrer.
		// Aqui só logamos.
		logger.shutdown(hub.activeCodes().length);
	});
	cleanup.start();

	// Heartbeat timer: 1s tick chama wsService.tick() → timers + grace period
	const heartbeat = setInterval(() => wsService.tick(), 1000);
	if (typeof heartbeat.unref === "function") heartbeat.unref();

	// Signal handlers — graceful shutdown
	installSignalHandlers(cleanup, () => {
		wsService.gracefulShutdown();
	});

	Bun.serve({
		port: PORT,
		fetch(req, srv) {
			let url: URL;
			try {
				url = new URL(req.url);
			} catch {
				return new Response("Bad Request", { status: 400 });
			}

			// WebSocket upgrade em /ws
			if (url.pathname === "/ws") {
				const ip = srv.requestIP(req)?.address ?? "unknown";
				// data do WS é inicializado no `open` (Bun não aceita `data` em upgrade)
				const ok = srv.upgrade(req);
				if (ok) {
					// IP é resolvido depois via onOpen (sem data pré-set)
					void ip; // disponível via srv.requestIP em onOpen se necessário
					return undefined;
				}
				return new Response("WebSocket upgrade failed", { status: 400 });
			}

			// HTTP via Hono
			return app.fetch(req);
		},
		websocket: {
			open(ws) {
				wsService.onOpen(ws as unknown as import("./ws").BunWS);
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
