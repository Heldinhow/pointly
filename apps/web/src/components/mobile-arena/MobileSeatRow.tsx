/**
 * MobileSeatRow — linha horizontal de jogador pra MobilePlayerList.
 *
 * **Contexto de design (Phase 7 mobile-first)**:
 * Substitui o assento trigonométrico do round-table em viewports <sm.
 * Round-table é preservado em ≥sm (Counter-Scale Rule exige contrapeso
 * pra tap-targets no scaled box); mobile dispensa o scale e ganha uma
 * lista vertical scrollável.
 *
 * **Layout**: avatar circle (w-11 h-11 = 44×44 tap target) + nick + state
 * pill OR face-up value. Hairline inferior separa rows. Border-left coral
 * 2px em VOCÊ; gold 2px em votedMedian (não-unanimous).
 *
 * **Diferenças vs Seat (round-table)**:
 *  - sem projétil 🎯 no hover (long-press é fora de escopo deste PR)
 *  - layout horizontal (não vertical card 96×128)
 *  - nick em `text-body` (não `text-label`) — área de leitura maior
 *  - state pill colado à direita; VOCÊ badge suprimido (border-left
 *    coral já comunica "você")
 *
 * **A11y**: <li> dentro de <ol>; aria-label com nickname + status;
 * border-left coral não substitui nenhum ring/foco.
 *
 * @see DESIGN.md §4 (Counter-Scale Rule — mobile branch é a saída)
 */
import type { Player } from "@planning-poker/shared";
import { cn } from "../ui/utils";

export interface MobileSeatRowProps {
	player: Player;
	isYou: boolean;
	faceUp: boolean;
	votedMedian: boolean;
	unanimous: boolean;
	/** Opcional: ref pro <li> raiz (para tests/scroll-into-view). */
	ref?: React.Ref<HTMLLIElement>;
}

/** Estado visível (espelha a derivação do Seat round-table). */
function deriveVisualState(
	player: Player,
	faceUp: boolean,
): "idle" | "voted" | "disconnected" | "revealed" {
	if (player.status === "disconnected") return "disconnected";
	if (faceUp) return "revealed";
	if (player.hasVoted) return "voted";
	return "idle";
}

/** Label curto do badge de estado (à direita do nick). */
function stateLabel(player: Player, faceUp: boolean): string {
	if (player.status === "disconnected") return "DESCONECTADO";
	if (faceUp && player.value !== null) return String(player.value);
	if (player.hasVoted) return "VOTOU";
	return "AGUARDANDO";
}

/** Iniciais (até 2 chars) pro avatar — mesmo helper do Seat. */
function getInitials(nick: string): string {
	const trimmed = nick.trim();
	if (trimmed.length === 0) return "?";
	const first = trimmed.charAt(0).toUpperCase();
	const idx = trimmed.search(/\s/);
	if (idx > 0 && idx + 1 < trimmed.length) {
		return first + trimmed.charAt(idx + 1).toUpperCase();
	}
	return first;
}

export function MobileSeatRow({
	player,
	isYou,
	faceUp,
	votedMedian,
	unanimous,
	ref,
}: MobileSeatRowProps) {
	const state = deriveVisualState(player, faceUp);
	const label = stateLabel(player, faceUp);
	const initials = getInitials(player.nick);
	const isDisconnected = state === "disconnected";
	const showFaceNum = state === "revealed" && player.value !== null;
	const effectiveMedian = votedMedian && !unanimous;

	return (
		<li
			ref={ref}
			data-testid={`mobile-seat-${player.id}`}
			data-player-id={player.id}
			data-seat-state={state}
			data-seat-is-you={isYou ? "true" : "false"}
			className={cn(
				// base
				"relative flex items-center gap-3 px-3 py-2.5",
				"min-h-[56px]",
				// **Sem `bg-surface` aqui**: cada row com bg-surface criava 8-12
				// "listas brancas" no dark mode (sandwich de surfaces).
				// Avatar (bg-paper-dark) + state badge (bg-paper) já dão
				// contraste suficiente contra page bg sem precisar row bg.
				"border-y border-ink/5 first:border-t-0",
				// VOCÊ: borda esquerda coral 2px substitui o badge "VOCÊ" no nick
				isYou && "border-l-[3px] border-l-coral",
				// votedMedian (não-unanimous): gold inner via box-shadow inset
				effectiveMedian && "border-l-[3px] border-l-mustard",
				isDisconnected && "opacity-50",
				"transition-colors",
			)}
			style={
				effectiveMedian && isYou
					? { boxShadow: "inset 0 0 0 2px var(--mustard)" }
					: undefined
			}
		>
			{/* Avatar (44×44 = WCAG tap target) */}
			<div
				aria-hidden="true"
				data-testid="mobile-seat-avatar"
				className={cn(
					"w-11 h-11 rounded-full bg-paper-dark flex items-center justify-center flex-shrink-0",
					"font-italic italic text-vote-numeral text-ink-soft",
				)}
			>
				{initials}
			</div>

			{/* Nick + host star inline */}
			<div className="flex-1 min-w-0 flex items-baseline gap-2">
				<span
					data-testid="mobile-seat-nick"
					title={player.nick}
					className={cn(
						"font-display font-semibold text-body text-ink truncate",
						isDisconnected && "text-ink-mute",
					)}
				>
					{player.nick}
				</span>
				{player.role === "host" && (
					<span
						aria-label="Host"
						className="text-mustard text-sm leading-none flex-shrink-0"
					>
						★
					</span>
				)}
			</div>

			{/* State badge: IDLE / VOTED / disconnected / face-up value */}
			{showFaceNum ? (
				<span
					data-testid="mobile-seat-face-num"
					aria-label={`Voto: ${player.value}`}
					className="font-italic italic text-vote-mark text-ink font-bold leading-none flex-shrink-0"
				>
					{player.value}
				</span>
			) : (
				<span
					data-testid="mobile-seat-state"
					className={cn(
						"font-mono text-micro-label tracking-caps uppercase",
						"py-[3px] px-2 rounded-full border flex-shrink-0",
						state === "voted"
							? "text-ink border-ink/15 bg-paper"
							: state === "disconnected"
								? "text-coral-deep border-coral-deep/30 bg-paper"
								: "text-ink-faint border-ink/5 bg-paper",
					)}
				>
					{label}
				</span>
			)}
		</li>
	);
}
