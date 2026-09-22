/**
 * WebSocket handler — Phase 3 / T17
 *
 * Bun.serve() com upgrade em /ws. Dispatch de eventos por `event.type`
 * para os handlers T13/T14/T15/T16. Heartbeat de protocolo: o SERVIDOR
 * pinga (`ws.ping()`) a cada 25s e o browser responde `pong` sozinho na
 * stack de rede — sem JS na aba, logo imune a throttle de aba oculta.
 * Timeout 90s pega só morte real; o cliente retenta por 5min.
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
	type HistoriaAddPayload,
	type HistoriaMovePayload,
	type HistoriaRemovePayload,
	type HistoriaSelectPayload,
	type HistoriaUpdatePayload,
	type SendNudgePayload,
	type ServerToClientEvent,
	type SalaState,
	type ThrowProjectilePayload,
	type UpdateAvatarPayload,
	type Vote,
} from "@planning-poker/shared";
import type { Hub } from "./hub";
import type { Sala } from "./sala";
import { handleCastVote } from "./handlers/cast-vote";
import { handleHello } from "./handlers/hello";
import { handleHistoriaAdd } from "./handlers/historia-add";
import { handleHistoriaMove } from "./handlers/historia-move";
import { handleHistoriaRemove } from "./handlers/historia-remove";
import { handleHistoriaSelect } from "./handlers/historia-select";
import { handleHistoriaUpdate } from "./handlers/historia-update";
import { handleRevealVotes } from "./handlers/reveal-votes";
import { handleSendNudge } from "./handlers/send-nudge";
import { handleStartNewRound } from "./handlers/start-new-round";
import { handleThrowProjectile } from "./handlers/throw-projectile";
import { handleUpdateAvatar } from "./handlers/update-avatar";
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
	lastPingAt: number;
};

/**
 * Tipo de WebSocket aceito por Bun.serve(). Mantemos duck-typed porque
 * `import { ServerWebSocket } from "bun"` muda entre versões.
 */
export type BunWS = {
	send(message: string | ArrayBuffer | Uint8Array): void;
	close(code?: number, reason?: string): void;
	ping(data?: string | ArrayBuffer | Uint8Array): void;
	data: WSContext;
	remoteAddress: string;
	subscribe(topic: string): void;
	unsubscribe(topic: string): void;
};

