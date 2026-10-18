import { describe, expect, test } from "bun:test";
import { middleTruncate } from "./utils";

describe("middleTruncate", () => {
	test("texto curto passa intacto", () => {
		expect(middleTruncate("http://localhost/join")).toBe(
			"http://localhost/join",
		);
	});

	test("texto longo corta o meio e preserva o fim com o código", () => {
		const url = "https://pointly.very-long-subdomain.example.com/join?code=AB12";
		const shown = middleTruncate(url, 30);

		expect(shown).toHaveLength(30);
		expect(shown).toContain("…");
		expect(shown.startsWith("https://pointl")).toBe(true);
		expect(shown.endsWith("/join?code=AB12")).toBe(true);
		expect(shown).not.toBe(url);
	});

	test("respeita o limite pedido", () => {
		expect(middleTruncate("abcdefghij", 7)).toBe("abc…hij");
	});

	test("limite mínimo devolve só a reticência", () => {
		expect(middleTruncate("abcdef", 1)).toBe("…");
		expect(middleTruncate("abcdef", 0)).toBe("…");
	});

	test("não parte emoji ao meio", () => {
		expect(middleTruncate("😀😀😀😀😀😀😀", 5)).toBe("😀😀…😀😀");
		expect(Array.from(middleTruncate("🎯abcdefghij", 7))).toHaveLength(7);
	});
});
