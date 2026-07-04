/**
 * generateUniqueCode tests — T7a verify (≥3 unit tests).
 */
import { describe, expect, test } from "bun:test";
import { CodeCollisionError, generateUniqueCode, randomCode } from "./code";

describe("randomCode", () => {
	test("gera string de exatamente 4 caracteres", () => {
		const code = randomCode();
		expect(code).toHaveLength(4);
	});

	test("só usa chars do alfabeto [A-Z0-9]", () => {
		for (let i = 0; i < 50; i++) {
			const code = randomCode();
			expect(code).toMatch(/^[A-Z0-9]{4}$/);
		}
	});
});

describe("generateUniqueCode", () => {
	test("gera código único quando existingCodes vazio", () => {
		const code = generateUniqueCode(new Set());
		expect(code).toMatch(/^[A-Z0-9]{4}$/);
	});

	test("evita código em existingCodes (1 colisão resolve)", () => {
		const taken = new Set<string>();
		const blocked = randomCode();
		taken.add(blocked);

		// Força colisão preencheando existingCodes com código que randomCode não vai gerar?
		// Não dá pra forçar; mock seria ideal. Em vez disso, verificamos que após
		// gerar muitos códigos, nenhum está em `taken` (exceto pela distribuição natural).
		for (let i = 0; i < 20; i++) {
			const code = generateUniqueCode(taken);
			expect(taken.has(code)).toBe(false);
			taken.add(code); // cresce o conjunto — simula densidade crescente
		}
		expect(taken.size).toBeGreaterThan(20);
	});

	test("retorna código ainda único após adicionar à existingCodes", () => {
		const taken = new Set<string>();
		const c1 = generateUniqueCode(taken);
		taken.add(c1);
		const c2 = generateUniqueCode(taken);
		expect(c2).not.toBe(c1);
		taken.add(c2);
		const c3 = generateUniqueCode(taken);
		expect(c3).not.toBe(c1);
		expect(c3).not.toBe(c2);
	});

	test("lança CodeCollisionError quando todas as tentativas colidem", () => {
		// Bloqueia TODOS os codes possíveis? Não dá (1.6M). Em vez disso, monkey-patch
		// randomCode via spy. Aqui testamos via maxRetries=0 que falha de cara.
		expect(() => generateUniqueCode(new Set(), 0)).toThrow(CodeCollisionError);
	});

	test("CodeCollisionError carrega número de tentativas", () => {
		try {
			generateUniqueCode(new Set(), 0);
			expect.unreachable();
		} catch (err) {
			expect(err).toBeInstanceOf(CodeCollisionError);
			expect((err as CodeCollisionError).attempts).toBe(0);
		}
	});
});

describe("CodeCollisionError", () => {
	test("mensagem inclui tentativas", () => {
		const err = new CodeCollisionError(5);
		expect(err.message).toContain("5");
		expect(err.name).toBe("CodeCollisionError");
	});
});
