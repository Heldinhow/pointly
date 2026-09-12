import type { Phase } from "@planning-poker/shared";
import { type Vote } from "@planning-poker/shared";
/**
 * Deck — T32 (Phase 6).
 *
 * Dock inferior da arena com 9 cartas Fibonacci: 0, ½, 1, 2, 3, 5, 8, 13, ☕.
 *
 * **Visual** (vide plan.md 6.4 + design/arena.html):
 *  - 9 cartas 64×84 desktop / 48×68 mobile, radius 8px
 *  - Numeral em Geist 20px sem itálico (dígitos; o ☕ usa
 *    font-sans 16px pra diferenciar do numeral)
 *  - Default: ink stroke 1px, surface bone, label ink-faint
 *  - Hover: border coral (sem translate — motion só pra feedback)
 *  - Selected: accent sólido + on-accent (single master com arena.css)
 *  - Pós-reveal: cartas seguem ativas para editar o próprio voto (EVR-01)
 *
 * **Comportamento**:
 *  - Click numa carta chama `onSelect(value)` (T38 wire dispara `cast_vote`)
 *  - Mesma carta selecionada = no-op visual, NÃO envia `value: null`
 *    (F-011 idempotência: un-vote proibido pelo server)
 *  - Cartas com `value === currentVote` recebem `aria-pressed=true`
 *
 * **A11y**:
 *  - Cada carta é `<button>` com aria-label contextual
 *  - Navegação por teclado (Enter/Space nativos do <button>)
 *
 * @see .specs/features/planning-poker-v1/tasks.md T32
 * @see .specs/features/planning-poker-v1/spec.md F-016, F-017
 * @see tests/e2e/edit-vote-after-reveal.spec.ts (EVR-01: edição pós-reveal)
 */
import { type KeyboardEvent, Fragment, useEffect, useRef } from "react";
import { cn } from "./ui/utils";

export interface DeckProps {
	/** Voto atual do player local. `null` = não votou. */
	currentVote: Vote | null;
	/** Callback quando user clica/ativa uma carta. */
	onSelect: (value: Vote) => void;
	/** Phase atual (para resetar scrollLeft quando entra em voting). */
	phase?: Phase;
}

/**
 * Renderiza as 9 cartas em ordem Fibonacci.
 *
 * **Mobile (Phase 3 / BUG-203 / ADR-005)**: deck vira horizontal scroll com
 * `scroll-snap-x mandatory` em <sm (≤640px). Cartas mantêm tamanho 48×68.
 * Em ≥sm mantém layout flex sem scroll. Peeks gradientes nas pontas indicam
 * "tem mais cartas" no mobile (escondidos em ≥sm).
 *
 * **Chunking**: grupos de ≤4 cartas separados por hairline (baixas / altas
 * / pausa) pra decisão caber na working memory.
 */
/**
 * Grupos visuais do deck (chunking ≤4 por grupo, working memory).
 * Ordem e valores idênticos a DECK_VALUES — só agrupamento visual:
 *  - baixas: 0, ½, 1, 2
 *  - altas: 3, 5, 8, 13
 *  - pausa: ☕ (preciso de um intervalo)
 */
