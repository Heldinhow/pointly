/**
 * @planning-poker/shared — client protocol helpers (issue #147).
 *
 * SSOT dos builders/guards/parse que antes viviam espelhados em
 * `apps/web/src/lib/protocol.ts`. Web e server importam daqui —
 * nada de espelho mantido à mão no frontend.
 *
 * Camadas:
 *   schemas/  Zod schemas + tipos (fonte da verdade estrutural)
 *   protocol  builders/guards/parse finos sobre os schemas (este módulo)
 *
 * @see https://github.com/Heldinhow/pointly/issues/147
 */

import { VoteSchema, type Vote } from "./schemas/sala";
import {
	NudgeIdSchema,
	ProjectileOutcomeSchema,
	ProjectileTypeSchema,
	ServerToClientEventSchema,
	type ClientToServerEvent,
	type ErrorEvent,
	type NudgeId,
	type NudgeSentEvent,
	type ProjectileOutcome,
	type ProjectileThrownEvent,
	type ProjectileType,
	type RoomStateResponse,
	type ServerToClientEvent,
	type WelcomeResponse,
} from "./schemas/events";

// ---------------------------------------------------------------------------
// Constantes espelhadas como valores (derivadas dos schemas — sem duplicar)
// ---------------------------------------------------------------------------

/** Catálogo de projéteis (6 tipos) — deriva de `ProjectileTypeSchema`. */
export const PROJECTILE_TYPES = ProjectileTypeSchema.options;

/** Desfechos do sorteio — deriva de `ProjectileOutcomeSchema`. */
export const PROJECTILE_OUTCOMES = ProjectileOutcomeSchema.options;

/** Cutucadas fixas (issue #172) — deriva de `NudgeIdSchema`. */
export const NUDGE_IDS = NudgeIdSchema.options;

// ---------------------------------------------------------------------------
// Aliases de compatibilidade (nomes que a web usava no espelho)
// ---------------------------------------------------------------------------

/** Web usava `WelcomePayload`; o contrato chama `WelcomeResponse`. */
export type WelcomePayload = WelcomeResponse;
/** Web usava `RoomStatePayload`; o contrato chama `RoomStateResponse`. */
export type RoomStatePayload = RoomStateResponse;
/** Web usava `ServerErrorPayload`; o contrato chama `ErrorEvent`. */
export type ServerErrorPayload = ErrorEvent;
/** Web usava `ProjectileThrownPayload`; o contrato chama `ProjectileThrownEvent`. */
export type ProjectileThrownPayload = ProjectileThrownEvent;
/** Web usava `NudgeSentPayload`; o contrato chama `NudgeSentEvent`. */
export type NudgeSentPayload = NudgeSentEvent;

// ---------------------------------------------------------------------------
// Guards (finos sobre os schemas Zod)
// ---------------------------------------------------------------------------

export function isDeckValue(value: unknown): value is Vote {
	return VoteSchema.safeParse(value).success;
}

export function isProjectileType(value: unknown): value is ProjectileType {
	return ProjectileTypeSchema.safeParse(value).success;
}

export function isProjectileOutcome(
	value: unknown,
): value is ProjectileOutcome {
	return ProjectileOutcomeSchema.safeParse(value).success;
}

export function isNudgeId(value: unknown): value is NudgeId {
	return NudgeIdSchema.safeParse(value).success;
}

// ---------------------------------------------------------------------------
// Builders C→S (objetos literais tipados pela união do contrato)
// ---------------------------------------------------------------------------

export function buildCastVoteMessage(
	value: Vote,
): Extract<ClientToServerEvent, { type: "cast_vote" }> {
	return { type: "cast_vote", payload: { value } };
}

export function buildRevealVotesMessage(): Extract<
	ClientToServerEvent,
	{ type: "reveal_votes" }
> {
	return { type: "reveal_votes", payload: {} };
}

export function buildStartNewRoundMessage(): Extract<
	ClientToServerEvent,
	{ type: "start_new_round" }
> {
	return { type: "start_new_round", payload: {} };
}

export function buildLeaveRoomMessage(): Extract<
	ClientToServerEvent,
	{ type: "leave_room" }
> {
	return { type: "leave_room", payload: {} };
}

export function buildUpdateAvatarMessage(
	avatar: string | null,
): Extract<ClientToServerEvent, { type: "update_avatar" }> {
	return { type: "update_avatar", payload: { avatar } };
}

export function buildThrowProjectileMessage(
	targetPlayerId: string,
	projectileType: ProjectileType,
): Extract<ClientToServerEvent, { type: "throw_projectile" }> {
	return {
		type: "throw_projectile",
		payload: { targetPlayerId, projectileType },
	};
}

export function buildSendNudgeMessage(
	targetPlayerId: string,
	nudgeId: NudgeId,
): Extract<ClientToServerEvent, { type: "send_nudge" }> {
	return { type: "send_nudge", payload: { targetPlayerId, nudgeId } };
}

// ---------------------------------------------------------------------------
// Parse S→C
// ---------------------------------------------------------------------------

/**
 * Validação estrutural de um evento vindo do servidor via Zod
 * (`ServerToClientEventSchema`). Retorna null para JSON inválido,
 * formato desconhecido ou payload malformado — o chamador ignora em
 * silêncio (compatibilidade com eventos futuros).
 */
export function parseServerEvent(raw: string): ServerToClientEvent | null {
	let json: unknown;
	try {
		json = JSON.parse(raw);
	} catch {
		return null;
	}
	const parsed = ServerToClientEventSchema.safeParse(json);
	if (!parsed.success) return null;
	return parsed.data;
}
