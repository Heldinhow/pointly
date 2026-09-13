/**
 * ArenaTable — a mesa de volta, em estética Spell.
 *
 * Elipse dark com glow esmeralda + spotlight que segue o cursor
 * (só com motion permitido), trilho externo e assentos orbitando o feltro.
 * O próprio jogador senta embaixo (6h); os demais distribuídos na elipse.
 * O centro recebe `center` (copy da rodada + reveal) via slot.
 *
 * Desktop only: a arena monta OU a mesa OU a grade (nunca as duas —
 * os testids `seat-*` precisam ser únicos no DOM).
 */
import type { Player, ProjectileType } from "@planning-poker/shared";
import { useCallback, useState } from "react";
import type * as React from "react";
import { SeatCard } from "./seat-card";

export interface ArenaTableProps {
	players: Player[];
	currentPlayerId: string | null;
	faceUp: boolean;
	onThrow: (targetPlayerId: string, projectileType: ProjectileType) => void;
	center: React.ReactNode;
}

/** Posição de um assento na elipse (%, origem no centro). Self = 90° = embaixo. */
export function seatPosition(index: number, total: number): {
	left: string;
	top: string;
} {
	if (total <= 0) return { left: "50%", top: "50%" };
	const angle = ((90 + (index * 360) / total) * Math.PI) / 180;
	return {
		left: `${(50 + 44 * Math.cos(angle)).toFixed(2)}%`,
		top: `${(50 + 44 * Math.sin(angle)).toFixed(2)}%`,
	};
}

export function ArenaTable({
	players,
	currentPlayerId,
	faceUp,
	onThrow,
	center,
}: ArenaTableProps) {
	const [spot, setSpot] = useState({ x: 50, y: 30 });

	const handlePointerMove = useCallback((e: React.PointerEvent) => {
		const el = e.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return;
		setSpot({
			x: ((e.clientX - rect.left) / rect.width) * 100,
			y: ((e.clientY - rect.top) / rect.height) * 100,
		});
	}, []);

	// Self primeiro (vai para 90° = embaixo), resto na ordem da sala.
	const ordered = [...players].sort((a, b) => {
		if (a.id === currentPlayerId) return -1;
		if (b.id === currentPlayerId) return 1;
		return 0;
	});

	return (
		<div
			data-testid="arena-table"
			role="group"
			aria-label="Mesa de votação"
			onPointerMove={handlePointerMove}
			className="group relative mx-auto aspect-[16/10] w-full max-w-4xl [html.light_&]:max-w-4xl"
		>
			{/* halo externo — estático, um único momento luminoso */}
			<div
				aria-hidden="true"
				className="absolute -inset-3 rounded-[50%] bg-emerald-500/[0.07] blur-3xl [html.light_&]:bg-emerald-500/15"
			/>
			{/* trilho — borda hairline + brilho ambiente contido */}
			<div
				aria-hidden="true"
				className="absolute inset-[4%] rounded-[50%] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent shadow-[0_0_100px_-24px_rgba(52,211,153,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] [html.light_&]:border-zinc-300 [html.light_&]:from-white [html.light_&]:shadow-[0_0_100px_-32px_rgba(16,185,129,0.45)]"
			/>
			{/* feltro — vinheta noturna + respiro esmeralda no topo */}
			<div
				aria-hidden="true"
				className="absolute inset-[10%] rounded-[50%] border border-white/[0.08] bg-[radial-gradient(ellipse_55%_42%_at_50%_26%,rgba(52,211,153,0.16),transparent_70%),radial-gradient(ellipse_at_center,#17171e_0%,#0c0c11_62%,#08080b_100%)] [html.light_&]:border-zinc-300 [html.light_&]:bg-[radial-gradient(ellipse_55%_42%_at_50%_26%,rgba(16,185,129,0.2),transparent_70%),radial-gradient(ellipse_at_center,#ffffff_0%,#e9f1eb_72%,#dde8e0_100%)]"
			/>
			{/* costura interna — anel pontilhado contido */}
			<div
				aria-hidden="true"
				className="absolute inset-[12.5%] rounded-[50%] border border-dashed border-white/[0.09] [html.light_&]:border-emerald-900/25"
			/>
			{/* spotlight que segue o cursor (só com motion) */}
			<div
				aria-hidden="true"
				className="absolute inset-[10%] rounded-[50%] opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100"
				style={{
					background: `radial-gradient(circle at ${spot.x}% ${spot.y}%, rgba(255,255,255,0.07) 0%, transparent 46%)`,
				}}
			/>

			{/* inlay central */}
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="w-full max-w-sm px-6 text-center">{center}</div>
			</div>

			{/* assentos em órbita */}
			{ordered.map((p, i) => {
				const pos = seatPosition(i, ordered.length);
				return (
					<div
						key={p.id}
						className="absolute z-10 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
						style={{ left: pos.left, top: pos.top }}
					>
						<SeatCard
							player={p}
							isYou={p.id === currentPlayerId}
							faceUp={faceUp}
							onThrow={onThrow}
							layout="orbit"
						/>
					</div>
				);
			})}
		</div>
	);
}
