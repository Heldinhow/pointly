/**
 * SeatCard — assento de um player (Spell dark).
 *
 * Círculo de iniciais em gradiente (sem avatar externo) + nick + badge
 * de estado (VOTOU/AGUARDANDO/valor face-up) + ★ do host.
 * Pós-reveal, mira 🎯 abre o menu de projéteis (hover/focus).
 */
import type { Player, ProjectileType } from "@planning-poker/shared";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/spell/badge";
import { cn } from "@/lib/cn";

export interface SeatCardProps {
	player: Player;
	isYou: boolean;
	faceUp: boolean;
	onThrow?: (targetPlayerId: string, projectileType: ProjectileType) => void;
	/**
	 * `row` (default): linha horizontal da grade mobile.
	 * `orbit`: pílula compacta vertical para os assentos ao redor da mesa.
	 * Mesmos testids, mesma lógica — só muda o layout.
	 */
	layout?: "row" | "orbit";
}

export const PROJECTILE_EMOJI: Record<ProjectileType, string> = {
	paper_ball: "📄",
	tomato: "🍅",
	coffee: "☕",
	rubber_duck: "🦆",
	star: "⭐",
	heart: "❤️",
	claps: "👏",
};

const PROJECTILE_ORDER: ProjectileType[] = [
	"paper_ball",
	"tomato",
	"coffee",
	"rubber_duck",
	"star",
	"heart",
	"claps",
];

/** Cooldown client-side entre arremessos. */
export const PROJECTILE_COOLDOWN_MS = 5_000;

/**
 * Cooldown GLOBAL por sender (module-level, via window): vale pra qualquer
 * SeatCard — arremessou pra um alvo, todos os outros bloqueiam por 5s.
 * O server também valida (cooldown de 5s por sender); isto é só UX rápida.
 */
function cooldownUntil(): number {
	try {
		const v = (
			window as unknown as Record<string, unknown>
		).__pointly_cooldown_until__;
		return typeof v === "number" ? v : 0;
	} catch {
		return 0;
	}
}

function markThrown(now: number = Date.now()): void {
	try {
		(
			window as unknown as Record<string, unknown>
		).__pointly_cooldown_until__ = now + PROJECTILE_COOLDOWN_MS;
	} catch {
		// storage/window indisponível — cooldown local do card ainda vale
	}
}

/** Apenas para testes — zera o cooldown global. */
export function __resetProjectileCooldownForTests(): void {
	try {
		(window as unknown as Record<string, unknown>).__pointly_cooldown_until__ =
			0;
	} catch {
		// ignore
	}
}

function getInitials(nick: string): string {
	const trimmed = nick.trim();
	if (trimmed.length === 0) return "?";
	const first = trimmed.charAt(0).toUpperCase();
	const gap = trimmed.search(/\s/);
	if (gap > 0 && gap + 1 < trimmed.length) {
		return first + trimmed.charAt(gap + 1).toUpperCase();
	}
	return first;
}