const DECK_GROUPS: Array<{ label: string; values: Vote[] }> = [
	{ label: "Estimativas baixas", values: ["0", "½", "1", "2"] },
	{ label: "Estimativas altas", values: ["3", "5", "8", "13"] },
	{ label: "Pausa", values: ["☕"] },
];
export function Deck({ currentVote, onSelect, phase }: DeckProps) {
	const scrollRef = useRef<HTMLDivElement | null>(null);

	// BUG-203 / T05: reset scrollLeft no início de cada rodada (phase → voting).
	useEffect(() => {
		if (phase === "voting" && scrollRef.current) {
			scrollRef.current.scrollLeft = 0;
		}
	}, [phase]);

	// Phase 7 (mobile-first): atribui data-deck-scrollable-left/right no
	// container de scroll baseado em scrollLeft vs scrollWidth. O CSS
	// [index.css] usa esses attrs pra reforçar o side-shadow "tem mais"
	// só na direção que ainda tem conteúdo (não desperdiça affordance).
	// Marque scrollWidth > clientWidth + 1 (tolerância sub-pixel iOS).
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const update = () => {
			const maxScroll = el.scrollWidth - el.clientWidth;
			const canScroll = maxScroll > 1;
			el.dataset.deckScrollable = canScroll ? "true" : "false";
			el.dataset.deckScrollableLeft =
				canScroll && el.scrollLeft > 1 ? "true" : "false";
			el.dataset.deckScrollableRight =
				canScroll && el.scrollLeft < maxScroll - 1 ? "true" : "false";
		};
		update();
		el.addEventListener("scroll", update, { passive: true });
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => {
			el.removeEventListener("scroll", update);
			ro.disconnect();
		};
	}, []);

	function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, value: Vote) {
		// <button> já lida com Enter/Space; nada extra necessário.
		// (Mantemos o handler explícito pra accessibility/axe.)
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSelect(value);
		}
	}

	return (
		<div className="relative fib-deck-wrapper" data-testid="deck-wrapper">
			{/* Peek gradientes — só no mobile (escondidos em ≥sm).
			    Phase 7: w-6 (24px) — w-12 cobria a carta inteira de 48px em 375px. */}
			<div
				aria-hidden="true"
				className="fib-deck-peek fib-deck-peek-left pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:hidden"
			/>
			<div
				aria-hidden="true"
				className="fib-deck-peek fib-deck-peek-right pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:hidden"
			/>
			<div
				ref={scrollRef}
				data-testid="deck"
				data-od-id="deck-dock"
			className={cn(
				"arena-deck",
					"flex gap-2 bg-surface border border-ink/5 rounded-lg py-2 px-2.5",
					// Mobile: scroll horizontal + snap. ≥sm: overflow visível.
					"overflow-x-auto snap-x snap-mandatory sm:overflow-visible sm:snap-none",
					// Esconde scrollbar webkit (peek é o affordance).
					"fib-deck",
				)}
				aria-label="Deck de cartas Fibonacci"
				role="region"
			>
				{DECK_GROUPS.map((group, gi) => (
				<Fragment key={group.label}>
					{gi > 0 && (
						<span
							aria-hidden="true"
							className="w-px self-stretch bg-ink/10 flex-shrink-0"
						/>
					)}
					<div
						key={group.label}
						role="group"
						aria-label={group.label}
						className="flex gap-2 flex-shrink-0"
					>
						{group.values.map((value) => {
							const selected = currentVote === value;
							const isCoffee = value === "☕";
							return (
								<button
									key={value}
									type="button"
									aria-label={
										selected ? `Selecionada, voto em ${value}` : `Votar ${value}`
									}
									aria-pressed={selected}
									onClick={() => onSelect(value)}
									onKeyDown={(e) => handleKeyDown(e, value)}
									data-testid={`deck-card-${value}`}
									data-deck-value={value}
									data-deck-selected={selected ? "true" : "false"}
									style={{ scrollSnapAlign: "start" }}
									className={cn(
										// base
										"w-[48px] h-[68px] flex-shrink-0 bg-surface rounded-lg",
										"flex items-center justify-center select-none",
										"transition-colors duration-150 cursor-pointer",
									"focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
									// default border (1px ink)
									!selected && "border border-ink/15",
									// selected: accent sólido + on-accent (DESIGN deck-card-selected)
									selected && "border-2 border-coral bg-coral text-on-accent",
									// hover (só quando não selected)
									!selected && "hover:border-coral-deep",
									)}
								>
									{isCoffee ? (
										<span
											className={`font-display text-body leading-none ${selected ? "text-on-accent" : "text-ink"}`}
											aria-hidden="true"
										>
											☕
										</span>
									) : (
										<span
											className={`font-display text-vote-mark leading-none ${selected ? "text-on-accent" : "text-ink"}`}
											aria-hidden="true"
										>
											{value}
										</span>
									)}
								</button>
							);
						})}
					</div>
				</Fragment>
			))}
			</div>
		</div>
	);
}
