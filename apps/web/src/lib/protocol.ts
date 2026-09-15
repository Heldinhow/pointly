/**
 * Espelho local mínimo do wire format cliente-servidor.
 *
 * TODO(#147): apagar este módulo e importar tudo de `@planning-poker/shared`
 * quando o pacote do contrato for recriado. Até lá, manter sincronizado com os
 * schemas do servidor — a suíte de testes do servidor é a especificação.
 */

export type Role = "host" | "player" | "spectator";
export type Phase = "idle" | "voting" | "revealable" | "revealed";
export type PlayerStatus = "connected" | "disconnected";

/**
 * Deck fixo (espelho de `DECK_VALUES` do contrato compartilhado):
 * Fibonacci 0–13 com ½ valendo 0,5 e ☕ (pausa) fora dos cálculos.
 */
export const DECK_VALUES = [
	"0",
	"½",
	"1",
	"2",
	"3",
	"5",
	"8",
	"13",
	"☕",
] as const;
export type Vote = (typeof DECK_VALUES)[number];

/** Guarda genérico para uniões de string — antes 3x `typeof+includes`. */
function isOneOf<const T extends readonly string[]>(
	values: T,
	value: unknown,
): value is T[number] {
	return (
		typeof value === "string" &&
		(values as readonly string[]).includes(value)
	);
}

export function isDeckValue(value: unknown): value is Vote {
	return isOneOf(DECK_VALUES, value);
}

export interface Player {
	id: string;
	uuid: string;
	nick: string;
	role: Role;
	seatIndex: number;
	hasVoted: boolean;
	value: Vote | string | null;
	status: PlayerStatus;
	joinedAt: number;
}

export interface SalaState {
	code: string;
	hostId: string | null;
	players: Player[];
	phase: Phase;
	round: number;
	timer: number;
	votes: Record<string, Vote | string>;
	createdAt: number;
}

export interface HelloPayload {
	uuid: string;
	nick: string;
	code?: string;
	spectate?: boolean;
}

export interface WelcomePayload {
	playerId: string;
	role: Role;
	sala: SalaState;
}

export interface RoomStatePayload {
	sala: SalaState;
	critical?: boolean;
}

export interface ServerErrorPayload {
	code: string;
	message: string;
}

export interface CastVotePayload {
	value: Vote;
}

export function buildCastVoteMessage(value: Vote): {
	type: "cast_vote";
	payload: CastVotePayload;
} {
	return { type: "cast_vote", payload: { value } };
}

export function buildRevealVotesMessage(): {
	type: "reveal_votes";
	payload: Record<string, never>;
} {
	return { type: "reveal_votes", payload: {} };
}

export function buildStartNewRoundMessage(): {
	type: "start_new_round";
	payload: Record<string, never>;
} {
	return { type: "start_new_round", payload: {} };
}

/**
 * Ticket 09: saída voluntária. O servidor remove o Player da sala e
 * broadcast `player_left` + `room_state` para os demais em tempo real
 * (com promoção de host quando o Host sai). F5/recarregamento NÃO envia
 * — só o botão "Sair da sala" — para o reload cair no reconnect via UUID.
 */
export function buildLeaveRoomMessage(): {
	type: "leave_room";
	payload: Record<string, never>;
} {
	return { type: "leave_room", payload: {} };
}

/**
 * Projéteis pós-reveal (issue #157 — 7 interações com cooldown).
 * Espelho do `ProjectileTypeSchema` do contrato compartilhado:
 * bola de papel, tomate, café, pato, estrela, coração, aplausos.
 */
export const PROJECTILE_TYPES = [
	"paper_ball",
	"tomato",
	"coffee",
	"rubber_duck",
	"star",
	"heart",
	"claps",
] as const;
export type ProjectileType = (typeof PROJECTILE_TYPES)[number];

export const PROJECTILE_OUTCOMES = ["hit", "dodge", "deflect"] as const;
export type ProjectileOutcome = (typeof PROJECTILE_OUTCOMES)[number];

export function isProjectileType(value: unknown): value is ProjectileType {
	return isOneOf(PROJECTILE_TYPES, value);
}

export function isProjectileOutcome(
	value: unknown,
): value is ProjectileOutcome {
	return isOneOf(PROJECTILE_OUTCOMES, value);
}

