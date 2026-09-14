import { DECK_VALUES, type Vote } from "./protocol";

export { DECK_VALUES, type Vote };

/** Carta de pausa: conta presença (`hasVoted`) mas fica fora dos cálculos. */
export const PAUSE_VOTE: Vote = "☕";

export function isPauseVote(value: Vote | string | null): boolean {
	return value === PAUSE_VOTE;
}

/**
 * Espelho client-side de `voteToNumber` do servidor: ½ vale 0,5,
 * ☕ retorna null (fora de média/mediana/mínimo/máximo).
 */
export function voteToNumber(vote: Vote | string): number | null {
	if (vote === PAUSE_VOTE) return null;
	if (vote === "½") return 0.5;
	const parsed = Number(vote);
	return Number.isFinite(parsed) ? parsed : null;
}

export function voteLabel(value: Vote | string): string {
	if (value === PAUSE_VOTE) return "Pausa para café (fora da média)";
	return `Votar ${value}`;
}

/**
 * Espelho client-side de `ConsensusStats` do servidor: média, mediana e
 * [mín, máx] sobre os votos numéricos. `null` quando não há votos
 * numéricos (só pausa ou vazio) — pausa e ausência ficam fora dos cálculos.
 */
export interface ConsensusStats {
	median: number | null;
	mean: number | null;
	range: [number, number] | null;
}

/**
 * Calcula média, mediana e intervalo a partir dos votos. ½ vale 0,5 e 0 é
 * voto válido (não filtrar por truthiness); ☕ retorna null e é excluída.
 */
export function computeConsensus(
	votes: ReadonlyArray<Vote | string>,
): ConsensusStats {
	const nums: number[] = [];
	for (const vote of votes) {
		const n = voteToNumber(vote);
		if (n !== null) nums.push(n);
	}
	if (nums.length === 0) {
		return { median: null, mean: null, range: null };
	}
	const sorted = [...nums].sort((a, b) => a - b);
	const len = sorted.length;
	const mid = Math.floor(len / 2);
	const median =
		len % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
	const mean = sorted.reduce((sum, n) => sum + n, 0) / len;
	return { median, mean, range: [sorted[0]!, sorted[len - 1]!] };
}

/**
 * Unanimidade sobre os votos numéricos (pausa ignorada). `false` sem
 * nenhum voto numérico.
 */
export function isUnanimous(votes: ReadonlyArray<Vote | string>): boolean {
	const nums: number[] = [];
	for (const vote of votes) {
		const n = voteToNumber(vote);
		if (n !== null) nums.push(n);
	}
	if (nums.length === 0) return false;
	return nums.every((n) => n === nums[0]);
}

export interface VoteGroup {
	value: Vote | string;
	count: number;
}

/**
 * Agrupa votos por valor preservando a ordem do deck (pausa por último).
 */
export function groupVotes(
	votes: ReadonlyArray<Vote | string>,
): VoteGroup[] {
	const counts = new Map<string, number>();
	for (const vote of votes) {
		counts.set(vote, (counts.get(vote) ?? 0) + 1);
	}
	return (DECK_VALUES as readonly string[])
		.filter((value) => counts.has(value))
		.map((value) => ({ value, count: counts.get(value) ?? 0 }));
}

/** Mediana: inteira sem decimais, senão 1 casa; null vira "—". */
export function formatMedian(median: number | null): string {
	if (median === null) return "—";
	return Number.isInteger(median) ? String(median) : median.toFixed(1);
}

/** Média sempre com 1 casa decimal; null vira "—". */
export function formatMean(mean: number | null): string {
	if (mean === null) return "—";
	return mean.toFixed(1);
}

/** Intervalo `mín–máx` (en-dash U+2013); null vira "—". */
export function formatRange(range: [number, number] | null): string {
	if (!range) return "—";
	return `${range[0]}–${range[1]}`;
}
