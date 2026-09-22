/**
 * historia_remove handler — issue #163 (parent #160).
 *
 * Remove da pauta e reindexa. Tradução fina: payload validado (Zod
 * no boundary WS) → `Sala.removeHistoria`. Sem regra de negócio aqui.
 *
 * Nota: o contrato #161 (`HistoriaRemovePayload`) carrega só `{ id }`
 * — sem `confirmScored` no v1. Apagar pontuada sem confirmação falha
 * com `invalid_phase` no domínio (cliente #164+ trata a confirmação).
 *
 * Erros do domínio (via `mapDomainError`, socket segue aberto):
 *  - `role_denied` — espectador tentando apagar
 *  - `historia_nao_encontrada` — id ausente ou caller fora da sala
 *  - `invalid_phase` — ativa em voting/revealable, ou pontuada sem
 *    confirmação
 *
 * @see https://github.com/Heldinhow/pointly/issues/163
 */

import type { Historia, HistoriaRemovePayload } from "@planning-poker/shared";
import type { Hub } from "../hub";
import { Sala } from "../sala";
import {
	mapDomainError,
	requireSala,
	type HandlerErrorCode,
} from "./_shared";

export type HistoriaRemoveOutcome =
	| { ok: true; historia: Historia }
	| {
			ok: false;
			code: HandlerErrorCode;
			message: string;
	  };

/**
 * Processa `historia_remove` do cliente.
 *
 * @param hub      Hub global do processo
 * @param playerId ID do player (já autenticado via `hello`)
 * @param payload  HistoriaRemovePayload validado por Zod no WS dispatch
 */
export function handleHistoriaRemove(
	hub: Hub,
	playerId: string,
	payload: HistoriaRemovePayload,
): HistoriaRemoveOutcome {
	const salaOrError = requireSala(hub, playerId, "historia_nao_encontrada");
	if (!(salaOrError instanceof Sala)) return salaOrError;
	const sala = salaOrError;

	try {
		const historia = sala.removeHistoria(playerId, payload.id);
		return { ok: true, historia };
	} catch (e) {
		return mapDomainError(e);
	}
}
