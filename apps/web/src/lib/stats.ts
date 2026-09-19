import {
	computeConsensus,
	consensusSignal,
	divergenceMagnitude,
	formatMean,
	formatMedian,
	formatRange,
	groupVotes,
	voteToNumber,
	type ConsensusSignal,
	type ConsensusStats,
	type VoteGroup,
} from "./deck";

/**
 * Consenso + rótulos de resultado compartilhados entre `home.tsx` (demo) e
 * `arena.tsx` (sala ao vivo). Antes o bloco de ~18 linhas + `resultsAriaLabel`
 * + `selectionText` estava copiado nos dois.
 */
export interface ConsensusView {
	consensus: ConsensusStats;
	/** Sinal único (14.1): unânime, divergente ou sem sinal (<2 numéricos). */
	consensusSignal: ConsensusSignal;
	/** Delta numérico `max - min`; null sem numéricos, 0 com todos iguais. */
	divergenceMagnitude: number | null;
	numericCount: number;
	noNumerics: boolean;
	isSingleNumeric: boolean;
	isUnanimousSignal: boolean;
	voteGroups: VoteGroup[];
	resultsAriaLabel: string;
}

export function useConsensusStats(
	votes: ReadonlyArray<string>,
): ConsensusView {
	const consensus = computeConsensus(votes);
	const signal = consensusSignal(votes);
	const numericCount = votes.filter(
		(vote) => voteToNumber(vote) !== null,
	).length;
	const noNumerics = numericCount === 0;
	const isSingleNumeric = numericCount === 1;
	const isUnanimousSignal = signal === "unanimous";
	const voteGroups = groupVotes(votes);
	const resultsAriaLabel = noNumerics
		? "Sem votos numéricos · pausa e ausência ficam fora dos cálculos"
		: isSingleNumeric
			? `Voto único · média ${formatMean(consensus.mean)} · intervalo ${formatRange(consensus.range)}`
			: isUnanimousSignal
				? `Votação unânime · média ${formatMean(consensus.mean)} · intervalo ${formatRange(consensus.range)}`
				: `Estatísticas pós-reveal · média ${formatMean(consensus.mean)} · mediana ${formatMedian(consensus.median)} · intervalo ${formatRange(consensus.range)}`;
	return {
		consensus,
		consensusSignal: signal,
		divergenceMagnitude: divergenceMagnitude(votes),
		numericCount,
		noNumerics,
		isSingleNumeric,
		isUnanimousSignal,
		voteGroups,
		resultsAriaLabel,
	};
}

/** Texto "Seu voto: …" — 3 variantes antes copiadas em home/arena. */
export function voteSelectionText(
	vote: string | null,
	opts: { revealed: boolean; adjustable?: boolean },
): string {
	if (opts.revealed) {
		if (vote === "☕") {
			return opts.adjustable
				? "Seu voto: pausa para café (conta presença, fora da média). Você pode ajustar · o resultado atualiza para todos."
				: "Seu voto: pausa para café (conta presença, fora da média). Troque de carta · o resultado recalcula.";
		}
		if (vote !== null) {
			return opts.adjustable
				? `Seu voto: ${vote}. Você pode ajustar · o resultado atualiza para todos.`
				: `Seu voto: ${vote}. Troque de carta · o resultado recalcula.`;
		}
		return "Vote mesmo após o reveal · o resultado atualiza para todos.";
	}
	if (vote === null) return "Escolha uma carta para votar.";
	if (vote === "☕") {
		return opts.adjustable
			? "Seu voto: pausa para café (conta presença, fora da média)."
			: "Seu voto: pausa para café (conta presença, fora da média).";
	}
	return opts.adjustable
		? `Seu voto: ${vote}. Clique em outra carta para substituir.`
		: `Seu voto: ${vote}. Clique em outra carta para substituir.`;
}

/** `hasVotes` usado em 3 pontos da arena (teclado R, ticker, reveal). */
export function hasAnyVotes(
	players: ReadonlyArray<{ hasVoted: boolean }>,
	votes: Record<string, string> | undefined | null,
): boolean {
	return (
		players.some((p) => p.hasVoted) ||
		Object.keys(votes ?? {}).length > 0
	);
}
