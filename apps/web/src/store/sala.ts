/**
 * useSalaStore — Zustand store para o estado Planning Poker no client.
 *
 * Phase 5 (T22). Single source of truth no frontend.
 *
 * **Princípios**
 * 1. Estado canônico: `sala: SalaState` (validado por Zod via @planning-poker/shared).
 *    Toda mutation que muda a sala substitui o objeto inteiro (server-driven).
 * 2. Selectors granulares evitam re-render desnecessário: cada selector
 *    retorna uma referência nova SÓ quando o subset relevante muda.
 * 3. Imutabilidade: `set((s) => ...)` retorna novo objeto `SalaState`
 *    (cliente de T13 produz snapshots in-place no server, mas a action
 *    substitui por novo objeto via spread pra Zustand detectar mudança).
 *
 * **Pattern Zustand v5**
 *  - `import { create } from "zustand"`
 *  - `create<State>()((set, get) => ({ ... }))` (curried form p/ TS)
 *  - Selectors exportados como funções puras que recebem `state`.
 *    Hooks React ficam em `useSalaStore(selector)` com auto-shallow compare
 *    via `useShallow` (zustand v5).
 *
 * @see .specs/features/planning-poker-v1/tasks.md T22
 * @see docs/adr/0008-zustand-zod-shared-schemas.md
 */

import { useShallow } from "zustand/react/shallow";
import { create } from "zustand";
import type { Phase, Player, SalaState, Vote } from "@planning-poker/shared";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/**
 * Estado computado de consenso (preenchido no `applyReveal`).
 * Espelha `ConsensusStats` do shared, mas mantido aqui para composição
 * com `unanimous` que vive no evento `votes_revealed` (não em SalaState).
 */
export type ConsensusSnapshot = {
	median: number | null;
	mean: number | null;
	range: [number, number] | null;
	unanimous: boolean;
};

/** Toast efêmero para feedback rápido (voto, sala cheia, reconnect). */
export type ToastKind = "info" | "success" | "error";
export type Toast = { kind: ToastKind; text: string };

/** Estado local de UI (sem persistência). */
export type UIState = {
	toast: Toast | null;
};

