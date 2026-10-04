import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { PrensaBrand, PrensaMark, PrensaWordmark } from "./wordmark";

afterEach(() => {
	cleanup();
});

// F0.3: marca nova — lockup em Archivo, sem relação com a antiga
// (swirl de 8 pás + cascata). Produto segue "Pointly"; "Prensa" é a direção.
describe("marca Prensa (F0.3)", () => {
	test("wordmark lê-se Pointly com ponto de sinal em accent", () => {
		render(<PrensaWordmark />);
		const el = screen.getByText(/Pointly/);
		expect(el.getAttribute("data-slot")).toBe("prensa-wordmark");
		expect(el.textContent).toBe("Pointly.");
		expect(el.getAttribute("style")).toMatch(/--font-display/);
		expect(el.getAttribute("style")).toMatch(/--ink/);
	});

	test("bloco de tipo: P sobre tinta + filete de vermelhão", () => {
		const { container } = render(<PrensaMark size={28} />);
		const mark = container.querySelector('[data-slot="prensa-mark"]');
		expect(mark?.textContent).toContain("P");
		expect(container.innerHTML).toMatch(/var\(--ink\)/);
		expect(container.innerHTML).toMatch(/var\(--accent\)/);
	});

	test("lockup combina bloco + wordmark sem cascata nem swirl", () => {
		const { container } = render(<PrensaBrand />);
		expect(
			container.querySelector('[data-slot="prensa-brand"]'),
		).toBeTruthy();
		expect(
			container.querySelector('[data-slot="prensa-mark"]'),
		).toBeTruthy();
		expect(
			container.querySelector('[data-slot="prensa-wordmark"]'),
		).toBeTruthy();
		// Antiga banida: sem pás, giro, cascata ou classes dela.
		expect(container.innerHTML).not.toMatch(/brand-mark/);
		expect(container.innerHTML).not.toMatch(/brand-word/);
		expect(container.innerHTML).not.toMatch(/--i:/);
		expect(container.innerHTML).not.toMatch(/rotate\(.*32 32\)/);
	});
});