export function SeatCard({
	player,
	isYou,
	faceUp,
	onThrow,
	layout = "row",
}: SeatCardProps) {
	const initials = getInitials(player.nick);
	const showFaceNum = faceUp && player.value !== null;
	const canThrow = faceUp && !isYou && typeof onThrow === "function";

	const [menuOpen, setMenuOpen] = useState(false);
	const [coolingDown, setCoolingDown] = useState(false);
	const cooldownRef = useRef<number | null>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		return () => {
			if (cooldownRef.current !== null) window.clearTimeout(cooldownRef.current);
		};
	}, []);

	useEffect(() => {
		if (!canThrow) setMenuOpen(false);
	}, [canThrow]);

	useEffect(() => {
		if (!menuOpen) return;
		const onPointer = (e: PointerEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		};
		document.addEventListener("pointerdown", onPointer);
		return () => document.removeEventListener("pointerdown", onPointer);
	}, [menuOpen]);

	const stateLabel = showFaceNum
		? player.value ?? ""
		: player.status === "disconnected"
			? "Desconectado"
			: player.hasVoted
				? "Votou"
				: "Aguardando";

	const handleThrow = (type: ProjectileType) => {
		// Gate global primeiro: outro card pode ter arremessado há <5s.
		if (Date.now() < cooldownUntil()) return;
		if (coolingDown) return;
		onThrow?.(player.id, type);
		setMenuOpen(false);
		setCoolingDown(true);
		markThrown();
		if (cooldownRef.current !== null) window.clearTimeout(cooldownRef.current);
		cooldownRef.current = window.setTimeout(
			() => setCoolingDown(false),
			PROJECTILE_COOLDOWN_MS,
		);
	};

	return (
		<div
			data-testid={`seat-${player.id}`}
			data-seat-you={isYou ? "true" : "false"}
			className={cn(
				"relative flex min-h-[44px] items-center gap-3 rounded-xl border px-3 py-2",
				"border-[#26262c] bg-[#101013] [html.light_&]:border-zinc-200 [html.light_&]:bg-white",
				isYou && "border-emerald-400/50",
				player.status === "disconnected" && "opacity-50",
				layout === "orbit" &&
					"w-36 min-h-0 flex-col gap-1.5 rounded-2xl px-2 py-2.5 text-center",
			)}
		>
			<div
				aria-hidden="true"
				className={cn(
					"flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 via-zinc-800 to-black font-mono text-sm font-semibold text-zinc-100",
					layout === "orbit" && "h-8 w-8 text-xs",
				)}
			>
				{initials}
			</div>
			<div
				className={cn(
					"flex min-w-0 flex-1 flex-col",
					layout === "orbit" && "w-full items-center",
				)}
			>
				<span
					data-testid="seat-nick"
					className={cn(
						"truncate text-sm font-medium text-zinc-100 [html.light_&]:text-zinc-900",
						layout === "orbit" && "w-full text-center text-xs",
					)}
				>
					{player.nick}
					{player.role === "host" && (
						<span aria-label="anfitrião" title="Anfitrião" className="ml-1 text-amber-300">
							★
						</span>
					)}
					{isYou && (
						<span className="ml-1.5 font-mono text-[10px] tracking-[0.12em] text-zinc-500 uppercase">
							você
						</span>
					)}
				</span>
				{showFaceNum ? (
					<span
						data-testid="seat-face-num"
						className="font-mono text-lg leading-tight font-semibold text-emerald-300 tabular-nums [html.light_&]:text-emerald-700"
					>
						{player.value}
					</span>
			) : (
				<Badge
					data-testid="seat-state"
					variant={
						player.status === "disconnected"
							? "red"
							: player.hasVoted
								? "green"
								: "blue"
					}
					className="font-mono tracking-[0.12em] uppercase"
				>
					{stateLabel}
				</Badge>
			)}
			</div>
			{canThrow && (
				<div ref={menuRef} className="relative shrink-0">
					<button
						type="button"
						aria-label={`Arremessar projétil em ${player.nick}`}
						aria-haspopup="menu"
						aria-expanded={menuOpen ? "true" : "false"}
						disabled={coolingDown}
						title={coolingDown ? "Recarregando…" : `Provocar ${player.nick}`}
						onClick={() => setMenuOpen((v) => !v)}
						onKeyDown={(e) => {
							if (e.key === "Escape") setMenuOpen(false);
						}}
						className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-base opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none disabled:cursor-wait disabled:opacity-30"
					>
						🎯
					</button>
					{menuOpen && (
						<div
							role="menu"
							aria-label={`Projéteis para ${player.nick}`}
							className="absolute right-0 bottom-full z-30 mb-1 flex gap-1 rounded-xl border border-[#26262c] bg-[#17171b] p-1.5 shadow-xl"
						>
							{PROJECTILE_ORDER.map((type) => (
								<button
									key={type}
									type="button"
									role="menuitem"
									title={type}
									aria-label={`${PROJECTILE_EMOJI[type]} ${type}`}
									onClick={() => handleThrow(type)}
									className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-lg hover:bg-zinc-700/60 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
								>
									{PROJECTILE_EMOJI[type]}
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
