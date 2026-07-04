/**
 * Smoke test: importa tudo do barrel `@planning-poker/shared` e valida runtime.
 * Confirma que T11 barrel cobre T7-T10 + tipos derivados.
 */
import { describe, expect, test } from "bun:test";
import * as Shared from "./index";

describe("Barrel `@planning-poker/shared` smoke test", () => {
	test("exporta SHARED_SCHEMA_VERSION", () => {
		expect(Shared.SHARED_SCHEMA_VERSION).toBeString();
	});

	test("exporta schemas Zod principais", () => {
		// Schemas sala
		expect(Shared.SalaStateSchema).toBeDefined();
		expect(Shared.PlayerSchema).toBeDefined();
		expect(Shared.PhaseSchema).toBeDefined();
		expect(Shared.VoteSchema).toBeDefined();
		expect(Shared.NickSchema).toBeDefined();
		expect(Shared.RoomCodeSchema).toBeDefined();
		expect(Shared.UuidSchema).toBeDefined();
		expect(Shared.DECK_VALUES).toBeDefined();
		// Schemas events
		expect(Shared.HelloPayloadSchema).toBeDefined();
		expect(Shared.CastVotePayloadSchema).toBeDefined();
		expect(Shared.WelcomeResponseSchema).toBeDefined();
		expect(Shared.VoteCastEventSchema).toBeDefined();
		expect(Shared.VotesRevealedEventSchema).toBeDefined();
		expect(Shared.SalaEndedEventSchema).toBeDefined();
		expect(Shared.ErrorEventSchema).toBeDefined();
		// Discriminated unions
		expect(Shared.ClientToServerEventSchema).toBeDefined();
		expect(Shared.ServerToClientEventSchema).toBeDefined();
	});

	test("exporta funções puras", () => {
		expect(typeof Shared.computeConsensus).toBe("function");
		expect(typeof Shared.isUnanimous).toBe("function");
		expect(typeof Shared.voteToNumber).toBe("function");
	});

	test("exporta utilitários de código", () => {
		expect(typeof Shared.generateUniqueCode).toBeDefined();
		expect(typeof Shared.randomCode).toBe("function");
		expect(Shared.CodeCollisionError).toBeDefined();
	});

	test("end-to-end: valida um SalaState real", () => {
		const sala = {
			code: "X7Y2",
			hostId: "p1",
			players: [
				{
					id: "p1",
					uuid: "550e8400-e29b-41d4-a716-446655440000",
					nick: "Ana",
					role: "host" as const,
					seatIndex: 0,
					hasVoted: true,
					value: "5" as const,
					status: "connected" as const,
					joinedAt: 1700000000000,
				},
			],
			phase: "voting" as const,
			round: 1,
			timer: 45,
			votes: { p1: "5" as const },
			createdAt: 1700000000000,
		};

		const r = Shared.SalaStateSchema.safeParse(sala);
		expect(r.success).toBe(true);

		// computeConsensus roda nesse sala
		const stats = Shared.computeConsensus(["5", "8", "13"] as Shared.Vote[]);
		expect(stats.median).toBe(8);

		// generateUniqueCode retorna código 4-char
		const code = Shared.generateUniqueCode(new Set());
		expect(code).toHaveLength(4);
	});
});