/** Ping de protocolo a cada 25s (mantém vivo + atravessa NAT/proxy idle). */
const HEARTBEAT_PING_INTERVAL_MS = 25_000;
/** Sem `pong` por 90s = morte real (browser responde sozinho, sem JS). */
const HEARTBEAT_TIMEOUT_MS = 90_000;

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
		const now = Date.now();
		ws.data = {
			playerId: null,
			code: null,
			ip,
			lastPongAt: now,
			lastPingAt: now,
		};
		this.connections.add(ws);
		this.logger.connect(ip);
	}

	/**
	 * `pong` de protocolo (resposta ao `ws.ping()` do tick). O browser
	 * responde sozinho, sem JS — por isso aba oculta não derruba.
	 */
	onPong(ws: BunWS): void {
		if (!this.connections.has(ws)) return;
		ws.data.lastPongAt = Date.now();
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
	 * (grace period de 6min antes de remover).
	 */
	onClose(ws: BunWS, code: number, reason: string): void {
		const ctx = ws.data;
		this.connections.delete(ws);
		this.byIP.delete(ws);

		if (ctx?.playerId) {
			this.logger.disconnect(
				ctx.playerId,
				ctx.code ?? undefined,
				`code=${code} reason=${reason}`,
			);
			this.hub.markDisconnected(ctx.playerId);
		}
	}

	/**
	 * Heartbeat tick. Roda a cada 1s no servidor. Pinga cada conexão com
	 * `hello` feito a cada 25s (frame de protocolo — o browser responde
	 * sem JS) e fecha quem não responde `pong` há 90s (morte real).
	 */
	tick(now: number = Date.now()): void {
		// 1. Ping de protocolo + timeout per-connection
		for (const ws of this.connections) {
			if (now - ws.data.lastPongAt > HEARTBEAT_TIMEOUT_MS) {
				this.logger.error(
					"heartbeat_timeout",
					`Player ${ws.data.playerId} não respondeu ping em ${HEARTBEAT_TIMEOUT_MS}ms`,
					ws.data.playerId ?? undefined,
					ws.data.code ?? undefined,
				);
				ws.close(1011, "heartbeat_timeout");
				continue;
			}
			// Só pinga após o hello (playerId setado) — pré-hello o
			// helloTimeout do handshake já cobre conexão pendurada.
			if (
				ws.data.playerId &&
				now - ws.data.lastPingAt > HEARTBEAT_PING_INTERVAL_MS
			) {
				ws.data.lastPingAt = now;
				try {
					ws.ping();
				} catch {
					// Socket já morto — o timeout fecha em seguida.
				}
			}
		}
		// 2. Grace period cleanup (T18)
		const removed = this.hub.tickGracePeriod(now);
		for (const { code, playerId } of removed) {
			this.broadcastMembershipChange(code, playerId);
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
			case "throw_projectile":
				return this.handleThrowProjectileEvent(ws, event.payload);
			case "send_nudge":
				return this.handleSendNudgeEvent(ws, event.payload);
			case "update_avatar":
				return this.handleUpdateAvatarEvent(ws, event.payload);
			case "historia_add":
				return this.handleHistoriaAddEvent(ws, event.payload);
			case "historia_update":
				return this.handleHistoriaUpdateEvent(ws, event.payload);
			case "historia_move":
				return this.handleHistoriaMoveEvent(ws, event.payload);
			case "historia_remove":
				return this.handleHistoriaRemoveEvent(ws, event.payload);
			case "historia_select":
				return this.handleHistoriaSelectEvent(ws, event.payload);
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
				sala: outcome.sala,
			},
		});
		this.broadcastRoomState(outcome.sala.code, ws);
	}

	private handleCastVoteEvent(ws: BunWS, value: Vote | null): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
		const outcome = handleCastVote(this.hub, playerId, { value });
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}

		// EVR-03 / EVR-14: no-op short-circuit. Mesma carta clicada duas
		// vezes (em qualquer fase, inclusive pós-reveal) = zero packets,
		// zero broadcasts. O cliente já fez early-return em
		// `handleCardSelect` (T8), mas server-side é source-of-truth
		// para clientes que violem F-011 (ex: 2 janelas, double-click).
		if (!outcome.changed) {
			return;
		}

		const code = ws.data.code!;
		const sala = this.hub.getSala(code);
		if (!sala) return;

		if (sala.phase === "revealed") {
			this.broadcastConsensus(code, sala);
		} else {
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
		}
		// O sender TAMBÉM precisa do room_state — o vote_cast não carrega
		// o value (privacidade pré-reveal), então o cliente que votou só
		// sabe do seu próprio voto via room_state. Sem `except` aqui
		// intencionalmente.
		this.broadcastRoomState(code);
	}

	private handleRevealVotesEvent(ws: BunWS): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
		const outcome = handleRevealVotes(this.hub, playerId);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
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
		// O autor também consome room_state para atualizar fase e resultados.
		this.broadcastRoomState(code);
	}

	private handleStartNewRoundEvent(ws: BunWS): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
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
		this.broadcastRoomState(code);
	}

	private handleLeaveRoomEvent(ws: BunWS): void {
		const playerId = ws.data.playerId;
		if (!playerId) return;
		const removed = this.hub.removePlayer(playerId);
		ws.data.playerId = null;
		ws.data.code = null;
		if (removed.code) {
			// O leaver não recebe o room_state (já saiu) — `except: ws`.
			this.broadcastMembershipChange(removed.code, playerId, ws);
		}
	}

	/**
	 * `ping` app-level (compat — o cliente novo não envia mais; o
	 * heartbeat é o frame de protocolo via `tick` + `onPong`).
	 */
	private handlePingEvent(ws: BunWS): void {
		ws.data.lastPongAt = Date.now();
		this.sendEvent(ws, { type: "pong", payload: {} });
	}

	private handleThrowProjectileEvent(
		ws: BunWS,
		payload: ThrowProjectilePayload,
	): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
		const outcome = handleThrowProjectile(this.hub, playerId, payload);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
		this.broadcast(code, {
			type: "projectile_thrown",
			payload: {
				senderPlayerId: playerId,
				targetPlayerId: payload.targetPlayerId,
				projectileType: payload.projectileType,
				outcome: outcome.outcome,
			},
		});
	}

	/**
	 * `send_nudge` (issue #172): broadcast efêmero `nudge_sent`, sem
	 * `room_state` e sem persistência — quem não estava conectado não vê.
	 */
	private handleSendNudgeEvent(ws: BunWS, payload: SendNudgePayload): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
		const outcome = handleSendNudge(this.hub, playerId, payload);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
		this.broadcast(code, {
			type: "nudge_sent",
			payload: {
				senderPlayerId: playerId,
				targetPlayerId: payload.targetPlayerId,
				nudgeId: payload.nudgeId,
			},
		});
	}

	private handleUpdateAvatarEvent(
		ws: BunWS,
		payload: UpdateAvatarPayload,
	): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
		const outcome = handleUpdateAvatar(this.hub, playerId, payload);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		// Campo ignorado (teto/formato): ok sem mudança, sem broadcast.
		if (!outcome.changed) return;
		const code = ws.data.code!;
		this.broadcastRoomState(code);
	}

	// -----------------------------------------------------------------------
	// Pauta — handlers finos #163 (tradução + dispatch + broadcast room_state)
	// -----------------------------------------------------------------------

	/**
	 * `historia_add` (#163): válido → broadcast `room_state` completo
	 * (pauta + historiaAtualId) pra toda a sala. Erro → `error` só pro
	 * sender, sem broadcast, socket segue aberto.
	 */
	private handleHistoriaAddEvent(ws: BunWS, payload: HistoriaAddPayload): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
		const outcome = handleHistoriaAdd(this.hub, playerId, payload);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
		this.broadcastRoomState(code);
	}

	/** `historia_update` (#163): mesmo padrão — erro sem broadcast. */
	private handleHistoriaUpdateEvent(
		ws: BunWS,
		payload: HistoriaUpdatePayload,
	): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
		const outcome = handleHistoriaUpdate(this.hub, playerId, payload);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
		this.broadcastRoomState(code);
	}

	/** `historia_move` (#163): mesmo padrão — erro sem broadcast. */
	private handleHistoriaMoveEvent(
		ws: BunWS,
		payload: HistoriaMovePayload,
	): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
		const outcome = handleHistoriaMove(this.hub, playerId, payload);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
		this.broadcastRoomState(code);
	}

	/** `historia_remove` (#163): mesmo padrão — erro sem broadcast. */
	private handleHistoriaRemoveEvent(
		ws: BunWS,
		payload: HistoriaRemovePayload,
	): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
		const outcome = handleHistoriaRemove(this.hub, playerId, payload);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
		this.broadcastRoomState(code);
	}

	/** `historia_select` (#163): mesmo padrão — erro sem broadcast. */
	private handleHistoriaSelectEvent(
		ws: BunWS,
		payload: HistoriaSelectPayload,
	): void {
		const playerId = this.requireWsPlayer(ws);
		if (!playerId) return;
		const outcome = handleHistoriaSelect(this.hub, playerId, payload);
		if (!outcome.ok) {
			this.sendError(ws, outcome.code, outcome.message);
			return;
		}
		const code = ws.data.code!;
		this.broadcastRoomState(code);
	}

	// -----------------------------------------------------------------------
	// Broadcast helpers
	// -----------------------------------------------------------------------

	/**
	 * Guard de autenticação do socket — SSOT (antes 4x `if (!playerId)`
	 * com mensagens levemente diferentes). Envia erro e retorna null.
	 */
	private requireWsPlayer(ws: BunWS): string | null {
		const playerId = ws.data.playerId;
		if (!playerId) {
			this.sendError(
				ws,
				"invalid_phase",
				"Sala desconhecida. Envie hello primeiro.",
			);
			return null;
		}
		return playerId;
	}

	/**
	 * Broadcast `votes_revealed` a partir do consenso da sala (SSOT —
	 * antes payload de 5 campos montado inline 3x com
	 * `computeConsensus/isUnanimous` duplicados).
	 */
	private broadcastConsensus(code: string, sala: Sala): void {
		this.broadcast(code, {
			type: "votes_revealed",
			payload: sala.getConsensusEvent(),
		});
	}

	/**
	 * Trio `player_left` → `room_state`/`sala_ended` (SSOT — antes copiado
	 * no grace cleanup e no leave voluntário).
	 */
	private broadcastMembershipChange(
		code: string,
		playerId: string,
		except?: BunWS,
	): void {
		this.broadcast(code, {
			type: "player_left",
			payload: { playerId },
		});
		// Sala pode ter sumido; check
		if (this.hub.getSala(code)) {
			this.broadcastRoomState(code, except);
		} else {
			// Sala vazia → fim
			this.broadcast(code, {
				type: "sala_ended",
				payload: { reason: "last_left" },
			});
		}
	}

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
		// EVR-04/EVR-05: consome a flag atomicamente. Comportamentalmente
		// ainda broadcastamos sempre (handler já envia síncrono em
		// handleCastVoteEvent); flag serve para rastreabilidade/
		// observabilidade e prepara terreno para um futuro throttle de
		// coalescing em votações rápidas. Loga em debug quando dirty=true.
		if (sala.consumeConsensusDirty()) {
			this.logger.log({
				type: "ws.event",
				direction: "s2c",
				event: "room_state_dirty",
				salaCode: code,
			}, "debug");
		}
		const state = sala.toState();
		this.broadcast(code, toRoomStateEvent(state), except);
	}

	private sendEvent(ws: BunWS, event: ServerToClientEvent): void {
		const validated = ServerToClientEventSchema.parse(event);
		ws.send(JSON.stringify(validated));
	}

	private sendError(ws: BunWS, code: string, message: string): void {
		this.logger.error(code, message, ws.data?.playerId ?? undefined);
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
 * Envelope `room_state` (SSOT).
 */
function toRoomStateEvent(state: SalaState): ServerToClientEvent {
	return { type: "room_state", payload: { sala: state } };
}
