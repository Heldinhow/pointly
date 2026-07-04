/**
 * reveal_votes loop — T39 (Phase 7).
 *
 * Conecta RevealButton.click → ws.send(reveal_votes) → server broadcast
 * votes_revealed → Zustand.applyReveal + StatsPill aparece + Seats viram
 * face-up com mediana gold.
 *
 * **Pattern**:
 *  - `requestReveal(ws)` envia o evento WS
 *  - `applyVotesRevealedEvent(store, event)` aplica no store
 *  - `createRevealLoop(ws, store)` retorna `{ requestReveal, applyVotesRevealed }`
 *
 * **Server broadcast** (`votes_revealed`):
 *  - `votes: Record<playerId, Vote>` — mapa de votos por playerId
 *  - `median: number | null` — mediana cardinal ou meio entre 2 centrais
 *  - `mean: number | null` — média aritmética excluindo ☕
 *  - `range: [min, max] | null` — range numérico excluindo ☕
 *  - `unanimous: boolean` — true quando todos os votos não-nulos são iguais
 *
 * **Regra F-049**: unanimous=true → nenhum assento recebe borda gold
 * (em vez disso, stats pill exibe badge "UNANIMOUS").
 *
 * **Testes** (integration com mock WS):
 *  - requestReveal envia payload correto
 *  - applyVotesRevealed popula store (votes + consensus + phase=revealed)
 *  - unanimous=true aplica no consensus (medal logic em T35)
 *
 * @see .specs/features/planning-poker-v1/tasks.md T39
 * @see .specs/features/planning-poker-v1/spec.md F-021, F-022, F-023, F-024, F-049
 */
import type {
	ServerToClientEvent,
	VotesRevealedEvent,
} from "@planning-poker/shared";
import type { SalaStore } from "../store/sala";
import type { WSClient } from "./ws-client";

/** Envia `reveal_votes { }` ao servidor. Qualquer player pode chamar. */
export function requestReveal(ws: WSClient): void {
	ws.send({ type: "reveal_votes", payload: {} });
}

/** Aplica `votes_revealed` no Zustand store. */
export function applyVotesRevealedEvent(
	store: SalaStore,
	event: VotesRevealedEvent,
): void {
	store.applyReveal(event.votes, {
		median: event.median,
		mean: event.mean,
		range: event.range,
		unanimous: event.unanimous,
	});
}

/** Cria o reveal loop. */
export function createRevealLoop(ws: WSClient, store: SalaStore) {
	return {
		requestReveal: () => requestReveal(ws),
		applyVotesRevealed: (event: VotesRevealedEvent) =>
			applyVotesRevealedEvent(store, event),
		dispatch: (event: ServerToClientEvent) => {
			if (event.type === "votes_revealed") {
				applyVotesRevealedEvent(store, event.payload);
			}
		},
	};
}
