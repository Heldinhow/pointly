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

/** Formata segundos em MM:SS (legacy) ou `Ns` (0..60). */
export function formatTimer(seconds: number): string {
	const clamped = Math.max(0, Math.min(99, Math.floor(seconds)));
	// Timer da arena vai de 0..60. Para ≤60 (incl. 60) mostramos só o numeral
	// em segundos (BUG-201): "60", "30", "0". Acima de 60 usamos MM:SS legado
	// (defesa em profundidade — fora do range normal do timer).
	if (clamped <= 60) {
		return String(clamped);
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
				// Pill compacto (Atelier Zero): py-1 + gap-2 (antes py-2 + gap-2.5).
				// Stats-pill (esquerda) já usa py-1 + `text-micro-label` (10px)
				// — espelhar aqui pros dois strips do header terem a mesma
				// altura visual E o mesmo peso tipográfico. Antes timer value
				// era `text-label` (11px), um passo acima — visualmente
				// competia com o Seat face-up (20px Playfair) sem motivo.
				"inline-flex items-center gap-2 px-3 py-1 rounded-full",
				"border transition-colors duration-200",
				"font-mono text-micro-label tracking-caps uppercase",
				isCritical
					? "bg-coral-soft border-coral/40 text-ink"
					: "bg-surface border-ink/5 text-ink-faint",
			)}
		>
			{/* Timer (número) — text-label, weight medium → info primária */}
			<span
				className={cn(
					"text-label font-medium font-variant-numeric",
					isCritical ? "text-ink" : "text-ink",
				)}
				data-testid="timer-value"
			>
				{formatTimer(timer)}
			</span>
			{/* ROUND — micro-label, hairline separator, weight normal → info secundária */}
			<span
				aria-hidden="true"
				className="inline-block w-px h-2.5 bg-ink/15"
			/>
			<span
				className="text-micro-label font-normal text-ink-faint/80"
				data-testid="timer-round"
			>
				{formatRound(round)}
			</span>
		</div>
	);
}
