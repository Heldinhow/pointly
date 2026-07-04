/**
 * cast_vote loop — T38 (Phase 7).
 *
 * Conecta a interação Deck.click → ws.send(cast_vote) → server broadcast
 * vote_cast → Zustand.markVoted → Seat re-renderiza com VOTED.
 *
 * **Pattern**:
 *  - `castVote(ws, value)` envia o evento WS
 *  - `applyVoteCastEvent(store, event)` aplica o evento S→C no store
 *    (suporta union individual/aggregate)
 *  - `createVoteLoop(ws, store)` retorna `{ castVote, applyVoteCast }`
 *
 * **Idempotência** (F-011): cast_vote é idempotente — mudar o voto é OK.
 * Server atualiza in-place. Client marca hasVoted=true imediatamente
 * (optimistic update) e server confirma via vote_cast.
 *
 * **Server broadcast** (vote_cast — discriminated union):
 *  - `kind: 'individual'` → 1º voto real da rodada (toast com nome)
 *  - `kind: 'aggregate'`  → votos seguintes (toast "Mais N escolheram")
 *
 * **Testes** (integration com mock WS):
 *  - castVote envia payload correto via ws.send
 *  - applyVoteCast individual marca hasVoted sem expor value
 *  - applyVoteCast aggregate ignora (toast é disparado pelo T37)
 *
 * @see .specs/features/planning-poker-v1/tasks.md T38
 * @see .specs/features/planning-poker-v1/spec.md F-009, F-010, F-011, F-017
 */
import type {
	VoteCastEvent,
	ServerToClientEvent,
} from "@planning-poker/shared";
import type { SalaStore } from "../store/sala";
import type { WSClient } from "./ws-client";

/** Envia `cast_vote { value }` ao servidor via WS client. */
export function castVote(
	ws: WSClient,
	value: import("@planning-poker/shared").Vote,
): void {
	ws.send({ type: "cast_vote", payload: { value } });
}

/**
 * Aplica o evento `vote_cast` no Zustand store.
 *  - individual: marca hasVoted do playerId (sem expor value).
 *  - aggregate: no-op no store (apenas dispara toast via T37).
 */
export function applyVoteCastEvent(
	store: SalaStore,
	event: VoteCastEvent,
): void {
	if (event.kind === "individual") {
		store.markVoted(event.playerId, true);
	}
	// aggregate: ToastQueue (T37) cuida do toast "Mais N escolheram"
	// Aqui só logamos para debug (sem mudança de estado).
}

/**
 * Cria o vote loop: castVote + dispatch de vote_cast events.
 * Caller conecta via `ws.on('vote_cast', applyVoteCast)`.
 */
export function createVoteLoop(ws: WSClient, store: SalaStore) {
	return {
		/** Dispara cast_vote pro servidor. */
		castVote: (value: import("@planning-poker/shared").Vote) =>
			castVote(ws, value),

		/** Dispatcher: recebe evento S→C e aplica no store se for vote_cast. */
		dispatch: (event: ServerToClientEvent) => {
			if (event.type === "vote_cast") {
				applyVoteCastEvent(store, event.payload);
			}
		},
	};
}
