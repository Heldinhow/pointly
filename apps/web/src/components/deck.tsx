import { CoffeeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DECK_VALUES, voteLabel, type Vote } from "@/lib/deck";

export interface DeckProps {
	currentVote: Vote | string | null;
	onSelect: (value: Vote) => void;
	disabled?: boolean;
}

const DECK_GROUPS: Array<{ label: string; values: Vote[] }> = [
	{ label: "Estimativas baixas", values: ["0", "½", "1", "2"] },
	{ label: "Estimativas altas", values: ["3", "5", "8", "13"] },
	{ label: "Pausa", values: ["☕"] },
];

export function Deck({ currentVote, onSelect, disabled = false }: DeckProps): React.ReactElement {
	return (
		<div
			data-testid="deck"
			role="group"
			aria-label="Cartas de estimativa"
			aria-disabled={disabled ? true : undefined}
			className="flex flex-col gap-3"
		>
			<div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-3">
				{DECK_GROUPS.map((group) => (
					<div
						key={group.label}
						role="group"
						aria-label={group.label}
						className="flex items-end gap-1.5"
					>
						{group.values.map((value) => {
							const selected = currentVote === value;
							const isPause = value === "☕";
							return (
								<button
									key={value}
									type="button"
									data-testid={`deck-card-${value}`}
									aria-pressed={selected ? "true" : "false"}
									aria-label={voteLabel(value)}
									aria-disabled={disabled ? true : undefined}
									disabled={disabled}
									title={isPause ? "Pausa — fora da média" : `Votar ${value}`}
									onClick={() => onSelect(value)}
								className={cn(
									"flex h-16 w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border font-mono text-xl",
									"motion-safe:transition-transform motion-safe:duration-150",
									"motion-safe:hover:-translate-y-1 motion-safe:active:translate-y-0",
									"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
									selected
										? "border-primary bg-primary font-semibold text-primary-foreground shadow-xs motion-safe:-translate-y-1"
										: "border-border bg-card text-card-foreground hover:border-muted-foreground/40",
									selected && "motion-safe:-translate-y-2",
								)}
								>
									{isPause ? (
										<CoffeeIcon aria-hidden="true" className="size-5" />
									) : (
										<span aria-hidden="true">{value}</span>
									)}
									<span className="sr-only">{isPause ? "pausa" : value}</span>
								</button>
							);
						})}
					</div>
				))}
			</div>
			<p
				className="text-center text-xs text-muted-foreground"
				data-testid="deck-hint"
			>
				A pausa conta presença, mas fica fora da média.
			</p>
		</div>
	);
}

export { DECK_VALUES };
