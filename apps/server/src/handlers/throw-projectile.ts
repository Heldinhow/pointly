import {
	rollProjectileOutcome,
	type ProjectileOutcome,
	type ThrowProjectilePayload,
} from "@planning-poker/shared";
import type { Hub } from "../hub";
import { Sala } from "../sala";
import {
	mapDomainError,
	requireSala,
	type HandlerErrorCode,
} from "./_shared";

export type ThrowProjectileOutcome =
	| { ok: true; outcome: ProjectileOutcome }
	| {
			ok: false;
			code: HandlerErrorCode;
			message: string;
	  };

/**
 * Processa a ação de arremessar um projétil de um player para outro.
 * Valida se ambos estão na mesma sala, executa o cooldown e sorteia o desfecho.
 */
export function handleThrowProjectile(
	hub: Hub,
	playerId: string,
	payload: ThrowProjectilePayload,
	now: number = Date.now(),
): ThrowProjectileOutcome {
	const salaOrError = requireSala(hub, playerId, "sala_nao_encontrada");
	if (!(salaOrError instanceof Sala)) return salaOrError;
	const sala = salaOrError;

	const target = sala.getPlayer(payload.targetPlayerId);
	if (!target) {
		return {
			ok: false,
			code: "invalid_phase",
			message: `Alvo ${payload.targetPlayerId} não encontrado na sala.`,
		};
	}

	try {
		sala.throwProjectile(playerId, now);

		return { ok: true, outcome: rollProjectileOutcome() };
	} catch (e) {
		return mapDomainError(e);
	}
}
