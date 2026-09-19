import type { SendNudgePayload } from "@planning-poker/shared";
import type { Hub } from "../hub";
import { Sala } from "../sala";
import {
	mapDomainError,
	requireSala,
	type HandlerErrorCode,
} from "./_shared";

export type SendNudgeOutcome =
	| { ok: true }
	| {
			ok: false;
			code: HandlerErrorCode;
			message: string;
	  };

/**
 * Processa a ação de cutucar outro participante (issue #172).
 * Valida se ambos estão conectados na mesma sala, recusa auto-cutucada e
 * aplica o cooldown compartilhado com o arremesso.
 */
export function handleSendNudge(
	hub: Hub,
	playerId: string,
	payload: SendNudgePayload,
	now: number = Date.now(),
): SendNudgeOutcome {
	const salaOrError = requireSala(hub, playerId, "sala_nao_encontrada");
	if (!(salaOrError instanceof Sala)) return salaOrError;
	const sala = salaOrError;

	const sender = sala.getPlayer(playerId);
	const target = sala.getPlayer(payload.targetPlayerId);
	if (!sender || sender.status !== "connected" || !target || target.status !== "connected") {
		return {
			ok: false,
			code: "invalid_phase",
			message: "Cutucada indisponível: os participantes precisam estar conectados à mesma sala.",
		};
	}
	if (target.id === playerId) {
		return { ok: false, code: "invalid_phase", message: "Não é possível cutucar a si mesmo." };
	}

	try {
		sala.sendNudge(playerId, now);
		return { ok: true };
	} catch (e) {
		return mapDomainError(e);
	}
}
