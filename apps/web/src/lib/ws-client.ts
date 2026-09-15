import { JoinError } from "./errors";
import {
	buildCastVoteMessage,
	buildLeaveRoomMessage,
	buildRevealVotesMessage,
	buildStartNewRoundMessage,
	buildThrowProjectileMessage,
	isDeckValue,
	isProjectileType,
	parseServerEvent,
	type HelloPayload,
	type ProjectileThrownPayload,
	type ProjectileType,
	type SalaState,
	type Vote,
	type WelcomePayload,
} from "./protocol";

export type SocketStatus = "idle" | "connecting" | "ready" | "closed";

export interface PointlySocketEvents {
	onRoomState?: (sala: SalaState, critical: boolean) => void;
	onProjectileThrown?: (event: ProjectileThrownPayload) => void;
	onClose?: () => void;
	onError?: (code: string, message: string) => void;
}

interface PointlySocketOptions {
	helloTimeoutMs?: number;
	pingIntervalMs?: number;
	pongTimeoutMs?: number;
}

/**
 * Cliente WebSocket mínimo do ticket 03: conecta, envia hello, resolve com o
 * welcome (ou rejeita com o erro do servidor) e mantém heartbeat ping/pong.
 * Fechamento pós-ready (incluindo pong expirado) notifica `onClose`.
 *
 * Ticket 04: handlers podem ser atualizados pós-connect via `setHandlers`,
 * para a Arena assinar `room_state` no socket criado pela entrada (handoff
 * via store) sem recriar a conexão.
 *
 * Ticket 09: `sendLeaveRoom` para saída voluntária (remove o Player e
 * broadcast para os demais); F5/recarregamento NÃO envia leave — a Arena
 * reconecta com o mesmo UUID e o servidor reidrata sem duplicar.
 */
export class PointlySocket {
	private socket: WebSocket | null = null;
	private status: SocketStatus = "idle";
	private helloSettled = false;
	private resolveHello: ((welcome: WelcomePayload) => void) | null = null;
	private rejectHello: ((error: JoinError) => void) | null = null;
	private helloTimer: ReturnType<typeof setTimeout> | null = null;
	private pingTimer: ReturnType<typeof setInterval> | null = null;
	private staleTimer: ReturnType<typeof setInterval> | null = null;
	private lastPongAt = 0;
	private events: PointlySocketEvents;
	private readonly helloTimeoutMs: number;
	private readonly pingIntervalMs: number;
	private readonly pongTimeoutMs: number;

	constructor(
		events: PointlySocketEvents = {},
		options: PointlySocketOptions = {},
	) {
		this.events = { ...events };
		this.helloTimeoutMs = options.helloTimeoutMs ?? 10_000;
		this.pingIntervalMs = options.pingIntervalMs ?? 5_000;
		this.pongTimeoutMs = options.pongTimeoutMs ?? 10_000;
	}

	getStatus(): SocketStatus {
		return this.status;
	}

	/**
	 * Atualiza os handlers sem tocar na conexão. Usado pela Arena para
	 * assinar `room_state` no socket vivo herdado da entrada.
	 */
	setHandlers(events: Partial<PointlySocketEvents>): void {
		this.events = { ...this.events, ...events };
	}

