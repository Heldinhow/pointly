/**
 * start_new_round handler — Phase 3 / T16
 *
 * Qualquer player inicia nova rodada (sem role check — ADR-0002).
 *
 * Regras (Sala):
 *  - `phase === 'revealed'` aceito
 *  - Limpa votes e hasVoted de todos
 *  - Incrementa round
 *  - Phase → 'voting', reset timer (próximo cast_vote reinicia contagem)
 *
 * @see spec US-3 (F-025, F-026)
 */

import type { Hub } from "../hub";
import { SalaError } from "../sala";

export type StartNewRoundOutcome =
	| { ok: true; round: number }
	| {
			ok: false;
			code:
				| "invalid_phase"
				| "sala_cheia"
				| "sala_nao_encontrada"
				| "invalid_vote"
				| "invalid_nick"
				| "internal_error";
			message: string;
	  };

export function handleStartNewRound(
	hub: Hub,
	playerId: string,
): StartNewRoundOutcome {
	const sala = hub.getSalaForPlayer(playerId);
	if (!sala) {
		return {
			ok: false,
			code: "invalid_phase",
			message: `Player ${playerId} não está em nenhuma sala.`,
		};
	}

	try {
		sala.startNewRound();
	} catch (e) {
		if (e instanceof SalaError) {
			return { ok: false, code: e.code, message: e.message };
		}
		const message = e instanceof Error ? e.message : String(e);
		return { ok: false, code: "internal_error", message };
	}

	return { ok: true, round: sala.round };
}
