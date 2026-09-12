/**
 * identity.test — unit tests da lógica compartilhada (spell-rebuild).
 */
import "../test-jsdom";
import { beforeEach, describe, expect, test } from "bun:test";
import {
	API_BASE,
	buildShareUrl,
	getCode,
	getNick,
	getOrCreateUUID,
	isValidCode,
	normalizeCode,
	setCode,
	setNick,
	validateNick,
} from "./identity";

beforeEach(() => {
	sessionStorage.clear();
});

describe("normalizeCode", () => {
	test("maiúsculas direto", () => {
		expect(normalizeCode("AB12")).toBe("AB12");
	});

	test("minúsculas viram maiúsculas", () => {
		expect(normalizeCode("ab12")).toBe("AB12");
	});

	test("remove separadores e corta em 4", () => {
		expect(normalizeCode("a b-c!d")).toBe("ABCD");
		expect(normalizeCode("abcdef")).toBe("ABCD");
	});

	test("NFKD dobra acentos", () => {
		expect(normalizeCode("éà1")).toBe("EA1");
	});

	test("vazio → vazio", () => {
		expect(normalizeCode("")).toBe("");
		expect(normalizeCode("---")).toBe("");
	});
});

describe("isValidCode", () => {
	test("4 alfanum maiúsculos → true", () => {
		expect(isValidCode("AB12")).toBe(true);
		expect(isValidCode("ZZ99")).toBe(true);
	});

	test("curto/longo → false", () => {
		expect(isValidCode("ABC")).toBe(false);
		expect(isValidCode("ABCDE")).toBe(false);
		expect(isValidCode("")).toBe(false);
	});

	test("minúsculas e símbolos → false (normalizar antes)", () => {
		expect(isValidCode("ab12")).toBe(false);
		expect(isValidCode("AB!2")).toBe(false);
		expect(isValidCode("AB 2")).toBe(false);
	});
});

describe("validateNick", () => {
	test("vazio → null (botão disabled em vez de erro)", () => {
		expect(validateNick("")).toBeNull();
	});

	test("<2 chars → erro mínimo", () => {
		expect(validateNick("A")).toBe("Use pelo menos 2 caracteres.");
	});

	test(">20 chars → erro máximo", () => {
		expect(validateNick("a".repeat(21))).toBe("Use no máximo 20 caracteres.");
	});

	test("espaço duplo → erro", () => {
		expect(validateNick("Hel  der")).toBe(
			"Evite espaços duplos no meio do nome.",
		);
	});

	test("espaço na borda → erro", () => {
		expect(validateNick(" Helder")).toBe("Remova espaços no início e no fim.");
		expect(validateNick("Helder ")).toBe("Remova espaços no início e no fim.");
	});

	test("válidos → null", () => {
		expect(validateNick("He")).toBeNull();
		expect(validateNick("Helder")).toBeNull();
		expect(validateNick("a".repeat(20))).toBeNull();
		expect(validateNick("Luna Silva")).toBeNull();
	});
});

describe("sessionStorage (silent-fail)", () => {
	test("nick roundtrip", () => {
		expect(getNick()).toBeNull();
		setNick("Luna");
		expect(getNick()).toBe("Luna");
	});

	test("code roundtrip", () => {
		expect(getCode()).toBeNull();
		setCode("AB12");
		expect(getCode()).toBe("AB12");
	});

	test("getOrCreateUUID é estável e formato UUID", () => {
		const first = getOrCreateUUID();
		expect(first).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
		expect(getOrCreateUUID()).toBe(first);
	});
});

describe("urls", () => {
	test("buildShareUrl", () => {
		expect(buildShareUrl("https://pointly.space", "AB12")).toBe(
			"https://pointly.space/join?code=AB12",
		);
	});

	test("API base relativa (proxy do Vite em dev)", () => {
		expect(API_BASE).toBe("/api/v1");
	});
});
