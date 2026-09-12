/**
 * Arena event loops — TODOS os loops da arena em UM arquivo.
 *
 * Substitui os antigos `vote-loop`/`reveal-loop`/`new-round-loop`/
 * `sala-end-loop`/`projectile-loop`/`use-arena-loop` (deletados no
 * scaffold spell-rebuild). Server é intocado: este arquivo espelha o
 * protocolo exatamente (tipos de `@planning-poker/shared`, sem redefinir).
 *
 * C→S (strict, sem chaves extras): hello | cast_vote | reveal_votes |
 * start_new_round | throw_projectile | ping | leave_room (só no close da
 * arena, após welcome — saída voluntária imediata em vez do grace de 60s).
 *
 * S→C: welcome | room_state | player_left | vote_cast | votes_revealed |
 * round_started | sala_ended | error | pong | projectile_thrown.
 * `player_joined` existe no schema mas NUNCA é emitido — joins hidratam
 * via `room_state`.
 *
 * Timer local: o ticker só decrementa com `timerActive` (mirror do server —
 * sala.ts inicia no primeiro voto, para em reveal/new-round/empty). Loops
 * sinaliza `timerActive=true` em vote_cast e em room_state com votos;
 * reveal/new-round zeram via store.
 */
import type {
	ClientToServerEvent,
	Phase,
	ProjectileThrownEvent,
	ProjectileType,
	SalaEndedReason,
	SalaState,
	ServerToClientEvent,
	Vote,
} from "@planning-poker/shared";
import { toast } from "@/components/feedback/toast";
import type { ConsensusSnapshot, SetSalaOpts } from "@/store/sala";
import { useSalaStore } from "@/store/sala";
import {
	createWSClient,
	type CreateWSClientOptions,
	type WSClient,
} from "./ws-client";

// ---------------------------------------------------------------------------
// Identidade (sessionStorage — chaves iguais às da join page)
// ---------------------------------------------------------------------------

const K_UUID = "pointly.uuid";
const K_NICK = "pointly.nick";
const K_CODE = "pointly.code";

function readKey(key: string): string | null {
	try {
		return sessionStorage.getItem(key);
	} catch {
		return null;
	}
}

/** UUID persistido pela join page (`pointly.uuid`). */
export function readStoredUuid(): string | null {
	return readKey(K_UUID);
}

/** Nick persistido pela join page (`pointly.nick`). */
export function readStoredNick(): string | null {
	return readKey(K_NICK);
}

/** Code persistido pela join page (`pointly.code`). */
export function readStoredCode(): string | null {
	return readKey(K_CODE);
}

// ---------------------------------------------------------------------------
// Store adapter (desacopla dispatch dos detalhes do Zustand → testável)
// ---------------------------------------------------------------------------

export interface LoopsStoreApi {
	setSala: (sala: SalaState, opts?: SetSalaOpts) => void;
	setTimerActive: (active: boolean) => void;
	setCurrentPlayerId: (id: string) => void;
	removePlayerById: (id: string) => void;
	markVoted: (playerId: string, hasVoted: boolean) => void;
	applyReveal: (votes: Record<string, Vote>, stats: ConsensusSnapshot) => void;
	resetForNewRound: (round: number) => void;
	setSalaEnded: (reason: SalaEndedReason) => void;
	getPhase: () => Phase;
	getCode: () => string | null;
}

export interface LoopsHooks {
	navigate: (path: string) => void;
	/** Código da sala desta conexão (pra preservar ?code= em redirects de erro). */
	code?: string;
}

function liveStoreApi(): LoopsStoreApi {
	return {
		setSala: (s, opts) => useSalaStore.getState().setSala(s, opts),
		setTimerActive: (a) => useSalaStore.getState().setTimerActive(a),
		setCurrentPlayerId: (id) => useSalaStore.getState().setCurrentPlayerId(id),
		removePlayerById: (id) => useSalaStore.getState().removePlayerById(id),
		markVoted: (pid, v) => useSalaStore.getState().markVoted(pid, v),
		applyReveal: (v, st) => useSalaStore.getState().applyReveal(v, st),
		resetForNewRound: (r) => useSalaStore.getState().resetForNewRound(r),
		setSalaEnded: (r) => useSalaStore.getState().setSalaEnded(r),
		getPhase: () => useSalaStore.getState().sala?.phase ?? "idle",
		getCode: () => useSalaStore.getState().sala?.code ?? null,
	};
}

/** Código conhecido pra preservar em redirects (`?code=`), store primeiro. */
function knownCode(store: LoopsStoreApi, hooks: LoopsHooks): string {
	return store.getCode() || hooks.code || "";
}

