/**
 * Seat — T31 (Phase 6).
 *
 * Assento da mesa com:
 *  - Avatar circular (inicial do nome em Playfair Italic)
 *  - Nick truncado em ellipsis
 *  - Badge "VOCÊ" no assento local
 *  - State pill: IDLE / VOTED / revealed-value (face-up)
 *  - ★ mostarda no canto superior direito se host
 *  - Borda coral 2px se VOCÊ; borda gold 2px se votedMedian (aninhada via inset shadow)
 *
 * Compõe o SeatPrimitive (T26) com:
 *  - Avatar + Nick + Badge (children)
 *  - data-* attrs que o Arena shell usa pra lookup de seat por id
 *
 * **Lógica**:
 *  - `state` derivado de `phase` + `hasVoted` + `value`:
 *    - `'revealed'` quando phase === 'revealed' (face-up)
 *    - `'voted'` quando hasVoted && phase !== 'revealed'
 *    - `'idle'` quando !hasVoted
 *    - `'disconnected'` quando player.status === 'disconnected'
 *  - `faceUp` = phase === 'revealed'
 *  - `votedMedian` = revealed && value === consensus.median && !unanimous
 *
 * **A11y**:
 *  - Avatar com aria-hidden (decorativo)
 *  - Nick em <span> semânticamente associado
 *  - Badge "VOCÊ" com texto visível (não aria-only)
 *  - State pill em <span> com label descritivo
 *  - Face-num com aria-label "Voto: 5" pós-reveal
 *
 * @see .specs/features/planning-poker-v1/tasks.md T31
 * @see .specs/features/planning-poker-v1/spec.md F-028, F-029, F-030, F-050
 */
import type { Player, Vote } from "@planning-poker/shared";
import { SeatPrimitive, type SeatPrimitiveState } from "./ui/seat";

/** Props do Seat. `player` é o PlayerSchema canônico. */
export interface SeatProps {
	player: Player;
	/** true se este assento é o do player local (playerId === currentPlayerId). */
	isYou: boolean;
	/** true se fase atual é 'revealed' (face-up). */
	faceUp: boolean;
	/** true se este player votou a mediana (e não unanimous). */
	votedMedian: boolean;
	/** true se todos os jogadores não-nulos votaram igual. */
	unanimous: boolean;
}

/** Gera a inicial do nick para o avatar (max 2 chars, uppercase). */
function getInitials(nick: string): string {
	const trimmed = nick.trim();
	if (trimmed.length === 0) return "?";
	// Pega primeira letra, ou duas primeiras se houver espaço (ex: "Li Anderson" → "LA")
	const first = trimmed.charAt(0).toUpperCase();
	const secondIdx = trimmed.search(/\s/);
	if (secondIdx > 0 && secondIdx + 1 < trimmed.length) {
		return first + trimmed.charAt(secondIdx + 1).toUpperCase();
	}
	return first;
}

/** Determina o state do SeatPrimitive. */
function deriveState(
	player: Player,
	faceUp: boolean,
): SeatPrimitiveState {
	if (player.status === "disconnected") return "disconnected";
	if (faceUp) return "revealed";
	if (player.hasVoted) return "voted";
	return "idle";
}

/** Label curto do state pill. */
function stateLabel(player: Player, faceUp: boolean): string {
	if (player.status === "disconnected") return "DISCONNECTED";
	if (faceUp && player.value !== null) return player.value;
	if (player.hasVoted) return "VOTED";
	return "IDLE";
}

/**
 * Renderiza um assento da mesa. Position é controlado pelo parent (Arena)
 * via coordenadas absolutas (CSS left/top) sobre o SVG Ellipse.
 */
export function Seat({
	player,
	isYou,
	faceUp,
	votedMedian,
	unanimous,
}: SeatProps) {
	const state = deriveState(player, faceUp);
	const label = stateLabel(player, faceUp);
	const initials = getInitials(player.nick);
	const showFaceNum = faceUp && player.value !== null;

	return (
		<div
			data-testid={`seat-${player.id}`}
			data-seat-player-id={player.id}
			data-seat-nick={player.nick}
			data-seat-role={player.role}
			className="contents"
		>
			<SeatPrimitive
				isYou={isYou}
				isHost={player.role === "host"}
				state={state}
				faceUp={faceUp}
				votedMedian={votedMedian}
				unanimous={unanimous}
			>
			{/* Avatar circular */}
			<div
				className="w-9 h-9 rounded-full bg-paper-dark flex items-center justify-center font-italic italic text-[18px] text-ink-soft flex-shrink-0"
				aria-hidden="true"
				data-testid="seat-avatar"
			>
				{initials}
			</div>

			{/* Nick (truncado) */}
			<div
				className="font-display font-semibold text-[11.5px] text-ink max-w-[80px] truncate tracking-[-0.01em]"
				title={player.nick}
				data-testid="seat-nick"
			>
				{player.nick}
			</div>

			{/* Badge "VOCÊ" */}
			{isYou && (
				<div
					className="font-mono text-[8.5px] tracking-[0.1em] text-coral uppercase py-0.5 px-1.5 border border-coral rounded"
					data-testid="seat-voc-badge"
					aria-label="Você está neste assento"
				>
					Você
				</div>
			)}

			{/* State pill: IDLE / VOTED / face-num */}
			{showFaceNum ? (
				<div
					className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-italic italic text-[22px] text-ink"
					aria-label={`Voto: ${player.value as Vote}`}
					data-testid="seat-face-num"
				>
					{player.value}
				</div>
			) : (
				<span
					className={`font-mono text-[9.5px] tracking-[0.06em] uppercase py-[3px] px-2 border rounded-full bg-paper ${
						player.hasVoted
							? "text-ink border-ink/15"
							: "text-ink-faint border-ink/5"
					}`}
					data-testid="seat-state"
				>
					{label}
				</span>
			)}
			</SeatPrimitive>
		</div>
	);
}