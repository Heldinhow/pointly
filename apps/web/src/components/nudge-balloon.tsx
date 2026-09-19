import type { CSSProperties, RefObject } from "react";
import { useLayoutEffect, useState } from "react";
import { NUDGE_CATALOG } from "@/lib/nudges";
import type { NudgeId } from "@/lib/protocol";
import "./nudge-balloon.css";

export interface NudgeBalloonEvent {
	key: number;
	senderPlayerId: string;
	targetPlayerId: string;
	nudgeId: NudgeId;
	receivedAt: number;
}

/** Tempo de vida do balão (some sozinho — issue #172). */
export const NUDGE_BALLOON_MS = 2000;

interface NudgeBalloonProps {
	event: NudgeBalloonEvent;
	arenaRef: RefObject<HTMLDivElement | null>;
	onDone: (key: number) => void;
}

/** Escapa aspas/barra do id para uso no seletor de atributo (CSS.escape é opcional no jsdom). */
function escapeSelectorValue(value: string): string {
	return value.replace(/["\\]/g, "\\$&");
}

/**
 * Balão efêmero da cutucada sobre o avatar do alvo (assento ou linha de
 * espectadores). Posiciona uma vez no mount a partir do mesmo anchor dos
 * projéteis (`data-projectile-player`) e se remove sozinho após
 * `NUDGE_BALLOON_MS`. Só `transform/opacity`; reduced-motion desliga a
 * animação, mantendo o tempo de vida.
 */
export function NudgeBalloon({
	event,
	arenaRef,
	onDone,
}: NudgeBalloonProps): React.ReactElement | null {
	const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

	useLayoutEffect(() => {
		const arena = arenaRef.current;
		const anchor = arena?.querySelector<HTMLElement>(
			`[data-projectile-player="${escapeSelectorValue(event.targetPlayerId)}"]`,
		);
		if (!arena || !anchor) {
			onDone(event.key);
			return;
		}
		const bounds = arena.getBoundingClientRect();
		const rect = anchor.getBoundingClientRect();
		setPos({
			x: rect.left + rect.width / 2 - bounds.left,
			y: rect.top - bounds.top - 6,
		});

		const remaining = NUDGE_BALLOON_MS - (Date.now() - event.receivedAt);
		if (remaining <= 0) {
			onDone(event.key);
			return;
		}
		const timer = setTimeout(() => onDone(event.key), remaining);
		return () => clearTimeout(timer);
	}, [event.key, event.targetPlayerId, event.receivedAt, arenaRef, onDone]);

	if (!pos) return null;
	const label =
		NUDGE_CATALOG.find((entry) => entry.id === event.nudgeId)?.label ??
		event.nudgeId;
	return (
		<span
			className="nudge-balloon"
			role="status"
			data-testid="nudge-balloon"
			data-target-player={event.targetPlayerId}
			style={
				{
					left: pos.x,
					top: pos.y,
					"--nudge-ms": `${NUDGE_BALLOON_MS}ms`,
				} as CSSProperties
			}
		>
			{label}
		</span>
	);
}
