/**
 * MobilePlayerList — lista vertical de jogadores pra Arena mobile (<sm).
 *
 * Substitui o round-table trigonométrico em viewports estreitos. Lista
 * scrollável, com header consolidação de:
 *  - Jogadores votados/total (esquerda)
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
	/** true se todos votaram igual (espelha badge UNÂNIME do desktop). */
	unanimous?: boolean;
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
	unanimous = false,
}: MobilePlayerListProps) {
	const votedCount = players.filter((p) => p.hasVoted).length;
	const isEmpty = players.length === 0;

	return (
		<section
			data-testid="mobile-player-list"
			aria-label="Jogadores na sala"
			className="arena-mobile-list flex-1 flex flex-col min-h-0 min-w-0"
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
				className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 flex-shrink-0 border-b border-ink/10 min-h-[44px] bg-bg"
			>
				{/* Contador de jogadores — dot de status + label micro + count bold.
				    Hierarchy: "JOGADORES" caption + "0/0" numerico forte.
				    votedCount em olive quando > 0 (sinal positivo de progresso). */}
				<div className="flex items-center gap-2">
					<span
						aria-hidden="true"
						className={[
							"inline-block w-1.5 h-1.5 rounded-full",
							votedCount > 0 ? "bg-olive" : "bg-ink-faint",
						].join(" ")}
					/>
					<div className="flex flex-col leading-tight">
						<span
							data-testid="mobile-player-count-label"
							className="font-sans text-caption text-ink-mute"
						>
							Votos recebidos
						</span>
						<span
							data-testid="mobile-player-count"
							aria-label={`${votedCount} de ${players.length} participantes votaram`}
							className="font-display text-caption font-semibold tabular-nums text-ink"
						>
							{votedCount}/{players.length}
						</span>
					</div>
				</div>
				<div className="flex flex-wrap min-w-0 items-center gap-2.5">
					{faceUp && unanimous ? (
						<span
							data-testid="mobile-player-unanimous"
							className="font-sans text-caption text-warning font-semibold inline-flex items-center gap-1"
						>
							<span aria-hidden="true">★</span>
							Unânime
						</span>
					) : (
						faceUp &&
						median !== null && (
							<span
								data-testid="mobile-player-median"
								className="font-sans text-caption inline-flex items-center gap-1 text-ink-mute"
							>
								<span>Mediana</span>
								<span className="text-ink font-semibold border-b border-warning">
									{formatMedian(median)}
								</span>
							</span>
						)
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
							unanimous={unanimous}
							/>
						))}
					</ol>
				)}
			</div>
		</section>
	);
}
