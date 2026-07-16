/**
 * MobileRevealDock — dock sticky-bottom pra Arena mobile (<sm).
 *
 * Substitui o counter-scaled Deck + RevealButton central do round-table
 * desktop. Em viewports estreitos: Deck horizontal scroll + RevealButton
 * full-width empilhados verticalmente, ancorados no rodapé safe-area.
 *
 * **Stacking (top→bottom)**:
 *  1. Deck (scroll-snap horizontal, 9 cards Fibonacci) — input visual
 *  2. RevealButton (mode=inline) — commit, coral CTA
 *
 * Justificativa da ordem: Voting UX should land thumb on cards first
 * (selecting vote), then on CTA (committing). Reverse order força o
 * usuário a saltar a CTA pra alcançar as cartas menos populares.
 *
 * **Border+Shadow Rule (DESIGN.md §4)**:
 * Border-t hairline + shadow-bone. Pill archetype exception: dock é um
 * floating surface (sticky/overlay) sem side/bottom borders — shadow
 * sozinho carrega o lift, exatamente como toast/projectile-menu.
 *
 * **Safe area**: padding-bottom usa `env(safe-area-inset-bottom)` com
 * floor de 12px pra acomodar home indicator (iOS) + altura visual mínima.
 *
 * **A11y**: region landmark com aria-label. Deck + RevealButton mantêm
 * seus próprios testids e aria; o dock é só container.
 *
 * @see Deck, RevealButton
 * @see DESIGN.md §4 (Border+Shadow Pill exception)
 */
import type { Phase, Vote } from "@planning-poker/shared";
import { Deck } from "../deck";
import { RevealButton } from "../reveal-button";

export interface MobileRevealDockProps {
	phase: Phase;
	myVote: Vote | null;
	/** true se fase atual é 'revealed' (deck fica disabled). */
	disabled: boolean;
	votedCount: number;
	totalPlayers: number;
	onSelect: (value: Vote) => void;
	onReveal: () => void;
	onNewRound: () => void;
}

export function MobileRevealDock({
	phase,
	myVote,
	disabled,
	votedCount,
	totalPlayers,
	onSelect,
	onReveal,
	onNewRound,
}: MobileRevealDockProps) {
	return (
		<div
			data-testid="mobile-reveal-dock"
			role="region"
			aria-label="Ações de voto da rodada"
			className={[
				// sticky ancorado no bottom do <main> scroll container
				"sticky bottom-0 z-20",
				// fundo opaco + surface-noise de famille com a página
				"bg-surface surface-noise",
				// pill archetype: border-t hairline + shadow-bone
				// (Border+Shadow Rule exception — floating surface)
				"border-t border-ink/10 shadow-bone",
				// safe-area-bottom + inner padding (respiração vertical
				// generosa pra thumb zone)
				"px-3 pt-3",
				"pb-[max(env(safe-area-inset-bottom),0.75rem)]",
			].join(" ")}
		>
			<Deck
				currentVote={myVote}
				disabled={disabled}
				onSelect={onSelect}
				phase={phase}
			/>
			<RevealButton
				phase={phase}
				votedCount={votedCount}
				totalPlayers={totalPlayers}
				onReveal={onReveal}
				onNewRound={onNewRound}
				mode="inline"
			/>
		</div>
	);
}
