/**
 * useArenaLoop — composition hook que conecta o Arena ao WebSocket server.
 *
 * Phase 7 (T38-T41). Combina os 4 loops (vote, reveal, new-round, sala-end)
 * num único hook que:
 *  1. Cria WS client (createWSClient) na URL configurada
 *  2. Conecta ao mount
 *  3. Despacha eventos S→C para os loops corretos
 *  4. Envia `hello { uuid, nick, code }` após connect
 *  5. Expõe helpers: `castVote`, `requestReveal`, `requestNewRound`
 *  6. Cleanup no unmount
 *
 * **Pattern de composição**:
 *  - vote-loop + reveal-loop + new-round-loop + sala-end-loop
 *  - 4 dispatchers rodam em ordem, primeiro match vence
 *
 * **hello handshake**:
 *  - Após `ws.onopen` (status='open'), envia `hello`
 *  - `welcome` response popula `currentPlayerId` + `sala`
 *  - `error` response redireciona se sala_cheia (T41)
 *
 * **Estabilização**:
 *  - Refs para handlers (`castVote`, etc.) — sem re-render quando mudam
 *  - useEffect cleanup fecha WS
 *
 * @see .specs/features/planning-poker-v1/tasks.md T38-T41
 */
import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Vote } from "@planning-poker/shared";
import { useToast } from "../components/ui/toast";
import { useSalaStore } from "../store/sala";
import { createNewRoundLoop } from "./new-round-loop";
import { createRevealLoop } from "./reveal-loop";
import { createSalaEndLoop, type SalaEndHooks } from "./sala-end-loop";
import { createVoteLoop } from "./vote-loop";
import { createProjectileLoop } from "./projectile-loop";
import { createWSClient, type WSClient } from "./ws-client";
import { getUUID } from "./storage";

/** Parâmetros do hook. */
export interface UseArenaLoopParams {
	/** Apelido do player local (obrigatório). */
	nick: string;
	/** Código da sala (opcional — vazio = cria nova). */
	code: string;
	/** UUID persistente do player (ADR-0009 / T08 → sessionStorage). */
	uuid: string;
	/** Override da URL WS (default: import.meta.env.VITE_WS_URL ou ws://localhost:3001/ws). */
	wsUrl?: string;
}

// `getStoredUUID` agora é re-exportado de `./storage` (T08 / ADR-006).
// Antes lia de `localStorage`; agora via `sessionStorage` (tab-close apaga).
// O nome é preservado pra não quebrar call-sites existentes.
/** Re-export: nome legado `getStoredUUID` agora aponta para storage.getUUID. */
export const getStoredUUID = getUUID;

