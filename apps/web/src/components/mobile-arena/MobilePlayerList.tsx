/**
 * MobilePlayerList — lista vertical de jogadores pra Arena mobile (<sm).
 *
 * Substitui o round-table trigonométrico em viewports estreitos. Lista
 * scrollável, com header consolidação de:
 *  - Players voted/total (esquerda)
 *  - TimerPill com timer + round (direita)
 *  - Mediana pós-reveal (entre o contador e a pill)
 *
 * O round NN é mostrado pelo TimerPill — não duplicamos.
 *
 * **Empty state**: sala vazia (zero jogadores além de VOCÊ) → renderiza
 * um hint amigável dentro do scroll area, sem surpreender com lista
 * em branco.
 *
 * **A11y**: <ol> com `role="list"` redundante (alguns screen readers
 * perdem semântica em <ol>); contador sem aria-live pra não competir
 * com TimerPill (role="timer" + aria-live="off").
 *
 * **Scroll**: overscroll-contain evita bounce-through; padding-bottom
 * reserva espaço pra MobileRevealDock sticky (~180px). EmptyOverlay
 * z-30 cobre a lista quando ativo.
 *
 * @see MobileSeatRow (filho)
 */
import type { Player } from "@planning-poker/shared";
import { TimerPill } from "../timer-pill";
import { MobileSeatRow } from "./MobileSeatRow";

export interface MobilePlayerListProps {
	players: Player[];
	currentPlayerId: string | null;
	faceUp: boolean;
	/** null se ainda não há consensus (pré-reveal). */
	median: number | null;
}

function formatMedian(median: number | null): string | null {
	if (median === null) return null;
	return Number.isInteger(median) ? String(median) : median.toFixed(1);
}

/** Compara o valor do player com a mediana; trata "½" como 0.5 e "☕" como null. */
function isMedianVote(
	player: Player,
	faceUp: boolean,
	median: number | null,
): boolean {
	if (!faceUp || median === null || player.value === null) return false;
	const numeric =
		player.value === "½"
			? 0.5
			: player.value === "☕"
				? null
				: Number(player.value);
	return numeric !== null && numeric === median;
}

export function MobilePlayerList({
	players,
	currentPlayerId,
	faceUp,
	median,
}: MobilePlayerListProps) {
	const votedCount = players.filter((p) => p.hasVoted).length;
	const isEmpty = players.length === 0;

	return (
		<section
			data-testid="mobile-player-list"
			className="flex-1 flex flex-col min-h-0"
		>
			{/* Header strip — consolida contador de players + TimerPill (que já
				 carrega Round internamente) + mediana pós-reveal. Mobile-first
				 NUNCA usa absolute TimerPill porque colide com este strip.

				 **Sem `bg-paper-warm`**: o token criava uma listra mais clara no
				 dark mode (sandwich de surfaces #13120d → #1a1914 → #efe7d2 no
				 light). Mantemos só `border-b border-ink/10` para definir o
				 limite visual sem peso cromático. Token-safe: `bg-bg` aqui só
				 reforça o page bg (redundante, omitido). */}
			<header
				data-testid="mobile-player-header"
				className="flex items-center justify-between gap-3 px-4 py-2 flex-shrink-0 border-b border-ink/10 min-h-[44px] bg-bg"
			>
				{/* Players counter — dot de status + label micro + count bold.
				    Hierarchy: "JOGADORES" caption + "0/0" numerico forte.
				    votedCount em olive quando > 0 (sinal positivo de progresso). */}
				<div className="flex items-center gap-2">
					<span
						aria-hidden="true"
						className={[
							"inline-block w-1.5 h-1.5 rounded-full",
							votedCount > 0 ? "bg-olive" : "bg-ink-faint/40",
						].join(" ")}
					/>
					<div className="flex flex-col leading-tight">
						<span
							data-testid="mobile-player-count-label"
							className="font-mono text-micro-label tracking-caps uppercase text-ink-faint"
						>
							Players
						</span>
						<span
							data-testid="mobile-player-count"
							className="font-mono text-label font-medium tabular-nums text-ink"
						>
							{votedCount}/{players.length}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2.5">
					{faceUp && median !== null && (
						<span
							data-testid="mobile-player-median"
							className="font-mono text-micro-label tracking-caps uppercase inline-flex items-center gap-1 text-ink-faint"
						>
							<span className="text-ink-faint">Mediana</span>
							<span className="text-ink font-semibold border-b border-mustard">
								{formatMedian(median)}
							</span>
						</span>
					)}
					<TimerPill />
				</div>
			</header>

			{/* Scroll container. overflow-y-auto + min-h-0 permitem o flex
				 comprimir e scroll funcionar em safari iOS. */}
			<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
				{isEmpty ? (
					<p
						className="px-4 py-12 text-center font-sans text-caption text-ink-mute"
						role="status"
					>
						Aguardando jogadores…
						<br />
						<span className="text-ink-faint text-micro-label tracking-caps uppercase">
							Compartilhe o link pra começar
						</span>
					</p>
				) : (
					<ol role="list" className="flex flex-col">
						{players.map((p) => (
							<MobileSeatRow
								key={p.id}
								player={p}
								isYou={p.id === currentPlayerId}
								faceUp={faceUp}
								votedMedian={isMedianVote(p, faceUp, median)}
								unanimous={false}
							/>
						))}
					</ol>
				)}
			</div>
		</section>
	);
}
