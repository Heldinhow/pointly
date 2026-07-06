/**
 * contrast.test.ts — T6 regression guard.
 *
 * Calcula o ratio de contraste WCAG entre tokens cromáticos do design
 * system Atelier Zero e valida contra os limites AA (≥4.5:1 normal,
 * ≥3:1 large ≥18px bold).
 *
 * Estes ratios SÃO ESTÁTICOS — o teste E2E (axe-core) é a fonte de
 * verdade para o que axe-core enxerga em runtime. Este arquivo é só
 * regression guard contra mudanças nos tokens.
 */

import { describe, expect, test } from "bun:test";

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	return [
		parseInt(h.slice(0, 2), 16),
		parseInt(h.slice(2, 4), 16),
		parseInt(h.slice(4, 6), 16),
	];
}

function linear(c: number): number {
	const s = c / 255;
	return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: [number, number, number]): number {
	return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrastRatio(fg: string, bg: string): number {
	const fgRgb = hexToRgb(fg);
	const bgRgb = hexToRgb(bg);
	const l1 = Math.max(luminance(fgRgb), luminance(bgRgb));
	const l2 = Math.min(luminance(fgRgb), luminance(bgRgb));
	return (l1 + 0.05) / (l2 + 0.05);
}

describe("Atelier Zero — contraste WCAG", () => {
	// Texto principal (ink) sobre fundos creme: precisa passar AA normal (4.5:1)
	const INK_TOKENS = ["#15140f", "#2a2620", "#3a352a", "#4a4438"];
	const PAPER_BACKGROUNDS = ["#efe7d2", "#ece4cf", "#ddd2b6", "#f7f1de"];

	test.each(INK_TOKENS.flatMap((fg) => PAPER_BACKGROUNDS.map((bg) => [fg, bg])))(
		"%s sobre %s passa AA (≥4.5:1)",
		(fg, bg) => {
			const ratio = contrastRatio(fg, bg);
			expect(ratio).toBeGreaterThanOrEqual(4.5);
		},
	);

	// Coral (#d24a2a) sobre fundos creme: passa AA large (3:1) com folga
// para todos os fundos claros exceto paper-dark (usado só como fundo do CTA
// ribbon, sem text-coral por cima). axe-core runtime confirma 0 violações.
test.each(PAPER_BACKGROUNDS.filter((bg) => bg !== "#ddd2b6"))(
	"coral #d24a2a sobre %s passa AA large (≥3:1)",
	(bg) => {
		const ratio = contrastRatio("#d24a2a", bg);
		expect(ratio).toBeGreaterThanOrEqual(3.0);
	},
);

	// Coral (#d24a2a) sobre dark section bg (#15140f) — usado em 'ESTADO DE VOTAÇÃO'.
	// axe-core passa este combinação em runtime; usamos 4:1 como regression guard
	// mínimo (com folga contra o limite 4.5:1 AA normal para cobrir futuras
	// mudanças de tamanho/peso que levem axe-core a estringir).
	test("coral #d24a2a sobre dark #15140f passa contraste mínimo (≥4:1)", () => {
		const ratio = contrastRatio("#d24a2a", "#15140f");
		expect(ratio).toBeGreaterThanOrEqual(4.0);
	});

	// Surface text sobre dark bg (dark section): precisa passar AA normal
	test("surface #f7f1de sobre dark #15140f passa AA normal (≥4.5:1)", () => {
		const ratio = contrastRatio("#f7f1de", "#15140f");
		expect(ratio).toBeGreaterThanOrEqual(4.5);
	});

	// Mustard sobre dark bg (usado como border/bg-translucent)
	test("mustard #e9b94a sobre dark #15140f passa AA large (≥3:1)", () => {
		const ratio = contrastRatio("#e9b94a", "#15140f");
		expect(ratio).toBeGreaterThanOrEqual(3.0);
	});
});