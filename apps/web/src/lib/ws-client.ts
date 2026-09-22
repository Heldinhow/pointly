import { JoinError } from "./errors";
import {
	buildCastVoteMessage,
	buildLeaveRoomMessage,
	buildRevealVotesMessage,
	buildSendNudgeMessage,
	buildStartNewRoundMessage,
	buildThrowProjectileMessage,
	buildUpdateAvatarMessage,
	isDeckValue,
	isNudgeId,
	isProjectileType,
	parseServerEvent,
	type HelloPayload,
	type NudgeId,
	type NudgeSentPayload,
	type ProjectileThrownPayload,
	type ProjectileType,
	type SalaState,
	type Vote,
	type WelcomePayload,
} from "@planning-poker/shared";

export type SocketStatus = "idle" | "connecting" | "ready" | "closed";

export interface PointlySocketEvents {
	onRoomState?: (sala: SalaState) => void;
	onProjectileThrown?: (event: ProjectileThrownPayload) => void;
	onNudgeSent?: (event: NudgeSentPayload) => void;
	onClose?: () => void;
	onError?: (code: string, message: string) => void;
	onReconnecting?: (attempt: number, nextInMs: number) => void;
	onReconnected?: (welcome: WelcomePayload) => void;
	onReconnectFailed?: () => void;
}

interface PointlySocketOptions {
	helloTimeoutMs?: number;
	/** Janela total de retry após queda real pós-ready. Default 5min. */
	reconnectWindowMs?: number;
	/** Delay base do backoff exponencial. Default 1s. */
	reconnectBaseDelayMs?: number;
	/** Teto do delay entre tentativas. Default 10s. */
	reconnectMaxDelayMs?: number;
	/** Desliga o auto-reconnect (ex: testes). Default true. */
	autoReconnect?: boolean;
}

/**
 * Cliente WebSocket mínimo do ticket 03: conecta, envia hello e resolve com
 * o welcome (ou rejeita com o erro do servidor).
 *
 * Liveness é responsabilidade do SERVIDOR (ping de protocolo a cada 25s —
 * o browser responde `pong` sozinho, sem JS, logo aba oculta não derruba).
 * O cliente nunca envia ping nem se auto-derruba por timeout local.
 *
 * Ticket 04: handlers podem ser atualizados pós-connect via `setHandlers`,
 * para a Arena assinar `room_state` no socket criado pela entrada (handoff
 * via store) sem recriar a conexão.
 *
 * Ticket 09: `sendLeaveRoom` para saída voluntária (remove o Player e
 * broadcast para os demais); F5/recarregamento NÃO envia leave — a Arena
 * reconecta com o mesmo UUID e o servidor reidrata sem duplicar.
 *
 * Rede de segurança: queda REAL pós-ready (rede, sleep, discard) agenda
 * retry com backoff exponencial por 5min (mesmo `hello`/UUID — o servidor
 * reidrata voto, assento e fase dentro do grace period).
 */
export class PointlySocket {
	private socket: WebSocket | null = null;
	private status: SocketStatus = "idle";
	private helloSettled = false;
	private resolveHello: ((welcome: WelcomePayload) => void) | null = null;
	private rejectHello: ((error: JoinError) => void) | null = null;
	private helloTimer: ReturnType<typeof setTimeout> | null = null;
	private events: PointlySocketEvents;
	private readonly helloTimeoutMs: number;
	private readonly reconnectWindowMs: number;
	private readonly reconnectBaseDelayMs: number;
	private readonly reconnectMaxDelayMs: number;
	private autoReconnect: boolean;
	private lastUrl: string | null = null;
	private lastHello: HelloPayload | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private reconnectAttempt = 0;
	private reconnectStartedAt = 0;

	constructor(
		events: PointlySocketEvents = {},
		options: PointlySocketOptions = {},
	) {
		this.events = { ...events };
		this.helloTimeoutMs = options.helloTimeoutMs ?? 10_000;
		this.reconnectWindowMs = options.reconnectWindowMs ?? 5 * 60_000;
		this.reconnectBaseDelayMs = options.reconnectBaseDelayMs ?? 1_000;
		this.reconnectMaxDelayMs = options.reconnectMaxDelayMs ?? 10_000;
		this.autoReconnect = options.autoReconnect ?? true;
	}

	setAutoReconnect(enabled: boolean): void {
		this.autoReconnect = enabled;
		if (!enabled) this.clearReconnect();
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
	 * `revealed`).
	 */
	sendRevealVotes(): boolean {
		return this.send(buildRevealVotesMessage());
	}

	/**
	 * Envia `start_new_round {}`. Qualquer Player pode abrir nova rodada
	 * (servidor democratizado, sem role check; exige phase `revealed`).
	 * Retorna false sem conexão pronta. O servidor responde com
	 * `round_started` + `room_state` (round incrementado, votos limpos,
	 * mesmos Players).
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
	 * Envia `update_avatar { avatar }` (AV-06). String válida
	 * define/substitui; null remove (volta a iniciais). Retorna false sem
	 * conexão pronta ou avatar fora de forma — nunca lança, o chamador
	 * mantém o estado local. O servidor responde com `room_state`.
	 */
	updateAvatar(avatar: string | null): boolean {
		if (avatar !== null && typeof avatar !== "string") return false;
		return this.send(buildUpdateAvatarMessage(avatar));
	}

