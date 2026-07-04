/**
 * Sala schema tests — T7 verify (≥4 unit tests).
 *
 * Bun test runner (vitest-compatible API). Run: `bun test src/`.
 */
import { describe, expect, test } from "bun:test";
import {
	DECK_VALUES,
	NickSchema,
	PhaseSchema,
	PlayerSchema,
	RoomCodeSchema,
	SalaStateSchema,
	VoteSchema,
} from "./sala";

describe("DECK_VALUES", () => {
	test("tem exatamente 9 cartas na sequência Fibonacci + ☕", () => {
		expect(DECK_VALUES).toEqual([
			"0",
			"½",
			"1",
			"2",
			"3",
			"5",
			"8",
			"13",
			"☕",
		]);
		expect(DECK_VALUES).toHaveLength(9);
	});

	test("VoteSchema aceita cada valor do deck", () => {
		for (const value of DECK_VALUES) {
			expect(VoteSchema.parse(value)).toBe(value);
		}
	});

	test("VoteSchema rejeita valor fora do deck", () => {
		const r = VoteSchema.safeParse("42");
		expect(r.success).toBe(false);
	});
});

describe("RoomCodeSchema", () => {
	test("aceita código 4-char alfanumérico válido", () => {
		expect(RoomCodeSchema.parse("ABCD")).toBe("ABCD");
		expect(RoomCodeSchema.parse("X9Y2")).toBe("X9Y2");
		expect(RoomCodeSchema.parse("0000")).toBe("0000");
	});

	test("rejeita código com tamanho errado", () => {
		expect(RoomCodeSchema.safeParse("ABC").success).toBe(false);
		expect(RoomCodeSchema.safeParse("ABCDE").success).toBe(false);
		expect(RoomCodeSchema.safeParse("").success).toBe(false);
	});

	test("rejeita código com chars lowercase ou símbolos", () => {
		expect(RoomCodeSchema.safeParse("abcd").success).toBe(false);
		expect(RoomCodeSchema.safeParse("AB-C").success).toBe(false);
		expect(RoomCodeSchema.safeParse("AB C").success).toBe(false);
	});
});

describe("NickSchema", () => {
	test("aceita nick 2–20 chars alfanumérico/acentos/espaços simples", () => {
		expect(NickSchema.parse("Ana")).toBe("Ana");
		expect(NickSchema.parse("Marília")).toBe("Marília");
		expect(NickSchema.parse("Dev Front")).toBe("Dev Front");
	});

	test("rejeita nick < 2 chars", () => {
		expect(NickSchema.safeParse("A").success).toBe(false);
		expect(NickSchema.safeParse("").success).toBe(false);
	});

	test("rejeita nick > 20 chars", () => {
		expect(NickSchema.safeParse("a".repeat(21)).success).toBe(false);
	});

	test("rejeita nick com espaços duplos", () => {
		expect(NickSchema.safeParse("Dev  Front").success).toBe(false);
	});

	test("rejeita nick com espaço nas pontas", () => {
		expect(NickSchema.safeParse(" Ana").success).toBe(false);
		expect(NickSchema.safeParse("Ana ").success).toBe(false);
	});
});

describe("PhaseSchema", () => {
	test("aceita as 4 fases", () => {
		for (const phase of ["idle", "voting", "revealable", "revealed"] as const) {
			expect(PhaseSchema.parse(phase)).toBe(phase);
		}
	});

	test("rejeita fase desconhecida", () => {
		expect(PhaseSchema.safeParse("finished").success).toBe(false);
		expect(PhaseSchema.safeParse("VOTING").success).toBe(false); // lowercase-only
	});
});

describe("PlayerSchema", () => {
	const validPlayer = {
		id: "p1",
		uuid: "550e8400-e29b-41d4-a716-446655440000",
		nick: "Ana",
		role: "host" as const,
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected" as const,
		joinedAt: 1700000000000,
	};

	test("aceita player válido completo", () => {
		expect(PlayerSchema.parse(validPlayer)).toEqual(validPlayer);
	});

	test("aceita player com vote preenchido", () => {
		const voted = { ...validPlayer, hasVoted: true, value: "5" as const };
		expect(PlayerSchema.parse(voted)).toEqual(voted);
	});

	test("rejeita seatIndex fora de 0..11", () => {
		expect(
			PlayerSchema.safeParse({ ...validPlayer, seatIndex: 12 }).success,
		).toBe(false);
		expect(
			PlayerSchema.safeParse({ ...validPlayer, seatIndex: -1 }).success,
		).toBe(false);
	});

	test("rejeita status desconhecido", () => {
		expect(
			PlayerSchema.safeParse({ ...validPlayer, status: "ghost" }).success,
		).toBe(false);
	});

	test("rejeita uuid inválido", () => {
		expect(
			PlayerSchema.safeParse({ ...validPlayer, uuid: "not-a-uuid" }).success,
		).toBe(false);
	});
});

describe("SalaStateSchema", () => {
	const basePlayer = {
		id: "p1",
		uuid: "550e8400-e29b-41d4-a716-446655440000",
		nick: "Ana",
		role: "host" as const,
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected" as const,
		joinedAt: 1700000000000,
	};

	const validSala = {
		code: "ABCD",
		hostId: "p1",
		players: [basePlayer],
		phase: "idle" as const,
		round: 1,
		timer: 60,
		votes: {},
		createdAt: 1700000000000,
	};

	test("aceita sala válida (idle, 1 player)", () => {
		expect(SalaStateSchema.parse(validSala)).toEqual(validSala);
	});

	test("rejeita sala com mais de 12 jogadores (capacidade)", () => {
		const overflow = Array.from({ length: 13 }, (_, i) => ({
			...basePlayer,
			id: `p${i}`,
			uuid: `550e8400-e29b-41d4-a716-44665544000${i}`,
			seatIndex: i,
		}));
		const r = SalaStateSchema.safeParse({ ...validSala, players: overflow });
		expect(r.success).toBe(false);
	});

	test("rejeita sala com timer > 60", () => {
		const r = SalaStateSchema.safeParse({ ...validSala, timer: 120 });
		expect(r.success).toBe(false);
	});

	test("aceita votes parcial (apenas quem votou)", () => {
		const withVotes = { ...validSala, votes: { p1: "5" as const } };
		expect(SalaStateSchema.parse(withVotes)).toEqual(withVotes);
	});

	test("hostId nullable durante cleanup (T18)", () => {
		const cleanup = { ...validSala, hostId: null, players: [] };
		expect(SalaStateSchema.parse(cleanup)).toEqual(cleanup);
	});
});
