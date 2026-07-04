/**
 * Sala domain schemas — Pointly
 *
 * Phase 2 (T7). Estado canônico da sala, jogador, voto e fase.
 *
 * @see docs/adr/0005-v1-functional-in-memory-state.md  (Sala em Map<codigo, Sala>)
 * @see docs/adr/0009-reconnect-uuid-strategy.md         (UUID client-side, sala reidrata)
 * @see CONTEXT.md                                       (glossário 12 termos)
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * Código curto de 4 caracteres alfanuméricos (A–Z, 0–9).
 * Gerado client-side via `generateUniqueCode` (T7a).
 */
export const RoomCodeSchema = z
	.string()
	.regex(/^[A-Z0-9]{4}$/, "code deve ter 4 chars [A-Z0-9]");

/**
 * UUID v4 string. Server pode armazenar como reconnect handle.
 * Validamos formato UUID RFC 4122.
 */
export const UuidSchema = z.string().uuid();

/**
 * Apelido do jogador. 2–20 chars, sem espaços duplos, sem espaços nas pontas.
 * Validação aplicada tanto aqui quanto no server (T13).
 */
export const NickSchema = z
	.string()
	.min(2, "apelido: mínimo 2 chars")
	.max(20, "apelido: máximo 20 chars")
	.refine((s) => s === s.trim(), "apelido: sem espaços nas pontas")
	.refine((s) => !/ {2,}/.test(s), "apelido: sem espaços duplos");

/**
 * Papel dentro da sala. v2 democratico: host é só criador (ADR 0002 grilling).
 */
export const RoleSchema = z.enum(["host", "player"]);

/**
 * Conexão WS momentânea — sala "limpa" players disconnected > 60s (T12a).
 */
export const PlayerStatusSchema = z.enum(["connected", "disconnected"]);

// ---------------------------------------------------------------------------
// Deck + Vote
// ---------------------------------------------------------------------------

/**
 * 9 cartas do deck Fibonacci + pausa explícita. (ADR-0001)
 *
 * Imutável — frozen const-array. Importada por:
 * - T32 (Deck component, frontend)
 * - T9  (computeConsensus: filtra ☕ antes do cálculo)
 * - T14 (cast_vote valida value ∈ DECK_VALUES)
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
export type DeckValue = (typeof DECK_VALUES)[number];

export const VoteSchema = z.enum(DECK_VALUES);
export type Vote = z.infer<typeof VoteSchema>;

// ---------------------------------------------------------------------------
// Phase
// ---------------------------------------------------------------------------

/**
 * Estado da rodada (ADR-0002 grilling: reveal/new_round democratizados).
 *
 *   idle        — round zerado, sem votos. Aguardando 1º voto.
 *   voting      — ≥1 voto entrou. Timer 60s rodando.
 *   revealable  — todos conectados votaram (pre-reveal). UI mostra "Revelar votos".
 *   revealed    — votos virados face-up, stats calculadas. Aguardando "Nova rodada".
 */
export const PhaseSchema = z.enum(["idle", "voting", "revealable", "revealed"]);
export type Phase = z.infer<typeof PhaseSchema>;

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

/**
 * Player. id (server) ≠ uuid (client). Vide ADR-0009.
 * uuid persistido em localStorage permite reconnect enquanto sala existe.
 */
export const PlayerSchema = z.object({
	/** server-assigned stable ID (imutável durante a vida da sala) */
	id: z.string().min(1),
	/** client-generated v4 UUID (reconnect handle — ADR-0009) */
	uuid: UuidSchema,
	/** apelido visível */
	nick: NickSchema,
	role: RoleSchema,
	/** posição fixa na mesa (0..11). Atribuída no hello handler (T13). */
	seatIndex: z.number().int().min(0).max(11),
	/** voto já registrado nesta rodada. Limpo em start_new_round (T16). */
	hasVoted: z.boolean(),
	/** voto escolhido. `null` quando `hasVoted: false` ou un-voted. */
	value: VoteSchema.nullable(),
	/** conexão WS momentânea. disconnected > 60s = remoção (T12a). */
	status: PlayerStatusSchema,
	/** epoch ms. Usado por promoteOldestPlayer (T12a) e ordenação. */
	joinedAt: z.number().int().positive(),
});

export type Player = z.infer<typeof PlayerSchema>;

// ---------------------------------------------------------------------------
// SalaState
// ---------------------------------------------------------------------------

/**
 * Snapshot serializável da sala — wire format pra `room_state` event.
 *
 * No servidor, `Sala` (Phase 3 — T12) é um objeto em memória com `Map<id, Player>`
 * pra O(1) lookup. Pra mandar pelo WS, normalizamos pra `SalaState` (este schema).
 *
 * Hidratação: client recebe SalaState e popula Zustand store (T22).
 */
export const SalaStateSchema = z.object({
	/** código curto 4-char alfanumérico */
	code: RoomCodeSchema,
	/** ID do player host (criador). Pode ser null brevemente durante cleanup (T18). */
	hostId: z.string().nullable(),
	players: z.array(PlayerSchema).max(12),
	phase: PhaseSchema,
	/** contador da rodada (1-based). Incrementa em start_new_round (T16). */
	round: z.number().int().min(0),
	/** segundos restantes do timer. 60 = início, 30 = critical, 0 = auto-reveal. */
	timer: z.number().int().min(0).max(60),
	/** mapa playerId → Vote (apenas quem votou nesta rodada). */
	votes: z.record(z.string(), VoteSchema),
	/** epoch ms — usado pelo client pra detectar sala stale. */
	createdAt: z.number().int().positive(),
});

export type SalaState = z.infer<typeof SalaStateSchema>;
