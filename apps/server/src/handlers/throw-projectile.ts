import type {
	ThrowProjectilePayload,
	ProjectileOutcome,
} from "@planning-poker/shared";
import type { Hub } from "../hub";
import { SalaError } from "../sala";

export type ThrowProjectileOutcome =
	| { ok: true; outcome: ProjectileOutcome }
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
 * Processa a ação de arremessar um projétil de um player para outro.
 * Valida se ambos estão na mesma sala, executa o cooldown e sorteia o desfecho.
 */
export function handleThrowProjectile(
	hub: Hub,
	playerId: string,
	payload: ThrowProjectilePayload,
	now: number = Date.now(),
): ThrowProjectileOutcome {
	const sala = hub.getSalaForPlayer(playerId);
	if (!sala) {
		return {
			ok: false,
			code: "sala_nao_encontrada",
			message: `Player ${playerId} não está em nenhuma sala.`,
		};
	}

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

		// Sorteia o desfecho: 80% hit (0.20 a 1.0), 15% dodge (0.05 a 0.20), 5% deflect (0.0 a 0.05)
		const rand = Math.random();
		let outcome: ProjectileOutcome = "hit";
		if (rand < 0.05) {
			outcome = "deflect";
		} else if (rand < 0.2) {
			outcome = "dodge";
		}

		return { ok: true, outcome };
	} catch (e) {
		if (e instanceof SalaError) {
			return { ok: false, code: e.code, message: e.message };
		}
		const message = e instanceof Error ? e.message : String(e);
		return { ok: false, code: "internal_error", message };
	}
}
