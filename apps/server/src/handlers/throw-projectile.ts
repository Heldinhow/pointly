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

	const sender = sala.getPlayer(playerId);
	const target = sala.getPlayer(payload.targetPlayerId);
	if (!sender || sender.status !== "connected" || !target || target.status !== "connected") {
		return {
			ok: false,
			code: "invalid_phase",
			message: "Arremesso indisponível: os participantes precisam estar conectados à mesma sala.",
		};
	}
	if (target.id === playerId) {
		return { ok: false, code: "invalid_phase", message: "Não é possível arremessar em si mesmo." };
	}

	try {
		sala.throwProjectile(playerId, now, payload.projectileType);

		// Cadeirada épica sempre acerta — dispensa o sorteio.
		const outcome: ProjectileOutcome = payload.projectileType === "chair"
			? "hit"
			: rollProjectileOutcome();
		return { ok: true, outcome };
	} catch (e) {
		return mapDomainError(e);
	}
}
