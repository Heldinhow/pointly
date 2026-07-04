/**
 * Deck — T32 (Phase 6).
 *
 * Dock inferior da arena com 9 cartas Fibonacci: 0, ½, 1, 2, 3, 5, 8, 13, ☕.
 *
 * **Visual** (vide plan.md 6.4 + design/arena.html):
 *  - 9 cartas bone-fill 72×100, radius 18px
 *  - Numeral em Playfair Italic 32px (único flourish editorial dentro da arena)
 *  - ☕ usa font-sans (sem itálico) + tamanho menor pra diferenciar do numeral
 *  - Default: ink stroke 1px, surface bone, label ink-faint
 *  - Hover: translateY(-3px) + border coral
 *  - Selected: ring coral 2px + bg coral-soft + ink color
 *  - Disabled pós-reveal: opacity 0.4, sem pointer
 *
 * **Comportamento**:
 *  - Click numa carta chama `onSelect(value)` (T38 wire dispara `cast_vote`)
 *  - Mesma carta selecionada = no-op visual, NÃO envia `value: null`
 *    (F-011 idempotência: un-vote proibido pelo server)
 *  - Cartas com `value === currentVote` recebem `aria-pressed=true`
 *
 * **A11y**:
 *  - Cada carta é `<button>` com aria-label contextual
 *  - aria-disabled quando deck.post-reveal
 *  - Navegação por teclado (Enter/Space nativos do <button>)
 *
 * @see .specs/features/planning-poker-v1/tasks.md T32
 * @see .specs/features/planning-poker-v1/spec.md F-016, F-017, F-018
 */
import type { KeyboardEvent } from "react";
import { DECK_VALUES, type Vote } from "@planning-poker/shared";
import { cn } from "./ui/utils";

export interface DeckProps {
	/** Voto atual do player local. `null` = não votou. */
	currentVote: Vote | null;
	/** true se fase atual é 'revealed' (deck fica desabilitado). */
	disabled: boolean;
	/** Callback quando user clica/ativa uma carta. */
	onSelect: (value: Vote) => void;
}

/**
 * Renderiza as 9 cartas em ordem Fibonacci.
 */
export function Deck({ currentVote, disabled, onSelect }: DeckProps) {
	function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, value: Vote) {
		if (disabled) return;
		// <button> já lida com Enter/Space; nada extra necessário.
		// (Mantemos o handler explícito pra accessibility/axe.)
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSelect(value);
		}
	}

	return (
		<div
			data-testid="deck"
			data-od-id="deck-dock"
			className={cn(
				"flex gap-3 bg-surface border border-ink/5 rounded-card py-3.5 px-4 shadow-bone",
				"transition-opacity",
				disabled && "opacity-40",
			)}
			aria-label="Deck de cartas Fibonacci"
			role="group"
		>
			{DECK_VALUES.map((value) => {
				const selected = currentVote === value;
				const isCoffee = value === "☕";
				return (
					<button
						key={value}
						type="button"
						disabled={disabled}
						aria-label={
							selected
								? `Selecionada, voto em ${value}`
								: `Votar ${value}`
						}
						aria-pressed={selected}
						onClick={() => onSelect(value)}
						onKeyDown={(e) => handleKeyDown(e, value)}
						data-testid={`deck-card-${value}`}
						data-deck-value={value}
						data-deck-selected={selected ? "true" : "false"}
						className={cn(
							// base
							"w-[72px] h-[100px] bg-surface rounded-card",
							"flex items-center justify-center select-none",
							"transition-all duration-150 cursor-pointer",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
							// default border (1px ink)
							!selected && "border border-ink/15",
							// selected: coral ring + soft bg + coral ink
							selected && "border-2 border-coral bg-coral/8 text-coral",
							// hover (só quando não disabled e não selected)
							!disabled && !selected && "hover:-translate-y-[3px] hover:border-coral",
							// disabled: opacity 0.4 (deck pai também aplica, aqui no botão individual)
							disabled && "pointer-events-none opacity-40 cursor-not-allowed",
						)}
					>
						{isCoffee ? (
							<span
								className="font-display text-[22px] text-ink"
								aria-hidden="true"
							>
								☕
							</span>
						) : (
							<span
								className="font-italic italic text-[30px] text-ink leading-none"
								aria-hidden="true"
							>
								{value}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}