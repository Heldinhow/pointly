/**
 * Pauta / História contract tests — issue #161 (parent #160).
 *
 * Contrato SOMENTE (schema + tipos + dispatch). Sem lógica de Sala.
 * Run: `bun --filter @planning-poker/shared test`
 */
import { describe, expect, test } from "bun:test";
import {
	ClientToServerEventSchema,
	ErrorCodeSchema,
} from "./events";
import { SalaStateSchema } from "./sala";
import {
	HistoriaAddPayloadSchema,
	HistoriaAtualIdSchema,
	HistoriaMovePayloadSchema,
	HistoriaRemovePayloadSchema,
	HistoriaSchema,
	HistoriaSelectPayloadSchema,
	HistoriaUpdatePayloadSchema,
	PAUTA_MAX_HISTORIAS,
	PautaSchema,
} from "./pauta";

const historiaValida = {
	id: "h1",
	titulo: "Como cliente quero votar",
	pontos: null,
	ordem: 0,
};

describe("HistoriaSchema", () => {
	test("aceita história válida (título + pontos null + ordem)", () => {
		expect(HistoriaSchema.parse(historiaValida)).toEqual(historiaValida);
	});

	test("aceita critério ≤1000 ou ausente", () => {
		const comCriterio = {
			...historiaValida,
			criterio: "Dado contexto, quando ação, então resultado",
		};
		expect(HistoriaSchema.parse(comCriterio)).toEqual(comCriterio);
		expect(HistoriaSchema.parse(historiaValida)).toEqual(historiaValida);
		// limite exato 1000 passa
		expect(
			HistoriaSchema.safeParse({
				...historiaValida,
				criterio: "x".repeat(1000),
			}).success,
		).toBe(true);
	});

	test("aceita pontos numéricos (mediana pós-reveal) ou null", () => {
		expect(
			HistoriaSchema.safeParse({ ...historiaValida, pontos: 5 }).success,
		).toBe(true);
		expect(
			HistoriaSchema.safeParse({ ...historiaValida, pontos: null }).success,
		).toBe(true);
	});

	test("rejeita título vazio / só-espaços / longo", () => {
		expect(
			HistoriaSchema.safeParse({ ...historiaValida, titulo: "" }).success,
		).toBe(false);
		expect(
			HistoriaSchema.safeParse({ ...historiaValida, titulo: "   " }).success,
		).toBe(false);
		expect(
			HistoriaSchema.safeParse({ ...historiaValida, titulo: "x".repeat(121) })
				.success,
		).toBe(false);
	});

	test("aceita título no limite 1–120", () => {
		expect(
			HistoriaSchema.safeParse({ ...historiaValida, titulo: "a" }).success,
		).toBe(true);
		expect(
			HistoriaSchema.safeParse({ ...historiaValida, titulo: "x".repeat(120) })
				.success,
		).toBe(true);
	});

	test("rejeita critério >1000", () => {
		expect(
			HistoriaSchema.safeParse({
				...historiaValida,
				criterio: "x".repeat(1001),
			}).success,
		).toBe(false);
	});
});

describe("PautaSchema (lista ≤50)", () => {
	const makePauta = (n: number) =>
		Array.from({ length: n }, (_, i) => ({
			id: `h${i}`,
			titulo: `História ${i}`,
			pontos: null,
			ordem: i,
		}));

	test("limite SSOT é 50", () => {
		expect(PAUTA_MAX_HISTORIAS).toBe(50);
	});

	test("aceita pauta com 50", () => {
		expect(PautaSchema.safeParse(makePauta(50)).success).toBe(true);
	});

	test("rejeita 51ª (pauta_cheia no domínio)", () => {
		const r = PautaSchema.safeParse(makePauta(51));
		expect(r.success).toBe(false);
		// código de erro do domínio existe no contrato
		expect(ErrorCodeSchema.safeParse("pauta_cheia").success).toBe(true);
	});
});

describe("HistoriaAtualIdSchema", () => {
	test("aceita id non-empty ou null", () => {
		expect(HistoriaAtualIdSchema.parse("h1")).toBe("h1");
		expect(HistoriaAtualIdSchema.parse(null)).toBeNull();
	});

	test("rejeita string vazia", () => {
		expect(HistoriaAtualIdSchema.safeParse("").success).toBe(false);
	});
});

