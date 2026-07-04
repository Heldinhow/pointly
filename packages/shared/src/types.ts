/**
 * @planning-poker/shared — z.infer type re-exports.
 *
 * Phase 2 (T10). Os tipos abaixo são inferidos dos schemas Zod em `./schemas/`.
 * Server (Phase 3+) e client (Phase 5+) consomem esses tipos — não redefinam em lugar nenhum.
 *
 * @see docs/adr/0008-zustand-zod-shared-schemas.md (single source of truth)
 */
export type {
	// Sala core
	DeckValue,
	Phase,
	Player,
	SalaState,
	Vote,
	// Discriminated unions
	ClientToServerEvent,
	ServerToClientEvent,
	// Client → Server payloads
	HelloPayload,
	CastVotePayload,
	RevealVotesPayload,
	StartNewRoundPayload,
	LeaveRoomPayload,
	PingPayload,
	// Server → Client payloads
	WelcomeResponse,
	RoomStateResponse,
	PlayerJoinedEvent,
	PlayerLeftEvent,
	VoteCastEvent,
	VotesRevealedEvent,
	RoundStartedEvent,
	SalaEndedEvent,
	SalaEndedReason,
	ErrorEvent,
	ErrorCode,
	PongPayload,
} from "./schemas/index";

export type { ConsensusStats } from "./compute/consensus";
