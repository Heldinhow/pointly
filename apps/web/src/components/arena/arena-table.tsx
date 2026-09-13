/**
 * ArenaTable — a mesa de volta, em estética Spell.
 *
 * Elipse compacta com feltro noturno e assentos orbitando a mesa.
 * O próprio jogador senta embaixo (6h); os demais distribuídos na elipse.
 * O centro recebe `center` (copy da rodada + reveal) via slot.
 *
 * Desktop only: a arena monta OU a mesa OU a grade (nunca as duas —
 * os testids `seat-*` precisam ser únicos no DOM).
 */
import type { Player, ProjectileType } from "@planning-poker/shared";
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
		left: `${(50 + 40 * Math.cos(angle)).toFixed(2)}%`,
		top: `${(50 + 40 * Math.sin(angle)).toFixed(2)}%`,
	};
}

export function ArenaTable({
	players,
	currentPlayerId,
	faceUp,
	onThrow,
	center,
}: ArenaTableProps) {
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
			className="relative mx-auto my-4 h-[420px] w-full max-w-4xl"
		>
			{/* trilho — borda hairline + brilho ambiente contido */}
			<div
				aria-hidden="true"
				className="absolute inset-[4%] rounded-[50%] border border-[#262c29] bg-[#111714] [html.light_&]:border-zinc-300 [html.light_&]:bg-[#e5ece7]"
			/>
			{/* feltro — vinheta noturna + respiro esmeralda no topo */}
			<div
				aria-hidden="true"
				className="absolute inset-[7%] rounded-[50%] border border-white/[0.06] bg-[#101612] [html.light_&]:border-zinc-300 [html.light_&]:bg-[#f0f4f1]"
			/>
			{/* costura interna — anel pontilhado contido */}
			<div
				aria-hidden="true"
				className="absolute inset-[10%] rounded-[50%] border border-dashed border-white/[0.07] [html.light_&]:border-emerald-900/15"
			/>

			{/* inlay central */}
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="w-full max-w-sm px-4 text-center">{center}</div>
			</div>

			{/* assentos em órbita */}
			{ordered.map((p, i) => {
				const pos = seatPosition(i, ordered.length);
				return (
					<div
						key={p.id}
						className="absolute z-10 -translate-x-1/2 -translate-y-1/2 focus-within:z-20"
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
