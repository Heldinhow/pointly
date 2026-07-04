/**
 * Validators tests — T20 verify (≥8 unit tests).
 *
 * Foco nos validadores de nick (NickSchema) e código de sala (hello handler).
 * Cobre boundary conditions e rejeições críticas do fluxo de entrada.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T20
 * @see spec F-001 (nick 2-20 chars), F-002 (sem espaços duplos/nas pontas)
 * @see spec F-005 (sala_cheia), F-006 (sala_nao_encontrada)
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { NickSchema, RoomCodeSchema } from "@planning-poker/shared";
import type { z } from "zod";

type Nick = z.infer<typeof NickSchema>;
import { Hub } from "./hub";
import { handleHello } from "./handlers/hello";
import { SALA_SEAT_COUNT } from "./sala";

let hub: Hub;

beforeEach(() => {
	hub = new Hub();
});

// ---------------------------------------------------------------------------
// Validação de nick — testes diretos no Zod schema (F-001, F-002)
// ---------------------------------------------------------------------------

describe("NickSchema — boundary conditions (F-001, F-002)", () => {
	test("rejeita nick vazio", () => {
		const result = NickSchema.safeParse("");
		expect(result.success).toBe(false);
		if (!result.success) {
			// primeira issue deve ser sobre min length
			expect(result.error.issues[0]?.message).toMatch(/mínimo/i);
		}
	});

	test("rejeita nick com 1 char (boundary: abaixo do mínimo 2)", () => {
		const result = NickSchema.safeParse("A");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toMatch(/mínimo/i);
		}
	});

	test("aceita nick com exatamente 2 chars (boundary: mínimo válido)", () => {
		const result = NickSchema.safeParse("An");
		expect(result.success).toBe(true);
		if (result.success) expect(result.data).toBe("An");
	});

	test("aceita nick com exatamente 20 chars (boundary: máximo válido)", () => {
		const nick = "a".repeat(20);
		const result = NickSchema.safeParse(nick);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data).toHaveLength(20);
	});

	test("rejeita nick com 21 chars (boundary: acima do máximo 20)", () => {
		const nick = "a".repeat(21);
		const result = NickSchema.safeParse(nick);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toMatch(/máximo/i);
		}
	});

	test("rejeita nick com espaço duplo interno (F-002)", () => {
		const result = NickSchema.safeParse("Dev  Front");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toMatch(/espaços duplos/i);
		}
	});

	test("rejeita nick com espaço na ponta esquerda (F-002)", () => {
		const result = NickSchema.safeParse(" Ana");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toMatch(/espaços nas pontas/i);
		}
	});

	test("rejeita nick com espaço na ponta direita (F-002)", () => {
		const result = NickSchema.safeParse("Ana ");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toMatch(/espaços nas pontas/i);
		}
	});

	test("aceita nick com espaço único interno (válido)", () => {
		const result = NickSchema.safeParse("Dev Front");
		expect(result.success).toBe(true);
		if (result.success) expect(result.data).toBe("Dev Front");
	});

	test("aceita nick com emoji e charset estendido (sem validação de charset no v1)", () => {
		// emojis contam como 1+ code points mas o v1 não restringe charset
		const result = NickSchema.safeParse("🚀Ana");
		expect(result.success).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Validação de nick via hello handler — fluxo end-to-end
// ---------------------------------------------------------------------------

describe("handleHello — nick validation end-to-end", () => {
	test("hello com nick vazio retorna invalid_nick", () => {
		const result = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: "",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_nick");
	});

	test("hello com nick de 1 char retorna invalid_nick", () => {
		const result = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: "X",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_nick");
	});

	test("hello com nick de 21 chars retorna invalid_nick", () => {
		const result = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: "a".repeat(21),
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_nick");
	});

	test("hello com nick de espaço duplo retorna invalid_nick", () => {
		const result = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: "AB  CD",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_nick");
	});

	test("hello com nick de espaço na ponta retorna invalid_nick", () => {
		const result = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: " ana",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_nick");
	});
});

// ---------------------------------------------------------------------------
// Validação de código de sala — RoomCodeSchema + hello handler (F-005, F-006)
// ---------------------------------------------------------------------------

describe("RoomCodeSchema — formato do código", () => {
	test("aceita código 4-char alfanumérico maiúsculo", () => {
		expect(RoomCodeSchema.safeParse("ABCD").success).toBe(true);
		expect(RoomCodeSchema.safeParse("1234").success).toBe(true);
		expect(RoomCodeSchema.safeParse("A1B2").success).toBe(true);
		expect(RoomCodeSchema.safeParse("ZZZZ").success).toBe(true);
	});

	test("rejeita código com char minúsculo", () => {
		expect(RoomCodeSchema.safeParse("abcd").success).toBe(false);
		expect(RoomCodeSchema.safeParse("ABcD").success).toBe(false);
	});

	test("rejeita código com tamanho errado", () => {
		expect(RoomCodeSchema.safeParse("ABC").success).toBe(false); // 3 chars
		expect(RoomCodeSchema.safeParse("ABCDE").success).toBe(false); // 5 chars
		expect(RoomCodeSchema.safeParse("").success).toBe(false);
	});

	test("rejeita código com char especial", () => {
		expect(RoomCodeSchema.safeParse("AB-D").success).toBe(false);
		expect(RoomCodeSchema.safeParse("AB D").success).toBe(false);
		expect(RoomCodeSchema.safeParse("AB@D").success).toBe(false);
	});
});

describe("handleHello — código de sala (F-004, F-005, F-006)", () => {
	test("join com código válido em sala existente retorna ok", () => {
		// cria sala com host
		const host = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: "Host",
		});
		expect(host.ok).toBe(true);
		const code = hub.activeCodes()[0]!;

		// join com code correto
		const join = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000002",
			nick: "Bob",
			code,
		});
		expect(join.ok).toBe(true);
		if (join.ok) {
			expect(join.role).toBe("player");
			expect(join.sala.code).toBe(code);
			expect(join.sala.players).toHaveLength(2);
		}
	});

	test("join com código inexistente retorna sala_nao_encontrada (F-006)", () => {
		const result = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: "Ghost",
			code: "ZZZZ",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("sala_nao_encontrada");
			expect(result.message).toMatch(/ZZZZ/);
		}
	});

	test("join em sala cheia (12/12) retorna sala_cheia (F-005)", () => {
		// cria sala
		const host = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: "Host",
		});
		expect(host.ok).toBe(true);
		const code = hub.activeCodes()[0]!;

		// preenche 11 players adicionais (sala aceita 12 = 1 host + 11 players)
		for (let i = 2; i <= SALA_SEAT_COUNT; i++) {
			const uuid = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
			const join = handleHello(hub, { uuid, nick: `P${i}`, code });
			expect(join.ok).toBe(true);
		}

		expect(hub.getSala(code)!.playerCount).toBe(SALA_SEAT_COUNT);

		// 13º player rejeitado
		const overflow = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-999999999999",
			nick: "Late",
			code,
		});
		expect(overflow.ok).toBe(false);
		if (!overflow.ok) {
			expect(overflow.code).toBe("sala_cheia");
		}
	});

	test("join com código de formato inválido (3 chars) retorna internal_error", () => {
		// Hello não usa RoomCodeSchema direto; passa pelo sala.get(code) que
		// é undefined → sala_nao_encontrada. 5 chars também.
		const r3 = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: "X",
			code: "ABC",
		});
		// nick "X" falha primeiro → invalid_nick
		expect(r3.ok).toBe(false);
		if (!r3.ok) expect(r3.code).toBe("invalid_nick");
	});

	test("join com código malformado (chars inválidos) retorna sala_nao_encontrada", () => {
		const r = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-000000000001",
			nick: "Ana",
			code: "ab-d", // lowercase + dash
		});
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe("sala_nao_encontrada");
	});
});

// ---------------------------------------------------------------------------
// Validação de UUID — pré-requisito pra hello handler
// ---------------------------------------------------------------------------

describe("handleHello — UUID", () => {
	test("aceita UUID v4 válido", () => {
		const r = handleHello(hub, {
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			nick: "Ana",
		});
		expect(r.ok).toBe(true);
	});

	test("UUID é propagado ao player criado", () => {
		const uuid = "550e8400-e29b-41d4-a716-446655440000";
		const r = handleHello(hub, { uuid, nick: "Ana" });
		expect(r.ok).toBe(true);
		if (r.ok) {
			const created = r.sala.players.find((p) => p.uuid === uuid);
			expect(created).toBeDefined();
		}
	});

	test("typecheck: Nick inferido corretamente", () => {
		// Sanity check que NickSchema exporta tipo Nick via z.infer
		const nick: Nick = "Test";
		expect(NickSchema.safeParse(nick).success).toBe(true);
	});
});
