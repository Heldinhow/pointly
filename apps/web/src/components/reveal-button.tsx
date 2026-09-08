/**
 * RevealButton + NewRoundButton (morphing) — T33 (Phase 6).
 *
 * Botão da arena com 3 estados morphing:
 *  1. `awaiting` (ghost, disabled): "Aguardando votos…"
 *     Mostrado quando phase !== 'revealed' && votes === 0
 *  2. `ready` (primary pill): "Revelar votos" + hint com contagem
 *     Mostrado quando ≥1 voto entrou && phase !== 'revealed'
 *  3. `post-reveal` (outline ghost): "Nova rodada" → "Confirmar nova rodada?"
 *     Mostrado quando phase === 'revealed' (qualquer player pode iniciar).
 *    Ghost proposital: ação destrutiva não veste o primário do commit.
 *
 * **Regra democratizada** (ADR-0002 + spec F-051/F-052):
 *  - Qualquer player pode revelar (não precisa ser host)
 *  - Qualquer player pode iniciar nova rodada
 *
 * **Lógica de estado**:
 *  - `state = 'awaiting'` quando votedCount === 0
 *  - `state = 'ready'` quando votedCount >= 1 && phase !== 'revealed'
 *  - `state = 'post-reveal'` quando phase === 'revealed'
 *
 * **Modes**:
 *  - `centered` (default): posicionamento `absolute top-1/2 left-1/2` —
 *    usado pelo round-table desktop. Morphing hover translada para
 *    compensar a centralização.
 *  - `inline`: width-full + posição natural do fluxo — usado pelo
 *    MobileRevealDock sticky-bottom (mobile-first). Sem compensação
 *    de translação no hover.
 *
 * **A11y**:
 *  - aria-label contextual ao estado
 *  - aria-disabled no estado awaiting
 *  - Click + Enter/Space nativos do <button>
 *
 * @see .specs/features/planning-poker-v1/tasks.md T33
 * @see .specs/features/planning-poker-v1/spec.md F-031, F-051, F-052
 */
import type { Phase } from "@planning-poker/shared";
import { useEffect, useRef, useState } from "react";
import { cn } from "./ui/utils";

export type RevealButtonState = "awaiting" | "ready" | "post-reveal";
export type RevealButtonMode = "centered" | "inline";

export interface RevealButtonProps {
	phase: Phase;
	/** Número de jogadores que votaram nesta rodada. */
	votedCount: number;
	/** Total de jogadores na sala (referência: o contador é só pra você, não aparece no hint). */
	totalPlayers: number;
	/** Callback: clicar no estado ready → envia `reveal_votes`. */
	onReveal: () => void;
	/** Callback: clicar no estado post-reveal → envia `start_new_round`. */
	onNewRound: () => void;
	/**
	 * `centered` (default): absolute centrado no parent (round-table desktop).
	 * `inline`: width-full dentro de um sticky dock (mobile-first).
	 */
	mode?: RevealButtonMode;
}

/** Decide o estado do botão baseado na phase + votedCount. */
export function deriveButtonState(
	phase: Phase,
	votedCount: number,
): RevealButtonState {
	if (phase === "revealed") return "post-reveal";
	if (votedCount === 0) return "awaiting";
	return "ready";
}

export function RevealButton({
	phase,
	votedCount,
	totalPlayers,
	onReveal,
	onNewRound,
	mode = "centered",
}: RevealButtonProps) {
	const state = deriveButtonState(phase, votedCount);
	const centered = mode === "centered";

	// Nova rodada limpa votos + timer: ação destrutiva pede confirmação
	// inline em dois toques (arma → confirma). Desarma sozinho em 4s,
	// com Escape ou quando a phase muda (nova rodada começou).
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
			if (disarmTimer.current !== null)
				window.clearTimeout(disarmTimer.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [phase]);
	const armConfirm = () => {
		setConfirming(true);
		if (disarmTimer.current !== null)
			window.clearTimeout(disarmTimer.current);
		disarmTimer.current = window.setTimeout(() => setConfirming(false), 4000);
	};

	// O botão já comunica espera; o hint complementa apenas ações disponíveis.
	const allVoted = totalPlayers > 0 && votedCount >= totalPlayers;
	const hint =
		state === "ready"
			? allVoted
				? "Todos votaram · hora de revelar."
				: `${votedCount} de ${totalPlayers} votaram.`
			: state === "post-reveal"
				? confirming
					? "Toque de novo para confirmar."
					: "Limpa votos · reinicia timer."
				: "";

	const label =
		state === "awaiting"
			? "Aguardando votos…"
			: state === "ready"
				? "Revelar votos"
				: confirming
					? "Confirmar nova rodada?"
					: "Nova rodada";

	const disabled = state === "awaiting";

	const ariaLabel =
		state === "awaiting"
			? "Aguardando votos para revelar"
			: state === "ready"
				? allVoted
					? "Revelar votos agora, todos votaram"
					: `Revelar votos agora, ${votedCount} de ${totalPlayers} votaram`
				: confirming
					? "Confirmar nova rodada, limpa os votos"
					: "Iniciar nova rodada";

	const handleClick = () => {
		if (state === "ready") onReveal();
		else if (state === "post-reveal") {
			if (confirming) {
				disarm();
				onNewRound();
			} else armConfirm();
		}
	};

	return (
		<div
			className={cn(
				"arena-reveal-stack flex flex-col items-center gap-1.5",
				centered
					? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto min-w-[180px]"
					: "relative w-full",
			)}
		>
		<button
			type="button"
			disabled={disabled}
			aria-label={ariaLabel}
			aria-disabled={disabled}
			aria-describedby={hint ? "reveal-button-hint" : undefined}
			aria-keyshortcuts={
				state === "ready" ? "R" : state === "post-reveal" ? "N" : undefined
			}
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Escape" && confirming) disarm();
			}}
			data-testid="reveal-button"
			data-od-id="reveal-button"
			data-reveal-state={state}
			data-reveal-mode={mode}
			data-reveal-confirm={confirming ? "true" : "false"}
			className={cn(
				"arena-reveal-button",
				"flex items-center justify-center",
				centered ? "w-auto min-w-[180px] px-5" : "w-full px-6",
			"py-2 rounded-full whitespace-nowrap",
			"min-h-[44px] min-h-[var(--tap-target-min,44px)]",
			"font-mono font-semibold uppercase tracking-caps text-[13px]",
			"transition-colors duration-200 select-none",
			"focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
				state === "awaiting" &&
					"bg-paper-dark border border-ink/15 text-ink-faint cursor-not-allowed",
				state === "ready" &&
					"bg-coral border border-coral text-on-accent cursor-pointer shadow-coral hover:bg-[var(--accent-hover)]",
				state === "post-reveal" &&
					cn(
						"border cursor-pointer bg-surface text-ink",
						confirming
							? "border-danger text-danger"
							: "border-ink/25 hover:border-coral hover:text-accent-ink",
					),
			)}
		>
			<span className="inline-flex items-center gap-1.5 leading-none">
				{label}
			</span>
		</button>
			{hint && (
				<p
					id="reveal-button-hint"
					data-testid="reveal-button-hint"
					aria-live="polite"
					className={cn(
						"m-0 font-mono text-label normal-case font-normal text-center text-wrap-balance",
						state === "ready"
							? "text-ink"
							: state === "post-reveal" && confirming
								? "text-danger"
								: "text-ink-mute",
					)}
				>
					{hint}
				</p>
			)}
		</div>
	);
}
