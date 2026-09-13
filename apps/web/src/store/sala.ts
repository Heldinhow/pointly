/**
 * Sala store — Zustand (spell-rebuild).
 *
 * Fonte client-side de verdade server-driven: todo snapshot chega via
 * `room_state`/`welcome` e entra por `setSala`. Eventos incrementais
 * (`vote_cast`, `votes_revealed`, `round_started`, `player_left`) aplicam
 * patches locais; o próximo `room_state` reconcilia tudo.
 *
 * Toasts/errores/navegação vivem em `src/lib/loops.ts` (via `toast()` de
 * `@/components/feedback/toast`) — este store guarda só estado de sala.
 */
import type {
	Phase,
	Player,
	SalaEndedReason,
	SalaState,
	Vote,
} from "@planning-poker/shared";
import { computeConsensus, isUnanimous } from "@planning-poker/shared";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/** Stats pós-reveal. Espelha o payload `votes_revealed` do server. */
export type ConsensusSnapshot = {
	median: number | null;
	mean: number | null;
	range: [number, number] | null;
	unanimous: boolean;
};

/** Estado do store. */
export type SalaStoreState = {
	/** Snapshot mais recente do server. Null pré-connect. */
	sala: SalaState | null;
	/** ID do player local (set em `welcome`). */
	currentPlayerId: string | null;
	/** Stats pós-reveal (preenchido por `applyReveal`). */
	consensus: ConsensusSnapshot | null;
	/**
	 * Timer ≤30s segundo o server (`room_state.critical`).
	 * Recompute local de `timer` é fallback SÓ quando o server omite
	 * `critical` (welcome, broadcasts sem critical).
	 */
	critical: boolean;
	/**
	 * True entre o primeiro voto da rodada e reveal/new-round.
	 * Mirror do `timerActive` do server (sala.ts): timer só decrementa
	 * enquanto ativo — sem voto, sem countdown (fresh round timer=60 parado).
	 */
	timerActive: boolean;
	/** Reason do último `sala_ended` (pra UI decidir redirect). */
	salaEndedReason: SalaEndedReason | null;
};

/** Hints do server para `setSala` (tudo opcional; ausência = derivação local). */
export type SetSalaOpts = {
	/**
	 * `room_state.critical` quando presente. Server computa
	 * `timerActive && 0<timer<=30` — usa direto, sem recomputar.
	 */
	critical?: boolean;
	/**
	 * Override explícito de `timerActive` (loops passa `true` em
	 * vote_cast/room_state com votos). Sem hint, deriva do snapshot:
	 * phase voting|revealable + timer>0 + (timer<60 ou há votos).
	 */
	timerActive?: boolean;
};

export type SalaStoreActions = {
	/**
	 * Substitui `sala` pelo snapshot do server (welcome/room_state).
	 * `opts.critical` (room_state) vence o recompute local; `opts.timerActive`
	 * vence a derivação (loops sinaliza vote_cast / room_state com votos).
	 */
	setSala: (sala: SalaState, opts?: SetSalaOpts) => void;
	/** Sinaliza timer rodando/parado (loops chama em vote_cast/reveal/new-round). */
	setTimerActive: (active: boolean) => void;
	/** Define o ID do player local (welcome). */
	setCurrentPlayerId: (id: string) => void;
	/** Insere ou atualiza um player (imutável). */
	upsertPlayer: (player: Player) => void;
	/** Remove player por id (+prune em `votes`). */
	removePlayerById: (id: string) => void;
	/** Marca hasVoted sem expor valor pré-reveal. */
	markVoted: (playerId: string, hasVoted: boolean) => void;
	/** Aplica reveal: injeta votos + stats, phase → 'revealed'. */
	applyReveal: (
		votes: Record<string, Vote>,
		stats: ConsensusSnapshot,
	) => void;
	/** Nova rodada: phase → 'voting', timer 60, votos limpos (mirror server). */
	resetForNewRound: (round: number) => void;
	/** Registra fim de sala. */
	setSalaEnded: (reason: SalaEndedReason) => void;
	/** Decrementa timer em 1 (só com timerActive em voting|revealable, piso 0). */
	tickTimer: () => void;
	/** Reset completo (desconectou / trocou de sala). */
	reset: () => void;
};