/** Estado completo do store. */
export type SalaStoreState = {
	/** Snapshot mais recente do server. Null pré-connect. */
	sala: SalaState | null;
	/** ID do player local (set em `welcome`). */
	currentPlayerId: string | null;
	/** Stats pós-reveal (preenchido por `applyReveal`). */
	consensus: ConsensusSnapshot | null;
	/** UI efêmera (toasts, etc). */
	ui: UIState;
	/** Flag crítica do timer (≤30s). Setado por `setSala` se `critical: true`. */
	critical: boolean;
	/** Reason do `sala_ended` (pra UI decidir redirect). */
	salaEndedReason: string | null;
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type SalaStoreActions = {
	/** Substitui `sala` pelo snapshot do server (room_state). */
	setSala: (sala: SalaState) => void;
	/** Define ID do player local (em welcome). */
	setCurrentPlayerId: (id: string) => void;
	/** Insere ou atualiza player (preserva imutabilidade). */
	upsertPlayer: (player: Player) => void;
	/** Remove player por id. */
	removePlayerById: (id: string) => void;
	/** Marca hasVoted (sem expor valor pré-reveal). */
	markVoted: (playerId: string, hasVoted: boolean) => void;
	/** Aplica reveal: injeta votos + stats, phase → 'revealed'. */
	applyReveal: (votes: Record<string, Vote>, stats: ConsensusSnapshot) => void;
	/** Limpa votos, phase → 'voting', round++ (start_new_round). */
	resetForNewRound: (round: number) => void;
	/** Registra fim de sala com reason. */
	setSalaEnded: (reason: string) => void;
	/** Push de toast efêmero. */
	pushToast: (text: string, kind?: ToastKind) => void;
	/** Dismiss do toast atual. */
	dismissToast: () => void;
	/** Reset completo (logout / reconnect novo). */
	reset: () => void;
};

export type SalaStore = SalaStoreState & SalaStoreActions;

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Estado inicial do store (pré-connect). */
const INITIAL_STATE: SalaStoreState = {
	sala: null,
	currentPlayerId: null,
	consensus: null,
	ui: { toast: null },
	critical: false,
	salaEndedReason: null,
};

/** Regra crítica: timer ≤30s = coral. */
const CRITICAL_THRESHOLD_SECONDS = 30;

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/** Helper: cria novo SalaState substituindo players. */
function withPlayers(
	sala: SalaState,
	updater: (players: Player[]) => Player[],
): SalaState {
	return { ...sala, players: updater([...sala.players]) };
}

/** Helper: atualiza player por id (ou retorna inalterado). */
function mapPlayer(
	players: Player[],
	id: string,
	fn: (p: Player) => Player,
): Player[] {
	return players.map((p) => (p.id === id ? fn(p) : p));
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSalaStore = create<SalaStore>()((set) => ({
	...INITIAL_STATE,

	setSala: (sala) =>
		set((s) => {
			// Detecta critical a partir do timer (server pode mandar `critical`
			// em RoomStateResponse, mas SalaState é a fonte canônica).
			const critical =
				sala.timer > 0 && sala.timer <= CRITICAL_THRESHOLD_SECONDS;
			// Reset de consensus só se fase mudou para algo diferente de revealed.
			const nextConsensus = sala.phase === "revealed" ? s.consensus : null;
			// Espalha `sala` em objeto novo para garantir referência distinta
			// e acionar re-render de selectors com shallow compare.
			return {
				sala: { ...sala },
				critical,
				consensus: nextConsensus,
				salaEndedReason: null,
			};
		}),

	setCurrentPlayerId: (id) => set({ currentPlayerId: id }),

	upsertPlayer: (player) =>
		set((s) => {
			if (!s.sala) return s;
			const exists = s.sala.players.some((p) => p.id === player.id);
			const nextPlayers = exists
				? mapPlayer(s.sala.players, player.id, () => player)
				: [...s.sala.players, player];
			return { sala: { ...s.sala, players: nextPlayers } };
		}),

	removePlayerById: (id) =>
		set((s) => {
			if (!s.sala) return s;
			const nextPlayers = s.sala.players.filter((p) => p.id !== id);
			const nextVotes = { ...s.sala.votes };
			delete nextVotes[id];
			return {
				sala: { ...s.sala, players: nextPlayers, votes: nextVotes },
			};
		}),

	markVoted: (playerId, hasVoted) =>
		set((s) => {
			if (!s.sala) return s;
			return {
				sala: withPlayers(s.sala, (players) =>
					mapPlayer(players, playerId, (p) => ({ ...p, hasVoted })),
				),
			};
		}),

	applyReveal: (votes, stats) =>
		set((s) => {
			if (!s.sala) return s;
			return {
				sala: { ...s.sala, phase: "revealed", votes: { ...votes } },
				consensus: stats,
			};
		}),

	resetForNewRound: (round) =>
		set((s) => {
			if (!s.sala) return s;
			return {
				sala: {
					...s.sala,
					round,
					phase: "voting",
					timer: 60,
					votes: {},
					players: s.sala.players.map((p) => ({
						...p,
						hasVoted: false,
						value: null,
					})),
				},
				consensus: null,
				critical: false,
			};
		}),

	setSalaEnded: (reason) =>
		set((s) => {
			if (!s.sala) return { salaEndedReason: reason };
			return {
				salaEndedReason: reason,
				sala: { ...s.sala, phase: "idle" },
			};
		}),

	pushToast: (text, kind = "info") => set({ ui: { toast: { kind, text } } }),

	dismissToast: () => set((s) => ({ ui: { ...s.ui, toast: null } })),

	reset: () => set({ ...INITIAL_STATE }),
}));

// ---------------------------------------------------------------------------
// Selectors granulares (pure functions — retornam subset do state).
//
// **Pattern**: cada selector é uma função `(state: SalaStore) => T`.
// Para usar em componente React, wrap em `useShallow` (zustand v5):
//   const players = useSalaStore(useShallow((s) => s.sala?.players ?? []));
//
// `useShallow` faz shallow comparison do resultado, evitando re-render
// quando o subset não mudou estruturalmente.
// ---------------------------------------------------------------------------

/** Sala completa (null se pré-connect). */
export const selectSala = (s: SalaStore): SalaState | null => s.sala;
/** Lista de players (vazio se sem sala). */
export const selectPlayers = (s: SalaStore): Player[] => s.sala?.players ?? [];
/** Player local (null se pré-welcome). */
export const selectCurrentPlayer = (s: SalaStore): Player | null => {
	if (!s.sala || !s.currentPlayerId) return null;
	return s.sala.players.find((p) => p.id === s.currentPlayerId) ?? null;
};
/** Phase atual. Default 'idle' (não-conectado). */
export const selectPhase = (s: SalaStore): Phase => s.sala?.phase ?? "idle";
/** Timer atual em segundos. Default 60. */
export const selectTimer = (s: SalaStore): number => s.sala?.timer ?? 60;
/** Critical flag (timer ≤30s). */
export const selectCritical = (s: SalaStore): boolean => s.critical;
/** Round atual (1-based). */
export const selectRound = (s: SalaStore): number => s.sala?.round ?? 1;
/** Mapa de votos (playerId → Vote). */
export const selectVotes = (s: SalaStore): Record<string, Vote> =>
	s.sala?.votes ?? {};
/** Stats pós-reveal. */
export const selectConsensus = (s: SalaStore): ConsensusSnapshot | null =>
	s.consensus;
/** Meu assento (alias semântico de selectCurrentPlayer). */
export const selectMySeat = (s: SalaStore): Player | null =>
	selectCurrentPlayer(s);
/** Toast atual. */
export const selectToast = (s: SalaStore): Toast | null => s.ui.toast;
/** Reason do sala_ended (null se sala viva). */
export const selectSalaEndedReason = (s: SalaStore): string | null =>
	s.salaEndedReason;
/** Host da sala (player com role='host'). */
export const selectHost = (s: SalaStore): Player | null => {
	if (!s.sala?.hostId) return null;
	return s.sala.players.find((p) => p.id === s.sala!.hostId) ?? null;
};
/** Código da sala. */
export const selectCode = (s: SalaStore): string | null => s.sala?.code ?? null;
/** true se sou o host. */
export const selectIsHost = (s: SalaStore): boolean => {
	const me = selectCurrentPlayer(s);
	return me?.role === "host";
};
/** true se sala está vazia (só eu). */
export const selectIsOnlyPlayer = (s: SalaStore): boolean => {
	const players = selectPlayers(s);
	return players.length === 1 && players[0]?.id === s.currentPlayerId;
};

// ---------------------------------------------------------------------------
// Hooks React ergonômicos (wrap selectors com useShallow).
//
// **Por que useShallow aqui:** Zustand v5 NÃO faz shallow compare automático
// ao chamar `useSalaStore(fn)`. Sem useShallow, um selector que retorna
// `[]` ou `{}` faria re-render a cada update do store (nova referência).
// ---------------------------------------------------------------------------

/** Hook: sala completa. */
export const useSala = () => useSalaStore(useShallow(selectSala));
/** Hook: lista de players. */
export const usePlayers = () => useSalaStore(useShallow(selectPlayers));
/** Hook: player local. */
export const useCurrentPlayer = () =>
	useSalaStore(useShallow(selectCurrentPlayer));
/** Hook: phase atual. */
export const usePhase = () => useSalaStore(selectPhase);
/** Hook: timer em segundos. */
export const useTimer = () => useSalaStore(selectTimer);
/** Hook: critical flag. */
export const useCritical = () => useSalaStore(selectCritical);
/** Hook: round. */
export const useRound = () => useSalaStore(selectRound);
/** Hook: mapa de votos. */
export const useVotes = () => useSalaStore(useShallow(selectVotes));
/** Hook: stats pós-reveal. */
export const useConsensus = () => useSalaStore(useShallow(selectConsensus));
/** Hook: meu assento. */
export const useMySeat = () => useSalaStore(useShallow(selectMySeat));
/** Hook: toast atual. */
export const useToast = () => useSalaStore(useShallow(selectToast));
/** Hook: código da sala. */
export const useCode = () => useSalaStore(selectCode);
/** Hook: true se sou o host. */
export const useIsHost = () => useSalaStore(selectIsHost);
/** Hook: true se sala tem só eu. */
export const useIsOnlyPlayer = () => useSalaStore(selectIsOnlyPlayer);
/** Hook: reason do sala_ended. */
export const useSalaEndedReason = () => useSalaStore(selectSalaEndedReason);