describe("5 eventos finos C→S na união discriminada", () => {
	test("historia_add válido", () => {
		const r = ClientToServerEventSchema.safeParse({
			type: "historia_add",
			payload: { titulo: "Nova história" },
		});
		expect(r.success).toBe(true);
	});

	test("historia_add com criterio válido", () => {
		const r = ClientToServerEventSchema.safeParse({
			type: "historia_add",
			payload: { titulo: "Nova", criterio: "critério curto" },
		});
		expect(r.success).toBe(true);
	});

	test("historia_add rejeita título vazio", () => {
		expect(
			ClientToServerEventSchema.safeParse({
				type: "historia_add",
				payload: { titulo: "" },
			}).success,
		).toBe(false);
	});

	test("historia_update parcial (titulo ou criterio)", () => {
		expect(
			ClientToServerEventSchema.safeParse({
				type: "historia_update",
				payload: { id: "h1", titulo: "Ajustado" },
			}).success,
		).toBe(true);
		expect(
			ClientToServerEventSchema.safeParse({
				type: "historia_update",
				payload: { id: "h1", criterio: null },
			}).success,
		).toBe(true);
	});

	test("historia_update rejeita sem campo editável", () => {
		expect(
			HistoriaUpdatePayloadSchema.safeParse({ id: "h1" }).success,
		).toBe(false);
	});

	test("historia_move com toIndex 0..49", () => {
		expect(
			ClientToServerEventSchema.safeParse({
				type: "historia_move",
				payload: { id: "h1", toIndex: 0 },
			}).success,
		).toBe(true);
		expect(
			HistoriaMovePayloadSchema.safeParse({ id: "h1", toIndex: 49 }).success,
		).toBe(true);
		expect(
			HistoriaMovePayloadSchema.safeParse({ id: "h1", toIndex: 50 }).success,
		).toBe(false);
		expect(
			HistoriaMovePayloadSchema.safeParse({ id: "h1", toIndex: -1 }).success,
		).toBe(false);
	});

	test("historia_remove com id", () => {
		expect(
			ClientToServerEventSchema.safeParse({
				type: "historia_remove",
				payload: { id: "h1" },
			}).success,
		).toBe(true);
		expect(
			HistoriaRemovePayloadSchema.safeParse({ id: "" }).success,
		).toBe(false);
	});

	test("historia_select com id ou null (limpa ativa)", () => {
		expect(
			ClientToServerEventSchema.safeParse({
				type: "historia_select",
				payload: { historiaId: "h1" },
			}).success,
		).toBe(true);
		expect(
			ClientToServerEventSchema.safeParse({
				type: "historia_select",
				payload: { historiaId: null },
			}).success,
		).toBe(true);
		expect(
			HistoriaSelectPayloadSchema.safeParse({ historiaId: "" }).success,
		).toBe(false);
	});

	test("payloads estritos rejeitam campo extra", () => {
		expect(
			HistoriaAddPayloadSchema.safeParse({ titulo: "x", foo: 1 }).success,
		).toBe(false);
		expect(
			HistoriaRemovePayloadSchema.safeParse({ id: "h1", foo: 1 }).success,
		).toBe(false);
	});
});

describe("SalaState carrega pauta + historiaAtualId", () => {
	const baseSala = {
		code: "ABCD",
		hostId: "p1",
		players: [],
		phase: "idle" as const,
		round: 1,
		votes: {},
		createdAt: 1700000000000,
	};

	test("aceita sala legada sem pauta (compat retroativa)", () => {
		expect(SalaStateSchema.safeParse(baseSala).success).toBe(true);
	});

	test("aceita sala com pauta + historiaAtualId", () => {
		const r = SalaStateSchema.safeParse({
			...baseSala,
			pauta: [{ id: "h1", titulo: "H1", pontos: null, ordem: 0 }],
			historiaAtualId: "h1",
		});
		expect(r.success).toBe(true);
	});

	test("aceita historiaAtualId null (nenhuma ativa)", () => {
		const r = SalaStateSchema.safeParse({
			...baseSala,
			pauta: [],
			historiaAtualId: null,
		});
		expect(r.success).toBe(true);
	});

	test("rejeita pauta com 51 na SalaState", () => {
		const pauta51 = Array.from({ length: 51 }, (_, i) => ({
			id: `h${i}`,
			titulo: `H${i}`,
			pontos: null,
			ordem: i,
		}));
		const r = SalaStateSchema.safeParse({
			...baseSala,
			pauta: pauta51,
			historiaAtualId: null,
		});
		expect(r.success).toBe(false);
	});
});

describe("Error codes da Pauta", () => {
	test("cobre pauta_cheia + historia_nao_encontrada (novos #161)", () => {
		expect(ErrorCodeSchema.options).toContain("pauta_cheia");
		expect(ErrorCodeSchema.options).toContain("historia_nao_encontrada");
	});

	test("reusa invalid_phase + role_denied (select em voting / espectador)", () => {
		expect(ErrorCodeSchema.options).toContain("invalid_phase");
		expect(ErrorCodeSchema.options).toContain("role_denied");
	});
});
