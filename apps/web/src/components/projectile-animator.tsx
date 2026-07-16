import type { ProjectileType } from "@planning-poker/shared";
import { useEffect, useRef, useState } from "react";
import { projectileEvents } from "../lib/projectile-events";
import { useSalaStore } from "../store/sala";
import { assignSeatAngles, seatPosition } from "../lib/arena-geometry";

// Mapa de emojis para cada tipo de projétil
const PROJECTILE_EMOJIS: Record<ProjectileType, string> = {
	paper_ball: "🏐",
	tomato: "🍅",
	coffee: "☕",
	rubber_duck: "🧸",
	star: "⭐",
	heart: "❤️",
	claps: "👏",
};

interface ActiveAnimation {
	id: string;
	fromX: number;
	fromY: number;
	toX: number;
	toY: number;
	emoji: string;
	duration: number;
	isDeflecting: boolean;
}



const EMPTY_PLAYERS: any[] = [];

export function ProjectileAnimator() {
	const [activeAnimations, setActiveAnimations] = useState<ActiveAnimation[]>(
		[],
	);
	const players = useSalaStore((s) => s.sala?.players ?? EMPTY_PLAYERS);
	const currentPlayerId = useSalaStore((s) => s.currentPlayerId);

	const playersRef = useRef(players);
	const currentPlayerIdRef = useRef(currentPlayerId);

	useEffect(() => {
		playersRef.current = players;
		currentPlayerIdRef.current = currentPlayerId;
	}, [players, currentPlayerId]);

	useEffect(() => {
		const unsubscribe = projectileEvents.subscribe((event) => {
			const currentPlayers = playersRef.current;
			const currentMeId = currentPlayerIdRef.current;
			const playerIds = currentPlayers.map((p) => p.id);
			const seatAngles = assignSeatAngles(currentMeId, playerIds);

			const senderAngle = seatAngles.get(event.senderPlayerId);
			const targetAngle = seatAngles.get(event.targetPlayerId);

			if (senderAngle === undefined || targetAngle === undefined) return;

			const senderPos = seatPosition(senderAngle);
			const targetPos = seatPosition(targetAngle);

			const animationId = Math.random().toString(36).substring(2, 9);
			const emoji = PROJECTILE_EMOJIS[event.projectileType] ?? "📝";
			const duration = 700; // ms

			// Inicia a animação (voo de ida)
			setActiveAnimations((prev) => [
				...prev,
				{
					id: animationId,
					fromX: senderPos.left,
					fromY: senderPos.top,
					toX: targetPos.left,
					toY: targetPos.top,
					emoji,
					duration,
					isDeflecting: false,
				},
			]);

			// Agenda o impacto ou início do rebote
			setTimeout(() => {
				if (event.outcome === "deflect") {
					// Dispara evento de escudo/impacto inicial no alvo
					window.dispatchEvent(
						new CustomEvent("pointly-projectile-impact", {
							detail: {
								targetPlayerId: event.targetPlayerId,
								outcome: "deflect",
								projectileType: event.projectileType,
							},
						}),
					);

					// Começa o voo de volta (rebote)
					setActiveAnimations((prev) =>
						prev.map((anim) =>
							anim.id === animationId
								? {
										...anim,
										fromX: targetPos.left,
										fromY: targetPos.top,
										toX: senderPos.left,
										toY: senderPos.top,
										isDeflecting: true,
									}
								: anim,
						),
					);

					// Final do rebote atinge o emissor original
					setTimeout(() => {
						window.dispatchEvent(
							new CustomEvent("pointly-projectile-impact", {
								detail: {
									targetPlayerId: event.senderPlayerId,
									outcome: "hit",
									projectileType: event.projectileType,
								},
							}),
						);
						// Limpa animação
						setActiveAnimations((prev) =>
							prev.filter((anim) => anim.id !== animationId),
						);
					}, duration);
				} else {
					// Acerto ou desvio direto
					window.dispatchEvent(
						new CustomEvent("pointly-projectile-impact", {
							detail: {
								targetPlayerId: event.targetPlayerId,
								outcome: event.outcome,
								projectileType: event.projectileType,
							},
						}),
					);
					// Limpa animação
					setActiveAnimations((prev) =>
						prev.filter((anim) => anim.id !== animationId),
					);
				}
			}, duration);
		});

		return () => unsubscribe();
	}, []);

	return (
		<div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
			{activeAnimations.map((anim) => (
				<div
					key={anim.id}
					className="absolute animate-proj-x"
					style={
						{
							"--from-x": `${anim.fromX}px`,
							"--to-x": `${anim.toX}px`,
							"--duration": `${anim.duration}ms`,
							left: `${anim.fromX}px`,
						} as React.CSSProperties
					}
				>
					<div
						className="absolute animate-proj-y text-brand-mark select-none pointer-events-none"
						style={
							{
								"--from-y": `${anim.fromY}px`,
								"--to-y": `${anim.toY}px`,
								"--duration": `${anim.duration}ms`,
								top: `${anim.fromY}px`,
								transform: "translate(-50%, -50%)",
							} as React.CSSProperties
						}
					>
						{anim.emoji}
					</div>
				</div>
			))}
		</div>
	);
}
