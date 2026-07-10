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
	computeConsensus,
	isUnanimous,
} from "@planning-poker/shared";
import type { Hub } from "./hub";
import { handleCastVote } from "./handlers/cast-vote";
import { handleHello } from "./handlers/hello";
import { handleRevealVotes } from "./handlers/reveal-votes";
import { handleStartNewRound } from "./handlers/start-new-round";
import { handleThrowProjectile } from "./handlers/throw-projectile";
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
const RECONCILE_INTERVAL_MS = 10_000;

/**
 * Janela (ms) em que o broadcast de disconnect é ADIADO após `onClose`
 * para suprimir o flicker visual em reconexões rápidas. Se o cliente
 * reconectar (handleHello → markConnected) dentro dessa janela, o
 * broadcast agendado é CANCELADO e o peer nunca vê a transição
 * `connected → disconnected → connected` que era a causa raiz do
 * issue #59.
 *
 * Trade-off consciente: peer vê o peer offline ~1.5s mais tarde do que
 * com broadcast imediato (PR #58). Em Planning Poker com 3-12 pessoas,
 * tolerável — flicker visível era pior que 1.5s de "delay ghost". O
 * `tickGracePeriod` (60s) continua removendo players de verdade.
 *
 * Sem isso: cada reconnect (~50ms-1s) dispara 2 room_state broadcasts
 * que o peer renderiza com CSS transition 200ms → "pisca-pisca".
 *
 * @see docs/adr/0009-reconnect-uuid-strategy.md
 * @see https://github.com/Heldinhow/pointly/issues/59
 */
