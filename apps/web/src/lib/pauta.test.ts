import { describe, expect, test } from "bun:test";
import type { Historia } from "@planning-poker/shared";
import {
	formatPontos,
	formatPontuacao,
	getHistoriaAtiva,
	isPautaVazia,
	sortPauta,
} from "./pauta";

function historia(
	overrides: Partial<Historia> & { id: string },
): Historia {
	return {
		titulo: `Historia ${overrides.id}`,
		pontos: null,
		ordem: 0,
		...overrides,
	};
}

describe("pauta helpers — ordenação (#164)", () => {
	test("sortPauta ordena por ordem sem mutar a entrada", () => {
		const b = historia({ id: "b", ordem: 1 });
		const a = historia({ id: "a", ordem: 0 });
		const c = historia({ id: "c", ordem: 2 });
		const input = [b, c, a];
		const sorted = sortPauta(input);
		expect(sorted.map((h) => h.id)).toEqual(["a", "b", "c"]);
		// Entrada intacta (sem mutação).
		expect(input.map((h) => h.id)).toEqual(["b", "c", "a"]);
	});

	test("sortPauta é empty-safe (ausente/nula/vazia → [])", () => {
		expect(sortPauta(undefined)).toEqual([]);
		expect(sortPauta(null)).toEqual([]);
		expect(sortPauta([])).toEqual([]);
	});

	test("getHistoriaAtiva resolve a ativa e é null-safe", () => {
		const pauta = [historia({ id: "a", ordem: 0 }), historia({ id: "b", ordem: 1 })];
		expect(getHistoriaAtiva(pauta, "b")?.id).toBe("b");
		expect(getHistoriaAtiva(pauta, null)).toBeNull();
		expect(getHistoriaAtiva(pauta, undefined)).toBeNull();
		expect(getHistoriaAtiva(pauta, "orfao")).toBeNull();
		expect(getHistoriaAtiva(undefined, "a")).toBeNull();
		expect(getHistoriaAtiva(null, "a")).toBeNull();
		expect(getHistoriaAtiva([], "a")).toBeNull();
	});

	test("isPautaVazia cobre ausente/nula/vazia/cheia", () => {
		expect(isPautaVazia(undefined)).toBe(true);
		expect(isPautaVazia(null)).toBe(true);
		expect(isPautaVazia([])).toBe(true);
		expect(isPautaVazia([historia({ id: "a" })])).toBe(false);
	});
});

describe("pauta helpers — Pontuação tabular mono (#164)", () => {
	test("formatPontos: inteiro puro, decimal 1 casa, null → —", () => {
		expect(formatPontos(5)).toBe("5");
		expect(formatPontos(2.5)).toBe("2.5");
		expect(formatPontos(0)).toBe("0");
		expect(formatPontos(null)).toBe("—");
		expect(formatPontos(undefined)).toBe("—");
	});

	test("formatPontuacao: mediana + N×V com mapa de votos", () => {
		expect(
			formatPontuacao(5, { p1: "5", p2: "5", p3: "3" }),
		).toBe("5 · 1×3 2×5");
	});

	test("formatPontuacao: array de votos e ½/☕ ordenados (☕ por último)", () => {
		expect(formatPontuacao(3, ["☕", "½", "3", "½"])).toBe(
			"3 · 2×½ 1×3 1×☕",
		);
	});

	test("formatPontuacao não quebra com vazia (só mediana ou —)", () => {
		expect(formatPontuacao(8, {})).toBe("8");
		expect(formatPontuacao(8, [])).toBe("8");
		expect(formatPontuacao(8, undefined)).toBe("8");
		expect(formatPontuacao(8, null)).toBe("8");
		expect(formatPontuacao(null, {})).toBe("—");
		expect(formatPontuacao(null, undefined)).toBe("—");
		expect(formatPontuacao(undefined, null)).toBe("—");
	});

	test("formatPontuacao sem mediana mostra só o breakdown", () => {
		expect(formatPontuacao(null, { p1: "5", p2: "3" })).toBe("1×3 1×5");
	});
});
