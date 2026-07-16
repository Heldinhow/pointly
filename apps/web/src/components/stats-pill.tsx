/**
 * Stats pill — T35 (Phase 6).
 *
 * Pill bone-fill no canto superior esquerdo da arena com:
 *  - Mono caps `MÉDIA X.X · MEDIANA Y · INTERVALO A–B`
 *  - Mediana em gold (mustard) por padrão
 *  - Quando `unanimous: true`, mostra badge "UNANIMOUS" em vez da mediana gold
 *  - Aparece só pós-reveal
 *
 * **Lógica**:
 *  - Se `consensus === null`, renderiza vazio (ou hidden)
 *  - Se `consensus.unanimous === true`, exibe badge UNANIMOUS + range (sem mediana gold)
 *  - Caso contrário, exibe média + mediana gold + range
 *
 * **A11y**:
 *  - role="status" + aria-live="polite" (anuncia quando reveal acontece)
 *  - aria-label descritivo
 *
 * @see .specs/features/planning-poker-v1/tasks.md T35
 * @see .specs/features/planning-poker-v1/spec.md F-024, F-049
 */
import type { ConsensusSnapshot } from "../store/sala";
import { cn } from "./ui/utils";

export interface StatsPillProps {
	consensus: ConsensusSnapshot | null;
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

export function StatsPill({ consensus }: StatsPillProps) {
	// Sem consensus (pré-reveal): não renderiza nada visível, mas mantém
	// slot reservado pro layout (display:none evita CLS).
	if (!consensus) {
		return null;
	}

	const showUnanimous = consensus.unanimous;

	return (
		<div
			role="status"
			aria-live="polite"
			aria-label={
				showUnanimous
					? `Votação unânime · média ${formatMean(consensus.mean)} · intervalo ${formatRange(consensus.range)}`
					: `Estatísticas pós-reveal · média ${formatMean(consensus.mean)} · mediana ${formatMedian(consensus.median)} · intervalo ${formatRange(consensus.range)}`
			}
			data-testid="stats-pill"
			data-od-id="stats-pill"
			data-stats-unanimous={showUnanimous ? "true" : "false"}
			className={cn(
				// pill compacto (Atelier Zero): ocupa 1 linha discreta no topo,
				// não compete com a Ø wordmark à esquerda. py-2 era exagerado
				// pra um strip pós-reveal — encolhido pra py-1.5.
				"inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full",
				"bg-surface border border-ink/5",
				"font-mono text-label tracking-caps uppercase text-ink-faint",
				"transition-opacity duration-300",
			)}
		>
			{/* Média */}
			<span data-testid="stats-mean">
				<span className="text-ink-faint">Média</span>{" "}
				<span className="text-ink font-medium" data-testid="stats-mean-value">
					{formatMean(consensus.mean)}
				</span>
			</span>

			{/* Mediana (gold) OU UNANIMOUS badge */}
			{showUnanimous ? (
				<span
					data-testid="stats-unanimous-badge"
					className="font-mono text-micro-label tracking-caps uppercase text-mustard font-semibold inline-flex items-center gap-1"
				>
					<span aria-hidden="true" className="inline-block">
						★
					</span>
					Unanimous
					<span
						aria-hidden="true"
						className="inline-block text-mustard/70 text-micro-label tracking-caps -ml-0.5"
					>
						✦
					</span>
				</span>
			) : (
				<span data-testid="stats-median">
					<span className="text-ink-faint">Mediana</span>{" "}
					<span
						className="text-ink font-semibold border-b border-mustard"
						data-testid="stats-median-value"
					>
						{formatMedian(consensus.median)}
					</span>
				</span>
			)}

			{/* Intervalo */}
			<span data-testid="stats-range">
				<span className="text-ink-faint">Intervalo</span>{" "}
				<span className="text-ink font-medium" data-testid="stats-range-value">
					{formatRange(consensus.range)}
				</span>
			</span>
		</div>
	);
}
