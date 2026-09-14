/**
 * reveal_votes handler — Phase 3 / T15
 *
 * Qualquer player pode revelar (sem role check — ADR-0002 grilling 2026-07-04).
 * Calcula stats via computeConsensus, detecta unanimous.
 *
 * @see spec US-3 (F-015, F-019, F-020, F-021)
 */

import type { Vote } from "@planning-poker/shared";
import type { Hub } from "../hub";
import { Sala } from "../sala";
import {
	mapDomainError,
	requireSala,
	type HandlerErrorCode,
} from "./_shared";

export type RevealVotesOutcome =
	| {
			ok: true;
			votes: Record<string, Vote>;
			median: number | null;
			mean: number | null;
			range: [number, number] | null;
			unanimous: boolean;
	  }
	| {
			ok: false;
			code: HandlerErrorCode;
			message: string;
	  };

/**
 * Processa `reveal_votes` do cliente. Sem role check (ADR-0002).
 */
export function handleRevealVotes(
	hub: Hub,
	playerId: string,
): RevealVotesOutcome {
	const salaOrError = requireSala(hub, playerId, "invalid_phase");
	if (!(salaOrError instanceof Sala)) return salaOrError;
	const sala = salaOrError;

	try {
		const outcome = sala.reveal(playerId);
		return {
			ok: true,
			votes: outcome.votes,
			median: outcome.median,
			mean: outcome.mean,
			range: outcome.range,
			unanimous: outcome.unanimous,
		};
	} catch (e) {
		return mapDomainError(e);
	}
}