export interface ThrowProjectilePayload {
	targetPlayerId: string;
	projectileType: ProjectileType;
}

export interface ProjectileThrownPayload {
	senderPlayerId: string;
	targetPlayerId: string;
	projectileType: ProjectileType;
	outcome: ProjectileOutcome;
}

export function buildThrowProjectileMessage(
	targetPlayerId: string,
	projectileType: ProjectileType,
): {
	type: "throw_projectile";
	payload: ThrowProjectilePayload;
} {
	return {
		type: "throw_projectile",
		payload: { targetPlayerId, projectileType },
	};
}

export type ClientToServerEvent =
	| { type: "hello"; payload: HelloPayload }
	| { type: "cast_vote"; payload: CastVotePayload }
	| { type: "reveal_votes"; payload: Record<string, never> }
	| { type: "start_new_round"; payload: Record<string, never> }
	| { type: "leave_room"; payload: Record<string, never> }
	| { type: "throw_projectile"; payload: ThrowProjectilePayload }
	| { type: "ping"; payload: Record<string, never> };

export type ServerToClientEvent =
	| { type: "welcome"; payload: WelcomePayload }
	| { type: "room_state"; payload: RoomStatePayload }
	| { type: "projectile_thrown"; payload: ProjectileThrownPayload }
	| { type: "pong"; payload: Record<string, never> }
	| { type: "error"; payload: ServerErrorPayload };

function isSalaState(value: unknown): value is SalaState {
	if (typeof value !== "object" || value === null) return false;
	const sala = value as Record<string, unknown>;
	return (
		typeof sala.code === "string" &&
		Array.isArray(sala.players) &&
		typeof sala.round === "number" &&
		typeof sala.timer === "number" &&
		typeof sala.phase === "string" &&
		typeof sala.votes === "object" &&
		sala.votes !== null
	);
}

/**
 * Validação estrutural mínima de um evento vindo do servidor. Retorna null
 * para JSON inválido, formato desconhecido ou payload malformado — o chamador
 * ignora em silêncio (compatibilidade com eventos futuros).
 */
export function parseServerEvent(raw: string): ServerToClientEvent | null {
	let json: unknown;
	try {
		json = JSON.parse(raw);
	} catch {
		return null;
	}
	if (typeof json !== "object" || json === null) return null;
	const record = json as Record<string, unknown>;
	if (typeof record.type !== "string") return null;
	if (typeof record.payload !== "object" || record.payload === null) {
		return null;
	}
	switch (record.type) {
		case "welcome": {
			const payload = record.payload as Record<string, unknown>;
			if (
				typeof payload.playerId !== "string" ||
				(payload.role !== "host" &&
					payload.role !== "player" &&
					payload.role !== "spectator")
			) {
				return null;
			}
			if (!isSalaState(payload.sala)) return null;
			return {
				type: "welcome",
				payload: { playerId: payload.playerId, role: payload.role, sala: payload.sala },
			};
		}
		case "room_state": {
			const payload = record.payload as Record<string, unknown>;
			if (!isSalaState(payload.sala)) return null;
			return {
				type: "room_state",
				payload:
					payload.critical === true
						? { sala: payload.sala, critical: true }
						: { sala: payload.sala },
			};
		}
		case "pong":
			return { type: "pong", payload: {} };
		case "projectile_thrown": {
			const payload = record.payload as Record<string, unknown>;
			if (
				typeof payload.senderPlayerId !== "string" ||
				payload.senderPlayerId.length === 0 ||
				typeof payload.targetPlayerId !== "string" ||
				payload.targetPlayerId.length === 0 ||
				!isProjectileType(payload.projectileType) ||
				!isProjectileOutcome(payload.outcome)
			) {
				return null;
			}
			return {
				type: "projectile_thrown",
				payload: {
					senderPlayerId: payload.senderPlayerId,
					targetPlayerId: payload.targetPlayerId,
					projectileType: payload.projectileType,
					outcome: payload.outcome,
				},
			};
		}
		case "error": {
			const payload = record.payload as Record<string, unknown>;
			if (typeof payload.code !== "string" || typeof payload.message !== "string") {
				return null;
			}
			return {
				type: "error",
				payload: { code: payload.code, message: payload.message },
			};
		}
		default:
			return null;
	}
}
