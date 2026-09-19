/**
 * WS event schema tests — T8 verify (≥16 unit tests).
 *
 * Cobre C↔S payload validation + discriminated unions.
 */
import { describe, expect, test } from "bun:test";
import {
	CastVotePayloadSchema,
	ClientToServerEventSchema,
	ErrorCodeSchema,
	ErrorEventSchema,
	HelloPayloadSchema,
	LeaveRoomPayloadSchema,
	NudgeIdSchema,
	NudgeSentEventSchema,
	PingPayloadSchema,
	PlayerJoinedEventSchema,
	PlayerLeftEventSchema,
	PongPayloadSchema,
	RevealVotesPayloadSchema,
	RoundStartedEventSchema,
	SalaEndedEventSchema,
	SalaEndedReasonSchema,
	SendNudgePayloadSchema,
	ServerToClientEventSchema,
	StartNewRoundPayloadSchema,
	UpdateAvatarPayloadSchema,
	VoteCastEventSchema,
	VotesRevealedEventSchema,
	WelcomeResponseSchema,
} from "./events";

// (RoleSchema is imported transitively via WelcomeResponseSchema — its values
// are exercised in the WelcomeResponse tests above.)

// ---------------------------------------------------------------------------
// Client → Server
// ---------------------------------------------------------------------------

describe("HelloPayloadSchema", () => {
	test("aceita hello com code (join)", () => {
		const r = HelloPayloadSchema.safeParse({
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			nick: "Ana",
			code: "ABCD",
		});
		expect(r.success).toBe(true);
	});

	test("aceita hello sem code (criar sala)", () => {
		const r = HelloPayloadSchema.safeParse({
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			nick: "Ana",
		});
		expect(r.success).toBe(true);
	});

	test("rejeita uuid malformado", () => {
		const r = HelloPayloadSchema.safeParse({
			uuid: "not-uuid",
			nick: "Ana",
		});
		expect(r.success).toBe(false);
	});

	test("rejeita nick inválido (espaço duplo)", () => {
		const r = HelloPayloadSchema.safeParse({
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			nick: "Ana  Maria",
		});
		expect(r.success).toBe(false);
	});
});

describe("CastVotePayloadSchema", () => {
	test("aceita votos válidos", () => {
		for (const v of ["0", "½", "1", "2", "3", "5", "8", "13", "☕"] as const) {
			expect(CastVotePayloadSchema.safeParse({ value: v }).success).toBe(true);
		}
	});

	test("aceita value: null (change-vote to nil — server rejeita depois via business rule)", () => {
		expect(CastVotePayloadSchema.safeParse({ value: null }).success).toBe(true);
	});

	test("rejeita valor fora do deck", () => {
		expect(CastVotePayloadSchema.safeParse({ value: "42" }).success).toBe(
			false,
		);
	});

	test("rejeita payload extra (strict)", () => {
		expect(
			CastVotePayloadSchema.safeParse({ value: "5", foo: "bar" }).success,
		).toBe(false);
	});
});

