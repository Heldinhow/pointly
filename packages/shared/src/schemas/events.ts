/**
 * WebSocket event payload schemas — Pointly
 *
 * Phase 2 (T8). Toda mensagem C↔S é validada via Zod no boundary.
 * Server e client importam os mesmos schemas do `@planning-poker/shared`,
 * garantindo paridade estrutural (vide ADR-0008).
 *
 * @see .specs/features/planning-poker-v1/spec.md (WebSocket Protocol)
 */
import { z } from "zod";
import {
	RoomCodeSchema,
	SalaStateSchema,
	UuidSchema,
	NickSchema,
} from "./sala";

// ---------------------------------------------------------------------------
// Client → Server events
// ---------------------------------------------------------------------------

/**
 * `hello` — primeira mensagem após upgrade WS. Cria sala se sem code, ou
 * faz join se com code. Reconnect: uuid conhecida reidrata player existente (T13a).
 */
export const HelloPayloadSchema = z.object({
	uuid: UuidSchema,
	nick: NickSchema,
	code: RoomCodeSchema.optional(),
});
export type HelloPayload = z.infer<typeof HelloPayloadSchema>;

/**
 * `cast_vote { value }` — jogador registra voto na rodada atual.
 * Un-vote (value=null) é rejeitado pelo server (T14: `invalid_vote`).
 */
export const CastVotePayloadSchema = z
	.object({
		value: z.union([
			z.enum(["0", "½", "1", "2", "3", "5", "8", "13", "☕"]),
			z.null(),
		]),
	})
	.strict();
export type CastVotePayload = z.infer<typeof CastVotePayloadSchema>;

/** `reveal_votes { }` — qualquer player pode revelar (ADR-0002 grilling). */
export const RevealVotesPayloadSchema = z.object({}).strict();
export type RevealVotesPayload = z.infer<typeof RevealVotesPayloadSchema>;

/** `start_new_round { }` — qualquer player inicia nova rodada (ADR-0002). */
export const StartNewRoundPayloadSchema = z.object({}).strict();
export type StartNewRoundPayload = z.infer<typeof StartNewRoundPayloadSchema>;

/** `leave_room { }` — saída voluntária. server remove da sala (T18). */
export const LeaveRoomPayloadSchema = z.object({}).strict();
export type LeaveRoomPayload = z.infer<typeof LeaveRoomPayloadSchema>;

/** `ping { }` — heartbeat client→server (T17). Sem payload. */
export const PingPayloadSchema = z.object({}).strict();
export type PingPayload = z.infer<typeof PingPayloadSchema>;

export const ProjectileTypeSchema = z.enum([
	"paper_ball",
	"tomato",
	"coffee",
	"rubber_duck",
	"star",
	"heart",
	"claps",
]);
export type ProjectileType = z.infer<typeof ProjectileTypeSchema>;

export const ThrowProjectilePayloadSchema = z
	.object({
		targetPlayerId: z.string().min(1),
		projectileType: ProjectileTypeSchema,
	})
	.strict();
export type ThrowProjectilePayload = z.infer<
	typeof ThrowProjectilePayloadSchema
>;

/**
 * Discriminated union de todos os eventos C→S.
 * Server dispatcha por `event.type` (T17).
 */
export const ClientToServerEventSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("hello"), payload: HelloPayloadSchema }),
	z.object({ type: z.literal("cast_vote"), payload: CastVotePayloadSchema }),
	z.object({
		type: z.literal("reveal_votes"),
		payload: RevealVotesPayloadSchema,
	}),
	z.object({
		type: z.literal("start_new_round"),
		payload: StartNewRoundPayloadSchema,
	}),
	z.object({ type: z.literal("leave_room"), payload: LeaveRoomPayloadSchema }),
	z.object({ type: z.literal("ping"), payload: PingPayloadSchema }),
	z.object({
		type: z.literal("throw_projectile"),
		payload: ThrowProjectilePayloadSchema,
	}),
]);
export type ClientToServerEvent = z.infer<typeof ClientToServerEventSchema>;

// ---------------------------------------------------------------------------
// Server → Client events
// ---------------------------------------------------------------------------

/**
 * Roles of a player in a sala (re-export for clarity in welcome).
 */
import { RoleSchema } from "./sala";

/**
 * `welcome` — server aceita o `hello`. client deve armazenar `playerId` pra
 * correlacionar broadcasts futuros.
 */
export const WelcomeResponseSchema = z.object({
	playerId: z.string().min(1),
	role: RoleSchema,
	sala: SalaStateSchema,
});
export type WelcomeResponse = z.infer<typeof WelcomeResponseSchema>;

/**
 * `room_state` — snapshot completo após mudança (join, vote, reveal, etc.).
 * Hydrata o Zustand store no client (T22).
 */
export const RoomStateResponseSchema = z.object({
	sala: SalaStateSchema,
	/** timer ≤30s entra em estado coral (UI critical). Spec US-2 AC5. */
	critical: z.boolean().optional(),
});
export type RoomStateResponse = z.infer<typeof RoomStateResponseSchema>;

/** `player_joined` — outro player entrou na sala. */
export const PlayerJoinedEventSchema = z.object({
	player: z.lazy(() =>
		z.object({
			id: z.string().min(1),
			nick: NickSchema,
			seatIndex: z.number().int().min(0).max(11),
			role: RoleSchema,
		}),
	),
});
export type PlayerJoinedEvent = z.infer<typeof PlayerJoinedEventSchema>;