	/**
	 * Envio genérico — SSOT do guard `ready` + stringify + try/catch.
	 * Antes copiado 5x em cada `send*`.
	 */
	private send(message: unknown): boolean {
		if (this.status !== "ready" || !this.socket) return false;
		try {
			this.socket.send(JSON.stringify(message));
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Envia `cast_vote { value }`. Retorna false quando não há conexão
	 * pronta ou o valor é inválido — o chamador mantém o estado local.
	 * O servidor responde com `room_state` (o remetente recebe o estado
	 * completo; `vote_cast` não carrega valor por privacidade).
	 */
	sendCastVote(value: Vote): boolean {
		if (!isDeckValue(value)) return false;
		return this.send(buildCastVoteMessage(value));
	}

	/**
	 * Envia `reveal_votes {}`. Qualquer Player pode revelar (servidor
	 * democratizado, sem role check). Retorna false sem conexão pronta.
	 * O servidor responde com `votes_revealed` + `room_state` (phase
	 * `revealed`); auto-reveal no zero chega pelo mesmo caminho.
	 */
	sendRevealVotes(): boolean {
		return this.send(buildRevealVotesMessage());
	}

	/**
	 * Envia `start_new_round {}`. Qualquer Player pode abrir nova rodada
	 * (servidor democratizado, sem role check; exige phase `revealed`).
	 * Retorna false sem conexão pronta. O servidor responde com
	 * `round_started` + `room_state` (round incrementado, votos limpos,
	 * timer em 60s, mesmos Players).
	 */
	sendStartNewRound(): boolean {
		return this.send(buildStartNewRoundMessage());
	}

	/**
	 * Envia `leave_room {}`. Saída voluntária (botão "Sair da sala"):
	 * o servidor remove o Player e broadcast `player_left` + `room_state`
	 * para os demais em tempo real (promovendo novo Host quando o Host
	 * sai). Retorna false sem conexão pronta. F5 NÃO chama este método.
	 */
	sendLeaveRoom(): boolean {
		return this.send(buildLeaveRoomMessage());
	}

	/**
	 * Envia `throw_projectile { targetPlayerId, projectileType }` (issue #157).
	 * Em qualquer fase: o servidor valida o cooldown de 2s por sender,
	 * sorteia o desfecho (hit/dodge/deflect) e faz broadcast
	 * `projectile_thrown` para a Sala. Retorna false sem conexão pronta,
	 * alvo vazio ou tipo inválido — o chamador mantém o estado local e
	 * exibe feedback sem quebrar.
	 */
	sendThrowProjectile(
		targetPlayerId: string,
		projectileType: ProjectileType,
	): boolean {
		if (typeof targetPlayerId !== "string" || targetPlayerId.length === 0) {
			return false;
		}
		if (!isProjectileType(projectileType)) return false;
		return this.send(
			buildThrowProjectileMessage(targetPlayerId, projectileType),
		);
	}

	connect(url: string, hello: HelloPayload): Promise<WelcomePayload> {
		this.close({ silent: true });
		this.status = "connecting";
		this.helloSettled = false;

		return new Promise<WelcomePayload>((resolve, reject) => {
			this.resolveHello = resolve;
			this.rejectHello = reject;

			let socket: WebSocket;
			try {
				socket = new WebSocket(url);
			} catch {
				this.status = "closed";
				reject(new JoinError("connection_failed"));
				return;
			}
			this.socket = socket;

			this.helloTimer = setTimeout(() => {
				this.failHello(new JoinError("hello_timeout"));
			}, this.helloTimeoutMs);

			socket.onopen = () => {
				try {
					socket.send(JSON.stringify({ type: "hello", payload: hello }));
				} catch {
					this.failHello(new JoinError("connection_failed"));
				}
			};
			socket.onmessage = (event: MessageEvent) => {
				this.handleMessage(typeof event.data === "string" ? event.data : "");
			};
			socket.onerror = () => {
				if (!this.helloSettled) {
					this.failHello(new JoinError("connection_failed"));
				}
			};
			socket.onclose = () => {
				const wasReady = this.status === "ready";
				this.clearTimers();
				this.socket = null;
				this.status = "closed";
				if (!this.helloSettled) {
					this.helloSettled = true;
					this.rejectHello?.(new JoinError("connection_failed"));
					this.resolveHello = null;
					this.rejectHello = null;
				} else if (wasReady) {
					this.events.onClose?.();
				}
			};
		});
	}

	close(options: { silent?: boolean } = {}): void {
		const socket = this.socket;
		this.clearTimers();
		this.socket = null;
		if (this.status === "connecting" && !this.helloSettled) {
			this.helloSettled = true;
			this.rejectHello?.(new JoinError("connection_failed"));
			this.resolveHello = null;
			this.rejectHello = null;
		}
		const wasReady = this.status === "ready";
		this.status = "closed";
		try {
			socket?.close();
		} catch {
			// Socket já morto — nada a fazer.
		}
		if (wasReady && !options.silent) {
			this.events.onClose?.();
		}
	}

	private failHello(error: JoinError): void {
		if (this.helloSettled) return;
		this.helloSettled = true;
		this.clearTimers();
		try {
			this.socket?.close();
		} catch {
			// Socket já morto — nada a fazer.
		}
		this.socket = null;
		this.status = "closed";
		this.rejectHello?.(error);
		this.resolveHello = null;
		this.rejectHello = null;
	}

	private handleMessage(raw: string): void {
		const event = parseServerEvent(raw);
		if (!event) return;
		switch (event.type) {
			case "welcome": {
				if (this.helloSettled || !this.resolveHello) return;
				this.helloSettled = true;
				if (this.helloTimer) clearTimeout(this.helloTimer);
				this.helloTimer = null;
				this.status = "ready";
				this.startHeartbeat();
				const resolve = this.resolveHello;
				this.resolveHello = null;
				this.rejectHello = null;
				resolve(event.payload);
				return;
			}
			case "error": {
				if (!this.helloSettled) {
					this.failHello(new JoinError(event.payload.code, event.payload.message));
				} else if (this.status === "ready") {
					this.events.onError?.(event.payload.code, event.payload.message);
				}
				return;
			}
			case "room_state": {
				if (this.status === "ready") {
					this.events.onRoomState?.(
						event.payload.sala,
						event.payload.critical === true,
					);
				}
				return;
			}
			case "projectile_thrown": {
				if (this.status === "ready") {
					this.events.onProjectileThrown?.(event.payload);
				}
				return;
			}
			case "pong": {
				this.lastPongAt = Date.now();
				return;
			}
		}
	}

	private startHeartbeat(): void {
		this.lastPongAt = Date.now();
		this.pingTimer = setInterval(() => {
			try {
				this.socket?.send(JSON.stringify({ type: "ping", payload: {} }));
			} catch {
				// Falha de envio — o onclose/stale cobre em seguida.
			}
		}, this.pingIntervalMs);
		this.staleTimer = setInterval(() => {
			if (Date.now() - this.lastPongAt > this.pongTimeoutMs) {
				this.close();
			}
		}, this.pongTimeoutMs);
	}

	private clearTimers(): void {
		if (this.helloTimer) clearTimeout(this.helloTimer);
		if (this.pingTimer) clearInterval(this.pingTimer);
		if (this.staleTimer) clearInterval(this.staleTimer);
		this.helloTimer = null;
		this.pingTimer = null;
		this.staleTimer = null;
	}
}
