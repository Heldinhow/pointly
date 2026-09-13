/**
 * StatsPill — veredito pós-reveal (Spell dark).
 *
 * Mediana hero + média + intervalo + badge Unânime + distribuição por
 * valor (ordem do deck, ☕ por último).
 *
 * Formatos: mediana inteira→sem decimais senão 1dp; média 1dp;
 * range `min–max` (en-dash U+2013).
 */
import { DECK_VALUES, type Vote } from "@planning-poker/shared";
import type { ConsensusSnapshot } from "@/store/sala";
import { Badge } from "@/components/spell/badge";
import { cn } from "@/lib/cn";

export interface StatsPillProps {
	consensus: ConsensusSnapshot | null;
	votes?: readonly Vote[];
	compact?: boolean;
}

/** Mediana: inteira→sem decimais, senão 1 casa. */
export function formatMedian(median: number | null): string {
	if (median === null) return "—";
	return Number.isInteger(median) ? String(median) : median.toFixed(1);
}

/** Média sempre com 1 casa decimal. */
export function formatMean(mean: number | null): string {
	if (mean === null) return "—";
	return mean.toFixed(1);
}

/** Range `min–max` (en-dash). */
export function formatRange(range: [number, number] | null): string {
	if (!range) return "—";
	return `${range[0]}–${range[1]}`;
}

export type VoteGroup = { value: Vote; count: number };

/** Agrupa votos preservando a ordem do deck (☕ por último). */
export function groupVotes(votes: readonly Vote[]): VoteGroup[] {
	const counts = new Map<Vote, number>();
	for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
	return DECK_VALUES.filter((v) => counts.has(v)).map((v) => ({
		value: v,
		count: counts.get(v) ?? 0,
	}));
}

export function StatsPill({ consensus, votes, compact = false }: StatsPillProps) {
	if (!consensus) return null;

	const total = votes?.length ?? 0;
	const allCoffee = consensus.median === null && total > 0;
	const solo = !allCoffee && total === 1;
	const unanimous = consensus.unanimous && !solo;
	const groups =
		total > 1 && !unanimous && !allCoffee ? groupVotes(votes ?? []) : [];

	const ariaLabel = allCoffee
		? "Rodada em pausa · nenhum voto numérico"
		: solo
			? `Voto único · média ${formatMean(consensus.mean)} · intervalo ${formatRange(consensus.range)}`
			: unanimous
				? `Votação unânime · média ${formatMean(consensus.mean)} · intervalo ${formatRange(consensus.range)}`
				: `Estatísticas pós-reveal · média ${formatMean(consensus.mean)} · mediana ${formatMedian(consensus.median)} · intervalo ${formatRange(consensus.range)}`;

	return (
		<output
			aria-live="polite"
			aria-label={ariaLabel}
			data-testid="stats-pill"
			data-stats-unanimous={consensus.unanimous ? "true" : "false"}
			className={cn(
				"flex w-full items-center justify-center gap-5 text-left",
				compact ? "py-2" : "rounded-2xl border border-[#26262c] bg-[#101013] px-4 py-5 [html.light_&]:border-zinc-200 [html.light_&]:bg-white",
			)}
		>
			<div className="flex flex-col items-center gap-1">
		{unanimous ? (
			<Badge
				data-testid="stats-unanimous-badge"
				variant="emerald"
				className="rounded-full px-2.5 py-0.5 font-mono tracking-[0.14em] uppercase"
			>
				Unânime
			</Badge>
		) : (
				<span
					data-testid="stats-eyebrow"
					className="text-xs text-zinc-400 [html.light_&]:text-zinc-600"
				>
					{allCoffee ? "Pausa" : solo ? "Voto único" : "Mediana"}
				</span>
			)}
			<span
				data-testid="stats-result-value"
				className="font-mono text-4xl font-semibold text-zinc-50 tabular-nums [html.light_&]:text-zinc-900"
			>
				{allCoffee ? "☕" : formatMedian(consensus.median)}
			</span>
			</div>
			<span
				aria-hidden="true"
				className="h-12 w-px shrink-0 bg-[#26262c] [html.light_&]:bg-zinc-200"
			/>
			<div className="flex min-w-0 flex-col items-start gap-1.5">
			<span
				data-testid="stats-caption"
				className="text-sm text-zinc-400 [html.light_&]:text-zinc-600"
			>
				média{" "}
				<span data-testid="stats-mean-value" className="font-mono text-zinc-200 tabular-nums [html.light_&]:text-zinc-900">
					{formatMean(consensus.mean)}
				</span>{" "}
				· intervalo{" "}
				<span data-testid="stats-range-value" className="font-mono text-zinc-200 tabular-nums [html.light_&]:text-zinc-900">
					{formatRange(consensus.range)}
				</span>
			</span>
			{groups.length > 1 && (
				<span
					data-testid="stats-distribution"
					className="flex flex-wrap justify-center gap-1.5 sm:justify-start"
				>
				{groups.map((g) => (
					<Badge
						key={g.value}
						data-testid={`stats-pip-${g.value}`}
						title={`${g.count} voto${g.count > 1 ? "s" : ""} em ${g.value}`}
						variant="blue"
						className="font-mono tabular-nums"
					>
						{g.count}×{g.value}
					</Badge>
				))}
				</span>
			)}
			</div>
		</output>
	);
}