export type SalaStore = SalaStoreState & SalaStoreActions;

// ---------------------------------------------------------------------------
// Constantes + helpers
// ---------------------------------------------------------------------------

const INITIAL_STATE: SalaStoreState = {
	sala: null,
	currentPlayerId: null,
	consensus: null,
	critical: false,
	timerActive: false,
	salaEndedReason: null,
};

/** Timer entra em estado crítico em (0, 30]. */
export const CRITICAL_THRESHOLD_SECONDS = 30;
/** Segundos no início de cada rodada (mirror `TIMER_SECONDS` do server). */
export const ROUND_TIMER_SECONDS = 60;

function isCriticalTimer(timer: number): boolean {
	return timer > 0 && timer <= CRITICAL_THRESHOLD_SECONDS;
}

/** Há voto conhecido no snapshot (map `votes` ou flag `hasVoted`). */
function snapshotHasVotes(sala: SalaState): boolean {
	if (Object.keys(sala.votes ?? {}).length > 0) return true;
	return sala.players.some((p) => p.hasVoted);
}

/**
 * Deriva `timerActive` quando o caller não passa hint (welcome, broadcasts
 * sem contexto, callers diretos). Mirror do server: timer só roda em
 * voting|revealable após o primeiro voto — fresh round (timer=60, sem votos)
 * fica parado até o primeiro vote_cast.
 */
function deriveTimerActive(sala: SalaState): boolean {
	if (sala.phase !== "voting" && sala.phase !== "revealable") return false;
	if (sala.timer <= 0) return false;
	if (sala.timer < ROUND_TIMER_SECONDS) return true;
	return snapshotHasVotes(sala);
}

/** Deriva consensus client-side dos votos (fallback se room_state revealed chegar sem applyReveal). */
function deriveConsensus(votes: Record<string, Vote>): ConsensusSnapshot {
	const list = Object.values(votes);
	const stats = computeConsensus(list);
	return {
		median: stats.median,
		mean: stats.mean,
		range: stats.range,
		unanimous: isUnanimous(list),
	};
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSalaStore = create<SalaStore>()((set) => ({
	...INITIAL_STATE,

	setSala: (sala, opts) =>
		set((s) => {
			// Server é fonte da verdade quando manda `critical`; recompute
			// local só como fallback (welcome / broadcasts sem critical).
			const critical = opts?.critical ?? isCriticalTimer(sala.timer);
			const timerActive = opts?.timerActive ?? deriveTimerActive(sala);
			let nextConsensus: ConsensusSnapshot | null = null;
			if (sala.phase === "revealed") {
				nextConsensus =
					s.consensus ?? deriveConsensus(sala.votes as Record<string, Vote>);
			}
			return {
				sala: { ...sala },
				critical,
				timerActive,
				consensus: nextConsensus,
				salaEndedReason: null,
			};
		}),

	setTimerActive: (active) => set({ timerActive: active }),

	setCurrentPlayerId: (id) => set({ currentPlayerId: id }),

	upsertPlayer: (player) =>
		set((s) => {
			if (!s.sala) return s;
			const exists = s.sala.players.some((p) => p.id === player.id);
			const players = exists
				? s.sala.players.map((p) => (p.id === player.id ? player : p))
				: [...s.sala.players, player];
			return { sala: { ...s.sala, players } };
		}),

	removePlayerById: (id) =>
		set((s) => {
			if (!s.sala) return s;
			const players = s.sala.players.filter((p) => p.id !== id);
			const votes = { ...s.sala.votes };
			delete votes[id];
			return { sala: { ...s.sala, players, votes } };
		}),

	markVoted: (playerId, hasVoted) =>
		set((s) => {
			if (!s.sala) return s;
			return {
				sala: {
					...s.sala,
					players: s.sala.players.map((p) =>
						p.id === playerId ? { ...p, hasVoted } : p,
					),
				},
			};
		}),

	applyReveal: (votes, stats) =>
		set((s) => {
			if (!s.sala) return s;
			return {
				sala: { ...s.sala, phase: "revealed", votes: { ...votes } },
				consensus: { ...stats },
				timerActive: false,
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
					timer: ROUND_TIMER_SECONDS,
					votes: {},
					players: s.sala.players.map((p) => ({
						...p,
						hasVoted: false,
						value: null,
					})),
				},
				consensus: null,
				critical: false,
				timerActive: false,
			};
		}),

	setSalaEnded: (reason) =>
		set((s) => {
			if (!s.sala) return { salaEndedReason: reason, timerActive: false };
			return {
				salaEndedReason: reason,
				sala: { ...s.sala, phase: "idle" },
				timerActive: false,
			};
		}),

	tickTimer: () =>
		set((s) => {
			if (!s.sala) return s;
			if (!s.timerActive) return s;
			if (s.sala.phase !== "voting" && s.sala.phase !== "revealable")
				return s;
			if (s.sala.timer <= 0) return s;
			const timer = s.sala.timer - 1;
			return { sala: { ...s.sala, timer }, critical: isCriticalTimer(timer) };
		}),

	reset: () => set({ ...INITIAL_STATE }),
}));

