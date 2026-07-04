/**
 * computeConsensus tests — T9 verify (≥5 unit tests).
 */
import { describe, expect, test } from "bun:test";
import { computeConsensus, isUnanimous, voteToNumber } from "./consensus";
import type { Vote } from "../schemas/sala";

describe("voteToNumber", () => {
	test("converte cada deck value corretamente", () => {
		expect(voteToNumber("0")).toBe(0);
		expect(voteToNumber("½")).toBe(0.5);
		expect(voteToNumber("1")).toBe(1);
		expect(voteToNumber("13")).toBe(13);
	});

	test("☕ → null (sempre)", () => {
		expect(voteToNumber("☕")).toBeNull();
	});
});

describe("computeConsensus", () => {
	test("count ímpar: mediana é o valor central", () => {
		const r = computeConsensus(["5", "8", "13"] as Vote[]);
		expect(r.median).toBe(8);
		expect(r.mean).toBeCloseTo((5 + 8 + 13) / 3, 5);
		expect(r.range).toEqual([5, 13]);
	});

	test("count par: mediana é média dos dois centrais", () => {
		const r = computeConsensus(["2", "3", "5", "8"] as Vote[]);
		expect(r.median).toBe(4); // (3 + 5) / 2
		expect(r.range).toEqual([2, 8]);
	});

	test("cluster em 5 (todos iguais)", () => {
		const r = computeConsensus(["5", "5", "5", "5", "5"] as Vote[]);
		expect(r.median).toBe(5);
		expect(r.mean).toBe(5);
		expect(r.range).toEqual([5, 5]);
	});

	test("☕ excluído do cálculo", () => {
		const r = computeConsensus(["5", "☕", "8", "☕"] as Vote[]);
		expect(r.median).toBe(6.5); // (5 + 8) / 2
		expect(r.mean).toBe(6.5);
		expect(r.range).toEqual([5, 8]);
	});

	test("todos ☕ → null em todos os campos", () => {
		const r = computeConsensus(["☕", "☕", "☕"] as Vote[]);
		expect(r.median).toBeNull();
		expect(r.mean).toBeNull();
		expect(r.range).toBeNull();
	});

	test("array vazio → null em todos os campos (não throw)", () => {
		const r = computeConsensus([] as Vote[]);
		expect(r.median).toBeNull();
		expect(r.mean).toBeNull();
		expect(r.range).toBeNull();
	});

	test("½ conta como 0.5 nas stats", () => {
		const r = computeConsensus(["½", "½"] as Vote[]);
		expect(r.median).toBe(0.5);
		expect(r.mean).toBe(0.5);
	});
});