describe("Payloads sem campos extras (strict)", () => {
	test("RevealVotesPayload aceita {}", () => {
		expect(RevealVotesPayloadSchema.safeParse({}).success).toBe(true);
		expect(RevealVotesPayloadSchema.safeParse({ foo: 1 }).success).toBe(false);
	});

	test("StartNewRoundPayload aceita {}", () => {
		expect(StartNewRoundPayloadSchema.safeParse({}).success).toBe(true);
		expect(StartNewRoundPayloadSchema.safeParse({ extra: true }).success).toBe(
			false,
		);
	});

	test("LeaveRoomPayload aceita {}", () => {
		expect(LeaveRoomPayloadSchema.safeParse({}).success).toBe(true);
	});

	test("PingPayload aceita {}", () => {
		expect(PingPayloadSchema.safeParse({}).success).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Server → Client
// ---------------------------------------------------------------------------

describe("WelcomeResponseSchema", () => {
	const validSala = {
		code: "ABCD",
		hostId: "p1",
		players: [
			{
				id: "p1",
				uuid: "550e8400-e29b-41d4-a716-446655440000",
				nick: "Ana",
				role: "host",
				seatIndex: 0,
				hasVoted: false,
				value: null,
				status: "connected",
				joinedAt: 1700000000000,
			},
		],
		phase: "idle",
		round: 1,
		votes: {},
		createdAt: 1700000000000,
	};

	test("aceita welcome host", () => {
		const r = WelcomeResponseSchema.safeParse({
			playerId: "p1",
			role: "host",
			sala: validSala,
		});
		expect(r.success).toBe(true);
	});

	test("aceita welcome player (joining existing sala)", () => {
		const r = WelcomeResponseSchema.safeParse({
			playerId: "p2",
			role: "player",
			sala: validSala,
		});
		expect(r.success).toBe(true);
	});

	test("rejeita role inválida", () => {
		const r = WelcomeResponseSchema.safeParse({
			playerId: "p1",
			role: "admin",
			sala: validSala,
		});
		expect(r.success).toBe(false);
	});
});

describe("PlayerJoinedEventSchema + PlayerLeftEventSchema", () => {
	test("PlayerJoined aceita payload novo", () => {
		const r = PlayerJoinedEventSchema.safeParse({
			player: {
				id: "p2",
				nick: "Bob",
				seatIndex: 1,
				role: "player",
			},
		});
		expect(r.success).toBe(true);
	});

	test("PlayerLeft aceita { playerId }", () => {
		const r = PlayerLeftEventSchema.safeParse({ playerId: "p2" });
		expect(r.success).toBe(true);
	});
});

describe("VoteCastEventSchema (discriminated union)", () => {
	test("aceita kind: 'individual'", () => {
		const r = VoteCastEventSchema.safeParse({
			kind: "individual",
			playerId: "p1",
			playerName: "Ana",
		});
		expect(r.success).toBe(true);
	});

	test("aceita kind: 'aggregate' com count > 0", () => {
		const r = VoteCastEventSchema.safeParse({ kind: "aggregate", count: 3 });
		expect(r.success).toBe(true);
	});

	test("rejeita kind: 'aggregate' com count <= 0", () => {
		expect(
			VoteCastEventSchema.safeParse({ kind: "aggregate", count: 0 }).success,
		).toBe(false);
		expect(
			VoteCastEventSchema.safeParse({ kind: "aggregate", count: -1 }).success,
		).toBe(false);
	});

	test("rejeita kind desconhecido", () => {
		const r = VoteCastEventSchema.safeParse({
			kind: "all",
			playerId: "p1",
			playerName: "Ana",
		});
		expect(r.success).toBe(false);
	});
});

describe("VotesRevealedEventSchema", () => {
	test("aceita payload com range tuple", () => {
		const r = VotesRevealedEventSchema.safeParse({
			votes: { p1: "5", p2: "8" },
			median: 6.5,
			mean: 6.5,
			range: [5, 8],
			unanimous: false,
		});
		expect(r.success).toBe(true);
	});

	test("aceita median/mean/range null (sem votos numéricos)", () => {
		const r = VotesRevealedEventSchema.safeParse({
			votes: { p1: "☕" },
			median: null,
			mean: null,
			range: null,
			unanimous: false,
		});
		expect(r.success).toBe(true);
	});

	test("rejeita range com tamanho errado", () => {
		const r = VotesRevealedEventSchema.safeParse({
			votes: { p1: "5" },
			median: 5,
			mean: 5,
			range: [5],
			unanimous: true,
		});
		expect(r.success).toBe(false);
	});
});

describe("RoundStartedEventSchema + SalaEndedEventSchema", () => {
	test("RoundStarted aceita round positivo", () => {
		expect(RoundStartedEventSchema.safeParse({ round: 1 }).success).toBe(true);
		expect(RoundStartedEventSchema.safeParse({ round: 99 }).success).toBe(true);
	});

	test("SalaEnded aceita reasons conhecidos", () => {
		for (const reason of ["last_left", "server_restart", "replaced"] as const) {
			expect(SalaEndedEventSchema.safeParse({ reason }).success).toBe(true);
		}
	});

	test("SalaEnded rejeita reason desconhecido", () => {
		expect(SalaEndedEventSchema.safeParse({ reason: "fogo" }).success).toBe(
			false,
		);
	});

	test("SalaEndedReasonSchema é enum estrito", () => {
		expect(SalaEndedReasonSchema.options).toEqual([
			"last_left",
			"server_restart",
			"replaced",
		]);
	});
});

describe("ErrorEventSchema", () => {
	test("ErrorCodeSchema cobre todos os códigos documentados", () => {
		expect(ErrorCodeSchema.options).toContain("invalid_nick");
		expect(ErrorCodeSchema.options).toContain("sala_nao_encontrada");
		expect(ErrorCodeSchema.options).toContain("sala_cheia");
		expect(ErrorCodeSchema.options).toContain("invalid_phase");
		expect(ErrorCodeSchema.options).toContain("invalid_vote");
		expect(ErrorCodeSchema.options).toContain("rate_limited");
		expect(ErrorCodeSchema.options).toContain("internal_error");
	});

	test("ErrorEvent aceita code conhecido sem message", () => {
		expect(ErrorEventSchema.safeParse({ code: "sala_cheia" }).success).toBe(
			true,
		);
	});

	test("ErrorEvent aceita message opcional", () => {
		expect(
			ErrorEventSchema.safeParse({
				code: "invalid_nick",
				message: "Mínimo 2 chars.",
			}).success,
		).toBe(true);
	});

	test("ErrorEvent rejeita code desconhecido", () => {
		expect(ErrorEventSchema.safeParse({ code: "fogo" }).success).toBe(false);
	});
});

describe("PongPayloadSchema", () => {
	test("aceita {}", () => {
		expect(PongPayloadSchema.safeParse({}).success).toBe(true);
		expect(PongPayloadSchema.safeParse({ extra: true }).success).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Discriminated unions full
// ---------------------------------------------------------------------------

describe("ClientToServerEventSchema (discriminated union)", () => {
	test("aceita cada um dos 6 tipos", () => {
		const samples = [
			{
				type: "hello" as const,
				payload: { uuid: "550e8400-e29b-41d4-a716-446655440000", nick: "Ana" },
			},
			{ type: "cast_vote" as const, payload: { value: "5" as const } },
			{ type: "reveal_votes" as const, payload: {} },
			{ type: "start_new_round" as const, payload: {} },
			{ type: "leave_room" as const, payload: {} },
			{ type: "ping" as const, payload: {} },
		];
		for (const sample of samples) {
			expect(ClientToServerEventSchema.safeParse(sample).success).toBe(true);
		}
	});

	test("rejeita type desconhecido", () => {
		const r = ClientToServerEventSchema.safeParse({
			type: "magic",
			payload: {},
		});
		expect(r.success).toBe(false);
	});
});

describe("ServerToClientEventSchema (discriminated union)", () => {
	const baseSala = {
		code: "ABCD",
		hostId: "p1",
		players: [],
		phase: "revealed" as const,
		round: 1,
		votes: {},
		createdAt: 1700000000000,
	};

	test("aceita welcome válido", () => {
		const r = ServerToClientEventSchema.safeParse({
			type: "welcome",
			payload: { playerId: "p1", role: "host" as const, sala: baseSala },
		});
		expect(r.success).toBe(true);
	});

	test("aceita room_state válido", () => {
		const r = ServerToClientEventSchema.safeParse({
			type: "room_state",
			payload: { sala: baseSala },
		});
		expect(r.success).toBe(true);
	});

	test("aceita vote_cast individual", () => {
		const r = ServerToClientEventSchema.safeParse({
			type: "vote_cast",
			payload: { kind: "individual", playerId: "p1", playerName: "Ana" },
		});
		expect(r.success).toBe(true);
	});

	test("aceita votes_revealed com unanimous true", () => {
		const r = ServerToClientEventSchema.safeParse({
			type: "votes_revealed",
			payload: {
				votes: { p1: "5", p2: "5" },
				median: 5,
				mean: 5,
				range: [5, 5],
				unanimous: true,
			},
		});
		expect(r.success).toBe(true);
	});

	test("aceita round_started", () => {
		const r = ServerToClientEventSchema.safeParse({
			type: "round_started",
			payload: { round: 2 },
		});
		expect(r.success).toBe(true);
	});

	test("aceita sala_ended server_restart", () => {
		const r = ServerToClientEventSchema.safeParse({
			type: "sala_ended",
			payload: { reason: "server_restart" },
		});
		expect(r.success).toBe(true);
	});

	test("aceita error com code conhecido", () => {
		const r = ServerToClientEventSchema.safeParse({
			type: "error",
			payload: { code: "sala_cheia", message: "12/12" },
		});
		expect(r.success).toBe(true);
	});

	test("aceita pong", () => {
		const r = ServerToClientEventSchema.safeParse({
			type: "pong",
			payload: {},
		});
		expect(r.success).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Cutucadas (issue #172)
// ---------------------------------------------------------------------------

describe("NudgeIdSchema + SendNudgePayloadSchema", () => {
	test("cobre exatamente as 4 cutucadas fixas", () => {
		expect(NudgeIdSchema.options).toEqual([
			"bora",
			"cafe",
			"polemica",
			"confia",
		]);
	});

	test("aceita send_nudge válido", () => {
		const r = SendNudgePayloadSchema.safeParse({
			targetPlayerId: "p2",
			nudgeId: "bora",
		});
		expect(r.success).toBe(true);
	});

	test("rejeita nudgeId fora do catálogo", () => {
		const r = SendNudgePayloadSchema.safeParse({
			targetPlayerId: "p2",
			nudgeId: "texto_livre",
		});
		expect(r.success).toBe(false);
	});

	test("rejeita targetPlayerId vazio", () => {
		const r = SendNudgePayloadSchema.safeParse({
			targetPlayerId: "",
			nudgeId: "cafe",
		});
		expect(r.success).toBe(false);
	});

	test("rejeita payload extra (strict)", () => {
		const r = SendNudgePayloadSchema.safeParse({
			targetPlayerId: "p2",
			nudgeId: "confia",
			text: "oi",
		});
		expect(r.success).toBe(false);
	});
});

describe("NudgeSentEventSchema", () => {
	test("aceita nudge_sent válido com sender + target", () => {
		const r = NudgeSentEventSchema.safeParse({
			senderPlayerId: "p1",
			targetPlayerId: "p2",
			nudgeId: "polemica",
		});
		expect(r.success).toBe(true);
	});

	test("rejeita nudgeId desconhecido", () => {
		const r = NudgeSentEventSchema.safeParse({
			senderPlayerId: "p1",
			targetPlayerId: "p2",
			nudgeId: "fire",
		});
		expect(r.success).toBe(false);
	});
});

describe("Discriminated unions com send_nudge/nudge_sent", () => {
	test("ClientToServerEventSchema dispatch send_nudge", () => {
		const r = ClientToServerEventSchema.safeParse({
			type: "send_nudge",
			payload: { targetPlayerId: "p2", nudgeId: "bora" },
		});
		expect(r.success).toBe(true);
	});

	test("ServerToClientEventSchema aceita nudge_sent", () => {
		const r = ServerToClientEventSchema.safeParse({
			type: "nudge_sent",
			payload: {
				senderPlayerId: "p1",
				targetPlayerId: "p2",
				nudgeId: "cafe",
			},
		});
		expect(r.success).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Avatar na mesa (T2, AV-03)
// ---------------------------------------------------------------------------

describe("HelloPayloadSchema avatar", () => {
	const UUID = "550e8400-e29b-41d4-a716-446655440000";
	const JPEG = "data:image/jpeg;base64,/9j/4AAQ";

	test("aceita hello com avatar válido", () => {
		const r = HelloPayloadSchema.safeParse({ uuid: UUID, nick: "Ana", avatar: JPEG });
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.avatar).toBe(JPEG);
	});

	test("aceita hello sem avatar (fallback iniciais)", () => {
		const r = HelloPayloadSchema.safeParse({ uuid: UUID, nick: "Ana" });
		expect(r.success).toBe(true);
	});

	test("rejeita hello com avatar acima do teto", () => {
		const oversized = `data:image/jpeg;base64,${"A".repeat(40000)}`;
		const r = HelloPayloadSchema.safeParse({ uuid: UUID, nick: "Ana", avatar: oversized });
		expect(r.success).toBe(false);
	});
});

describe("UpdateAvatarPayloadSchema", () => {
	test("aceita set com dataURL válida", () => {
		const r = UpdateAvatarPayloadSchema.safeParse({
			avatar: "data:image/png;base64,iVBORw0KGgo=",
		});
		expect(r.success).toBe(true);
	});

	test("aceita clear com avatar null", () => {
		const r = UpdateAvatarPayloadSchema.safeParse({ avatar: null });
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.avatar).toBeNull();
	});

	test("rejeita avatar acima do teto", () => {
		const oversized = `data:image/webp;base64,${"A".repeat(40000)}`;
		expect(UpdateAvatarPayloadSchema.safeParse({ avatar: oversized }).success).toBe(false);
	});

	test("rejeita formato fora do v1 (gif)", () => {
		expect(
			UpdateAvatarPayloadSchema.safeParse({ avatar: "data:image/gif;base64,R0lGODlh" })
				.success,
		).toBe(false);
	});
});

describe("ClientToServerEventSchema update_avatar", () => {
	test("dispatch update_avatar set via união", () => {
		const r = ClientToServerEventSchema.safeParse({
			type: "update_avatar",
			payload: { avatar: "data:image/jpeg;base64,/9j/4AAQ" },
		});
		expect(r.success).toBe(true);
	});

	test("dispatch update_avatar clear via união", () => {
		const r = ClientToServerEventSchema.safeParse({
			type: "update_avatar",
			payload: { avatar: null },
		});
		expect(r.success).toBe(true);
	});
});

describe("PlayerJoinedEventSchema avatar", () => {
	test("aceita player_joined sem avatar", () => {
		const r = PlayerJoinedEventSchema.safeParse({
			player: { id: "p2", nick: "Bob", seatIndex: 1, role: "player" },
		});
		expect(r.success).toBe(true);
	});

	test("aceita player_joined com avatar", () => {
		const r = PlayerJoinedEventSchema.safeParse({
			player: {
				id: "p2",
				nick: "Bob",
				seatIndex: 1,
				role: "player",
				avatar: "data:image/webp;base64,UklGRg==",
			},
		});
		expect(r.success).toBe(true);
	});
});

// (RoleSchema imported above; used implicitly in welcome role assertions via the sala schema)
