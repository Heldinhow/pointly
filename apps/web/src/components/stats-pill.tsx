/**
 * Result plate — pós-reveal na arena.
 *
 * Imprime o resultado da rodada no inlay central do feltro:
 *  - Eyebrow + numeral herói (mono, tabular) + legenda média/intervalo
 *  - Distribuição real dos votos (agrupada por valor, ☕ por último)
 *  - Estados: normal (mediana), unânime, voto único, pausa (só ☕)
 *
 * **A11y**:
 *  - `role="status"` implícito (`<output>`) + `aria-live="polite"`
 *  - `aria-label` descritivo por estado
 *
 * @see .specs/features/planning-poker-v1/tasks.md T35
 * @see .specs/features/planning-poker-v1/spec.md F-024, F-049
 */
import { DECK_VALUES, type Vote, voteToNumber } from "@planning-poker/shared";
import type { ConsensusSnapshot } from "../store/sala";

export interface StatsPillProps {
	consensus: ConsensusSnapshot | null;
	/**
	 * Votos efetivamente dados nesta rodada (pós-reveal). Opcional:
	 * sem ele o plate mostra só o resultado, sem distribuição.
	 */
	votes?: readonly Vote[];
	/**
	 * `inlay` (default): numeral herói sobre o feltro da mesa (desktop).
	 * `panel`: mesmo veredito, em cartão de superfície — veredito
	 * byte-idêntico no topo da lista mobile (um componente, dois palcos).
	 */
	variant?: "inlay" | "panel";
}

/** Grupo de votos iguais, na ordem do deck (☕ por último). */
export type VoteGroup = { value: Vote; count: number };

/** Agrupa votos por valor preservando a ordem do deck. */
export function groupVotes(votes: readonly Vote[]): VoteGroup[] {
	const counts = new Map<Vote, number>();
	for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
	return DECK_VALUES.filter((v) => counts.has(v)).map((v) => ({
		value: v,
		count: counts.get(v) ?? 0,
	}));
}

/** Formata range "min–max" (U+2013 en-dash). */
export function formatRange(range: [number, number] | null): string {
	if (!range) return "—";
	return `${range[0]}\u2013${range[1]}`;
}

/** Formata mean com 1 casa decimal. */
export function formatMean(mean: number | null): string {
	if (mean === null) return "—";
	return mean.toFixed(1);
}

/** Formata mediana sem casas decimais se inteiro. */
export function formatMedian(median: number | null): string {
	if (median === null) return "—";
	return Number.isInteger(median) ? median.toString() : median.toFixed(1);
}

export function StatsPill({ consensus, votes, variant = "inlay" }: StatsPillProps) {
	// Sem consensus (pré-reveal): não renderiza nada visível.
	if (!consensus) {
		return null;
	}

	const total = votes?.length ?? 0;
	const allCoffee = consensus.median === null && total > 0;
	const solo = !allCoffee && total === 1;
	const unanimous = consensus.unanimous && !solo;
	const groups =
		total > 1 && !unanimous && !allCoffee ? groupVotes(votes ?? []) : [];
	const showDistribution = groups.length > 1;

	const ariaLabel = allCoffee
		? "Rodada em pausa · nenhum voto numérico"
		: solo
			? `Voto único · média ${formatMean(consensus.mean)} · intervalo ${formatRange(consensus.range)}`
			: unanimous
				? `Votação unânime · média ${formatMean(consensus.mean)} · intervalo ${formatRange(consensus.range)}`
				: `Estatísticas pós-reveal · média ${formatMean(consensus.mean)} · mediana ${formatMedian(consensus.median)} · intervalo ${formatRange(consensus.range)}`;

	const distributionLabel = showDistribution
		? `Distribuição: ${groups.map((g) => `${g.count} voto${g.count > 1 ? "s" : ""} ${g.value}`).join(", ")}`
		: undefined;

	return (
		<output
			aria-live="polite"
			aria-label={ariaLabel}
			data-testid="stats-pill"
			data-od-id="stats-pill"
			data-stats-unanimous={consensus.unanimous ? "true" : "false"}
			data-stats-mode={
				allCoffee ? "pause" : solo ? "solo" : unanimous ? "unanimous" : "normal"
			}
			data-stats-variant={variant}
			className={variant === "panel" ? "arena-result arena-result-panel" : "arena-result"}
		>
			{/* Eyebrow: o que o numeral está dizendo */}
			{unanimous ? (
				<span className="arena-result-eyebrow" data-testid="stats-unanimous-badge">
					Unânime
				</span>
			) : (
				<span className="arena-result-eyebrow" data-testid="stats-eyebrow">
					{allCoffee ? "Pausa" : solo ? "Voto único" : "Mediana"}
				</span>
			)}

			{/* Numeral herói */}
			<span
				className="arena-result-value"
				data-testid={
					unanimous || solo || allCoffee
						? "stats-result-value"
						: "stats-median-value"
				}
			>
				{allCoffee ? "☕" : formatMedian(consensus.median)}
			</span>

			{/* Legenda: média + intervalo (só faz sentido com dispersão) */}
			{!allCoffee && !solo && !unanimous && (
				<span className="arena-result-caption" data-testid="stats-caption">
					<span data-testid="stats-mean">
						média{" "}
						<span className="arena-result-strong" data-testid="stats-mean-value">
							{formatMean(consensus.mean)}
						</span>
					</span>
					<span aria-hidden="true"> · </span>
					<span data-testid="stats-range">
						intervalo{" "}
						<span className="arena-result-strong" data-testid="stats-range-value">
							{formatRange(consensus.range)}
						</span>
					</span>
				</span>
			)}
			{unanimous && (
				<span className="arena-result-caption">todos votaram o mesmo</span>
			)}
			{allCoffee && (
				<span className="arena-result-caption">
					sem votos numéricos nesta rodada
				</span>
			)}

			{/* Distribuição: os votos que produziram o numeral */}
			{showDistribution && (
				<span
					className="arena-result-dist"
					data-testid="stats-distribution"
					aria-label={distributionLabel}
				>
					{groups.map((g) => {
						const n = voteToNumber(g.value);
						const isMedian =
							n !== null &&
							consensus.median !== null &&
							n === consensus.median;
						return (
							<span
								key={g.value}
								className="arena-pip"
								data-testid={`stats-pip-${g.value}`}
								data-pip-median={isMedian ? "true" : "false"}
							>
								<span className="arena-pip-value" aria-hidden="true">
									{g.value}
								</span>
								{g.count > 1 && (
									<span className="arena-pip-count" aria-hidden="true">
										×{g.count}
									</span>
								)}
							</span>
						);
					})}
				</span>
			)}
		</output>
	);
}
