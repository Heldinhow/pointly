import type { Player, ProjectileType, Vote } from "@planning-poker/shared";
/**
 * Seat — T31 (Phase 6).
 *
 * Assento da mesa com:
 *  - Avatar circular (inicial do nome em Playfair Italic)
 *  - Nick truncado em ellipsis
 *  - Badge "VOCÊ" no assento local
 *  - State pill: IDLE / VOTED / revealed-value (face-up)
 *  - ★ mostarda no canto superior direito se host
 *  - Borda coral 2px se VOCÊ; borda gold 2px se votedMedian (aninhada via inset shadow)
 *  - Micro-interações de Arremesso (Mira + Menu de Projéteis no hover)
 *  - Cooldown visual de 5s após arremessar
 *  - Animações de impacto (Hit shake, Dodge slide, Deflect glow) e emojis flutuantes
 */
import { useEffect, useRef, useState } from "react";
import { SeatPrimitive, type SeatPrimitiveState } from "./ui/seat";

/** Props do Seat. `player` é o PlayerSchema canônico. */
export interface SeatProps {
	player: Player;
	/** true se este assento é o do player local (playerId === currentPlayerId). */
	isYou: boolean;
	/** true se fase atual é 'revealed' (face-up). */
	faceUp: boolean;
	/** true se este player votou a mediana (e não unanimous). */
	votedMedian: boolean;
	/** true se todos os jogadores não-nulos votaram igual. */
	unanimous: boolean;
	/** Callback para arremessar um projétil contra este jogador. */
	onThrow?: (targetPlayerId: string, projectileType: ProjectileType) => void;
}

const PROJECTILES: Array<{
	type: ProjectileType;
	emoji: string;
	title: string;
}> = [
	{ type: "paper_ball", emoji: "🏐", title: "Bola de Papel" },
	{ type: "tomato", emoji: "🍅", title: "Tomate" },
	{ type: "coffee", emoji: "☕", title: "Café" },
	{ type: "rubber_duck", emoji: "🧸", title: "Patinho" },
	{ type: "star", emoji: "⭐", title: "Estrela" },
	{ type: "heart", emoji: "❤️", title: "Coração" },
	{ type: "claps", emoji: "👏", title: "Palmas" },
];

const EMOJI_REACTIONS = ["🤨", "😐", "😠", "😂", "😮", "😎", "😜"];

/** Gera a inicial do nick para o avatar (max 2 chars, uppercase). */
function getInitials(nick: string): string {
	const trimmed = nick.trim();
	if (trimmed.length === 0) return "?";
	const first = trimmed.charAt(0).toUpperCase();
	const secondIdx = trimmed.search(/\s/);
	if (secondIdx > 0 && secondIdx + 1 < trimmed.length) {
		return first + trimmed.charAt(secondIdx + 1).toUpperCase();
	}
	return first;
}

/** Determina o state do SeatPrimitive. */
function deriveState(player: Player, faceUp: boolean): SeatPrimitiveState {
	if (player.status === "disconnected") return "disconnected";
	if (faceUp) return "revealed";
	if (player.hasVoted) return "voted";
	return "idle";
}

/** Label curto do state pill. */
function stateLabel(player: Player, faceUp: boolean): string {
	if (player.status === "disconnected") return "DISCONNECTED";
	if (faceUp && player.value !== null) return player.value;
	if (player.hasVoted) return "VOTED";
	return "IDLE";
}

