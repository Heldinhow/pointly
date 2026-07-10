/**
 * seat-layout — algoritmos puros de layout dos assentos ao redor da mesa.
 *
 * Extraído de `apps/web/src/pages/arena.tsx` (T31) e `projectile-animator.tsx`
 * (T47) porque ambos precisam das MESMAS constantes e funções para que o
 * arremesso saia do assento correto e atinja o alvo correto — qualquer
 * divergência entre as duas cópias quebra a animação.
 *
 * **Constantes da mesa** (vide design/arena.html):
 *  - R_x = 420, R_y = 210 (elipse 960×500 com margem superior)
 *  - Centro: (480, 250)
 *
 * **assignSeatAngles — invariantes** (reg 2026-07-10):
 *  - "VOCÊ" travado em 90° (6h, bottom-center)
 *  - Demais jogadores distribuídos em arco de 30° partindo de 30°
 *  - 90° é RESERVADO para o "VOCÊ" quando ele existe na lista → demais
 *    pulam esse slot (sem colisão visual com 4+ jogadores)
 *  - **Estabilidade**: ângulos atribuídos por ordem de `joinedAt`, NÃO
 *    por índice no array `players`. Sem isso, qualquer join/leave causa
 *    shift de TODOS os jogadores subsequentes → "eles ficam pulando de
 *    lugar a cada room_state" (UX bug relatado em prod).
 *
 * @see docs/adr/0007-seat-layout-stability.md (a documentar)
 */

import type { Player } from "@planning-poker/shared";

// ---------------------------------------------------------------------------
// Constantes da mesa (960×500 SVG usado em arena.tsx)
// ---------------------------------------------------------------------------

/** Raio horizontal da elipse (eixo X). */
export const TABLE_RX = 420;
/** Raio vertical da elipse (eixo Y). */
export const TABLE_RY = 210;
/** Centro X da mesa. */
export const TABLE_CX = 480;
/** Centro Y da mesa. */
export const TABLE_CY = 250;

// ---------------------------------------------------------------------------
// Ângulos
// ---------------------------------------------------------------------------

/**
 * Ângulos disponíveis para os "outros" jogadores quando 'me' existe na sala.
 * 11 slots (90° é reservado para "VOCÊ"). `0` (= 360°) é o right-edge
 * oposto a "VOCÊ" — completa o círculo de 12 posições para 12 jogadores.
 */
const ARC_ANGLES_WITH_ME: readonly number[] = [
	30, 60, 120, 150, 180, 210, 240, 270, 300, 330, 0,
];

/**
 * Ângulos disponíveis quando 'me' é null (cenário pré-welcome).
 * 11 slots incluindo 90° — equivalente ao comportamento histórico.
 */
const ARC_ANGLES_NO_ME: readonly number[] = [
	30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
];

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Coordenadas (left, top) em pixels para um assento no ângulo `angleDeg`
 * (graus, 0=right=3h, 90=bottom=6h, 180=left=9h, 270=top=12h).
 */
export function seatPosition(angleDeg: number): { left: number; top: number } {
	const rad = (angleDeg * Math.PI) / 180;
	return {
		left: TABLE_CX + Math.cos(rad) * TABLE_RX,
		top: TABLE_CY + Math.sin(rad) * TABLE_RY,
	};
}

/**
 * Mapa `playerId → ângulo (graus)` para distribuir os assentos ao redor
 * da mesa.
 *
 * **Estabilidade (reg 2026-07-10)**:
 *  - Ordena `players` por `joinedAt` antes de atribuir ângulos.
 *  - `joinedAt` é imutável por sessão (setado no `hello` do server), então
 *    a ordem não muda quando alguém entra/sai dentro da mesma sessão.
 *  - Jogadores que JÁ estavam na sala mantêm o MESMO ângulo quando um novo
 *    jogador entra. Sem isso, a cada `room_state` broadcast (vote, reconcile)
 *    os assentos pulam de posição → UX bug visual.
 *
 * @param mePlayerId  ID do player local. Se presente, trava em 90°. Se null
 *                    (pré-welcome), não há slot reservado e 90° entra na
 *                    rotação dos demais.
 * @param players     Lista de players (snapshot da sala). Usa apenas `id` e
 *                    `joinedAt` — aceita `Player` ou qualquer `{ id, joinedAt }`.
 */
export function assignSeatAngles(
	mePlayerId: string | null,
	players: ReadonlyArray<Pick<Player, "id" | "joinedAt">>,
): Map<string, number> {
	const map = new Map<string, number>();
	if (mePlayerId) map.set(mePlayerId, 90);

	const sortedOthers = [...players]
		.filter((p) => p.id !== mePlayerId)
		.sort((a, b) => a.joinedAt - b.joinedAt);

	const arc = mePlayerId ? ARC_ANGLES_WITH_ME : ARC_ANGLES_NO_ME;

	for (let i = 0; i < sortedOthers.length && i < arc.length; i++) {
		map.set(sortedOthers[i]!.id, arc[i]!);
	}
	return map;
}