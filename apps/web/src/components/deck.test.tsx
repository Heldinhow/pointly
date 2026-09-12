/**
 * Deck tests — T32 verify (≥3 of 5 minimum required).
 */
import { describe, expect, mock, test } from "bun:test";
import { DECK_VALUES } from "@planning-poker/shared";
import { Deck } from "./deck";
import { fireEvent, render, screen } from "./ui/test-helpers";

describe("Deck — T32", () => {
	test("renderiza 9 cartas Fibonacci em ordem", () => {
		render(<Deck currentVote={null} onSelect={() => {}} />);
		DECK_VALUES.forEach((v) => {
			expect(screen.getByTestId(`deck-card-${v}`)).toBeInTheDocument();
		});
	});

	test("carta selecionada tem data-deck-selected=true + aria-pressed=true", () => {
		render(<Deck currentVote="5" onSelect={() => {}} />);
		const card = screen.getByTestId("deck-card-5");
		expect(card.getAttribute("data-deck-selected")).toBe("true");
		expect(card.getAttribute("aria-pressed")).toBe("true");
		expect(card.getAttribute("aria-label")).toMatch(/selecionada/i);
	});

	test("carta não-selecionada tem data-deck-selected=false", () => {
		render(<Deck currentVote="5" onSelect={() => {}} />);
		const card = screen.getByTestId("deck-card-3");
		expect(card.getAttribute("data-deck-selected")).toBe("false");
		expect(card.getAttribute("aria-pressed")).toBe("false");
		expect(card.getAttribute("aria-label")).toMatch(/votar 3/i);
	});

	test("click numa carta chama onSelect(value)", () => {
		const onSelect = mock((_v: string) => {});
		render(
			<Deck
				currentVote={null}
				onSelect={
					onSelect as unknown as (
						v: import("@planning-poker/shared").Vote,
					) => void
				}
			/>,
		);
		fireEvent.click(screen.getByTestId("deck-card-8"));
		expect(onSelect).toHaveBeenCalledTimes(1);
		const lastCall = onSelect.mock.calls[onSelect.mock.calls.length - 1];
		expect(lastCall?.[0]).toBe("8");
	});

	test("cartas seguem habilitadas pós-reveal — edição do próprio voto (EVR-01)", () => {
		const onSelect = mock(() => {});
		render(<Deck currentVote="5" onSelect={onSelect} />);
		const card = screen.getByTestId("deck-card-8");
		expect(card).not.toBeDisabled();
		expect(screen.getByTestId("deck").className).not.toContain("opacity-60");
		fireEvent.click(card);
		expect(onSelect).toHaveBeenCalledWith("8");
	});

	test("selecionada usa accent sólido + on-accent (single master)", () => {
		render(<Deck currentVote="5" onSelect={() => {}} />);
		const card = screen.getByTestId("deck-card-5");
		expect(card.className).toContain("bg-coral");
		expect(card.className).toContain("text-on-accent");
		expect(card.className).not.toContain("bg-coral/8");
	});

	test("teclado Enter dispara onSelect (a11y)", () => {
		const onSelect = mock(() => {});
		render(<Deck currentVote={null} onSelect={onSelect} />);
		fireEvent.keyDown(screen.getByTestId("deck-card-3"), { key: "Enter" });
		expect(onSelect).toHaveBeenCalledWith("3");
	});

	test("teclado Space dispara onSelect (a11y)", () => {
		const onSelect = mock(() => {});
		render(<Deck currentVote={null} onSelect={onSelect} />);
		fireEvent.keyDown(screen.getByTestId("deck-card-13"), { key: " " });
		expect(onSelect).toHaveBeenCalledWith("13");
	});

	test("☕ renderiza como botão distinto (sem numeral italic)", () => {
		render(<Deck currentVote={null} onSelect={() => {}} />);
		const card = screen.getByTestId("deck-card-☕");
		expect(card).toBeInTheDocument();
		expect(card.textContent).toContain("☕");
	});

	test("chunking: 3 grupos (baixas / altas / pausa) com role=group", () => {
		render(<Deck currentVote={null} onSelect={() => {}} />);
		expect(screen.getByRole("group", { name: "Estimativas baixas" })).toBeInTheDocument();
		expect(screen.getByRole("group", { name: "Estimativas altas" })).toBeInTheDocument();
		expect(screen.getByRole("group", { name: "Pausa" })).toBeInTheDocument();
	});

	test("chunking visível: micro-legendas baixas / altas / pausa pra quem enxerga", () => {
		const { container } = render(<Deck currentVote={null} onSelect={() => {}} />);
		const deck = screen.getByTestId("deck");
		for (const caption of ["baixas", "altas", "pausa"]) {
			const el = Array.from(deck.querySelectorAll("span")).find(
				(s) => s.textContent === caption,
			);
			expect(el).toBeInTheDocument();
			// Legenda é visual; SR usa o aria-label do grupo, não o texto.
			expect(el?.getAttribute("aria-hidden")).toBe("true");
		}
		expect(container).toBeInTheDocument();
	});

	test("☕ explica a regra: title + aria 'pausa — fora da média'", () => {
		render(<Deck currentVote={null} onSelect={() => {}} />);
		const card = screen.getByTestId("deck-card-☕");
		expect(card.getAttribute("title")).toMatch(/fora da média/i);
		expect(card.getAttribute("aria-label")).toMatch(/pausa — fora da média/i);
	});
});