const DISCONNECT_BROADCAST_DEBOUNCE_MS = 1_500;

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
	/**
	 * Per-room timestamp (epoch ms) da última broadcastRoomState durante voting.
	 * Usado para cadência de reconciliação (10s por sala) — T01.
	 */
	private readonly lastBroadcastAt: Map<string, number> = new Map();
	/**
	 * Agendamentos pendentes de broadcast `disconnected` por playerId.
	 * Chave = playerId. Valor = { code, handle }. Cancelado quando o
	 * cliente reconecta dentro da janela (issue #59 — flicker fix).
	 */
	private readonly pendingDisconnectBroadcasts: Map<
		string,
		{ code: string; handle: ReturnType<typeof setTimeout> }
	> = new Map();
	/**
	 * Timer helpers injetáveis (default: setTimeout/clearTimeout globais).
	 * Override somente em testes com fake timers (não usado em prod).
	 */
	private readonly setTimeoutFn: typeof setTimeout;
	private readonly clearTimeoutFn: typeof clearTimeout;

	constructor(
		hub: Hub,
		logger: Logger = new Logger(),
		rateLimiter: RateLimiter = new RateLimiter(5),
		setTimeoutFn: typeof setTimeout = setTimeout,
		clearTimeoutFn: typeof clearTimeout = clearTimeout,
	) {
		this.hub = hub;
		this.logger = logger;
		this.rateLimiter = rateLimiter;
		this.setTimeoutFn = setTimeoutFn;
		this.clearTimeoutFn = clearTimeoutFn;
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
	 * (grace period 60s antes de remover) e AGENDA broadcast de room_state
	 * para daqui a `DISCONNECT_BROADCAST_DEBOUNCE_MS` ms.
	 *
	 * **Issue #59 (flicker multi-cliente)**: broadcast IMEDIATO causava
	 * flicker visível em reconexões rápidas — o peer renderizava
	 * `connected → disconnected (200ms CSS transition) → connected` em
	 * <1s. Agora o broadcast é ADIADO por 1.5s; se o cliente reconectar
	 * antes (handleHello → reconnect → markConnected), o agendamento é
	 * cancelado via `cancelScheduledDisconnectBroadcast`. Peer nunca vê
	 * a transição espúria.
	 *
	 * **Regressão prod (2026-07-10)**: na versão anterior a PR #58,
	 * `markDisconnected` rodava mas NENHUM broadcast acontecia — peers
	 * continuavam vendo o player como `status='connected'` até o próximo
	 * vote/tick/tickGracePeriod (até 60s). PR #58 introduziu broadcast
	 * imediato. Esta versão adiciona debounce para evitar flicker.
	 *
	 * **Trade-off**: peer vê peer offline ~1.5s mais tarde em desconexão
	 * permanente; flicker eliminado em reconexão rápida. Em Planning
	 * Poker com 3-12 pessoas, aceitable.
	 *
	 * @see https://github.com/Heldinhow/pointly/issues/59
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
			const code_sala = ctx.code;
			this.hub.markDisconnected(ctx.playerId);
			// Em vez de broadcast imediato, agenda para daqui 1.5s.
			// Se o cliente reconectar antes, `handleHelloEvent` cancela
			// via `cancelScheduledDisconnectBroadcast`.
			if (code_sala) this.scheduleDisconnectBroadcast(code_sala, ctx.playerId);
		}
	}

	/**
	 * Agenda broadcast room_state após `DISCONNECT_BROADCAST_DEBOUNCE_MS`
	 * para que peers vejam o peer como `disconnected`. Cancelável por
	 * `cancelScheduledDisconnectBroadcast` se houver reconnect dentro da janela.
	 */
	private scheduleDisconnectBroadcast(code: string, playerId: string): void {
		// Se já existe agendamento para esse playerId, cancela antes.
		this.cancelScheduledDisconnectBroadcast(playerId);
		const handle = this.setTimeoutFn(() => {
			this.pendingDisconnectBroadcasts.delete(playerId);
			this.broadcastRoomState(code);
		}, DISCONNECT_BROADCAST_DEBOUNCE_MS);
		this.pendingDisconnectBroadcasts.set(playerId, { code, handle });
	}

	/**
	 * Cancela um broadcast de disconnect pendente se existir.
	 * Chamado em `handleHelloEvent` quando o cliente reconecta dentro
	 * da janela de debounce (issue #59 — flicker fix).
	 */
	private cancelScheduledDisconnectBroadcast(playerId: string): void {
		const pending = this.pendingDisconnectBroadcasts.get(playerId);
		if (pending) {
			this.clearTimeoutFn(pending.handle);
			this.pendingDisconnectBroadcasts.delete(playerId);
		}
	}

	/**
	 * Test-only: retorna `true` se existe broadcast de disconnect agendado
	 * para esse playerId. Não usado em produção.
	 */
	hasPendingDisconnectBroadcast(playerId: string): boolean {
		return this.pendingDisconnectBroadcasts.has(playerId);
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
		// 2. Sala timers (auto-reveal + reconciliation cadence)
		const results = this.hub.tickAllTimers(now);
		for (const { code, tick, sala } of results) {
			if (tick === "fired") {
				const salaState = sala.toState();
				const votesValues = Array.from(sala.votes.values());
				const stats = computeConsensus(votesValues);
				const unanimous = isUnanimous(votesValues);
				this.broadcast(code, {
					type: "votes_revealed",
					payload: {
						votes: Object.fromEntries(sala.votes),
						median: stats.median,
						mean: stats.mean,
						range: stats.range,
						unanimous,
					},
				});
				const event: ServerToClientEvent = salaState.critical
					? {
							type: "room_state",
							payload: { sala: stripCritical(salaState), critical: true },
						}
					: { type: "room_state", payload: { sala: stripCritical(salaState) } };
				this.broadcast(code, event);
				this.lastBroadcastAt.set(code, now);
			} else if (tick === "ticking") {
				const last = this.lastBroadcastAt.get(code) ?? 0;
				if (now - last >= RECONCILE_INTERVAL_MS) {
					this.broadcastRoomState(code);
					this.lastBroadcastAt.set(code, now);
				}
			}
			// tick === 'idle' → sem broadcast
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
			case "throw_projectile":
				return this.handleThrowProjectileEvent(ws, event.payload);
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
		// Issue #59 (flicker fix): se o cliente reconectou dentro da janela
		// `DISCONNECT_BROADCAST_DEBOUNCE_MS`, cancela o broadcast pendente
		// de disconnect para que peers NÃO vejam a transição espúria.
		// Aplica-se a:
		// - reconnect (mesmo uuid, mesmo code): reconnected=true
		// - reconnect que disparou room migration: reconnected=false MAS
		//   mesmo playerId está sendo reusado (handleHello retornou mesmo id).
		// Regra geral: se outcome.playerId já tinha um disconnect agendado,
		// cancelamos. Simples e cobre todos os casos de reconexão.
		this.cancelScheduledDisconnectBroadcast(outcome.playerId);

		// Room migration (reg 2026-07-06): se o handler fez evict de outra
		// sala, broadcast player_left + room_state (ou sala_ended) na sala
		// antiga — espelha o que `handleLeaveRoomEvent` faz.
		if (outcome.evictedFrom) {
			const oldCode = outcome.evictedFrom.code;
			const oldPlayerId = outcome.evictedFrom.playerId;
			this.broadcast(oldCode, {
				type: "player_left",
				payload: { playerId: oldPlayerId },
			});
			const oldSala = this.hub.getSala(oldCode);
			if (oldSala) {
				this.broadcastRoomState(oldCode);
			} else {
				this.broadcast(oldCode, {
					type: "sala_ended",
					payload: { reason: "last_left" },
				});
			}
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

		if (sala.phase === "revealed") {
			const voteList = Array.from(sala.votes.values());
			const stats = computeConsensus(voteList);
			const unanimous = isUnanimous(voteList);
			this.broadcast(code, {
				type: "votes_revealed",
				payload: {
					votes: Object.fromEntries(sala.votes),
					median: stats.median,
					mean: stats.mean,
					range: stats.range,
					unanimous,
				},
			});
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

	private handleThrowProjectileEvent(
		ws: BunWS,
		payload: import("@planning-poker/shared").ThrowProjectilePayload,
	): void {
		const playerId = ws.data.playerId;
		if (!playerId) {
			this.sendError(ws, "invalid_phase", "Sala desconhecida.");
			return;
		}
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
