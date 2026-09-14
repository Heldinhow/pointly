import { describe, expect, test } from "bun:test";
import {
	DECK_VALUES,
	computeConsensus,
	formatMean,
	formatMedian,
	formatRange,
	groupVotes,
	isPauseVote,
	isUnanimous,
	voteLabel,
	voteToNumber,
} from "./deck";

describe("deck (ticket 05 — Votar)", () => {
	test("deck completo com 9 cartas na ordem do contrato", () => {
		expect([...DECK_VALUES]).toEqual([
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
	});

	test("½ vale 0,5 e zero é voto válido", () => {
		expect(voteToNumber("½")).toBe(0.5);
		expect(voteToNumber("0")).toBe(0);
		expect(voteToNumber("13")).toBe(13);
	});

	test("pausa marca participação mas fica fora dos cálculos", () => {
		expect(isPauseVote("☕")).toBe(true);
		expect(isPauseVote("5")).toBe(false);
		expect(voteToNumber("☕")).toBeNull();
		expect(voteLabel("☕")).toMatch(/fora da média/i);
	});
});

describe("consenso (ticket 07 — Resultados)", () => {
	test("½ computa como 0,5 e 0 é voto válido", () => {
		const stats = computeConsensus(["½", "0", "1"]);
		// (0 + 0,5 + 1) / 3 = 0,5; mediana ordenada [0, 0,5, 1] → 0,5.
		expect(stats.mean).toBeCloseTo(0.5, 10);
		expect(stats.median).toBeCloseTo(0.5, 10);
		expect(stats.range).toEqual([0, 1]);
	});

	test("média, mediana e intervalo de [5, 8]", () => {
		const stats = computeConsensus(["5", "8"]);
		expect(stats.mean).toBeCloseTo(6.5, 10);
		expect(stats.median).toBeCloseTo(6.5, 10);
		expect(stats.range).toEqual([5, 8]);
	});

	test("mediana ímpar pega o centro", () => {
		expect(computeConsensus(["5", "5", "8"]).median).toBe(5);
	});

	test("pausa e ausência ficam fora dos cálculos", () => {
		const onlyPause = computeConsensus(["☕", "☕"]);
		expect(onlyPause).toEqual({ median: null, mean: null, range: null });
		expect(computeConsensus([])).toEqual({
			median: null,
			mean: null,
			range: null,
		});
		// Pausa misturada não distorce: só o 8 conta.
		expect(computeConsensus(["☕", "8"])).toEqual({
			median: 8,
			mean: 8,
			range: [8, 8],
		});
	});

	test("unanimidade ignora pausa e exige ao menos um numérico", () => {
		expect(isUnanimous(["5", "5", "5"])).toBe(true);
		expect(isUnanimous(["5", "5", "☕"])).toBe(true);
		expect(isUnanimous(["5", "8"])).toBe(false);
		expect(isUnanimous(["☕"])).toBe(false);
		expect(isUnanimous([])).toBe(false);
	});

	test("agrupamento preserva a ordem do deck com a pausa por último", () => {
		expect(groupVotes(["8", "5", "8", "☕", "5", "5"])).toEqual([
			{ value: "5", count: 3 },
			{ value: "8", count: 2 },
			{ value: "☕", count: 1 },
		]);
	});

	test("formatos: mediana inteira sem decimais, média 1dp, intervalo com en-dash", () => {
		expect(formatMedian(null)).toBe("—");
		expect(formatMedian(5)).toBe("5");
		expect(formatMedian(6.5)).toBe("6.5");
		expect(formatMean(null)).toBe("—");
		expect(formatMean(6.5)).toBe("6.5");
		expect(formatRange(null)).toBe("—");
		expect(formatRange([5, 8])).toBe("5–8");
	});
});
