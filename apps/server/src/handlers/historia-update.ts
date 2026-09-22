/**
 * historia_update handler — issue #163 (parent #160).
 *
 * Edição parcial last-write-wins. Tradução fina: payload validado
 * (Zod no boundary WS) → `Sala.updateHistoria`. Sem regra de negócio
 * aqui. `criterio: null` limpa o critério (vira ausente no domínio).
 *
 * Erros do domínio (via `mapDomainError`, socket segue aberto):
 *  - `role_denied` — espectador tentando editar
 *  - `historia_nao_encontrada` — id ausente ou caller fora da sala
 *  - `internal_error` — validação Zod interna (ex. título vazio em
 *    chamada direta, sem broadcast)
 *
 * @see https://github.com/Heldinhow/pointly/issues/163
 */

import type { Historia, HistoriaUpdatePayload } from "@planning-poker/shared";
import type { Hub } from "../hub";
import { Sala } from "../sala";
import {
	mapDomainError,
	requireSala,
	type HandlerErrorCode,
} from "./_shared";

export type HistoriaUpdateOutcome =
	| { ok: true; historia: Historia }
	| {
			ok: false;
			code: HandlerErrorCode;
			message: string;
	  };

/**
 * Processa `historia_update` do cliente.
 *
 * @param hub      Hub global do processo
 * @param playerId ID do player (já autenticado via `hello`)
 * @param payload  HistoriaUpdatePayload validado por Zod no WS dispatch
 */
export function handleHistoriaUpdate(
	hub: Hub,
	playerId: string,
	payload: HistoriaUpdatePayload,
): HistoriaUpdateOutcome {
	const salaOrError = requireSala(hub, playerId, "historia_nao_encontrada");
	if (!(salaOrError instanceof Sala)) return salaOrError;
	const sala = salaOrError;

	try {
		const historia = sala.updateHistoria(playerId, payload.id, {
			...(payload.titulo !== undefined ? { titulo: payload.titulo } : {}),
			...(payload.criterio !== undefined
				? { criterio: payload.criterio }
				: {}),
		});
		return { ok: true, historia };
	} catch (e) {
		return mapDomainError(e);
	}
}
