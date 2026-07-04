/**
 * Timer pill — T34 (Phase 6).
 *
 * Pill bone-fill no canto superior direito da arena com:
 *  - Mono numerics tabular `00:42 · ROUND 03`
 *  - Critical state (timer ≤ 30s): bg coral-soft + border coral + coral ink
 *  - Auto-hide quando sala vazia (não aplicável no v2, sempre mostra)
 *  - Sync com Zustand via `useTimer()` + `useRound()`
 *
 * **A11y**:
 *  - role="timer"
 *  - aria-live="off" (não anuncia cada segundo pra evitar ruído)
 *  - aria-label="Tempo restante: X segundos"
 *
 * @see .specs/features/planning-poker-v1/tasks.md T34
 * @see .specs/features/planning-poker-v1/spec.md F-013, F-014
 */
import { useCritical, useRound, useTimer } from "../store/sala";
import { cn } from "./ui/utils";

/** Threshold crítico (segundos). Match com store CRITICAL_THRESHOLD_SECONDS. */
const CRITICAL_THRESHOLD = 30;

/** Formata segundos em MM:SS. */
export function formatTimer(seconds: number): string {
	const clamped = Math.max(0, Math.min(99, Math.floor(seconds)));
	// Timer da arena vai de 0..60 — mostramos como "00:SS" pra combinar
	// com o wireframe legado (vide design/arena.html `00:${t}`).
	if (clamped <= 60) {
		return `00:${String(clamped).padStart(2, "0")}`;
	}
	const mm = Math.floor(clamped / 60);
	const ss = clamped % 60;
	return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** Formata round como 'ROUND 03'. */
export function formatRound(round: number): string {
	const r = Math.max(1, Math.floor(round));
	return `ROUND ${String(r).padStart(2, "0")}`;
}

export interface TimerPillProps {
	/** Override opcional (default: lê do store via useTimer/useRound/useCritical). */
	timer?: number;
	round?: number;
	critical?: boolean;
}

export function TimerPill(props: TimerPillProps = {}) {
	const storeTimer = useTimer();
	const storeRound = useRound();
	const storeCritical = useCritical();

	const timer = props.timer ?? storeTimer;
	const round = props.round ?? storeRound;
	const critical = props.critical ?? storeCritical;

	const isCritical = critical || timer <= CRITICAL_THRESHOLD;

	return (
		<div
			role="timer"
			aria-live="off"
			aria-label={`Tempo restante: ${timer} segundos`}
			data-testid="timer-pill"
			data-od-id="timer-pill"
			data-timer-critical={isCritical ? "true" : "false"}
			className={cn(
				"inline-flex items-center gap-3.5 px-4 py-2.5 rounded-full",
				"border transition-colors duration-200",
				"font-mono text-[11px] tracking-[0.06em] uppercase",
				isCritical
					? "bg-coral-soft border-coral/40 text-coral"
					: "bg-surface border-ink/5 text-ink-faint",
			)}
		>
			<span
				className={cn(
					"font-variant-numeric",
					isCritical ? "text-coral" : "text-ink",
				)}
				data-testid="timer-value"
			>
				{formatTimer(timer)}
			</span>
			<span data-testid="timer-round">{formatRound(round)}</span>
		</div>
	);
}