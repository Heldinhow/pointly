/**
 * Seat (primitive) — base para o componente Seat completo da arena.
 *
 * Phase 5 (T26). Estrutura visual. T31 instancia com lógica (avatar,
 * nick, vote state, badges).
 *
 * Props:
 *  - isYou: borda coral 2px (outer)
 *  - isHost: ★ mostarda no canto (decoração via children)
 *  - state: 'idle' | 'voted' | 'disconnected' | 'revealed'
 *  - faceUp: full opacity após reveal
 *  - votedMedian: borda gold 2px inner (box-shadow inset)
 *  - unanimous: se true, neutraliza votedMedian visual (regra F-023)
 *
 * Children: avatar + nick + badge "VOCÊ" + value pós-reveal. T31 compõe.
 *
 * @see docs/adr/0010-ui-primitives-and-testing.md
 */
import type * as React from "react";
import { cn } from "./utils";

export type SeatPrimitiveState = "idle" | "voted" | "disconnected" | "revealed";

export interface SeatPrimitiveProps {
	isYou?: boolean;
	isHost?: boolean;
	state?: SeatPrimitiveState;
	faceUp?: boolean;
	votedMedian?: boolean;
	unanimous?: boolean;
	className?: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
	/** Ref pro <div> raiz. */
	ref?: React.Ref<HTMLDivElement>;
}

/**
 * Seat primitive. T31 consome compondo avatar + nick + badges.
 *
 * Regra visual: quando `isYou && votedMedian` (não-unanimous), borda coral
 * outer (2px) + box-shadow inset 2px gold (inner) — ambas preservadas.
 *
 * Quando `unanimous=true`, votedMedian é neutralizado visualmente (a stats
 * pill exibe badge UNANIMOUS em vez disso).
 */
export function SeatPrimitive({
	isYou = false,
	isHost = false,
	state = "idle",
	faceUp = false,
	votedMedian = false,
	unanimous = false,
	className,
	style,
	children,
	ref,
}: SeatPrimitiveProps) {
	const effectiveMedian = votedMedian && !unanimous;
	const isDisconnected = state === "disconnected";

	return (
		<div
			ref={ref}
			role="group"
			aria-label="Assento"
			className={cn(
				// base
				"relative w-24 h-32 bg-surface rounded-card shadow-bone border",
				"flex flex-col items-center justify-center gap-1",
				"transition-all duration-200",
				// opacity
				isDisconnected ? "opacity-40" : faceUp ? "opacity-100" : "opacity-95",
				// borders
				isYou ? "border-coral border-2" : "border-ink/5",
				effectiveMedian && !isYou && "border-mustard border-2",
				className,
			)}
			style={{
				// Coral outer + gold inner via box-shadow inset (não sobrescreve border)
				boxShadow: effectiveMedian
					? isYou
						? "inset 0 0 0 2px var(--mustard)"
						: "none"
					: "none",
				...style,
			}}
			data-seat-state={state}
			data-seat-is-you={isYou ? "true" : "false"}
			data-seat-is-host={isHost ? "true" : "false"}
		>
			{/* host star (mostarda) — canto superior direito */}
			{isHost && (
				<span
					aria-label="Host — gerencia a mesa"
					title="Host — gerencia a mesa (pode revelar votos e iniciar nova rodada)"
					className="absolute top-1.5 right-1.5 text-mustard text-sm leading-none"
					style={{ fontFamily: "system-ui, sans-serif" }}
				>
					★
				</span>
			)}
			{children}
		</div>
	);
}
