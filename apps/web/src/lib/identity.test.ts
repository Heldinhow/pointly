import { afterEach, describe, expect, test } from "bun:test";
import {
	CodeSchema,
	NickSchema,
	clearSession,
	getOrCreateUuid,
	isValidCode,
	loadSession,
	normalizeCode,
	saveSession,
} from "./identity";

afterEach(() => {
	window.localStorage.clear();
});

describe("normalizeCode", () => {
	test("converte para maiúsculas", () => {
		expect(normalizeCode("ab12")).toBe("AB12");
	});
	test("remove separadores e espaços", () => {
		expect(normalizeCode("ab-d")).toBe("ABD");
		expect(normalizeCode("a b1")).toBe("AB1");
	});
	test("limita a 4 caracteres", () => {
		expect(normalizeCode("abcdef")).toBe("ABCD");
	});
	test("é idempotente", () => {
		expect(normalizeCode(normalizeCode("ab12!"))).toBe("AB12");
	});
	test("vazio continua vazio", () => {
		expect(normalizeCode("")).toBe("");
	});
});

describe("isValidCode", () => {
	test("aceita 4 alfanuméricos maiúsculos", () => {
		expect(isValidCode("AB12")).toBe(true);
		expect(isValidCode("ZZZZ")).toBe(true);
	});
	test("rejeita minúsculas, tamanho errado e símbolos", () => {
		expect(isValidCode("ab12")).toBe(false);
		expect(isValidCode("ABC")).toBe(false);
		expect(isValidCode("ABCDE")).toBe(false);
		expect(isValidCode("AB-D")).toBe(false);
		expect(isValidCode("")).toBe(false);
	});
});

describe("CodeSchema", () => {
	test("aceita código válido e rejeita inválido", () => {
		expect(CodeSchema.safeParse("AB12").success).toBe(true);
		expect(CodeSchema.safeParse("ab12").success).toBe(false);
		expect(CodeSchema.safeParse("ABC").success).toBe(false);
	});
});

describe("NickSchema", () => {
	test("aceita apelidos válidos", () => {
		for (const nick of ["An", "Ana", "Dev Front", "a".repeat(20)]) {
			expect(NickSchema.safeParse(nick).success).toBe(true);
		}
	});
	test("rejeita curto, longo e espaços irregulares", () => {
		for (const nick of ["", "A", "a".repeat(21), " Ana", "Ana ", "Dev  Front"]) {
			expect(NickSchema.safeParse(nick).success).toBe(false);
		}
	});
	test("mensagens em pt-BR", () => {
		const short = NickSchema.safeParse("");
		if (short.success) throw new Error("deveria falhar");
		expect(short.error.issues[0]?.message).toMatch(/2 caracteres/);
	});
});

describe("getOrCreateUuid", () => {
	test("é estável entre chamadas e tem formato UUID", () => {
		const first = getOrCreateUuid();
		const second = getOrCreateUuid();
		expect(first).toBe(second);
		expect(first).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
	});
});

describe("saveSession/loadSession/clearSession (ticket 09)", () => {
	test("salva e recupera código normalizado + apelido", () => {
		saveSession("ab12", "Ana");
		expect(loadSession()).toEqual({ code: "AB12", nick: "Ana" });
	});

	test("sem sessão retorna null", () => {
		expect(loadSession()).toBeNull();
	});

	test("clearSession apaga sem erro", () => {
		saveSession("AB12", "Ana");
		clearSession();
		expect(loadSession()).toBeNull();
	});

	test("código inválido não persiste", () => {
		saveSession("ABC", "Ana");
		expect(loadSession()).toBeNull();
	});

	test("apelido curto não persiste", () => {
		saveSession("AB12", "A");
		expect(loadSession()).toBeNull();
	});

	test("JSON corrompido retorna null sem lançar", () => {
		window.localStorage.setItem("pointly-session", "{invalido");
		expect(loadSession()).toBeNull();
	});
});