/** `player_left` — outro player saiu ou desconectou. */
export const PlayerLeftEventSchema = z.object({
	playerId: z.string().min(1),
});
export type PlayerLeftEvent = z.infer<typeof PlayerLeftEventSchema>;

/**
 * `vote_cast` — alguém votou (valor NÃO exposto pré-reveal).
 * Discriminated union:
 *   - `kind: 'individual'`  → primeiro voto real da rodada (toast com nome)
 *   - `kind: 'aggregate'`   → votos seguintes (toast "Mais N escolheram")
 *
 * @see spec US-2 AC8
 */
export const VoteCastEventSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("individual"),
		playerId: z.string().min(1),
		playerName: NickSchema,
	}),
	z.object({
		kind: z.literal("aggregate"),
		count: z.number().int().positive(),
	}),
]);
export type VoteCastEvent = z.infer<typeof VoteCastEventSchema>;

/**
 * `votes_revealed` — server broadcast ao virar face-up. Inclui unanimity.
 * Spec US-3 AC2/AC3.
 */
export const VotesRevealedEventSchema = z.object({
	votes: z.record(
		z.string(),
		z.enum(["0", "½", "1", "2", "3", "5", "8", "13", "☕", "☕"]),
	),
	/** mediana (cardinal ou meio entre dois centrais para count par). */
	median: z.number().nullable(),
	/** média aritmética, excluindo ☕. null quando 0 votos numéricos. */
	mean: z.number().nullable(),
	/** [min, max] numérico. null quando 0 votos numéricos. */
	range: z.tuple([z.number(), z.number()]).nullable(),
	/** true quando todos os votos não-nulos são iguais. */
	unanimous: z.boolean(),
});
export type VotesRevealedEvent = z.infer<typeof VotesRevealedEventSchema>;

/** `round_started` — host clicou nova rodada. votes limpos, timer reset. */
export const RoundStartedEventSchema = z.object({
	round: z.number().int().positive(),
});
export type RoundStartedEvent = z.infer<typeof RoundStartedEventSchema>;

/**
 * `sala_ended` — sala terminou por um motivo estrutural. Client deve redirecionar.
 * Reconnect para sala inexistente recebe este evento (ADR-0009).
 */
export const SalaEndedReasonSchema = z.enum([
	"last_left", // último player saiu
	"server_restart", // servidor vai reiniciar
	"replaced", // multi-tab: segunda aba tomou o lugar
]);
export type SalaEndedReason = z.infer<typeof SalaEndedReasonSchema>;

export const SalaEndedEventSchema = z.object({
	reason: SalaEndedReasonSchema,
});
export type SalaEndedEvent = z.infer<typeof SalaEndedEventSchema>;

/**
 * `error` — falha de validação ou regra de negócio. Client redireciona ou mostra toast.
 *
 * @see spec US-1 (invalid_nick, sala_nao_encontrada, sala_cheia)
 * @see spec US-2 AC7 (invalid_phase)
 * @see tasks T14 (invalid_vote)
 */
export const ErrorCodeSchema = z.enum([
	"invalid_nick",
	"sala_nao_encontrada",
	"sala_cheia",
	"invalid_phase",
	"invalid_vote",
	"role_denied", // reservado (não exercitado em v2 democratico, mas parseável)
	"rate_limited", // T17a
	"internal_error",
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ErrorEventSchema = z.object({
	code: ErrorCodeSchema,
	message: z.string().optional(),
});
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

/** `pong { }` — resposta ao ping. Sem payload. */
export const PongPayloadSchema = z.object({}).strict();
export type PongPayload = z.infer<typeof PongPayloadSchema>;

export const ProjectileOutcomeSchema = z.enum(["hit", "dodge", "deflect"]);
export type ProjectileOutcome = z.infer<typeof ProjectileOutcomeSchema>;

export const ProjectileThrownEventSchema = z
	.object({
		senderPlayerId: z.string().min(1),
		targetPlayerId: z.string().min(1),
		projectileType: ProjectileTypeSchema,
		outcome: ProjectileOutcomeSchema,
	})
	.strict();
export type ProjectileThrownEvent = z.infer<typeof ProjectileThrownEventSchema>;

/**
 * Discriminated union de todos os eventos S→C.
 * Client dispatcha por `event.type` (T23).
 */
export const ServerToClientEventSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("welcome"), payload: WelcomeResponseSchema }),
	z.object({ type: z.literal("room_state"), payload: RoomStateResponseSchema }),
	z.object({
		type: z.literal("player_joined"),
		payload: PlayerJoinedEventSchema,
	}),
	z.object({ type: z.literal("player_left"), payload: PlayerLeftEventSchema }),
	z.object({ type: z.literal("vote_cast"), payload: VoteCastEventSchema }),
	z.object({
		type: z.literal("votes_revealed"),
		payload: VotesRevealedEventSchema,
	}),
	z.object({
		type: z.literal("round_started"),
		payload: RoundStartedEventSchema,
	}),
	z.object({ type: z.literal("sala_ended"), payload: SalaEndedEventSchema }),
	z.object({ type: z.literal("error"), payload: ErrorEventSchema }),
	z.object({ type: z.literal("pong"), payload: PongPayloadSchema }),
	z.object({
		type: z.literal("projectile_thrown"),
		payload: ProjectileThrownEventSchema,
	}),
]);
export type ServerToClientEvent = z.infer<typeof ServerToClientEventSchema>;
