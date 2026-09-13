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
			className="flex flex-wrap items-end justify-center gap-x-5 gap-y-4"
		>
			{DECK_GROUPS.map((group) => (
				<div
					key={group.caption}
					role="group"
					aria-label={group.label}
					className="flex flex-col items-center gap-2"
				>
					<span
						aria-hidden="true"
						className="font-mono text-[10px] tracking-[0.18em] text-zinc-500 uppercase [html.light_&]:text-zinc-500"
					>
						{group.caption}
					</span>
					<div className="flex items-end gap-2">
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
									spotlight
									className={cn(
										"flex h-[76px] w-[56px] items-center justify-center rounded-xl border font-mono text-2xl transition-colors duration-150 sm:h-[88px] sm:w-16",
										selected
											? "border-emerald-300 bg-emerald-400 font-semibold text-emerald-950 shadow-[0_12px_32px_-10px_rgba(52,211,153,0.7)] ring-2 ring-emerald-300/60"
											: "border-[#2b2b31] bg-gradient-to-b from-[#1d1d22] to-[#141417] text-zinc-100 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-emerald-400/60 hover:text-white [html.light_&]:border-zinc-300 [html.light_&]:bg-white [html.light_&]:bg-none [html.light_&]:text-zinc-900 [html.light_&]:shadow-[0_8px_20px_-12px_rgba(0,0,0,0.25)]",
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
