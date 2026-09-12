/**
 * RevealButton — morphing em 3 estados (Spell dark).
 *
 *  - `awaiting` (0 votos): "Aguardando votos…" desabilitado
 *  - `ready` (≥1 voto, pré-reveal): "Revelar votos"
 *  - `post-reveal`: "Nova rodada" → dois toques ("Confirmar nova rodada?"),
 *    desarma sozinho em 4s ou com Escape (ação destrutiva).
 *
 * Qualquer player pode revelar/iniciar (server democratizado).
 * Contrato e2e: `data-testid="reveal-button"`, `data-reveal-state`,
 * `data-reveal-confirm`.
 */
import type { Phase } from "@planning-poker/shared";
import { useEffect, useRef, useState } from "react";
import { RichButton } from "@/components/spell/rich-button";

export type RevealButtonState = "awaiting" | "ready" | "post-reveal";

export interface RevealButtonProps {
	phase: Phase;
	votedCount: number;
	onReveal: () => void;
	onNewRound: () => void;
}

export function deriveButtonState(
	phase: Phase,
	votedCount: number,
): RevealButtonState {
	if (phase === "revealed") return "post-reveal";
	if (votedCount === 0) return "awaiting";
	return "ready";
}

const CONFIRM_TIMEOUT_MS = 4_000;

export function RevealButton({
	phase,
	votedCount,
	onReveal,
	onNewRound,
}: RevealButtonProps) {
	const state = deriveButtonState(phase, votedCount);
	const [confirming, setConfirming] = useState(false);
	const disarmTimer = useRef<number | null>(null);

	const disarm = () => {
		setConfirming(false);
		if (disarmTimer.current !== null) {
			window.clearTimeout(disarmTimer.current);
			disarmTimer.current = null;
		}
	};

	useEffect(() => {
		disarm();
		return () => {
			if (disarmTimer.current !== null) window.clearTimeout(disarmTimer.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [phase]);

	const handleClick = () => {
		if (state === "awaiting") return;
		if (state === "ready") {
			onReveal();
			return;
		}
		if (!confirming) {
			setConfirming(true);
			if (disarmTimer.current !== null) window.clearTimeout(disarmTimer.current);
			disarmTimer.current = window.setTimeout(
				() => setConfirming(false),
				CONFIRM_TIMEOUT_MS,
			);
			return;
		}
		disarm();
		onNewRound();
	};

	const label =
		state === "post-reveal"
			? confirming
				? "Confirmar nova rodada?"
				: "Nova rodada"
			: state === "ready"
				? "Revelar votos"
				: "Aguardando votos…";

	return (
		<RichButton
			type="button"
			color={state === "ready" ? "emerald" : "zinc"}
			data-testid="reveal-button"
			data-reveal-state={state}
			data-reveal-confirm={state === "post-reveal" && confirming ? "true" : "false"}
			disabled={state === "awaiting"}
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Escape") disarm();
			}}
			aria-label={
				state === "post-reveal"
					? confirming
						? "Confirmar nova rodada (ação destrutiva)"
						: "Nova rodada (pede confirmação)"
					: state === "ready"
						? "Revelar votos (atalho R)"
						: "Aguardando votos para revelar"
			}
			title={state === "ready" ? "Atalho: R" : state === "post-reveal" ? "Atalho: N" : undefined}
			className="min-h-[44px] rounded-full px-6"
		>
			{label}
		</RichButton>
	);
}
