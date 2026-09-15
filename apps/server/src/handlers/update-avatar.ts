/**
 * update_avatar handler — avatar-perfil-mesa T4 (AV-06/AV-07).
 *
 * Troca mid-sala: string válida define/substitui, null remove (iniciais).
 * Avatar inválido/acima do teto ignora só o campo (ok sem mudança,
 * sem broadcast). Sem sala → invalid_phase.
 *
 * @see .specs/features/avatar-perfil-mesa/spec.md (P2)
 */

import {
	AvatarSchema,
	type UpdateAvatarPayload,
} from "@planning-poker/shared";
import type { Hub } from "../hub";
import { Sala } from "../sala";
import {
	mapDomainError,
	requireSala,
	type HandlerErrorCode,
} from "./_shared";

export type UpdateAvatarOutcome =
	| {
			ok: true;
			/** false quando o campo foi ignorado (teto/formato) — sem broadcast. */
			changed: boolean;
	  }
	| {
			ok: false;
			code: HandlerErrorCode;
			message: string;
	  };

/**
 * Processa `update_avatar` do cliente.
 *
 * @param hub       Hub global do processo
 * @param playerId  ID do player (já autenticado via `hello`)
 * @param payload   UpdateAvatarPayload validado por Zod no WS dispatch
 */
export function handleUpdateAvatar(
	hub: Hub,
	playerId: string,
	payload: UpdateAvatarPayload,
): UpdateAvatarOutcome {
	// 1. Localiza sala (sem playerId/sala → invalid_phase, sem broadcast)
	const salaOrError = requireSala(hub, playerId, "invalid_phase");
	if (!(salaOrError instanceof Sala)) return salaOrError;
	const sala = salaOrError;

	// 2. null = remover; string passa pelo teto/formato (ignora só o campo)
	const avatar = payload.avatar === null ? null : toValidAvatar(payload.avatar);
	if (avatar === undefined) return { ok: true, changed: false };

	// 3. Aplica à Sala
	try {
		sala.setAvatar(playerId, avatar);
	} catch (e) {
		return mapDomainError(e);
	}
	return { ok: true, changed: true };
}

/** String válida retorna o dataURL; inválida/teto retorna undefined (ignorar). */
function toValidAvatar(value: string): string | undefined {
	const parsed = AvatarSchema.safeParse(value);
	return parsed.success ? parsed.data : undefined;
}
