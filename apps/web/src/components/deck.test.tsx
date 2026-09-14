import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Deck } from "./deck";
import { DECK_VALUES, type Vote } from "../lib/deck";

afterEach(() => {
	cleanup();
});

describe("Deck (ticket 05 — Votar)", () => {
	test("renderiza o deck completo com 9 cartas", () => {
		render(<Deck currentVote={null} onSelect={() => {}} />);
		expect(screen.getByTestId("deck")).toBeTruthy();
		for (const value of DECK_VALUES) {
			expect(screen.getByTestId(`deck-card-${value}`)).toBeTruthy();
		}
		expect(screen.getByTestId("deck-hint").textContent).toMatch(
			/fora da média/i,
		);
	});

	test("aria-pressed reflete a escolha atual sem desabilitar cartas", () => {
		render(<Deck currentVote={"5" as Vote} onSelect={() => {}} />);
		expect(
			screen.getByTestId("deck-card-5").getAttribute("aria-pressed"),
		).toBe("true");
		expect(
			screen.getByTestId("deck-card-8").getAttribute("aria-pressed"),
		).toBe("false");
		// Cartas nunca desabilitadas: pós-reveal o voto pode mudar.
		for (const value of DECK_VALUES) {
			expect(
				screen.getByTestId(`deck-card-${value}`).hasAttribute("disabled"),
			).toBe(false);
		}
	});

	test("clique seleciona a carta e pausa tem rótulo acessível", () => {
		const seen: Vote[] = [];
		render(
			<Deck
				currentVote={null}
				onSelect={(value) => {
					seen.push(value);
				}}
			/>,
		);
		fireEvent.click(screen.getByTestId("deck-card-8"));
		expect(seen).toEqual(["8"]);
		expect(screen.getByTestId("deck-card-☕").getAttribute("aria-label")).toMatch(
			/Pausa/i,
		);
	});

	test("seleção tem indicador estático e elevação só com movimento (issue #158)", () => {
		render(<Deck currentVote={"5" as Vote} onSelect={() => {}} />);
		const selected = screen.getByTestId("deck-card-5");
		// Indicador estático: fundo/borda de seleção independem de animação.
		expect(selected.className).toMatch(/bg-primary/);
		expect(selected.className).toMatch(/border-primary/);
		// Toda elevação (translate/transition) gated por `motion-safe:` —
		// com movimento reduzido a carta fica estática sem perder o estado.
		const tokens = selected.className.split(/\s+/);
		for (const token of tokens) {
			if (token.includes("translate") || token.includes("transition")) {
				expect(token.startsWith("motion-safe:")).toBe(true);
			}
		}
	});
});
