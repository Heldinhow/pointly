import type {
	Historia,
	HistoriaAtualId,
	Pauta,
} from "@planning-poker/shared";

export type { Historia, HistoriaAtualId, Pauta };

/**
 * Helpers da Pauta — wire client (#164, parent #160). Sem UI aqui (#165).
 *
 * Tipos vêm do contrato compartilhado (`@planning-poker/shared`, sem
 * espelho local — #147). Ordenação espelha o domínio (#162): canônica é
 * o índice no array (`ordem` espelha o índice); aqui ordenamos por
 * `ordem` de forma estável e sem mutar a entrada.
 *
 * Formatação da Pontuação: string plana pra render mono tabular na UI
 * (`font-mono tabular-nums` em #165) — `mediana + N×V`, ex. `5 · 2×5 1×3`.
 * Tudo empty-safe: pauta ausente/vazia e votos ausentes nunca quebram.
 */

/** Pauta ordenada pela ordem canônica, sem mutar a entrada. `null`/ausente → `[]`. */
export function sortPauta(pauta: Pauta | undefined | null): Historia[] {
	if (!pauta || pauta.length === 0) return [];
	return [...pauta].sort((a, b) => a.ordem - b.ordem || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** História ativa da rodada, ou `null` (pauta vazia, seleção limpa, id órfão). */
export function getHistoriaAtiva(
	pauta: Pauta | undefined | null,
	historiaAtualId: HistoriaAtualId | undefined | null,
): Historia | null {
	if (!pauta || historiaAtualId == null) return null;
	return pauta.find((h) => h.id === historiaAtualId) ?? null;
}

/** Pontos: inteiro sem decimais, senão 1 casa; `null`/ausente vira "—". */
export function formatPontos(pontos: number | null | undefined): string {
	if (pontos === null || pontos === undefined) return "—";
	return Number.isInteger(pontos) ? String(pontos) : pontos.toFixed(1);
}

type VotesLike = Record<string, string> | ReadonlyArray<string> | undefined | null;

/** Valor numérico pra ordenar os grupos (½ vale 0,5; ☕ por último). */
function voteRank(value: string): number {
	if (value === "☕") return Number.POSITIVE_INFINITY;
	if (value === "½") return 0.5;
	const n = Number(value);
	return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

/**
 * Pontuação tabular mono: `mediana + N×V` (ex. `5 · 2×5 1×3`).
 * Sem votos → só a mediana (`5`); sem mediana e sem votos → `"—"`.
 * Votos aceitam o mapa `SalaState.votes` ou um array de valores.
 */
export function formatPontuacao(
	pontos: number | null | undefined,
	votes: VotesLike,
): string {
	const values: string[] =
		votes == null ? [] : Array.isArray(votes) ? [...votes] : Object.values(votes);
	const counts = new Map<string, number>();
	for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
	const groups = [...counts.entries()].sort(
		(a, b) => voteRank(a[0]) - voteRank(b[0]) || (a[0] < b[0] ? -1 : 1),
	);
	const median = formatPontos(pontos);
	if (groups.length === 0) return median;
	const breakdown = groups.map(([value, n]) => `${n}×${value}`).join(" ");
	return pontos === null || pontos === undefined
		? breakdown
		: `${median} · ${breakdown}`;
}

/** `true` quando não há histórias (pauta ausente, nula ou vazia). */
export function isPautaVazia(pauta: Pauta | undefined | null): boolean {
	return !pauta || pauta.length === 0;
}