describe("isUnanimous", () => {
	test("cluster em 5 → true", () => {
		expect(isUnanimous(["5", "5", "5"] as Vote[])).toBe(true);
	});

	test("incluindo ☕ em cluster → true (☕ ignorado)", () => {
		expect(isUnanimous(["5", "5", "☕"] as Vote[])).toBe(true);
	});

	test("valores diferentes → false", () => {
		expect(isUnanimous(["5", "8"] as Vote[])).toBe(false);
	});

	test("só ☕ → false (sem votos numéricos, não há unanimidade)", () => {
		expect(isUnanimous(["☕", "☕"] as Vote[])).toBe(false);
	});

	test("vazio → false", () => {
		expect(isUnanimous([] as Vote[])).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// T21 — Cenários adicionais de computeConsensus
//   Cobertura ampliada com cenários de limite (sala cheia 12, todos 13,
//   pares/ímpares, ☕ intercalado, mean com frações).
// ---------------------------------------------------------------------------

describe("computeConsensus — 12 votos (sala cheia)", () => {
	test("12 votos idênticos em 5 — mediana/média/range = 5", () => {
		const votes: Vote[] = Array(12).fill("5");
		const r = computeConsensus(votes);
		expect(r.median).toBe(5);
		expect(r.mean).toBe(5);
		expect(r.range).toEqual([5, 5]);
		expect(isUnanimous(votes)).toBe(true);
	});

	test("12 votos idênticos em 13 — mediana/média/range = 13", () => {
		const votes: Vote[] = Array(12).fill("13");
		const r = computeConsensus(votes);
		expect(r.median).toBe(13);
		expect(r.mean).toBe(13);
		expect(r.range).toEqual([13, 13]);
		expect(isUnanimous(votes)).toBe(true);
	});

	test("12 votos com 4 ☕ intercalados — exclui do cálculo", () => {
		// 8 votos numéricos: 0,1,2,3,5,5,8,13 → 8 nums, mediana = (3+5)/2 = 4
		const votes: Vote[] = [
			"0",
			"☕",
			"1",
			"2",
			"☕",
			"3",
			"5",
			"5",
			"☕",
			"8",
			"13",
			"☕",
		];
		const r = computeConsensus(votes);
		expect(r.median).toBe(4); // (3 + 5) / 2
		expect(r.range).toEqual([0, 13]);
		// mean = (0+1+2+3+5+5+8+13) / 8 = 37 / 8 = 4.625
		expect(r.mean).toBeCloseTo(4.625, 3);
		expect(isUnanimous(votes)).toBe(false);
	});

	test("12 votos com maioria em 5 (unanimous-like com outlier 13) → mediana=5", () => {
		// 11 cincos + 1 treze — mediana ainda 5 (posição central é 5)
		const votes: Vote[] = [
			"5",
			"5",
			"5",
			"5",
			"5",
			"5",
			"13",
			"5",
			"5",
			"5",
			"5",
			"5",
		];
		const r = computeConsensus(votes);
		expect(r.median).toBe(5);
		expect(r.mean).toBeCloseTo((11 * 5 + 13) / 12, 5);
		expect(r.range).toEqual([5, 13]);
		expect(isUnanimous(votes)).toBe(false);
	});
});

describe("computeConsensus — paridade (par vs ímpar)", () => {
	test("count par (4 votos distintos): mediana é média dos dois centrais", () => {
		const r = computeConsensus(["0", "1", "3", "13"] as Vote[]);
		expect(r.median).toBe(2); // (1 + 3) / 2
		expect(r.mean).toBeCloseTo((0 + 1 + 3 + 13) / 4, 5);
		expect(r.range).toEqual([0, 13]);
	});

	test("count ímpar (5 votos distintos): mediana é o valor central", () => {
		const r = computeConsensus(["0", "1", "3", "8", "13"] as Vote[]);
		expect(r.median).toBe(3); // índice 2 = 3
		expect(r.mean).toBeCloseTo((0 + 1 + 3 + 8 + 13) / 5, 5);
		expect(r.range).toEqual([0, 13]);
	});

	test("count par com ½ no centro", () => {
		const r = computeConsensus(["0", "½", "1"] as Vote[]);
		expect(r.median).toBe(0.5);
		expect(r.mean).toBeCloseTo((0 + 0.5 + 1) / 3, 5);
	});

	test("count ímpar com ½ isolado", () => {
		const r = computeConsensus(["0", "½", "13"] as Vote[]);
		expect(r.median).toBe(0.5);
		expect(r.range).toEqual([0, 13]);
	});
});

describe("computeConsensus — ½ (meio) edge cases", () => {
	test("½ + ½ → mean/median = 0.5", () => {
		const r = computeConsensus(["½", "½"] as Vote[]);
		expect(r.median).toBe(0.5);
		expect(r.mean).toBe(0.5);
		expect(r.range).toEqual([0.5, 0.5]);
	});

	test("½ + 1 → mediana = 0.75 (count par)", () => {
		const r = computeConsensus(["½", "1"] as Vote[]);
		expect(r.median).toBe(0.75); // (0.5 + 1) / 2
		expect(r.mean).toBe(0.75);
	});

	test("½ não afeta cálculo como 0.5 (NÃO como ½ string)", () => {
		const r = computeConsensus(["0", "½", "1"] as Vote[]);
		expect(r.mean).toBeCloseTo((0 + 0.5 + 1) / 3, 5);
		// Não confundir: voteToNumber("½") = 0.5 (numeric)
		expect(voteToNumber("½")).toBe(0.5);
	});
});

describe("computeConsensus — ☕ pesado (mais da metade)", () => {
	test("6 ☕ + 3 votos numéricos → calcula com 3", () => {
		const votes: Vote[] = ["☕", "☕", "☕", "5", "☕", "8", "☕", "13", "☕"];
		const r = computeConsensus(votes);
		expect(r.median).toBe(8); // meio de [5,8,13] ordenado
		expect(r.mean).toBeCloseTo((5 + 8 + 13) / 3, 5);
		expect(r.range).toEqual([5, 13]);
	});

	test("11 ☕ + 1 voto numérico → calcula com 1", () => {
		const votes: Vote[] = [
			"☕",
			"☕",
			"☕",
			"☕",
			"☕",
			"☕",
			"☕",
			"5",
			"☕",
			"☕",
			"☕",
			"☕",
		];
		const r = computeConsensus(votes);
		expect(r.median).toBe(5);
		expect(r.mean).toBe(5);
		expect(r.range).toEqual([5, 5]);
		// unanimous = false porque ☕ está presente (sem votos numéricos iguais)
		// wait: isUnanimous compara nums entre si, ☕ ignorado. 1 num = unanimous true.
		expect(isUnanimous(votes)).toBe(true);
	});

	test("12 ☕ → todos null (não unanimous)", () => {
		const votes: Vote[] = Array(12).fill("☕");
		const r = computeConsensus(votes);
		expect(r.median).toBeNull();
		expect(r.mean).toBeNull();
		expect(r.range).toBeNull();
		expect(isUnanimous(votes)).toBe(false);
	});
});

describe("computeConsensus — casos extremos de range", () => {
	test("min = 0 e max = 13 — extremidades do deck", () => {
		const r = computeConsensus(["0", "13"] as Vote[]);
		expect(r.range).toEqual([0, 13]);
		expect(r.median).toBe(6.5);
	});

	test("todos 0 — cluster na extremidade baixa", () => {
		const r = computeConsensus(["0", "0", "0"] as Vote[]);
		expect(r.median).toBe(0);
		expect(r.mean).toBe(0);
		expect(r.range).toEqual([0, 0]);
	});

	test("todos 13 — cluster na extremidade alta", () => {
		const r = computeConsensus(["13", "13", "13"] as Vote[]);
		expect(r.median).toBe(13);
		expect(r.mean).toBe(13);
		expect(r.range).toEqual([13, 13]);
	});

	test("imutabilidade: input não é mutado", () => {
		const original: Vote[] = ["5", "8", "13"];
		const snapshot = [...original];
		computeConsensus(original);
		expect(original).toEqual(snapshot);
	});
});
