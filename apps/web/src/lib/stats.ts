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
import type { Lang } from "./i18n";

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

type StatsLabels = {
	noNumerics: string;
	single: (mean: string, range: string) => string;
	unanimous: (mean: string, range: string) => string;
	standard: (mean: string, median: string, range: string) => string;
};

const STATS_LABELS: Record<Lang, StatsLabels> = {
	"pt-BR": {
		noNumerics: "Sem votos numéricos · pausa e ausência ficam fora dos cálculos",
		single: (mean, range) => `Voto único · média ${mean} · intervalo ${range}`,
		unanimous: (mean, range) =>
			`Votação unânime · média ${mean} · intervalo ${range}`,
		standard: (mean, median, range) =>
			`Estatísticas pós-reveal · média ${mean} · mediana ${median} · intervalo ${range}`,
	},
	en: {
		noNumerics: "No numeric votes · pause and absence stay out of the math",
		single: (mean, range) => `Single vote · average ${mean} · range ${range}`,
		unanimous: (mean, range) =>
			`Unanimous vote · average ${mean} · range ${range}`,
		standard: (mean, median, range) =>
			`Post-reveal stats · average ${mean} · median ${median} · range ${range}`,
	},
};

export function useConsensusStats(
	votes: ReadonlyArray<string>,
	lang: Lang = "pt-BR",
): ConsensusView {
	const labels = STATS_LABELS[lang];
	const consensus = computeConsensus(votes);
	const signal = consensusSignal(votes);
	const numericCount = votes.filter(
		(vote) => voteToNumber(vote) !== null,
	).length;
	const noNumerics = numericCount === 0;
	const isSingleNumeric = numericCount === 1;
	const isUnanimousSignal = signal === "unanimous";
	const voteGroups = groupVotes(votes);
	const mean = formatMean(consensus.mean);
	const range = formatRange(consensus.range);
	const resultsAriaLabel = noNumerics
		? labels.noNumerics
		: isSingleNumeric
			? labels.single(mean, range)
			: isUnanimousSignal
				? labels.unanimous(mean, range)
				: labels.standard(mean, formatMedian(consensus.median), range);
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

type SelectionLabels = {
	revealedPauseAdjustable: string;
	revealedPause: string;
	revealedVoteAdjustable: (vote: string) => string;
	revealedVote: (vote: string) => string;
	revealedNoVote: string;
	pick: string;
	pause: string;
	voteAdjustable: (vote: string) => string;
	vote: (vote: string) => string;
};

const SELECTION_LABELS: Record<Lang, SelectionLabels> = {
	"pt-BR": {
		revealedPauseAdjustable:
			"Seu voto: pausa para café (conta presença, fora da média). Você pode ajustar · o resultado atualiza para todos.",
		revealedPause:
			"Seu voto: pausa para café (conta presença, fora da média). Troque de carta · o resultado recalcula.",
		revealedVoteAdjustable: (vote) =>
			`Seu voto: ${vote}. Você pode ajustar · o resultado atualiza para todos.`,
		revealedVote: (vote) =>
			`Seu voto: ${vote}. Troque de carta · o resultado recalcula.`,
		revealedNoVote: "Vote mesmo após o reveal · o resultado atualiza para todos.",
		pick: "Escolha uma carta para votar.",
		pause: "Seu voto: pausa para café (conta presença, fora da média).",
		voteAdjustable: (vote) =>
			`Seu voto: ${vote}. Clique em outra carta para substituir.`,
		vote: (vote) => `Seu voto: ${vote}. Clique em outra carta para substituir.`,
	},
	en: {
		revealedPauseAdjustable:
			"Your vote: coffee break (counts as present, out of the average). You can adjust it · the result updates for everyone.",
		revealedPause:
			"Your vote: coffee break (counts as present, out of the average). Pick another card · the result recalculates.",
		revealedVoteAdjustable: (vote) =>
			`Your vote: ${vote}. You can adjust it · the result updates for everyone.`,
		revealedVote: (vote) =>
			`Your vote: ${vote}. Pick another card · the result recalculates.`,
		revealedNoVote: "Vote even after the reveal · the result updates for everyone.",
		pick: "Choose a card to vote.",
		pause: "Your vote: coffee break (counts as present, out of the average).",
		voteAdjustable: (vote) =>
			`Your vote: ${vote}. Click another card to replace it.`,
		vote: (vote) => `Your vote: ${vote}. Click another card to replace it.`,
	},
};

/** Texto "Seu voto: …" — 3 variantes antes copiadas em home/arena. */
export function voteSelectionText(
	vote: string | null,
	opts: { revealed: boolean; adjustable?: boolean; lang?: Lang },
): string {
	const labels = SELECTION_LABELS[opts.lang ?? "pt-BR"];
	if (opts.revealed) {
		if (vote === "☕") {
			return opts.adjustable
				? labels.revealedPauseAdjustable
				: labels.revealedPause;
		}
		if (vote !== null) {
			return opts.adjustable
				? labels.revealedVoteAdjustable(vote)
				: labels.revealedVote(vote);
		}
		return labels.revealedNoVote;
	}
	if (vote === null) return labels.pick;
	if (vote === "☕") return labels.pause;
	return opts.adjustable ? labels.voteAdjustable(vote) : labels.vote(vote);
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
