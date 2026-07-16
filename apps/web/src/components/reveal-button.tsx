/**
 * RevealButton + NewRoundButton (morphing) — T33 (Phase 6).
 *
 * Botão central da arena com 3 estados morphing:
 *  1. `awaiting` (ghost, disabled): "Aguardando N jogadores…"
 *     Mostrado quando phase !== 'revealed' && votes === 0
 *  2. `ready` (coral pill): "Revelar votos." com coral dot
 *     Mostrado quando ≥1 voto entrou && phase !== 'revealed'
 *  3. `post-reveal` (ghost): "Nova rodada"
 *     Mostrado quando phase === 'revealed' (qualquer player pode iniciar)
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
 * **A11y**:
 *  - aria-label contextual ao estado
 *  - aria-disabled no estado awaiting
 *  - Click + Enter/Space nativos do <button>
 *
 * @see .specs/features/planning-poker-v1/tasks.md T33
 * @see .specs/features/planning-poker-v1/spec.md F-031, F-051, F-052
 */
import type { Phase } from "@planning-poker/shared";
import { cn } from "./ui/utils";

export type RevealButtonState = "awaiting" | "ready" | "post-reveal";

export interface RevealButtonProps {
	phase: Phase;
	/** Número de jogadores que votaram nesta rodada. */
	votedCount: number;
	/** Total de jogadores na sala (computa o N do "Aguardando N jogadores"). */
	totalPlayers: number;
	/** Callback: clicar no estado ready → envia `reveal_votes`. */
	onReveal: () => void;
	/** Callback: clicar no estado post-reveal → envia `start_new_round`. */
	onNewRound: () => void;
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
}: RevealButtonProps) {
	const state = deriveButtonState(phase, votedCount);

	const awaiting = totalPlayers - votedCount;
	const hint =
		state === "awaiting"
			? `Aguardando ${awaiting} jogador${awaiting === 1 ? "" : "es"}…`
			: state === "ready"
				? "Todos podem revelar."
				: "Limpa votos · reinicia timer.";

	const label =
		state === "awaiting"
			? "Revelar votos"
			: state === "ready"
				? "Revelar votos."
				: "Nova rodada";

	const disabled = state === "awaiting";

	const ariaLabel =
		state === "awaiting"
			? "Aguardando votos para revelar"
			: state === "ready"
				? "Revelar votos agora"
				: "Iniciar nova rodada";

	const handleClick = () => {
		if (state === "ready") onReveal();
		else if (state === "post-reveal") onNewRound();
	};

	return (
		<button
			type="button"
			disabled={disabled}
			aria-label={ariaLabel}
			aria-disabled={disabled}
			aria-keyshortcuts={
				state === "ready" ? "R" : state === "post-reveal" ? "N" : undefined
			}
			onClick={handleClick}
			data-testid="reveal-button"
			data-od-id="reveal-button"
			data-reveal-state={state}
			className={cn(
				"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
				"flex flex-col gap-[3px] items-center justify-center",
				"w-auto min-w-[230px] px-6 py-3.5 rounded-full whitespace-nowrap",
				"min-h-[44px] min-h-[var(--tap-target-min,44px)]",
				"font-display font-semibold text-[13px] tracking-[0.01em]",
				"transition-all duration-200 select-none",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
				// awaiting (ghost, disabled)
				state === "awaiting" &&
					"bg-paper-dark border border-ink/15 text-ink-faint cursor-not-allowed",
				// ready (coral pill, enabled)
				state === "ready" &&
					"bg-coral border border-coral text-white cursor-pointer shadow-coral hover:-translate-x-1/2 hover:-translate-y-[calc(50%+1px)] hover:bg-coral-soft",
				// post-reveal (primary coral, enabled)
				state === "post-reveal" &&
					"bg-coral border border-coral text-white cursor-pointer shadow-coral hover:-translate-x-1/2 hover:-translate-y-[calc(50%+1px)] hover:bg-coral-soft shadow-md",
			)}
		>
			<span className="inline-flex items-center gap-2">
				{label}
				{state === "ready" && (
					<span className="text-coral" aria-hidden="true">
						.
					</span>
				)}
			</span>
			<span
				className={cn(
					"font-mono text-[9.5px] tracking-[0.06em] uppercase font-normal",
					state === "awaiting" ? "text-ink-faint" : "text-white/85",
				)}
			>
				{hint}
			</span>
		</button>
	);
}
