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
import { motion, useReducedMotion } from "motion/react";

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
	const reducedMotion = useReducedMotion();

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
				"relative flex min-h-[56px] items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors duration-150",
				"border-[#26262c] bg-[#101013] [html.light_&]:border-zinc-200 [html.light_&]:bg-white",
				isYou
					? "border-emerald-400/60 ring-1 ring-emerald-400/25"
					: player.hasVoted && !faceUp
						? "border-emerald-400/25"
						: undefined,
				player.status === "disconnected" && "opacity-60 saturate-50",
				layout === "orbit" &&
					"w-32 min-h-0 flex-col gap-1 rounded-xl px-2 py-2 text-center",
			)}
		>
			<div
				aria-hidden="true"
				className={cn(
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold",
					player.status === "disconnected"
						? "bg-zinc-800 text-zinc-500"
						: "bg-zinc-800 text-zinc-200 [html.light_&]:bg-zinc-100 [html.light_&]:text-zinc-700",
					layout === "orbit" && "hidden",
				)}
			>
				{initials}
			</div>
			<div
				className={cn(
					"flex min-w-0 flex-1 flex-col",
					layout === "orbit" && "w-full items-center",
					layout === "row" && showFaceNum && "flex-row items-center justify-between gap-2",
				)}
			>
				<span
					data-testid="seat-nick"
					className={cn(
						"min-w-0 truncate text-sm font-medium text-zinc-100 [html.light_&]:text-zinc-900",
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
						<span className="ml-1.5 text-xs text-zinc-400 [html.light_&]:text-zinc-600">
							você
						</span>
					)}
				</span>
				{showFaceNum ? (
					<motion.span
						data-testid="seat-face-num"
						initial={reducedMotion ? false : { scale: 0.9, rotateY: -70 }}
						animate={{ scale: 1, rotateY: 0 }}
						transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
						className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-400 px-2 font-mono text-xl leading-tight font-semibold text-emerald-950 tabular-nums"
					>
						{player.value}
					</motion.span>
			) : (
				<Badge
					data-testid="seat-state"
					variant={
						player.status === "disconnected"
							? "red"
							: player.hasVoted
								? "green"
							: "default"
					}
					className={cn("self-start text-xs normal-case tracking-normal", layout === "orbit" && "self-center", !player.hasVoted && player.status !== "disconnected" && "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")}
				>
					{stateLabel}
				</Badge>
			)}
			</div>
			{canThrow && (
				<div ref={menuRef} className={cn("relative shrink-0", layout === "orbit" && "absolute -right-3 -bottom-3")}>
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
						className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#101013] text-base transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none disabled:cursor-wait disabled:opacity-30 [html.light_&]:bg-white"
					>
						🎯
					</button>
					{menuOpen && (
						<div
							role="menu"
							aria-label={`Projéteis para ${player.nick}`}
							className="absolute right-0 bottom-full z-30 mb-1 grid grid-cols-4 gap-1 rounded-xl border border-[#26262c] bg-[#17171b] p-1.5 shadow-xl [html.light_&]:border-zinc-300 [html.light_&]:bg-white"
						>
							{PROJECTILE_ORDER.map((type) => (
								<button
									key={type}
									type="button"
									role="menuitem"
									title={type}
									aria-label={`${PROJECTILE_EMOJI[type]} ${type}`}
									onClick={() => handleThrow(type)}
									className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-lg hover:bg-zinc-700/20 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
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
