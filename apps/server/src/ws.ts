/**
 * WebSocket handler — Phase 3 / T17
 *
 * Bun.serve() com upgrade em /ws. Dispatch de eventos por `event.type`
 * para os handlers T13/T14/T15/T16. Heartbeat ping/pong com timeout 60s.
 *
 * Wire format (C↔S) validado por Zod schemas em @planning-poker/shared.
 *
 * @see docs/adr/0006-bun-hono-websocket-backend.md
 * @see docs/adr/0009-reconnect-uuid-strategy.md
 */

import {
	ClientToServerEventSchema,
	ServerToClientEventSchema,
	type ClientToServerEvent,
	type ServerToClientEvent,
	type SalaState,
	type Vote,
} from "@planning-poker/shared";
import type { Hub } from "./hub";
import { handleCastVote } from "./handlers/cast-vote";
import { handleHello } from "./handlers/hello";
import { handleRevealVotes } from "./handlers/reveal-votes";
import { handleStartNewRound } from "./handlers/start-new-round";
import { Logger } from "./ws-logger";
import { RateLimiter } from "./ws-rate-limit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Contexto de cada WebSocket (Bun ServerWebSocket). Server-internal.
 * NÃO vai no wire format.
 */
export type WSContext = {
	playerId: string | null;
	code: string | null;
	ip: string;
	lastPongAt: number;
};

/**
 * Tipo de WebSocket aceito por Bun.serve(). Mantemos duck-typed porque
 * `import { ServerWebSocket } from "bun"` muda entre versões.
 */
export type BunWS = {
	send(message: string | ArrayBuffer | Uint8Array): void;
	close(code?: number, reason?: string): void;
	data: WSContext;
	remoteAddress: string;
	subscribe(topic: string): void;
	unsubscribe(topic: string): void;
};

const HEARTBEAT_TIMEOUT_MS = 60_000;

/**
 * Service entry — processa uma mensagem recebida do cliente.
 * Chama o handler apropriado e envia resposta.
 */
export class WSService {
	private readonly hub: Hub;
	private readonly logger: Logger;
	private readonly rateLimiter: RateLimiter;
	private readonly connections: Set<BunWS> = new Set();
	private readonly byIP: Map<BunWS, string> = new Map();

	constructor(
		hub: Hub,
		logger: Logger = new Logger(),
		rateLimiter: RateLimiter = new RateLimiter(5),
	) {
		this.hub = hub;
		this.logger = logger;
		this.rateLimiter = rateLimiter;
	}

	// -----------------------------------------------------------------------
	// Lifecycle
	// -----------------------------------------------------------------------

	/**
	 * Chamado em cada upgrade WS bem-sucedido. Inicializa context.
	 * Aplica rate limit — se rejeitado, fecha conexão.
	 */
	onOpen(ws: BunWS): void {
		const ip = ws.remoteAddress || "unknown";
		this.byIP.set(ws, ip);
		const allowed = this.rateLimiter.check(ip);
		if (!allowed) {
			this.logger.ratelimit(ip, true);
			this.sendError(ws, "rate_limited", "Muitas conexões. Tente em 1s.");
			ws.close(1013, "rate_limited");
			return;
		}
		this.logger.ratelimit(ip, false);
		ws.data = {
			playerId: null,
			code: null,
			ip,
			lastPongAt: Date.now(),
		};
		this.connections.add(ws);
		this.logger.connect(ip);
	}

	/**
	 * Mensagem recebida do cliente. Valida com Zod, dispatch handler, broadcast.
	 */
	onMessage(ws: BunWS, raw: string | Buffer): void {
		const text = typeof raw === "string" ? raw : raw.toString("utf-8");
		let parsed: ClientToServerEvent;
		try {
			const json = JSON.parse(text);
			parsed = ClientToServerEventSchema.parse(json);
		} catch (e) {
			// Tenta distinguir entre erro de JSON e erro de schema Zod.
			const msg = e instanceof Error ? e.message : String(e);
			this.logger.error("invalid_payload", msg, ws.data.playerId ?? undefined);
			// Se for problema de nick, propaga como invalid_nick (F-001, F-002).
			const code = /nick|apelido/i.test(msg)
				? "invalid_nick"
				: "internal_error";
			this.sendEvent(ws, { type: "error", payload: { code, message: msg } });
			return;
		}

		this.logger.event(
			"c2s",
			parsed.type,
			ws.data.playerId ?? undefined,
			ws.data.code ?? undefined,
		);

		this.dispatch(ws, parsed);
	}