// ---------------------------------------------------------------------------
// Projéteis: pub/sub local (server só faz broadcast; animação é client-side)
// ---------------------------------------------------------------------------

export type ProjectileListener = (e: ProjectileThrownEvent) => void;

const projectileListeners = new Set<ProjectileListener>();

/** Arena assina para animar emoji seat→seat. Retorna unsubscribe. */
export function subscribeProjectiles(fn: ProjectileListener): () => void {
	projectileListeners.add(fn);
	return () => {
		projectileListeners.delete(fn);
	};
}

function emitProjectile(e: ProjectileThrownEvent): void {
	for (const fn of projectileListeners) {
		try {
			fn(e);
		} catch (err) {
			console.warn("[loops] projectile listener threw:", err);
		}
	}
}

/** Apenas para testes — limpa assinantes. */
export function __resetProjectilesForTests(): void {
	projectileListeners.clear();
}

// ---------------------------------------------------------------------------
// Senders C→S
// ---------------------------------------------------------------------------

export function sendHello(
	ws: Pick<WSClient, "send">,
	identity: { uuid: string; nick: string; code?: string },
): void {
	const payload =
		identity.code && identity.code.length > 0
			? { uuid: identity.uuid, nick: identity.nick, code: identity.code }
			: { uuid: identity.uuid, nick: identity.nick };
	ws.send({ type: "hello", payload } as ClientToServerEvent);
}

/** Nunca envia `null` (server rejeita com `invalid_vote`) — caller filtra. */
export function sendCastVote(
	ws: Pick<WSClient, "send">,
	value: Vote,
): void {
	ws.send({ type: "cast_vote", payload: { value } });
}

export function sendReveal(ws: Pick<WSClient, "send">): void {
	ws.send({ type: "reveal_votes", payload: {} });
}

export function sendLeaveRoom(ws: Pick<WSClient, "send">): void {
	ws.send({ type: "leave_room", payload: {} });
}

export function sendNewRound(ws: Pick<WSClient, "send">): void {
	ws.send({ type: "start_new_round", payload: {} });
}

export function sendProjectile(
	ws: Pick<WSClient, "send">,
	targetPlayerId: string,
	projectileType: ProjectileType,
): void {
	ws.send({ type: "throw_projectile", payload: { targetPlayerId, projectileType } });
}

// ---------------------------------------------------------------------------
// Dispatch S→C
// ---------------------------------------------------------------------------

export function dispatchArenaEvent(
	store: LoopsStoreApi,
	event: ServerToClientEvent,
	hooks: LoopsHooks,
): void {
	switch (event.type) {
		case "welcome": {
			store.setCurrentPlayerId(event.payload.playerId);
			store.setSala(event.payload.sala);
			return;
		}
		case "room_state": {
			// Passthrough de `critical` (server é fonte da verdade; store só
			// recomputa quando undefined) + gate do timer: só há countdown
			// com votos conhecidos — fresh round (timer=60, sem votos) fica
			// parado até o primeiro vote_cast. O snapshot completo (players
			// com hasVoted + votes) reconcilia o N-de-M pra todo mundo,
			// inclusive o sender (vote_cast não carrega value, nem playerId
			// no aggregate — nunca adivinhar quem votou).
			const sala = event.payload.sala;
			const hasVotes =
				Object.keys(sala.votes ?? {}).length > 0 ||
				sala.players.some((p) => p.hasVoted);
			const votingPhase =
				sala.phase === "voting" || sala.phase === "revealable";
			const opts: SetSalaOpts = {};
			if (event.payload.critical !== undefined) {
				opts.critical = event.payload.critical;
			}
			opts.timerActive = votingPhase && hasVotes;
			store.setSala(sala, opts);
			return;
		}
		case "player_joined": {
			// NUNCA emitido pelo server — joins hidratam via room_state.
			// Ignorado de propósito (sem toast, sem patch parcial).
			return;
		}
		case "player_left": {
			store.removePlayerById(event.payload.playerId);
			return;
		}
		case "vote_cast": {
			// Só vale pré-reveal — pós-reveal o server reemite votes_revealed.
			if (store.getPhase() === "revealed") return;
			// Primeiro voto da rodada liga o countdown no server — espelha
			// aqui pra gatear o ticker local (individual E aggregate: ambos
			// provam que há voto; aggregate não diz quem — nunca marcar).
			store.setTimerActive(true);
			if (event.payload.kind === "individual") {
				store.markVoted(event.payload.playerId, true);
				toast(`${event.payload.playerName} escolheu uma carta.`);
			} else {
				toast(`Mais ${event.payload.count} escolheram.`);
			}
			return;
		}
		case "votes_revealed": {
			store.applyReveal(event.payload.votes as Record<string, Vote>, {
				median: event.payload.median,
				mean: event.payload.mean,
				range: event.payload.range,
				unanimous: event.payload.unanimous,
			});
			return;
		}
		case "round_started": {
			store.resetForNewRound(event.payload.round);
			return;
		}
		case "sala_ended": {
			store.setSalaEnded(event.payload.reason);
			if (event.payload.reason === "server_restart") {
				toast("Servidor reiniciou. Sala encerrada — reconecte.", {
					variant: "error",
				});
			} else if (event.payload.reason === "replaced") {
				toast("Outra aba assumiu o lugar desta.");
			} else {
				toast("Sala encerrada — último jogador saiu.");
			}
			hooks.navigate("/");
			return;
		}
		case "error": {
			const message = event.payload.message;
			switch (event.payload.code) {
				case "sala_cheia": {
					toast(message ?? "Sala cheia — 12/12 jogadores.", {
						variant: "error",
					});
					const code = knownCode(store, hooks);
					hooks.navigate(code ? `/full?code=${code}` : "/full");
					return;
				}
				case "sala_nao_encontrada": {
					toast(message ?? "Sala não encontrada.", { variant: "error" });
					const code = knownCode(store, hooks);
					hooks.navigate(code ? `/join?code=${code}` : "/join");
					return;
				}
				default: {
					// invalid_nick | invalid_phase | invalid_vote |
					// role_denied | rate_limited | internal_error → toast, sem sair
					toast(message ?? `Erro: ${event.payload.code}`, {
						variant: "error",
					});
					return;
				}
			}
		}
		case "pong": {
			return;
		}
		case "projectile_thrown": {
			emitProjectile(event.payload);
			return;
		}
	}
}