/** Hook principal. */
export function useArenaLoop({ nick, code, uuid, wsUrl }: UseArenaLoopParams) {
	const navigate = useNavigate();
	const toast = useToast();

	// Refs pra estabilizar handlers (sem re-criar WS a cada render)
	const wsRef = useRef<WSClient | null>(null);
	const loopsRef = useRef<{
		vote: ReturnType<typeof createVoteLoop>;
		reveal: ReturnType<typeof createRevealLoop>;
		newRound: ReturnType<typeof createNewRoundLoop>;
		salaEnd: ReturnType<typeof createSalaEndLoop>;
		projectile: ReturnType<typeof createProjectileLoop>;
	} | null>(null);
	const nickRef = useRef(nick);
	const codeRef = useRef(code);
	const uuidRef = useRef(uuid);

	// Atualiza refs
	nickRef.current = nick;
	codeRef.current = code;
	uuidRef.current = uuid;

	// Helper: envia hello se nick válido. Idempotente — o server é responsável
	// por reidratar (mesmo uuid → reconnect) ou criar sala (uuid novo → create).
	// Re-chamadas são seguras: cubrem reconnect, refresh e trocas tardias de nick.
	const sendHello = useCallback((ws: WSClient) => {
		// UX-006: só envia hello quando há nick válido (≥2 chars, conforme
		// NickSchema no @planning-poker/shared). Antes enviava mesmo com nick
		// vazio e o Zod rejeitava silenciosamente — virava 1 warning por page
		// load. Agora silenciosamente espera o effect reativo de `nick` re-
		// chamar quando o usuário digitar.
		const effectiveNick = nickRef.current?.trim() ?? "";
		if (effectiveNick.length < 2) return;
		const effectiveCode = codeRef.current || undefined;
		ws.send({
			type: "hello",
			payload: {
				uuid: uuidRef.current,
				nick: effectiveNick,
				code: effectiveCode,
			},
		});
	}, []);

	// Conecta WS no mount
	useEffect(() => {
		// Cria hooks do sala-end-loop
		const hooks: SalaEndHooks = {
			navigate: (path) => navigate(path),
			pushToast: (text, kind) => toast.push(text, kind ?? "info"),
		};

		// Cria WS PRIMEIRO (loops dependem dele)
		const wsClient = createWSClient({
			url: wsUrl,
			// Regressão prod (2026-07-05): `sendHello` antes dependia de um
			// `setInterval` que se auto-limpava na 1ª transição para `open`
			// e nunca mais disparava — se o nick ainda não estava válido nesse
			// momento (race com sessionStorage), o `hello` nunca chegava no
			// server e a sala ficava sem código de compartilhamento.
			// Agora `onOpen` dispara em CADA `open` (inclui reconnects), e o
			// effect reativo em `nick` (logo abaixo) cobre o caso "WS já
			// abriu mas nick virou válido depois". O server é idempotente:
			// mesmo uuid → reconnect; novo → cria sala.
			onOpen: () => sendHello(wsClient),
			onEvent: (event) => {
				// welcome handler: popula currentPlayerId + sala
				if (event.type === "welcome") {
					store.getState().setCurrentPlayerId(event.payload.playerId);
					store.getState().setSala(event.payload.sala);
					return;
				}
				// room_state: atualiza sala inteira
				if (event.type === "room_state") {
					store.getState().setSala(event.payload.sala);
					return;
				}
				// player_joined: adiciona player
				if (event.type === "player_joined") {
					const newPlayer = {
						id: event.payload.player.id,
						uuid: "00000000-0000-4000-8000-000000000000", // server não manda uuid
						nick: event.payload.player.nick,
						role: event.payload.player.role,
						seatIndex: event.payload.player.seatIndex,
						hasVoted: false,
						value: null,
						status: "connected" as const,
						joinedAt: Date.now(),
					};
					store.getState().upsertPlayer(newPlayer);
					return;
				}
				// player_left: remove player
				if (event.type === "player_left") {
					store.getState().removePlayerById(event.payload.playerId);
					return;
				}
				// Delega para os loops
				voteLoop.dispatch(event);
				revealLoop.dispatch(event);
				newRoundLoop.dispatch(event);
				salaEndLoop.dispatch(event);
				projectileLoop.dispatch(event);
			},
		});

		// Cria loops DEPOIS (agora wsClient existe)
		const store = useSalaStore;
		const voteLoop = createVoteLoop(wsClient, store.getState());
		const revealLoop = createRevealLoop(wsClient, store.getState());
		const newRoundLoop = createNewRoundLoop(wsClient, store.getState());
		const salaEndLoop = createSalaEndLoop(store.getState(), hooks);
		const projectileLoop = createProjectileLoop(wsClient);

		wsRef.current = wsClient;
		loopsRef.current = {
			vote: voteLoop,
			reveal: revealLoop,
			newRound: newRoundLoop,
			salaEnd: salaEndLoop,
			projectile: projectileLoop,
		};

		// Phase 8 (T42): expõe `sala` e `consensus` no `window` para E2E
		// fixtures conseguirem ler o estado Zustand sem acoplar a testes
		// internos. Production-safe: apagado no cleanup.
		const w = window as unknown as {
			__POINTLY_SALA__?: unknown;
			__POINTLY_CONSENSUS__?: unknown;
			__POINTLY_PLAYER_ID__?: string | null;
		};
		const unsubscribe = store.subscribe((state) => {
			w.__POINTLY_SALA__ = state.sala ?? undefined;
			w.__POINTLY_CONSENSUS__ = state.consensus ?? undefined;
			w.__POINTLY_PLAYER_ID__ = state.currentPlayerId;
		});
		// Snapshot inicial
		const initial = store.getState();
		w.__POINTLY_SALA__ = initial.sala ?? undefined;
		w.__POINTLY_CONSENSUS__ = initial.consensus ?? undefined;
		w.__POINTLY_PLAYER_ID__ = initial.currentPlayerId;

		wsClient.connect();

		// Cleanup no unmount
		return () => {
			unsubscribe();
			try {
				delete (w as Record<string, unknown>).__POINTLY_SALA__;
				delete (w as Record<string, unknown>).__POINTLY_CONSENSUS__;
				delete (w as Record<string, unknown>).__POINTLY_PLAYER_ID__;
			} catch {
				// ignore — window pode não aceitar delete em alguns hosts
			}
			wsClient.close();
			wsRef.current = null;
			loopsRef.current = null;
		};
	}, [navigate, toast, wsUrl, sendHello]);

	// Regressão prod (2026-07-05): cobre o caso "WS abriu antes do nick estar
	// válido". `onOpen` só dispara na transição → `'open'`; se o usuário
	// digitar o nick DEPOIS, precisamos re-tentar. Este effect roda quando
	// `nick` muda e o WS já está conectado.
	useEffect(() => {
		const ws = wsRef.current;
		if (!ws) return;
		if (ws.getStatus() !== "open") return;
		sendHello(ws);
	}, [nick, sendHello]);

	// Phase 1 (T02 — BUG-101): ticker cliente para o timer visual.
	// Decrementa `sala.timer` a cada 1s enquanto `phase === 'voting'`.
	// Servidor é a fonte da verdade — `room_state` broadcasts a cada 10s
	// reconciliam qualquer drift (ADR-002). Server não tem `fired` aqui:
	// quando o server dispara auto-reveal, ele manda `phase: 'revealed'`
	// via `room_state` e o `setSala` faz o ticker parar naturalmente.
	const phase = useSalaStore((s) => s.sala?.phase ?? "idle");
	useEffect(() => {
		if (phase !== "voting" && phase !== "revealable") return;
		const id = setInterval(() => {
			const current = useSalaStore.getState().sala;
			if (
				!current ||
				(current.phase !== "voting" && current.phase !== "revealable")
			)
				return;
			if (current.timer <= 0) return; // server will send 'revealed' shortly
			useSalaStore.getState().tickTimer();
		}, 1000);
		return () => clearInterval(id);
	}, [phase]);

	// Helpers expostos (estáveis via useCallback)
	const castVote = useCallback((value: Vote) => {
		loopsRef.current?.vote.castVote(value);
	}, []);

	const requestReveal = useCallback(() => {
		loopsRef.current?.reveal.requestReveal();
	}, []);

	const requestNewRound = useCallback(() => {
		loopsRef.current?.newRound.requestNewRound();
	}, []);

	const throwProjectile = useCallback((targetPlayerId: string, projectileType: import("@planning-poker/shared").ProjectileType) => {
		loopsRef.current?.projectile.throwProjectile(targetPlayerId, projectileType);
	}, []);

	return {
		castVote,
		requestReveal,
		requestNewRound,
		throwProjectile,
	};
}
