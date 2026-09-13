/**
 * TimerPill — timer + rodada (Spell dark).
 *
 * `Ns` até 60s, `MM:SS` acima (defesa); `RODADA NN` zero-padded.
 * Estilo warning (âmbar) quando crítico — fonte única: o store (`critical`
 * vem do `room_state.critical` do server, com recompute local só como
 * fallback quando o server omite). Este componente NUNCA re-deriva warning
 * do timer por conta própria.
 */
import { useCritical, usePhase, useRound, useTimer } from "@/store/sala";
import { Badge } from "@/components/spell/badge";

/** Segundos puros até 60; MM:SS acima. */
export function formatTimer(seconds: number): string {
	const clamped = Math.max(0, Math.floor(seconds));
	if (clamped <= 60) return String(clamped);
	const mm = Math.floor(clamped / 60);
	const ss = clamped % 60;
	return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** `RODADA 03` (1-based, zero-padded). */
export function formatRound(round: number): string {
	return `RODADA ${String(Math.max(1, Math.floor(round))).padStart(2, "0")}`;
}

export interface TimerPillProps {
	timer?: number;
	round?: number;
	critical?: boolean;
}

export function TimerPill(props: TimerPillProps = {}) {
	const storeTimer = useTimer();
	const storeRound = useRound();
	const storeCritical = useCritical();
	const phase = usePhase();

	const timer = props.timer ?? storeTimer;
	const round = props.round ?? storeRound;
	// Fonte única: prop explícita ou store. Sem re-derivação do timer aqui —
	// se o store diz não-crítico (server mandou critical=false), o pill obedece.
	const isCritical = props.critical ?? storeCritical;
	if (phase === "revealed") {
		return <span data-testid="timer-pill" data-timer-critical="false" className="text-sm text-zinc-400 [html.light_&]:text-zinc-600">Em discussão</span>;
	}

	return (
		<Badge
			role="timer"
			aria-live="off"
			aria-label={`Tempo restante: ${timer} segundos. No zero, revela sozinho.`}
			title="No zero, os votos revelam sozinhos"
			data-testid="timer-pill"
			data-timer-critical={isCritical ? "true" : "false"}
			variant={isCritical ? "yellow" : "blue"}
			className="gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[13px] tracking-[0.08em] uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
		>
			{isCritical && (
				<span aria-hidden="true" className="leading-none">
					⚠
				</span>
			)}
			<span data-testid="timer-value" className="font-semibold tabular-nums">
				{formatTimer(timer)}
			</span>
			<span aria-hidden="true" className="inline-block h-2.5 w-px bg-current opacity-30" />
			<span data-testid="timer-round" className="tabular-nums">
				{formatRound(round)}
			</span>
		</Badge>
	);
}
