/**
 * historia_add handler — issue #163 (parent #160).
 *
 * Cria história no fim da pauta. Tradução fina: payload validado (Zod
 * no boundary WS) → `Sala.addHistoria`. Sem regra de negócio aqui.
 *
 * Erros do domínio (via `mapDomainError`, socket segue aberto):
 *  - `role_denied` — espectador tentando criar
 *  - `pauta_cheia` — 51ª história (lista ≤50)
 *  - `historia_nao_encontrada` — caller fora da sala
 *  - `internal_error` — validação Zod interna (ex. título vazio em
 *    chamada direta, sem broadcast)
 *
 * @see https://github.com/Heldinhow/pointly/issues/163
 */

import type { Historia, HistoriaAddPayload } from "@planning-poker/shared";
import type { Hub } from "../hub";
import { Sala } from "../sala";
import {
	mapDomainError,
	requireSala,
	type HandlerErrorCode,
} from "./_shared";

export type HistoriaAddOutcome =
	| { ok: true; historia: Historia }
	| {
			ok: false;
			code: HandlerErrorCode;
			message: string;
	  };

/**
 * Processa `historia_add` do cliente.
 *
 * @param hub      Hub global do processo
 * @param playerId ID do player (já autenticado via `hello`)
 * @param payload  HistoriaAddPayload validado por Zod no WS dispatch
 */
export function handleHistoriaAdd(
	hub: Hub,
	playerId: string,
	payload: HistoriaAddPayload,
): HistoriaAddOutcome {
	const salaOrError = requireSala(hub, playerId, "historia_nao_encontrada");
	if (!(salaOrError instanceof Sala)) return salaOrError;
	const sala = salaOrError;

	try {
		const historia = sala.addHistoria(playerId, {
			titulo: payload.titulo,
			...(payload.criterio !== undefined
				? { criterio: payload.criterio }
				: {}),
		});
		return { ok: true, historia };
	} catch (e) {
		return mapDomainError(e);
	}
}
