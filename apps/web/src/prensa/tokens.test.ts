import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// F0.2: guarda executável dos tokens & temas (SSOT: tabela de cor do DESIGN.md).
const CSS = readFileSync(join(import.meta.dir, "tokens.css"), "utf-8");

const LIGHT: Record<string, string> = {
	"--bg": "#f6f2e9",
	"--surface": "#fdfaf3",
	"--ink": "#171512",
	"--ink-muted": "#6b6357",
	"--line": "#dad2c2",
	"--accent": "#c43a00",
	"--on-accent": "#ffffff",
	"--accent-soft": "#f3e2d8",
};

const DARK: Record<string, string> = {
	"--bg": "#141210",
	"--surface": "#1c1916",
	"--ink": "#f3eee3",
	"--ink-muted": "#a79d8c",
	"--line": "#34302a",
	"--accent": "#ff5a1f",
	"--on-accent": "#201008",
	"--accent-soft": "#3a2114",
};

describe("tokens & temas (F0.2)", () => {
	test("claro papel: valores exatos da tabela", () => {
		for (const [token, value] of Object.entries(LIGHT)) {
			expect(CSS).toContain(`${token}: ${value}`);
		}
	});

	test("escuro breu: valores exatos da tabela", () => {
		for (const [token, value] of Object.entries(DARK)) {
			expect(CSS).toContain(`${token}: ${value}`);
		}
	});

	test("foco = accent nos dois temas", () => {
		expect(CSS).toContain("--focus: var(--accent)");
	});

	test("tema manual (data-theme) tem precedência + padrão é o sistema", () => {
		expect(CSS).toContain(":root[data-theme=");
		expect(CSS).toContain("@media (prefers-color-scheme: dark)");
		expect(CSS).toContain("color-scheme: dark");
		expect(CSS).toContain("color-scheme: light");
	});

	test("espaçamento base 4, raios de papel cortado e recorte duro", () => {
		for (const [token, value] of [
			["--space-1", "4px"],
			["--space-5", "24px"],
			["--space-9", "96px"],
			["--radius-sm", "2px"],
			["--radius-md", "4px"],
		] as const) {
			expect(CSS).toContain(`${token}: ${value}`);
		}
		expect(CSS).toContain("--shadow-cut: 0 2px 0");
	});

	test("movimento: durações e easings do DESIGN.md", () => {
		expect(CSS).toContain("--dur-1: 120ms");
		expect(CSS).toContain("--dur-4: 280ms");
		expect(CSS).toContain("--ease-out: cubic-bezier(0.2, 0.8, 0.2, 1)");
		expect(CSS).toContain("--ease-snap: cubic-bezier(0.3, 1.4, 0.4, 1)");
	});

	test("base (body, títulos, links, seleção, foco, tabular) sob html.prensa", () => {
		for (const selector of [
			"html.prensa body",
			"html.prensa :is(h1, h2, h3)",
			"html.prensa a",
			"html.prensa ::selection",
			"html.prensa :focus-visible",
			"html.prensa .tnum",
		]) {
			expect(CSS).toContain(selector);
		}
		expect(CSS).toContain("font-variant-numeric: tabular-nums");
		expect(CSS).toContain("outline-offset: 2px");
	});
});