export function Seat({
	player,
	isYou,
	faceUp,
	votedMedian,
	unanimous,
	onThrow,
}: SeatProps) {
	const state = deriveState(player, faceUp);
	const label = stateLabel(player, faceUp);
	const initials = getInitials(player.nick);
	const showFaceNum = faceUp && player.value !== null;

	// Estados de animação e interações
	const [isHovered, setIsHovered] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const [impact, setImpact] = useState<"hit" | "dodge" | "deflect" | null>(
		null,
	);
	const [floatingEmoji, setFloatingEmoji] = useState<{
		emoji: string;
		key: number;
	} | null>(null);
	const [cooldownTime, setCooldownTime] = useState(0);

	const menuRef = useRef<HTMLDivElement>(null);

	// Cooldown global de arremessos
	useEffect(() => {
		const checkCooldown = () => {
			const until = (window as any).__pointly_cooldown_until__ || 0;
			const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
			setCooldownTime(left);
		};

		checkCooldown();
		const interval = setInterval(checkCooldown, 200);
		return () => clearInterval(interval);
	}, []);

	// Listener de impactos disparados pelo ProjectileAnimator
	useEffect(() => {
		const handleImpact = (e: Event) => {
			const detail = (e as CustomEvent).detail;
			if (detail.targetPlayerId !== player.id) return;

			setImpact(detail.outcome);

			// Se for um acerto normal (hit), joga emoji flutuante
			if (detail.outcome === "hit") {
				const randomEmoji =
					EMOJI_REACTIONS[Math.floor(Math.random() * EMOJI_REACTIONS.length)] ||
					"🤨";
				setFloatingEmoji({
					emoji: randomEmoji,
					key: Math.random(),
				});
			}

			// Limpa o impacto após a animação terminar
			const duration = detail.outcome === "dodge" ? 700 : 400;
			setTimeout(() => {
				setImpact(null);
			}, duration);
		};

		window.addEventListener("pointly-projectile-impact", handleImpact);
		return () =>
			window.removeEventListener("pointly-projectile-impact", handleImpact);
	}, [player.id]);

	// Fechar menu de reações se clicar fora
	useEffect(() => {
		if (!showMenu) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setShowMenu(false);
				setIsHovered(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showMenu]);

	const handleTargetClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (cooldownTime > 0) return;
		setShowMenu((prev) => !prev);
	};

	const handleProjectileSelect = (
		type: ProjectileType,
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		if (onThrow && cooldownTime === 0) {
			// Ativa cooldown de 5 segundos
			(window as any).__pointly_cooldown_until__ = Date.now() + 5000;
			setCooldownTime(5);
			onThrow(player.id, type);
		}
		setShowMenu(false);
		setIsHovered(false);
	};

	// Classes adicionais para animações físicas do assento
	const impactClass =
		impact === "hit"
			? "animate-hit-shake"
			: impact === "dodge"
				? "animate-dodge-slide"
				: impact === "deflect"
					? "ring-2 ring-mustard shadow-lg scale-95"
					: "";

	// Direção do desvio rápido baseada em posição (esquerda ou direita)
	const dodgeStyle =
		impact === "dodge"
			? ({
					"--dodge-x": player.seatIndex % 2 === 0 ? "40px" : "-40px",
					"--dodge-y": "-10px",
				} as React.CSSProperties)
			: undefined;

	return (
		<div
			data-testid={`seat-${player.id}`}
			data-seat-player-id={player.id}
			data-seat-nick={player.nick}
			data-seat-role={player.role}
			className="contents"
		>
			<div
				className="relative"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => {
					if (!showMenu) {
						setIsHovered(false);
					}
				}}
			>
				{/* Emoji Flutuante de Reação */}
				{floatingEmoji && (
					<div
						key={floatingEmoji.key}
						className="absolute -top-10 left-1/2 -translate-x-1/2 text-3xl z-40 pointer-events-none select-none animate-reaction-fade-up"
					>
						{floatingEmoji.emoji}
					</div>
				)}

				{/* Botão discreto de arremesso (Mira) no hover */}
				{isHovered && !isYou && player.status === "connected" && (
					<div className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
						<button
							type="button"
							onClick={handleTargetClick}
							disabled={cooldownTime > 0}
							className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-base border bg-surface transition-all duration-200 cursor-pointer shadow-md hover:scale-110 active:scale-95 ${
								cooldownTime > 0
									? "border-ink/5 text-ink-faint bg-paper-dark"
									: "border-coral text-coral hover:bg-coral hover:text-white"
							}`}
							title={
								cooldownTime > 0
									? `Aguarde ${cooldownTime}s`
									: "Arremessar algo!"
							}
						>
							🎯
						</button>

						{/* Menu de Projéteis horizontal elegante (Estilo slack reactions) */}
						{showMenu && (
							<div
								ref={menuRef}
								className="absolute bottom-12 bg-surface/95 backdrop-blur-sm border border-ink/10 rounded-full py-1 px-2 shadow-xl flex items-center gap-1.5 transition-all duration-200 animate-in fade-in zoom-in-95"
							>
								{PROJECTILES.map((proj) => (
									<button
										key={proj.type}
										type="button"
										onClick={(e) => handleProjectileSelect(proj.type, e)}
										className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-xl hover:bg-ink/5 active:scale-90 transition-transform cursor-pointer"
										title={proj.title}
									>
										{proj.emoji}
									</button>
								))}
							</div>
						)}
					</div>
				)}

				{/* Cooldown overlay sobre o seu próprio assento */}
				{isYou && cooldownTime > 0 && (
					<div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 font-mono text-[9px] bg-ink text-white px-2 py-0.5 rounded-full shadow-sm motion-reduce:animate-none animate-pulse tracking-wide select-none">
						RECARGA: {cooldownTime}s
					</div>
				)}

				{/* Deflect Shield Indicator */}
				{impact === "deflect" && (
					<div className="absolute inset-0 bg-mustard/15 border-2 border-mustard rounded-card z-30 pointer-events-none flex items-center justify-center motion-reduce:animate-none animate-pulse">
						<span className="text-xl">🛡️</span>
					</div>
				)}

				<SeatPrimitive
					isYou={isYou}
					isHost={player.role === "host"}
					state={state}
					faceUp={faceUp}
					votedMedian={votedMedian}
					unanimous={unanimous}
					className={`${impactClass} transition-all duration-200`}
					style={dodgeStyle}
				>
					{/* Avatar circular */}
					<div
						className="w-9 h-9 rounded-full bg-paper-dark flex items-center justify-center font-italic italic text-[18px] text-ink-soft flex-shrink-0 transition-opacity duration-200"
						aria-hidden="true"
						data-testid="seat-avatar"
					>
						{initials}
					</div>

					{/* Nick (truncado) */}
					<div
						className="font-display font-semibold text-[11.5px] text-ink max-w-[80px] truncate tracking-[-0.01em] transition-opacity duration-200"
						title={player.nick}
						data-testid="seat-nick"
					>
						{player.nick}
					</div>

					{/* Badge "VOCÊ" */}
					{isYou && (
						<div
							className="font-mono text-[8.5px] tracking-[0.1em] text-coral uppercase py-0.5 px-1.5 border border-coral rounded transition-opacity duration-200"
							data-testid="seat-voc-badge"
							aria-label="Você está neste assento"
						>
							Você
						</div>
					)}

					{/* State pill: IDLE / VOTED / face-num */}
					{showFaceNum ? (
						<div
							className="font-italic italic text-[24px] text-ink font-bold leading-none mt-1"
							aria-label={`Voto: ${player.value as Vote}`}
							data-testid="seat-face-num"
						>
							{player.value}
						</div>
					) : (
						<span
							className={`font-mono text-[9.5px] tracking-[0.06em] uppercase py-[3px] px-2 border rounded-full bg-paper ${
								player.hasVoted
									? "text-ink border-ink/15"
									: "text-ink-faint border-ink/5"
							}`}
							data-testid="seat-state"
						>
							{label}
						</span>
					)}
				</SeatPrimitive>
			</div>
		</div>
	);
}
