/**
 * Deck — fileira de 9 cartas Fibonacci (Spell dark).
 *
 * Grupos visuais (chunking ≤4): baixas [0,½,1,2] / altas [3,5,8,13] /
 * pausa [☕]. Cada carta é um `<button>` nativo (teclado de graça).
 *
 * Contrato e2e: `data-testid="deck-card-{value}"` + `aria-pressed` refletem
 * a verdade server-driven; cartas NUNCA desabilitadas (pós-reveal o voto
 * pode mudar — EVR-01 — e o clique repetido é no-op no caller).
 */
import { DECK_VALUES, type Vote } from "@planning-poker/shared";
import { TiltCard } from "@/components/spell/tilt-card";
import { cn } from "@/lib/cn";

export interface DeckProps {
	currentVote: Vote | null;
	onSelect: (value: Vote) => void;
}

const DECK_GROUPS: Array<{ label: string; caption: string; values: Vote[] }> = [
	{ label: "Estimativas baixas", caption: "baixas", values: ["0", "½", "1", "2"] },
	{ label: "Estimativas altas", caption: "altas", values: ["3", "5", "8", "13"] },
	{ label: "Pausa", caption: "pausa", values: ["☕"] },
];

export function Deck({ currentVote, onSelect }: DeckProps) {
	return (
		<div
			data-testid="deck"
			role="group"
			aria-label="Cartas de estimativa"
			className="flex flex-wrap items-end justify-center gap-x-3 gap-y-3"
		>
			{DECK_GROUPS.map((group) => (
				<div
					key={group.caption}
					role="group"
					aria-label={group.label}
					className="flex flex-col items-center gap-2"
				>
					<div className="flex items-end gap-1.5">
						{group.values.map((value) => {
							const selected = currentVote === value;
							return (
								<button
									key={value}
									type="button"
									data-testid={`deck-card-${value}`}
									aria-pressed={selected ? "true" : "false"}
									aria-label={
										value === "☕"
											? "Pausa para café (fora da média)"
											: `Votar ${value}`
									}
									title={
										value === "☕" ? "Pausa — fora da média" : `Votar ${value}`
									}
								onClick={() => onSelect(value)}
								className={cn(
									"cursor-pointer rounded-xl transition-transform duration-150 motion-safe:hover:-translate-y-1 motion-safe:active:translate-y-0",
									"focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] focus-visible:outline-none",
									selected && "motion-safe:-translate-y-2",
								)}
							>
								<TiltCard
									tiltLimit={6}
									scale={1.03}
									className={cn(
										"flex h-16 w-12 items-center justify-center rounded-lg border font-mono text-xl motion-safe:transition-colors duration-150 sm:h-20 sm:w-14",
										selected
											? "border-emerald-300 bg-emerald-400 font-semibold text-emerald-950 ring-2 ring-emerald-300/60"
											: "border-[#2b2b31] bg-[#17171b] text-zinc-100 hover:border-zinc-500 [html.light_&]:border-zinc-300 [html.light_&]:bg-white [html.light_&]:text-zinc-900",
									)}
								>
									{value}
								</TiltCard>
							</button>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}

export { DECK_VALUES };
