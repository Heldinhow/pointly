/**
 * start_new_round loop — T40 (Phase 7).
 *
 * Conecta NewRoundButton.click → ws.send(start_new_round) → server broadcast
 * round_started → Zustand.resetForNewRound (limpa votes, incrementa round,
 * reseta timer).
 *
 * **Pattern**:
 *  - `requestNewRound(ws)` envia o evento WS
 *  - `applyRoundStartedEvent(store, event)` aplica no store
 *  - `createNewRoundLoop(ws, store)` retorna `{ requestNewRound, dispatch }`
 *
 * **Server broadcast** (`round_started`):
 *  - `round: number` — novo round (1-based)
 *
 * **Efeito no client** (F-026):
 *  - votes: {}
 *  - players: hasVoted=false, value=null
 *  - timer: 60 (reset)
 *  - phase: 'voting' (ou 'idle' se ninguém votou ainda)
 *  - consensus: null
 *  - critical: false
 *
 * **Testes** (integration com mock WS):
 *  - requestNewRound envia payload correto
 *  - applyRoundStarted reseta votes + incrementa round
 *
 * @see .specs/features/planning-poker-v1/tasks.md T40
 * @see .specs/features/planning-poker-v1/spec.md F-025, F-026
 */
import type {
	RoundStartedEvent,
	ServerToClientEvent,
} from "@planning-poker/shared";
import type { SalaStore } from "../store/sala";
import type { WSClient } from "./ws-client";

/** Envia `start_new_round { }` ao servidor. Qualquer player pode chamar. */
export function requestNewRound(ws: WSClient): void {
	ws.send({ type: "start_new_round", payload: {} });
}

/** Aplica `round_started` no Zustand store. */
export function applyRoundStartedEvent(
	store: SalaStore,
	event: RoundStartedEvent,
): void {
	store.resetForNewRound(event.round);
}

export function createNewRoundLoop(ws: WSClient, store: SalaStore) {
	return {
		requestNewRound: () => requestNewRound(ws),
		applyRoundStarted: (event: RoundStartedEvent) =>
			applyRoundStartedEvent(store, event),
		dispatch: (event: ServerToClientEvent) => {
			if (event.type === "round_started") {
				applyRoundStartedEvent(store, event.payload);
			}
		},
	};
}
