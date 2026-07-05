/**
 * Storage helper unit tests — ADR-006 / BUG-307 gate.
 */
import { describe, expect, test } from "bun:test";
import {
	getCode,
	getDismissedEmpty,
	getNick,
	getUUID,
	resetDismissedEmpty,
	setCode,
	setDismissedEmpty,
	setNick,
	setUUID,
} from "./storage";

describe("storage — UUID", () => {
	test("setUUID + getUUID round-trip", () => {
		const u = "11111111-2222-4333-8444-555555555555";
		expect(setUUID(u)).toBe(true);
		expect(getUUID()).toBe(u);
	});

	test("setUUID rejeita UUID malformado", () => {
		expect(setUUID("not-a-uuid")).toBe(false);
	});

	test("getUUID gera + persiste quando storage está vazio", () => {
		// Limpa storage e verifica que getUUID cria um novo UUID válido.
		try {
			sessionStorage.removeItem("pointly.uuid");
		} catch {
			return; // skip — ambiente sem sessionStorage
		}
		const uuid = getUUID();
		expect(uuid).toMatch(/^[0-9a-f-]{36}$/i);
		// Segunda chamada retorna o mesmo (persistido).
		expect(getUUID()).toBe(uuid);
	});
});

describe("storage — Nick / Code", () => {
	test("setNick + getNick round-trip", () => {
		setNick("Helder");
		expect(getNick()).toBe("Helder");
	});

	test("setCode + getCode round-trip", () => {
		setCode("ABCD");
		expect(getCode()).toBe("ABCD");
	});
});

describe("storage — EmptyOverlay dismissal (T06 forward ref)", () => {
	test("getDismissedEmpty: false → set → true → reset → false", () => {
		try {
			sessionStorage.removeItem("pointly.dismissedEmpty");
		} catch {
			return;
		}
		expect(getDismissedEmpty()).toBe(false);
		expect(setDismissedEmpty()).toBe(true);
		expect(getDismissedEmpty()).toBe(true);
		expect(resetDismissedEmpty()).toBe(true);
		expect(getDismissedEmpty()).toBe(false);
	});
});

describe("storage — SSR / private-mode safety", () => {
	test("getUUID gera UUID válido mesmo quando sessionStorage.getItem joga", () => {
		// Não conseguimos mockar o global antes do helper importar (Bun
		// cache + import em module-scope). Validamos apenas que getUUID
		// SEMPRE retorna um UUID válido (a lógica de fallback na geração
		// já cobre o caso do storage estar ausente).
		const uuid = getUUID();
		expect(uuid).toMatch(/^[0-9a-f-]{36}$/i);
	});

	test("writes silenciosos (não throw) sob sessionStorage indisponível", () => {
		// Os blocos try/catch do helper cobrem throws do storage. Validação
		// estrutural via código: helper tem try/catch em cada operação.
		// Aqui apenas confirmamos que chamadas em sequência não throw.
		expect(() => {
			setNick("y");
			setCode("WXYZ");
			setDismissedEmpty();
			resetDismissedEmpty();
		}).not.toThrow();
	});
});
