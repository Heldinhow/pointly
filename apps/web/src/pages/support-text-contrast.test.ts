import { describe, expect, test } from "bun:test";

type Tokens = Record<string, string>;

function declarations(block: string): Tokens {
	const out: Tokens = {};
	for (const line of block.split(";")) {
		const index = line.indexOf(":");
		if (index < 0) continue;
		out[line.slice(0, index).trim()] = line.slice(index + 1).trim();
	}
	return out;
}

function blockFor(css: string, selector: string): string {
	const start = css.indexOf(selector);
	if (start < 0) throw new Error(`seletor ausente: ${selector}`);
	const open = css.indexOf("{", start);
	const close = css.indexOf("}", open);
	return css.slice(open + 1, close);
}

function value(decls: Tokens, property: string): string {
	const found = decls[property];
	if (!found) throw new Error(`propriedade ausente: ${property}`);
	return found;
}

function colorToken(decls: Tokens): string {
	const match = /var\((--[a-z-]+)\)/.exec(value(decls, "color"));
	if (!match) throw new Error("cor não usa token");
	return match[1]!;
}

function resolve(tokens: Tokens, token: string): string {
	const raw = tokens[token];
	if (!raw) throw new Error(`token ausente: ${token}`);
	const ref = /^var\((--[a-z-]+)\)$/.exec(raw.trim());
	return ref ? resolve(tokens, ref[1]!) : raw;
}

function channel(value16: number): number {
	const c = value16 / 255;
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
	const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
	if (!match) throw new Error(`hex inesperado: ${hex}`);
	const n = Number.parseInt(match[1]!, 16);
	return (
		0.2126 * channel((n >> 16) & 255) +
		0.7152 * channel((n >> 8) & 255) +
		0.0722 * channel(n & 255)
	);
}

function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

function css(path: string): Promise<string> {
	return Bun.file(new URL(path, import.meta.url)).text();
}

const HERO = [
	{ file: "./home.css", selector: ".pt-home__hero-lede", bg: "--background" },
	{ file: "./landing.css", selector: ".pt-landing__lede", bg: "--background" },
	{ file: "./join.css", selector: ".join-intro-copy", bg: "--background" },
] as const;

const HINTS = [
	{
		file: "./join.css",
		selector: '.join-form [data-slot="field-description"]',
		bg: "--card",
	},
	{ file: "./join.css", selector: ".join-spectate-hint", bg: "--card" },
] as const;

async function themes(): Promise<Tokens[]> {
	const tokens = await css("../index.css");
	return [
		declarations(blockFor(tokens, ":root {")),
		declarations(blockFor(tokens, ".dark {")),
	];
}

describe("contraste do texto de apoio", () => {
	test("parágrafo do hero fica em 18px com cor AA nos dois temas", async () => {
		for (const { file, selector, bg } of HERO) {
			const decls = declarations(blockFor(await css(file), selector));
			expect(value(decls, "font-size")).toBe("18px");
			for (const theme of await themes()) {
				const ratio = contrast(resolve(theme, colorToken(decls)), resolve(theme, bg));
				expect(ratio).toBeGreaterThanOrEqual(4.5);
			}
		}
	});

	test("dicas do formulário mantêm 4.5:1 nos dois temas", async () => {
		for (const { file, selector, bg } of HINTS) {
			const decls = declarations(blockFor(await css(file), selector));
			for (const theme of await themes()) {
				const ratio = contrast(resolve(theme, colorToken(decls)), resolve(theme, bg));
				expect(ratio).toBeGreaterThanOrEqual(4.5);
			}
		}
	});

	test("rótulo da foto opcional perde peso sem sair da paleta", async () => {
		const decls = declarations(
			blockFor(
				await css("../components/avatar-picker.css"),
				'.avatar-picker--quiet [data-slot="field-label"]',
			),
		);
		expect(value(decls, "font-weight")).toBe("400");
		expect(value(decls, "color")).toBe("var(--muted-foreground)");
	});
});