	/**
	 * Conexão fechada. Se player estava em sala, marca disconnected
	 * (grace period 60s antes de remover).
	 */
	onClose(ws: BunWS, code: number, reason: string): void {
		const ctx = ws.data;
		this.connections.delete(ws);
		this.byIP.delete(ws);

		if (ctx.playerId) {
			this.logger.disconnect(
				ctx.playerId,
				ctx.code ?? undefined,
				`code=${code} reason=${reason}`,
			);
			this.hub.markDisconnected(ctx.playerId);
		}
	}

	/**
	 * Heartbeat tick. Roda a cada 1s. Verifica timeout e decrementa timers.
	 */
	tick(now: number = Date.now()): void {
		// 1. Heartbeat timeout per-connection
		for (const ws of this.connections) {
			if (now - ws.data.lastPongAt > HEARTBEAT_TIMEOUT_MS) {
				this.logger.error(
					"heartbeat_timeout",
					`Player ${ws.data.playerId} não respondeu ping em ${HEARTBEAT_TIMEOUT_MS}ms`,
					ws.data.playerId ?? undefined,
					ws.data.code ?? undefined,
				);
				ws.close(1011, "heartbeat_timeout");
			}
		}
		// 2. Sala timers (auto-reveal)
		const fired = this.hub.tickAllTimers();
		for (const { code, sala } of fired) {
			const salaState = sala.toState();
			const votesValues = Array.from(sala.votes.values());
			this.broadcast(code, {
				type: "votes_revealed",
				payload: {
					votes: Object.fromEntries(sala.votes),
					median: null,
					mean: null,
					range: null,
					unanimous:
						votesValues.length > 0 &&
						votesValues.every((v) => v === votesValues[0]),
				},
			});
			const event: ServerToClientEvent = salaState.critical
				? {
						type: "room_state",
						payload: { sala: stripCritical(salaState), critical: true },
					}
				: { type: "room_state", payload: { sala: stripCritical(salaState) } };
			this.broadcast(code, event);
		}
		// 3. Grace period cleanup (T18)
		const removed = this.hub.tickGracePeriod(now);
		for (const { code, playerId } of removed) {
			this.broadcast(code, {
				type: "player_left",
				payload: { playerId },
			});
			// Sala pode ter sumido; check
			const sala = this.hub.getSala(code);
			if (sala) {
				const salaState = sala.toState();
				const event: ServerToClientEvent = salaState.critical
					? {
							type: "room_state",
							payload: { sala: stripCritical(salaState), critical: true },
						}
					: { type: "room_state", payload: { sala: stripCritical(salaState) } };
				this.broadcast(code, event);
			} else {
				// Sala vazia → fim
				this.broadcast(code, {
					type: "sala_ended",
					payload: { reason: "last_left" },
				});
			}
		}
	}

	/**
	 * Broadcast gracioso antes do shutdown (T18 SIGTERM).
	 */
	gracefulShutdown(): void {
		const codes = this.hub.activeCodes();
		this.logger.shutdown(codes.length);
		for (const code of codes) {
			this.broadcast(code, {
				type: "sala_ended",
				payload: { reason: "server_restart" },
			});
		}
		this.hub.shutdown();
		for (const ws of this.connections) ws.close(1012, "server_restart");
		this.connections.clear();
	}

	// -----------------------------------------------------------------------
	// Dispatch
	// -----------------------------------------------------------------------

	private dispatch(ws: BunWS, event: ClientToServerEvent): void {
		switch (event.type) {
			case "hello":
				return this.handleHelloEvent(ws, event.payload);
			case "cast_vote":
				return this.handleCastVoteEvent(ws, event.payload.value);
			case "reveal_votes":
				return this.handleRevealVotesEvent(ws);
			case "start_new_round":
				return this.handleStartNewRoundEvent(ws);
			case "leave_room":
				return this.handleLeaveRoomEvent(ws);
			case "ping":
				return this.handlePingEvent(ws);
		}
	}

	// -----------------------------------------------------------------------
	// Handlers (delegam para ./handlers/* e broadcastam resultado)
	// -----------------------------------------------------------------------

	private handleHelloEvent(
		ws: BunWS,
		payload: { uuid: string; nick: string; code?: string },
	): void {
		const outcome = handleHello(this.hub, payload);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		ws.data.playerId = outcome.playerId;
		ws.data.code = outcome.sala.code;
		this.sendEvent(ws, {
			type: "welcome",
			payload: {
				playerId: outcome.playerId,
				role: outcome.role,
				sala: stripCritical(outcome.sala),
			},
		});
		this.broadcastRoomState(outcome.sala.code, ws);
	}

