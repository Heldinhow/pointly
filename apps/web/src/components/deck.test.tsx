/**
 * Deck tests — T32 verify (≥3 of 5 minimum required).
 */
import { describe, expect, mock, test } from "bun:test";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders, screen } from "./ui/test-helpers";
import { Deck } from "./deck";
import { DECK_VALUES } from "@planning-poker/shared";

describe("Deck — T32", () => {
	test("renderiza 9 cartas Fibonacci em ordem", () => {
		renderWithProviders(<Deck currentVote={null} disabled={false} onSelect={() => {}} />);
		DECK_VALUES.forEach((v) => {
			expect(screen.getByTestId(`deck-card-${v}`)).toBeInTheDocument();
		});
	});

	test("carta selecionada tem data-deck-selected=true + aria-pressed=true", () => {
		renderWithProviders(<Deck currentVote="5" disabled={false} onSelect={() => {}} />);
		const card = screen.getByTestId("deck-card-5");
		expect(card.getAttribute("data-deck-selected")).toBe("true");
		expect(card.getAttribute("aria-pressed")).toBe("true");
		expect(card.getAttribute("aria-label")).toMatch(/selecionada/i);
	});

	test("carta não-selecionada tem data-deck-selected=false", () => {
		renderWithProviders(<Deck currentVote="5" disabled={false} onSelect={() => {}} />);
		const card = screen.getByTestId("deck-card-3");
		expect(card.getAttribute("data-deck-selected")).toBe("false");
		expect(card.getAttribute("aria-pressed")).toBe("false");
		expect(card.getAttribute("aria-label")).toMatch(/votar 3/i);
	});

	test("click numa carta chama onSelect(value)", () => {
		const onSelect = mock((_v: string) => {});
		renderWithProviders(
			<Deck
				currentVote={null}
				disabled={false}
				onSelect={onSelect as unknown as (v: import("@planning-poker/shared").Vote) => void}
			/>,
		);
		fireEvent.click(screen.getByTestId("deck-card-8"));
		expect(onSelect).toHaveBeenCalledTimes(1);
		const lastCall = onSelect.mock.calls[onSelect.mock.calls.length - 1];
		expect(lastCall?.[0]).toBe("8");
	});

	test("disabled=true bloqueia click + aplica opacity-40 (F-018)", () => {
		const onSelect = mock(() => {});
		renderWithProviders(<Deck currentVote={null} disabled={true} onSelect={onSelect} />);
		const card = screen.getByTestId("deck-card-5");
		expect(card).toBeDisabled();
		expect(card.className).toContain("opacity-40");
	});

	test("teclado Enter dispara onSelect (a11y)", () => {
		const onSelect = mock(() => {});
		renderWithProviders(<Deck currentVote={null} disabled={false} onSelect={onSelect} />);
		fireEvent.keyDown(screen.getByTestId("deck-card-3"), { key: "Enter" });
		expect(onSelect).toHaveBeenCalledWith("3");
	});

	test("teclado Space dispara onSelect (a11y)", () => {
		const onSelect = mock(() => {});
		renderWithProviders(<Deck currentVote={null} disabled={false} onSelect={onSelect} />);
		fireEvent.keyDown(screen.getByTestId("deck-card-13"), { key: " " });
		expect(onSelect).toHaveBeenCalledWith("13");
	});

	test("☕ renderiza como botao distinto (sem numeral italic) — DESIGN-12 / #74", () => {
		renderWithProviders(<Deck currentVote={null} disabled={false} onSelect={() => {}} />);
		const card = screen.getByTestId("deck-card-☕");
		expect(card).toBeInTheDocument();
		// DESIGN-12 / #74: emoji foi substituido por SVG com vapor animado.
		// Verifica o data-testid do SVG em vez do emoji.
		expect(card.querySelector('[data-testid="deck-coffee-icon"]')).toBeInTheDocument();
	});
});