/**
 * pickJustifySeat tests — 14.6 (Dado da mesa).
 *
 * Vetores fixos (ABCD, rounds 1–3) fixam a paridade com o espelho do web
 * em `apps/web/src/lib/deck.test.ts` — os dois lados declaram os mesmos
 * números literais.
 */
import { describe, expect, test } from "bun:test";
import { pickJustifySeat } from "./justify";

const ALL_SEATS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

describe("pickJustifySeat", () => {
	test("determinístico: mesma semente + mesmo pool → mesmo assento", () => {
		const first = pickJustifySeat("ABCD", 1, ALL_SEATS);
		expect(first).not.toBeNull();
		for (let i = 0; i < 10; i++) {
			expect(pickJustifySeat("ABCD", 1, ALL_SEATS)).toBe(first);
		}
	});

	test("independe da ordem de entrada do pool", () => {
		const ordered = pickJustifySeat("ABCD", 1, [0, 3, 7]);
		expect(pickJustifySeat("ABCD", 1, [7, 0, 3])).toBe(ordered);
		expect(pickJustifySeat("ABCD", 1, [3, 7, 0])).toBe(ordered);
	});

	test("vetores fixos (paridade shared ↔ web)", () => {
		expect(pickJustifySeat("ABCD", 1, ALL_SEATS)).toBe(0);
		expect(pickJustifySeat("ABCD", 2, ALL_SEATS)).toBe(9);
		expect(pickJustifySeat("ABCD", 3, ALL_SEATS)).toBe(10);
		expect(pickJustifySeat("ABCD", 1, [0, 3, 7])).toBe(0);
	});

	test("nova rodada pode trocar o assento", () => {
		const picks = new Set([1, 2, 3].map((r) => pickJustifySeat("ABCD", r, ALL_SEATS)));
		expect(picks.size).toBeGreaterThan(1);
	});

	test("pool vazio → null", () => {
		expect(pickJustifySeat("ABCD", 1, [])).toBeNull();
	});

	test("pool unitário → o próprio assento", () => {
		expect(pickJustifySeat("ABCD", 1, [7])).toBe(7);
	});

	test("resultado pertence ao pool", () => {
		const pool = [2, 5, 8];
		const pick = pickJustifySeat("XY12", 4, pool);
		expect(pool).toContain(pick!);
	});
});
