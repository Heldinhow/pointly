/**
 * cast_vote handler — Phase 3 / T14
 *
 * Registra/atualiza voto de um player. Idempotente.
 *
 * Regras (validadas na Sala):
 *  - `phase === 'idle' | 'voting' | 'revealable'` (F-012)
 *  - `value !== null` (un-vote proibido — spec)
 *  - `value ∈ DECK_VALUES`
 *  - Marca `hasVoted = true`, atualiza in-place (F-011)
 *  - Se primeiro voto: phase → 'voting' + inicia timer 60s (F-013)
 *  - Se todos votaram: phase → 'revealable'
 *
 * @see spec US-2 (F-009 a F-014)
 */

import type { CastVotePayload, Vote } from "@planning-poker/shared";
import type { Hub } from "../hub";
import { SalaError } from "../sala";

export type CastVoteOutcome =
	| { ok: true; isFirstVoteOfRound: boolean }
	| {
			ok: false;
			code:
				| "invalid_vote"
				| "invalid_phase"
				| "sala_cheia"
				| "sala_nao_encontrada"
				| "invalid_nick"
				| "internal_error";
			message: string;
	  };

/**
 * Processa `cast_vote` do cliente.
 *
 * @param hub       Hub global do processo
 * @param playerId  ID do player (já autenticado via `hello`)
 * @param payload   CastVotePayload validado por Zod no WS dispatch
 */
export function handleCastVote(
	hub: Hub,
	playerId: string,
	payload: CastVotePayload,
): CastVoteOutcome {
	// 1. Localiza sala e player
	const sala = hub.getSalaForPlayer(playerId);
	if (!sala) {
		return {
			ok: false,
			code: "invalid_vote",
			message: `Player ${playerId} não está em nenhuma sala.`,
		};
	}
	const player = sala.getPlayer(playerId);
	if (!player) {
		return {
			ok: false,
			code: "invalid_vote",
			message: `Player ${playerId} não encontrado na sala.`,
		};
	}

	// 2. Defense-in-depth: rejeita un-vote
	if (payload.value === null) {
		return {
			ok: false,
			code: "invalid_vote",
			message: "Un-vote (value=null) é proibido.",
		};
	}

	// 3. Marca "primeiro voto da rodada" se phase ainda é idle
	const isFirstVoteOfRound = sala.phase === "idle";

	// 4. Delega à Sala (validações de fase/deck)
	try {
		sala.castVote(playerId, payload.value as Vote);
	} catch (e) {
		if (e instanceof SalaError) {
			return { ok: false, code: e.code, message: e.message };
		}
		const message = e instanceof Error ? e.message : String(e);
		return { ok: false, code: "internal_error", message };
	}

	// 5. Hub notifica sala sobre first-vote (inicia timer)
	if (isFirstVoteOfRound) {
		// timer já foi iniciado dentro de Sala.castVote; mas o Hub pode
		// precisar agendar tick periódico. Por ora, sala.startTimer()
		// já configura o setInterval interno (60s timer self-managing).
	}

	return { ok: true, isFirstVoteOfRound };
}
