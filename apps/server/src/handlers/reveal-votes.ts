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
import { SalaError } from "../sala";

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
			code:
				| "invalid_phase"
				| "sala_cheia"
				| "sala_nao_encontrada"
				| "invalid_vote"
				| "invalid_nick"
				| "internal_error";
			message: string;
	  };

/**
 * Processa `reveal_votes` do cliente. Sem role check (ADR-0002).
 */
export function handleRevealVotes(
	hub: Hub,
	playerId: string,
): RevealVotesOutcome {
	const sala = hub.getSalaForPlayer(playerId);
	if (!sala) {
		return {
			ok: false,
			code: "invalid_phase",
			message: `Player ${playerId} não está em nenhuma sala.`,
		};
	}

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
		if (e instanceof SalaError) {
			return { ok: false, code: e.code, message: e.message };
		}
		const message = e instanceof Error ? e.message : String(e);
		return { ok: false, code: "internal_error", message };
	}
}
