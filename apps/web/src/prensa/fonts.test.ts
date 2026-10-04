import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// F0.1: guarda executável das fontes self-hosted (SSOT: DESIGN.md).
const PRENSA_DIR = import.meta.dir;
const FONTS_DIR = join(PRENSA_DIR, "..", "..", "public", "fonts");
const CSS = readFileSync(join(PRENSA_DIR, "fonts.css"), "utf-8");

const EXPECTED = [
	"archivo-var-latin.woff2",
	"archivo-var-latin-ext.woff2",
	"instrument-sans-var-latin.woff2",
	"instrument-sans-var-latin-ext.woff2",
];

describe("fontes self-hosted (F0.1)", () => {
	test("os 4 woff2 vendorizados existem e não estão vazios", () => {
		for (const file of EXPECTED) {
			const size = statSync(join(FONTS_DIR, file)).size;
			expect(size).toBeGreaterThan(8000);
		}
	});

	test("arquivos têm assinatura woff2 (wOF2)", () => {
		for (const file of EXPECTED) {
			const head = readFileSync(join(FONTS_DIR, file)).subarray(0, 4);
			expect(head.toString("ascii")).toBe("wOF2");
		}
	});

	test("nada além dos 4 woff2 esperados no diretório", () => {
		expect(readdirSync(FONTS_DIR).sort()).toEqual([...EXPECTED].sort());
	});

	test("@font-face cobre Archivo (latin + latin-ext) com unicode-range", () => {
		expect(CSS).toContain('font-family: "Archivo"');
		expect(CSS).toContain("/fonts/archivo-var-latin.woff2");
		expect(CSS).toContain("/fonts/archivo-var-latin-ext.woff2");
		expect(CSS).toContain("font-stretch: 62% 125%");
		expect(CSS).toContain("font-weight: 500 800");
		expect(CSS).toContain(
			"unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC",
		);
		expect(CSS).toContain("unicode-range: U+0000-00FF, U+0131");
	});

	test("@font-face cobre Instrument Sans (latin + latin-ext)", () => {
		expect(CSS).toContain('font-family: "Instrument Sans"');
		expect(CSS).toContain("/fonts/instrument-sans-var-latin.woff2");
		expect(CSS).toContain("/fonts/instrument-sans-var-latin-ext.woff2");
		expect(CSS).toContain("font-weight: 400 700");
	});

	test("fallbacks têm métricas anti-CLS (size-adjust + overrides)", () => {
		expect(CSS).toContain("size-adjust: 100.44%");
		expect(CSS).toContain("ascent-override: 87.8%");
		expect(CSS).toContain("size-adjust: 103.59%");
		expect(CSS).toContain("ascent-override: 97%");
		expect(CSS).toContain("font-display: swap");
	});
});