	/**
	 * Envia `throw_projectile { targetPlayerId, projectileType }` (issue #157).
	 * Em qualquer fase: o servidor valida o cooldown de 1s por sender,
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

	/**
	 * Envia `send_nudge { targetPlayerId, nudgeId }` (issue #172).
	 * Cutucada efêmera: o servidor aplica o cooldown compartilhado com o
	 * arremesso e faz broadcast `nudge_sent` — nunca persiste nem entra no
	 * `room_state`. Retorna false sem conexão pronta, alvo vazio ou id fora
	 * do catálogo.
	 */
	sendNudge(targetPlayerId: string, nudgeId: NudgeId): boolean {
		if (typeof targetPlayerId !== "string" || targetPlayerId.length === 0) {
			return false;
		}
		if (!isNudgeId(nudgeId)) return false;
		return this.send(buildSendNudgeMessage(targetPlayerId, nudgeId));
	}

	/**
	 * Tenta reconectar agora (botão "Tentar agora", `online`, `pageshow`).
	 * Sem credenciais guardadas ou já `ready`/`connecting` é no-op.
	 */
	retryNow(): void {
		if (this.status === "ready" || this.status === "connecting") return;
		if (!this.lastUrl || !this.lastHello) return;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		void this.attemptReconnect();
	}

	connect(url: string, hello: HelloPayload): Promise<WelcomePayload> {
		this.clearReconnect();
		this.lastUrl = url;
		this.lastHello = { ...hello };
		return this.connectRaw(url, hello);
	}

	private connectRaw(url: string, hello: HelloPayload): Promise<WelcomePayload> {
		this.close({ silent: true, keepReconnect: true });
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
					this.scheduleReconnect();
				}
			};
		});
	}

	close(options: { silent?: boolean; keepReconnect?: boolean } = {}): void {
		const socket = this.socket;
		if (!options.keepReconnect) this.clearReconnect();
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
					this.events.onError?.(event.payload.code, event.payload.message ?? "");
				}
				return;
			}
			case "room_state": {
				if (this.status === "ready") {
					this.events.onRoomState?.(event.payload.sala);
				}
				return;
			}
			case "projectile_thrown": {
				if (this.status === "ready") {
					this.events.onProjectileThrown?.(event.payload);
				}
				return;
			}
			case "nudge_sent": {
				if (this.status === "ready") {
					this.events.onNudgeSent?.(event.payload);
				}
				return;
			}
			case "pong": {
				// Legado do ping app-level (o cliente novo não envia ping;
				// o heartbeat é o frame de protocolo do servidor). Ignora.
				return;
			}
			default: {
				// Eventos S→C que a web não consome (player_joined, player_left,
				// vote_cast, votes_revealed, round_started, sala_ended): o
				// room_state subsequente hidrata o store. Ignora em silêncio.
				return;
			}
		}
	}

	/**
	 * Queda REAL pós-ready (rede, sleep, discard — o `onclose` do socket):
	 * retry com backoff por 5min antes de notificar `onClose`. Sem
	 * credenciais ou com retry desligado, notifica `onClose` direto.
	 */
	private scheduleReconnect(): void {
		if (!this.autoReconnect || !this.lastUrl || !this.lastHello) {
			this.events.onClose?.();
			return;
		}
		const now = Date.now();
		if (this.reconnectStartedAt === 0) this.reconnectStartedAt = now;
		const nextAttempt = this.reconnectAttempt + 1;
		const delay = this.reconnectDelayFor(nextAttempt);
		if (now + delay - this.reconnectStartedAt > this.reconnectWindowMs) {
			this.failReconnect();
			return;
		}
		this.reconnectAttempt = nextAttempt;
		this.events.onReconnecting?.(nextAttempt, delay);
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			void this.attemptReconnect();
		}, delay);
	}

	private async attemptReconnect(): Promise<void> {
		if (this.status === "ready" || this.status === "connecting") return;
		const url = this.lastUrl;
		const hello = this.lastHello;
		if (!url || !hello) {
			this.failReconnect();
			return;
		}
		if (
			this.reconnectStartedAt !== 0 &&
			Date.now() - this.reconnectStartedAt > this.reconnectWindowMs
		) {
			this.failReconnect();
			return;
		}
		try {
			const welcome = await this.connectRaw(url, hello);
			const wasReconnect = this.reconnectStartedAt !== 0;
			this.clearReconnect();
			if (wasReconnect) this.events.onReconnected?.(welcome);
		} catch (error) {
			if (!this.isRetryable(error)) {
				this.failReconnect();
				return;
			}
			// Falha de rede/timeout: agenda a próxima dentro da janela.
			// connectRaw já deixou status=closed; sem credenciais perdidas.
			if (!this.lastUrl || !this.lastHello) {
				this.failReconnect();
				return;
			}
			this.scheduleReconnect();
		}
	}

	private failReconnect(): void {
		this.clearReconnect();
		this.events.onReconnectFailed?.();
		this.events.onClose?.();
	}

	private reconnectDelayFor(attempt: number): number {
		const grown = this.reconnectBaseDelayMs * 2 ** Math.max(0, attempt - 1);
		const capped = Math.min(grown, this.reconnectMaxDelayMs);
		// Jitter ±20% para não sincronizar abas.
		const jitter = capped * 0.2 * (Math.random() * 2 - 1);
		return Math.max(0, Math.round(capped + jitter));
	}

	private isRetryable(error: unknown): boolean {
		if (error instanceof JoinError) {
			return error.code === "connection_failed" || error.code === "hello_timeout";
		}
		return false;
	}

	private clearReconnect(): void {
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
		this.reconnectTimer = null;
		this.reconnectAttempt = 0;
		this.reconnectStartedAt = 0;
	}

	private clearTimers(): void {
		if (this.helloTimer) clearTimeout(this.helloTimer);
		this.helloTimer = null;
	}
}
