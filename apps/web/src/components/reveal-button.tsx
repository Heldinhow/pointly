/**
 * RevealButton + NewRoundButton (morphing) — T33 (Phase 6).
 *
 * Botão da arena com 3 estados morphing:
 *  1. `awaiting` (ghost, disabled): "Aguardando jogadores…"
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

	// Hint só renderiza quando há algo pra comunicar. Sala vazia
	// (totalPlayers=0): o MobilePlayerList (ou o empty state desktop) já
	// mostra "Aguardando jogadores…" — exibir de novo aqui duplicaria.
	const hint =
		state === "awaiting" && totalPlayers > 0
			? "Aguardando jogadores…"
			: state === "ready"
				? "Todos podem revelar."
				: state === "post-reveal"
					? "Limpa votos · reinicia timer."
					: "";

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
			data-reveal-mode={mode}
			className={cn(
				// Layout: vertical stack (label + hint)
				"flex flex-col gap-[3px] items-center justify-center",
				// Positioning: centered (desktop) vs inline (mobile dock)
				centered
					? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto min-w-[180px] px-5"
					: "relative w-full px-6",
				"py-2 rounded-full whitespace-nowrap",
				"min-h-[44px] min-h-[var(--tap-target-min,44px)]",
				"font-display font-semibold text-caption",
				"transition-all duration-200 select-none",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-deep focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
				// awaiting (ghost, disabled)
				state === "awaiting" &&
					"bg-paper-dark border border-ink/15 text-ink-faint cursor-not-allowed",
				// ready (coral pill, enabled)
				state === "ready" &&
					cn(
						"bg-coral border border-coral text-white cursor-pointer shadow-coral hover:bg-coral-soft",
						centered
							? "hover:-translate-x-1/2 hover:-translate-y-[calc(50%+1px)]"
							: "",
					),
				// post-reveal (primary coral, enabled)
				state === "post-reveal" &&
					cn(
						"bg-coral border border-coral text-white cursor-pointer shadow-coral hover:bg-coral-soft shadow-md",
						centered
							? "hover:-translate-x-1/2 hover:-translate-y-[calc(50%+1px)]"
							: "",
					),
			)}
		>
			<span className="inline-flex items-center gap-1.5 leading-none">
				{label}
				{state === "ready" && (
					<span className="text-coral-deep" aria-hidden="true">
						.
					</span>
				)}
			</span>
			{/* Hint: micro-label sem uppercase pra hierarquia clara.
			 * `tracking-normal` + lowercase = nitidamente secundário.
			 * leading-[1.2]: 2 linhas de micro-label (10px) precisam caber
			 * dentro da pill de 44px de altura sem competir com o CTA coral.
			 * Token `micro-label` é 1.4 e renderiza 3 linhas em 12px — aqui
			 * queremos 2 linhas em 10px, então apertamos 1.2. Anotar em
			 * DESIGN.md como off-ramp intencional (Próximo PR de typog.). */}
			<span
				className={cn(
					"font-mono text-micro-label leading-[1.2] font-normal",
					"normal-case",
					state === "awaiting"
						? "text-ink-faint/75"
						: centered
							? "text-white/75"
							: "text-white/80",
				)}
			>
				{hint}
			</span>
		</button>
	);
}
