/**
 * pickJustifySeat — "Dado da mesa" (14.6)
 *
 * Sorteio determinístico e client-side do Assento que justifica primeiro
 * após um Reveal divergente. Sem servidor: todos os clientes computam o
 * MESMO Assento a partir da mesma semente (`code:round`) e do mesmo pool
 * (ordenado por `seatIndex`).
 *
 * @see CONTEXT.md — "Dado da mesa"
 */

/**
 * Sorteia o `seatIndex` que justifica primeiro.
 *
 * - `null` quando o pool está vazio.
 * - Determinístico: mesma semente (`code:round`) + mesmo pool → mesmo
 *   Assento, em qualquer cliente e após reload; a ordem de entrada do
 *   pool não importa (ordenado internamente).
 * - Só muda em nova Rodada (`round` muda) ou se o pool mudar.
 *
 * @example
 *   pickJustifySeat("ABCD", 1, [0, 3, 7]) → 0 | 3 | 7 (sempre o mesmo)
 *   pickJustifySeat("ABCD", 1, [])       → null
 */
export function pickJustifySeat(
	code: string,
	round: number,
	seatIndexes: readonly number[],
): number | null {
	if (seatIndexes.length === 0) return null;
	const pool = [...seatIndexes].sort((a, b) => a - b);
	const index = fnv1a(`${code}:${round}`) % pool.length;
	return pool[index]!;
}

/** FNV-1a 32-bit — hash pequeno e estável entre clientes. */
function fnv1a(input: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}
