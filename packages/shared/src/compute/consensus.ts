/**
 * computeConsensus — stats de consenso para votes Pós-Reveal
 *
 * Phase 2 (T9). Função pura, deterministic. Exclui ☕ (sempre — coffee = pause).
 * Converte ½ → 0.5 pra cálculos numéricos.
 *
 * @see .specs/features/planning-poker-v1/spec.md F-020
 */

import { DECK_VALUES, type Vote } from "../schemas/sala";

/**
 * Stats de consenso calculadas a partir de votos numéricos.
 *
 * `null` em todos os campos quando NÃO há votos numéricos (todos ☕ ou vazio).
 * Caller decide como exibir (UI T35).
 */
export type ConsensusStats = {
	/** mediana dos valores numéricos (count par = média dos dois centrais). */
	median: number | null;
	/** média aritmética dos valores numéricos. */
	mean: number | null;
	/** [min, max] numérico. Útil pra "intervalo A–B" na stats pill. */
	range: [number, number] | null;
};

/**
 * Converte string de voto em número. `½` → 0.5, `☕` → null.
 * Útil pra filtros e cálculos.
 */
export function voteToNumber(vote: Vote): number | null {
	if (vote === "☕") return null;
	if (vote === "½") return 0.5;
	return Number(vote);
}

/**
 * Calcula stats de consenso a partir de votos.
 *
 * Exclui ☕. Retorna `{median, mean, range}` ou `{median: null, mean: null, range: null}`
 * quando entrada é vazia OU todos os votos são ☕.
 *
 * @example
 *   computeConsensus(["5", "5", "8"]) → { median: 5, mean: 6, range: [5,8] }
 *   computeConsensus([])             → { median: null, mean: null, range: null }
 *   computeConsensus(["☕", "☕"])    → { median: null, mean: null, range: null }
 */
export function computeConsensus(votes: readonly Vote[]): ConsensusStats {
	const nums: number[] = [];
	for (const v of votes) {
		const n = voteToNumber(v);
		if (n !== null) nums.push(n);
	}

	if (nums.length === 0) {
		return { median: null, mean: null, range: null };
	}

	nums.sort((a, b) => a - b);
	const len = nums.length;
	const mid = Math.floor(len / 2);

	const median = len % 2 === 0 ? (nums[mid - 1]! + nums[mid]!) / 2 : nums[mid]!;
	const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
	const range: [number, number] = [nums[0]!, nums[len - 1]!];

	return { median, mean, range };
}

/**
 * Sinal de consenso de uma rodada revelada (14.1). ☕ e ausência ficam fora.
 *
 *  - `unanimous`: ≥2 votos numéricos, todos iguais
 *  - `divergent`: ≥2 votos numéricos, com pelo menos dois valores distintos
 *  - `none`: menos de 2 votos numéricos (voto único, só ☕, vazio)
 *
 * @example
 *   consensusSignal(["5", "5", "☕"]) → "unanimous"
 *   consensusSignal(["5", "8"])      → "divergent"
 *   consensusSignal(["5", "☕"])      → "none" (voto único)
 *   consensusSignal(["☕"])           → "none"
 */
export type ConsensusSignal = "unanimous" | "divergent" | "none";

export function consensusSignal(votes: readonly Vote[]): ConsensusSignal {
	const nums = numericVotes(votes);
	if (nums.length < 2) return "none";
	return nums.every((n) => n === nums[0]) ? "unanimous" : "divergent";
}

/**
 * Predicado derivado do sinal canônico — `true` só em `unanimous`.
 *
 * @example
 *   isUnanimous(["5", "5", "5"]) → true
 *   isUnanimous(["5", "5", "☕"]) → true (☕ ignorado, 5 == 5)
 *   isUnanimous(["5", "☕"])      → false (voto único não é unanimidade)
 *   isUnanimous(["5", "8"])      → false
 *   isUnanimous(["☕"])           → false (sem votos numéricos)
 *   isUnanimous([])              → false
 */
export function isUnanimous(votes: readonly Vote[]): boolean {
	return consensusSignal(votes) === "unanimous";
}

/**
 * Magnitude da divergência: distância numérica entre o menor e o maior voto
 * (`range[1] - range[0]`). `null` quando não há votos numéricos; `0` quando
 * todos os numéricos são iguais (inclusive voto único).
 */
export function divergenceMagnitude(votes: readonly Vote[]): number | null {
	const { range } = computeConsensus(votes);
	return range === null ? null : range[1] - range[0];
}

/** Votos numéricos (½ → 0.5, ☕ fora). Base de `consensusSignal`. */
function numericVotes(votes: readonly Vote[]): number[] {
	const nums: number[] = [];
	for (const v of votes) {
		const n = voteToNumber(v);
		if (n !== null) nums.push(n);
	}
	return nums;
}

// Re-export DECK_VALUES para callers que queiram iterar.
export { DECK_VALUES };
