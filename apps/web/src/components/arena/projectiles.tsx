/**
 * ProjectileLayer — anima `projectile_thrown` (pós-reveal).
 *
 * Assina `subscribeProjectiles` (loops): localiza os seats
 * `[data-testid="seat-{id}"]`, voa o emoji seat→seat em 700ms numa camada
 * `fixed`, e aplica o impacto do `outcome` no alvo
 * (hit shake / dodge slide / deflect rebound). Cooldown de 5s é do
 * emissor (SeatCard); aqui é só celebração.
 */
import type { ProjectileThrownEvent } from "@planning-poker/shared";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { subscribeProjectiles } from "@/lib/loops";
import { PROJECTILE_EMOJI } from "./seat-card";
import "./projectiles.css";

const FLY_MS = 700;
const IMPACT_MS = 500;

interface Flyer {
	key: number;
	emoji: string;
	fromX: number;
	fromY: number;
	dx: number;
	dy: number;
}

let nextKey = 1;

function seatCenter(id: string): { x: number; y: number } | null {
	const el = document.querySelector(`[data-testid="seat-${CSS.escape(id)}"]`);
	if (!el) return null;
	const r = el.getBoundingClientRect();
	return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function flashImpact(targetId: string, outcome: ProjectileThrownEvent["outcome"]): void {
	const el = document.querySelector(
		`[data-testid="seat-${CSS.escape(targetId)}"]`,
	);
	if (!el) return;
	const cls =
		outcome === "hit"
			? "pointly-proj-impact-hit"
			: outcome === "dodge"
				? "pointly-proj-impact-dodge"
				: "pointly-proj-impact-deflect";
	el.classList.add(cls);
	window.setTimeout(() => el.classList.remove(cls), IMPACT_MS);
}

export function ProjectileLayer() {
	const [flyers, setFlyers] = useState<Flyer[]>([]);
	const timers = useRef<number[]>([]);

	useEffect(() => {
		const unsub = subscribeProjectiles((e) => {
			const from = seatCenter(e.senderPlayerId);
			const to = seatCenter(e.targetPlayerId);
			if (!from || !to) return;
			const key = nextKey++;
			const flyer: Flyer = {
				key,
				emoji: PROJECTILE_EMOJI[e.projectileType] ?? "✨",
				fromX: from.x,
				fromY: from.y,
				dx: to.x - from.x,
				dy: to.y - from.y,
			};
			setFlyers((prev) => [...prev.slice(-4), flyer]);
			timers.current.push(
				window.setTimeout(() => {
					flashImpact(e.targetPlayerId, e.outcome);
					setFlyers((prev) => prev.filter((f) => f.key !== key));
				}, FLY_MS),
			);
		});
		return () => {
			unsub();
			for (const t of timers.current) window.clearTimeout(t);
			timers.current = [];
		};
	}, []);

	if (flyers.length === 0) return null;

	return (
		<div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]">
			{flyers.map((f) => (
				<span
					key={f.key}
					className="pointly-proj-flyer text-2xl"
					style={
						{
							left: f.fromX,
							top: f.fromY,
							"--dx": `${f.dx}px`,
							"--dy": `${f.dy}px`,
						} as CSSProperties
					}
				>
					{f.emoji}
				</span>
			))}
		</div>
	);
}