// ---------------------------------------------------------------------------
// Conexão: WS + hello por (re)connect + ticker do timer
// ---------------------------------------------------------------------------

export interface ConnectArenaParams {
	nick: string;
	code: string;
	uuid: string;
	wsUrl?: string;
	navigate: (path: string) => void;
	/** Factory do WS client (default `createWSClient`) — injetável pra testes. */
	clientFactory?: (opts: CreateWSClientOptions) => WSClient;
}

export interface ArenaConnection {
	castVote: (value: Vote) => void;
	requestReveal: () => void;
	requestNewRound: () => void;
	throwProjectile: (targetPlayerId: string, type: ProjectileType) => void;
	close: () => void;
}

function startTimerTicker(): () => void {
	const id = window.setInterval(() => {
		const sala = useSalaStore.getState().sala;
		if (!sala) return;
		if (sala.phase !== "voting" && sala.phase !== "revealable") return;
		if (sala.timer <= 0) return; // auto-reveal do server chega já-já
		useSalaStore.getState().tickTimer();
	}, 1000);
	return () => window.clearInterval(id);
}

/**
 * Conecta a arena: abre WS, envia `hello` uma vez por (re)connect com a
 * identidade persistida, despacha S→C no store e tika o timer local
 * (gateado por `timerActive` no store).
 *
 * No close (unmount): envia `leave_room` ANTES de fechar o socket quando
 * aberto — o server remove na hora em vez do grace de 60s. Guard: só se o
 * `hello` foi reconhecido (`welcome` recebido).
 */
export function connectArena(params: ConnectArenaParams): ArenaConnection {
	const { nick, code, uuid, wsUrl, navigate, clientFactory } = params;
	const store = liveStoreApi();
	const hooks: LoopsHooks = { navigate, code };
	let welcomed = false;

	const makeClient = clientFactory ?? ((opts) => createWSClient(opts));
	const ws = makeClient({
		url: wsUrl,
		onEvent: (event) => {
			if (event.type === "welcome") welcomed = true;
			dispatchArenaEvent(store, event, hooks);
		},
		onOpen: () => {
			sendHello(ws, { uuid, nick, code });
		},
	});
	ws.connect();
	const stopTicker = startTimerTicker();

	return {
		castVote: (value) => sendCastVote(ws, value),
		requestReveal: () => sendReveal(ws),
		requestNewRound: () => sendNewRound(ws),
		throwProjectile: (targetPlayerId, type) =>
			sendProjectile(ws, targetPlayerId, type),
		close: () => {
			stopTicker();
			if (welcomed && ws.getStatus() === "open") {
				try {
					sendLeaveRoom(ws);
				} catch {
					// send valida via Zod e nunca lança na prática; close segue
				}
			}
			ws.close();
		},
	};
}
