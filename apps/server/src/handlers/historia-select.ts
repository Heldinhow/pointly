/**
 * historia_select handler — issue #163 (parent #160).
 *
 * Define a história ativa. Tradução fina: payload validado (Zod no
 * boundary WS) → `Sala.selectHistoria`. Sem regra de negócio aqui.
 * `null` limpa a ativa. No-op (mesmo id) passa sem erro.
 *
 * Erros do domínio (via `mapDomainError`, socket segue aberto):
 *  - `role_denied` — espectador tentando selecionar
 *  - `historia_nao_encontrada` — id ausente ou caller fora da sala
 *  - `invalid_phase` — troca em voting/revealable
 *
 * @see https://github.com/Heldinhow/pointly/issues/163
 */

import type { HistoriaSelectPayload } from "@planning-poker/shared";
import type { Hub } from "../hub";
import { Sala } from "../sala";
import {
	mapDomainError,
	requireSala,
	type HandlerErrorCode,
} from "./_shared";

export type HistoriaSelectOutcome =
	| { ok: true }
	| {
			ok: false;
			code: HandlerErrorCode;
			message: string;
	  };

/**
 * Processa `historia_select` do cliente.
 *
 * @param hub      Hub global do processo
 * @param playerId ID do player (já autenticado via `hello`)
 * @param payload  HistoriaSelectPayload validado por Zod no WS dispatch
 */
export function handleHistoriaSelect(
	hub: Hub,
	playerId: string,
	payload: HistoriaSelectPayload,
): HistoriaSelectOutcome {
	const salaOrError = requireSala(hub, playerId, "historia_nao_encontrada");
	if (!(salaOrError instanceof Sala)) return salaOrError;
	const sala = salaOrError;

	try {
		sala.selectHistoria(playerId, payload.historiaId);
		return { ok: true };
	} catch (e) {
		return mapDomainError(e);
	}
}
