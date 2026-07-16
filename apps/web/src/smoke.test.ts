/**
 * Smoke test: web importa `@planning-poker/shared` via workspace (vitest).
 *
 * Bom pra detectar regressões no barrel quando o Phase 3+ consumir tipos daqui.
 */
import { describe, expect, test } from "bun:test";
import {
	DECK_VALUES,
	PhaseSchema,
	type Player,
	VoteSchema,
} from "@planning-poker/shared";

describe("web ↔ @planning-poker/shared workspace", () => {
	test("importa constants e schemas", () => {
		expect(DECK_VALUES).toHaveLength(9);
		expect(PhaseSchema.options).toContain("voting");
		expect(VoteSchema.options).toContain("☕");
	});

	test("anota um player com tipo TS importado", () => {
		const p: Player = {
			id: "p1",
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			nick: "Ana",
			role: "host",
			seatIndex: 0,
			hasVoted: false,
			value: null,
			status: "connected",
			joinedAt: 1700000000000,
		};
		expect(p.seatIndex).toBe(0);
	});
});
