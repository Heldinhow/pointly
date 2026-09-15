/**
 * start_new_round handler — Phase 3 / T16
 *
 * Qualquer player inicia nova rodada (sem role check — ADR-0002).
 *
 * Regras (Sala):
 *  - `phase === 'revealed'` aceito
 *  - Limpa votes e hasVoted de todos
 *  - Incrementa round
 *  - Phase → 'voting'
 *
 * @see spec US-3 (F-025, F-026)
 */

import type { Hub } from "../hub";
import { Sala } from "../sala";
import {
	mapDomainError,
	requireSala,
	type HandlerErrorCode,
} from "./_shared";

export type StartNewRoundOutcome =
	| { ok: true; round: number }
	| {
			ok: false;
			code: HandlerErrorCode;
			message: string;
	  };

export function handleStartNewRound(
	hub: Hub,
	playerId: string,
): StartNewRoundOutcome {
	const salaOrError = requireSala(hub, playerId, "invalid_phase");
	if (!(salaOrError instanceof Sala)) return salaOrError;
	const sala = salaOrError;

	try {
		sala.startNewRound();
	} catch (e) {
		return mapDomainError(e);
	}

	return { ok: true, round: sala.round };
}
