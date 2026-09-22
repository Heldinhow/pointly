/**
 * historia_move handler — issue #163 (parent #160).
 *
 * Reordena por índice explícito. Tradução fina: payload validado
 * (Zod no boundary WS) → `Sala.moveHistoria`. Sem regra de negócio
 * aqui.
 *
 * Erros do domínio (via `mapDomainError`, socket segue aberto):
 *  - `role_denied` — espectador tentando reordenar
 *  - `historia_nao_encontrada` — id ausente, toIndex fora da pauta
 *    real, ou caller fora da sala
 *  - `invalid_phase` — mover a ativa em voting/revealable
 *
 * @see https://github.com/Heldinhow/pointly/issues/163
 */

import type { Historia, HistoriaMovePayload } from "@planning-poker/shared";
import type { Hub } from "../hub";
import { Sala } from "../sala";
import {
	mapDomainError,
	requireSala,
	type HandlerErrorCode,
} from "./_shared";

export type HistoriaMoveOutcome =
	| { ok: true; pauta: Historia[] }
	| {
			ok: false;
			code: HandlerErrorCode;
			message: string;
	  };

/**
 * Processa `historia_move` do cliente.
 *
 * @param hub      Hub global do processo
 * @param playerId ID do player (já autenticado via `hello`)
 * @param payload  HistoriaMovePayload validado por Zod no WS dispatch
 */
export function handleHistoriaMove(
	hub: Hub,
	playerId: string,
	payload: HistoriaMovePayload,
): HistoriaMoveOutcome {
	const salaOrError = requireSala(hub, playerId, "historia_nao_encontrada");
	if (!(salaOrError instanceof Sala)) return salaOrError;
	const sala = salaOrError;

	try {
		const pauta = sala.moveHistoria(playerId, payload.id, payload.toIndex);
		return { ok: true, pauta };
	} catch (e) {
		return mapDomainError(e);
	}
}