// ---------------------------------------------------------------------------
// Selectors (funções puras) + hooks
// ---------------------------------------------------------------------------

export const selectSala = (s: SalaStore): SalaState | null => s.sala;
export const selectPlayers = (s: SalaStore): Player[] =>
	s.sala?.players ?? [];
export const selectCurrentPlayer = (s: SalaStore): Player | null => {
	if (!s.sala || !s.currentPlayerId) return null;
	return s.sala.players.find((p) => p.id === s.currentPlayerId) ?? null;
};
export const selectPhase = (s: SalaStore): Phase => s.sala?.phase ?? "idle";
export const selectTimer = (s: SalaStore): number => s.sala?.timer ?? 60;
export const selectCritical = (s: SalaStore): boolean => s.critical;
export const selectTimerActive = (s: SalaStore): boolean => s.timerActive;
export const selectRound = (s: SalaStore): number => s.sala?.round ?? 1;
export const selectVotes = (s: SalaStore): Record<string, Vote> =>
	(s.sala?.votes ?? {}) as Record<string, Vote>;
export const selectConsensus = (s: SalaStore): ConsensusSnapshot | null =>
	s.consensus;
export const selectCode = (s: SalaStore): string | null =>
	s.sala?.code ?? null;
export const selectVotedCount = (s: SalaStore): number =>
	s.sala?.players.filter((p) => p.hasVoted).length ?? 0;
export const selectMyVote = (s: SalaStore): Vote | null =>
	selectCurrentPlayer(s)?.value ?? null;
export const selectIsHost = (s: SalaStore): boolean =>
	selectCurrentPlayer(s)?.role === "host";
export const selectIsOnlyPlayer = (s: SalaStore): boolean => {
	const players = selectPlayers(s);
	return players.length === 1 && players[0]?.id === s.currentPlayerId;
};
export const selectSalaEndedReason = (s: SalaStore): SalaEndedReason | null =>
	s.salaEndedReason;

/** Sala completa (null pré-connect). */
export const useSala = () => useSalaStore(useShallow(selectSala));
/** Lista de players. */
export const usePlayers = () => useSalaStore(useShallow(selectPlayers));
/** Player local (null pré-welcome). */
export const useCurrentPlayer = () =>
	useSalaStore(useShallow(selectCurrentPlayer));
/** Phase atual. */
export const usePhase = () => useSalaStore(selectPhase);
/** Timer em segundos. */
export const useTimer = () => useSalaStore(selectTimer);
/** Flag crítica (server-driven; fallback local quando server omite). */
export const useCritical = () => useSalaStore(selectCritical);
/** Timer rodando (false em fresh round até o primeiro voto). */
export const useTimerActive = () => useSalaStore(selectTimerActive);
/** Round atual. */
export const useRound = () => useSalaStore(selectRound);
/** Mapa de votos. */
export const useVotes = () => useSalaStore(useShallow(selectVotes));
/** Stats pós-reveal. */
export const useConsensus = () => useSalaStore(useShallow(selectConsensus));
/** Código da sala. */
export const useCode = () => useSalaStore(selectCode);
/** Voto do player local. */
export const useMyVote = () => useSalaStore(selectMyVote);