	private handleCastVoteEvent(ws: BunWS, value: Vote | null): void {
		const playerId = ws.data.playerId;
		if (!playerId) {
			this.sendError(
				ws,
				"invalid_phase",
				"Sala desconhecida. Envie hello primeiro.",
			);
			return;
		}
		const outcome = handleCastVote(this.hub, playerId, { value });
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
		const sala = this.hub.getSala(code);
		if (!sala) return;
		// Vote cast event: individual se primeiro da rodada, aggregate se seguinte
		const isFirst = outcome.isFirstVoteOfRound;
		if (isFirst) {
			const player = sala.getPlayer(playerId);
			this.broadcast(code, {
				type: "vote_cast",
				payload: {
					kind: "individual",
					playerId,
					playerName: player?.nick ?? "",
				},
			});
		} else {
			// aggregate: count voters since last broadcast
			const totalVoted = Array.from(sala.players.values()).filter(
				(p) => p.hasVoted,
			).length;
			this.broadcast(code, {
				type: "vote_cast",
				payload: { kind: "aggregate", count: totalVoted },
			});
		}
		// O sender TAMBÉM precisa do room_state — o vote_cast não carrega
		// o value (privacidade pré-reveal), então o cliente que votou só
		// sabe do seu próprio voto via room_state. Sem `except` aqui
		// intencionalmente.
		this.broadcastRoomState(code);
	}

	private handleRevealVotesEvent(ws: BunWS): void {
		const playerId = ws.data.playerId;
		if (!playerId) {
			this.sendError(ws, "invalid_phase", "Sala desconhecida.");
			return;
		}
		const outcome = handleRevealVotes(this.hub, playerId);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
		const sala = this.hub.getSala(code);
		if (!sala) return;
		this.broadcast(code, {
			type: "votes_revealed",
			payload: {
				votes: outcome.votes,
				median: outcome.median,
				mean: outcome.mean,
				range: outcome.range,
				unanimous: outcome.unanimous,
			},
		});
		this.broadcastRoomState(code, ws);
	}

	private handleStartNewRoundEvent(ws: BunWS): void {
		const playerId = ws.data.playerId;
		if (!playerId) {
			this.sendError(ws, "invalid_phase", "Sala desconhecida.");
			return;
		}
		const outcome = handleStartNewRound(this.hub, playerId);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
		this.broadcast(code, {
			type: "round_started",
			payload: { round: outcome.round },
		});
		this.broadcastRoomState(code, ws);
	}

	private handleLeaveRoomEvent(ws: BunWS): void {
		const playerId = ws.data.playerId;
		if (!playerId) return;
		const removed = this.hub.removePlayer(playerId);
		ws.data.playerId = null;
		ws.data.code = null;
		if (removed.code) {
			this.broadcast(removed.code, {
				type: "player_left",
				payload: { playerId },
			});
			const sala = this.hub.getSala(removed.code);
			if (sala) {
				this.broadcastRoomState(removed.code, ws);
			} else {
				this.broadcast(removed.code, {
					type: "sala_ended",
					payload: { reason: "last_left" },
				});
			}
		}
	}

	private handlePingEvent(ws: BunWS): void {
		ws.data.lastPongAt = Date.now();
		this.sendEvent(ws, { type: "pong", payload: {} });
	}

	// -----------------------------------------------------------------------
	// Broadcast helpers
	// -----------------------------------------------------------------------

	/**
	 * Envia event pra todas as conexões dessa sala EXCETO `except`.
	 * Em v1, todos da sala recebem; filtros `except` por ws específico.
	 */
	private broadcast(
		code: string,
		event: ServerToClientEvent,
		except?: BunWS,
	): void {
		this.logger.event("s2c", event.type, undefined, code);
		for (const ws of this.connections) {
			if (ws.data.code !== code) continue;
			if (except && ws === except) continue;
			this.sendEvent(ws, event);
		}
	}

	private broadcastRoomState(code: string, except?: BunWS): void {
		const sala = this.hub.getSala(code);
		if (!sala) return;
		const state = sala.toState();
		const salaPayload = stripCritical(state);
		const event: ServerToClientEvent = state.critical
			? { type: "room_state", payload: { sala: salaPayload, critical: true } }
			: { type: "room_state", payload: { sala: salaPayload } };
		this.broadcast(code, event, except);
	}

	private sendEvent(ws: BunWS, event: ServerToClientEvent): void {
		const validated = ServerToClientEventSchema.parse(event);
		ws.send(JSON.stringify(validated));
	}

	private sendError(ws: BunWS, code: string, message: string): void {
		this.logger.error(code, message, ws.data.playerId ?? undefined);
		const errorEvent: ServerToClientEvent = {
			type: "error",
			payload: { code: code as never, message },
		};
		this.sendEvent(ws, errorEvent);
	}

	/** API para testes: total de conexões. */
	get connectionCount(): number {
		return this.connections.size;
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip campo `critical` antes de enviar como SalaState puro.
 * (events em SalaState enviam critical separado via RoomStateResponse.)
 */
function stripCritical(state: SalaState & { critical: boolean }): SalaState {
	const { critical: _critical, ...rest } = state;
	void _critical;
	return rest;
}
