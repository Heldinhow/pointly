import { CoffeeIcon } from "lucide-react";
import { DECK_VALUES, PAUSE_VOTE, voteLabel, type Vote } from "@/lib/deck";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface DeckProps {
	currentVote: Vote | string | null;
	onSelect: (value: Vote) => void;
	disabled?: boolean;
	/** Idioma dos rótulos; a arena (pt) usa o default. */
	lang?: Lang;
}

type DeckLabels = {
	ariaLabel: string;
	groups: readonly [string, string, string];
	pauseTitle: string;
	pauseSr: string;
	cardLabel: (value: Vote | string) => string;
	hint: string;
};

const DECK_LABELS: Record<Lang, DeckLabels> = {
	"pt-BR": {
		ariaLabel: "Cartas de estimativa",
		groups: ["Estimativas baixas", "Estimativas altas", "Pausa"],
		pauseTitle: "Pausa — fora da média",
		pauseSr: "pausa",
		cardLabel: voteLabel,
		hint: "A pausa conta presença, mas fica fora da média.",
	},
	en: {
		ariaLabel: "Estimation cards",
		groups: ["Low estimates", "High estimates", "Pause"],
		pauseTitle: "Pause — out of the average",
		pauseSr: "pause",
		cardLabel: (value) =>
			value === PAUSE_VOTE ? "Coffee break (out of the average)" : `Vote ${value}`,
		hint: "The pause counts as present, but stays out of the average.",
	},
};

const DECK_GROUPS: ReadonlyArray<{ index: 0 | 1 | 2; values: Vote[] }> = [
	{ index: 0, values: ["0", "½", "1", "2"] },
	{ index: 1, values: ["3", "5", "8", "13"] },
	{ index: 2, values: [PAUSE_VOTE] },
];

export function Deck({
	currentVote,
	onSelect,
	disabled = false,
	lang = "pt-BR",
}: DeckProps): React.ReactElement {
	const labels = DECK_LABELS[lang];
	return (
		<div
			data-testid="deck"
			role="group"
			aria-label={labels.ariaLabel}
			aria-disabled={disabled ? true : undefined}
			className="flex flex-col gap-3"
		>
			<div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-3">
				{DECK_GROUPS.map((group) => (
					<div
						key={group.index}
						role="group"
						aria-label={labels.groups[group.index]}
						className="flex items-end gap-1.5"
					>
						{group.values.map((value) => {
							const selected = currentVote === value;
							const isPause = value === PAUSE_VOTE;
							return (
								<button
									key={value}
									type="button"
									data-testid={`deck-card-${value}`}
									aria-pressed={selected ? "true" : "false"}
									aria-label={labels.cardLabel(value)}
									aria-disabled={disabled ? true : undefined}
									disabled={disabled}
									title={isPause ? labels.pauseTitle : `${labels.cardLabel(value)}`}
									onClick={() => onSelect(value)}
								className={cn(
									"flex h-16 w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border font-mono text-xl",
									"motion-safe:transition-transform motion-safe:duration-150",
									"motion-safe:enabled:hover:-translate-y-1 motion-safe:enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50",
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
									<span className="sr-only">
										{isPause ? labels.pauseSr : value}
									</span>
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
				{labels.hint}
			</p>
		</div>
	);
}

export { DECK_VALUES };
