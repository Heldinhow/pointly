import type { Player, ProjectileType, Vote } from "@planning-poker/shared";
/**
 * Seat — T31 (Phase 6).
 *
 * Assento da mesa com:
 *  - Avatar circular (iniciais do nome em Space Grotesk sem itálico)
 *  - Nick truncado em ellipsis
 *  - Badge "VOCÊ" no assento local
 *  - State pill: AGUARDANDO / VOTOU / revealed-value (face-up)
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
	{ type: "paper_ball", emoji: "📄", title: "Bola de Papel" },
	{ type: "tomato", emoji: "🍅", title: "Tomate" },
	{ type: "coffee", emoji: "☕", title: "Café" },
	{ type: "rubber_duck", emoji: "🦆", title: "Patinho" },
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

/** Label curto do state pill (PT-BR; pill aplica uppercase via CSS). */
function stateLabel(player: Player, faceUp: boolean): string {
	if (player.status === "disconnected") return "DESCONECTADO";
	if (faceUp && player.value !== null) return player.value;
	if (player.hasVoted) return "VOTOU";
	return "AGUARDANDO";
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
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);

	// Ao abrir o menu, move o foco pro primeiro item; setas ←/→ navegam,
	// Home/End saltam, Tab fecha e volta ao trigger.
	useEffect(() => {
		if (showMenu) menuItemRefs.current[0]?.focus();
	}, [showMenu]);
	const handleMenuKeyDown = (e: React.KeyboardEvent) => {
		const items = menuItemRefs.current.filter(Boolean) as HTMLButtonElement[];
		if (items.length === 0) return;
		const current = items.indexOf(document.activeElement as HTMLButtonElement);
		if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
			e.preventDefault();
			const dir = e.key === "ArrowRight" ? 1 : -1;
			const next = items[(current + dir + items.length) % items.length];
			next?.focus();
		} else if (e.key === "Home") {
			e.preventDefault();
			items[0]?.focus();
		} else if (e.key === "End") {
			e.preventDefault();
			items[items.length - 1]?.focus();
		} else if (e.key === "Tab") {
			setShowMenu(false);
			setIsHovered(false);
		}
	};

	// Cooldown global de arremessos — poll 1s (display em segundos; 200ms gerava 5 renders/s por assento)
	useEffect(() => {
		const checkCooldown = () => {
			const until = (window as any).__pointly_cooldown_until__ || 0;
			const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
			setCooldownTime(left);
		};

		checkCooldown();
		const interval = setInterval(checkCooldown, 1000);
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

	// Fechar menu de reações se clicar fora ou Escape; retorna foco ao trigger
	useEffect(() => {
		if (!showMenu) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setShowMenu(false);
				setIsHovered(false);
			}
		};
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setShowMenu(false);
				setIsHovered(false);
				triggerRef.current?.focus();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKey);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKey);
		};
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
			? "motion-reduce:animate-none animate-hit-shake"
			: impact === "dodge"
				? "motion-reduce:animate-none animate-dodge-slide"
				: impact === "deflect"
					? "ring-2 ring-warning shadow-lg scale-95"
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
				onFocus={() => setIsHovered(true)}
				onBlur={(e) => {
					if (!showMenu && !e.currentTarget.contains(e.relatedTarget as Node)) {
						setIsHovered(false);
					}
				}}
			>
				{/* Emoji Flutuante de Reação */}
				{floatingEmoji && (
					<div
						key={floatingEmoji.key}
						className="absolute -top-10 left-1/2 -translate-x-1/2 text-3xl z-40 pointer-events-none select-none motion-reduce:animate-none animate-reaction-fade-up"
					>
						{floatingEmoji.emoji}
					</div>
				)}

				{/* Botão discreto de arremesso (Mira) — sempre no DOM pra teclado/toque, visível em hover OU foco */}
				{!isYou && player.status === "connected" && (
					<div
						className={`absolute -top-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center transition-opacity ${isHovered || showMenu ? "opacity-100" : "opacity-0 pointer-events-none focus-within:opacity-100 focus-within:pointer-events-auto"}`}
					>
						<button
							ref={triggerRef}
							type="button"
							onClick={handleTargetClick}
							onFocus={() => setIsHovered(true)}
							disabled={cooldownTime > 0}
							tabIndex={cooldownTime > 0 ? -1 : 0}
							aria-label={cooldownTime > 0 ? `Aguarde ${cooldownTime} segundos para arremessar de novo` : `Arremessar algo em ${player.nick}`}
							aria-haspopup="menu"
							aria-expanded={showMenu}
							className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-base border bg-surface transition-colors duration-200 cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 ${
								cooldownTime > 0
									? "border-ink/5 text-ink-faint bg-paper-dark"
									: "border-coral text-coral hover:bg-coral hover:text-on-accent"
							}`}
						>
							<span aria-hidden="true">🎯</span>
						</button>

						{/* Menu de Projéteis horizontal elegante (Estilo slack reactions) */}
						{showMenu && (
							<div
								ref={menuRef}
								role="menu"
								aria-label={`Escolha o que arremessar em ${player.nick}`}
								onKeyDown={handleMenuKeyDown}
								className="absolute bottom-12 bg-surface border border-ink/10 rounded-full py-1 px-2 shadow-card flex items-center gap-1.5 motion-reduce:animate-none"
							>
								{PROJECTILES.map((proj, idx) => (
									<button
										key={proj.type}
										type="button"
										role="menuitem"
										ref={(el) => {
											menuItemRefs.current[idx] = el;
										}}
										onClick={(e) => handleProjectileSelect(proj.type, e)}
										className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-xl hover:bg-ink/5 active:scale-90 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus)]"
										aria-label={proj.title}
										title={proj.title}
									>
										<span aria-hidden="true">{proj.emoji}</span>
									</button>
								))}
							</div>
						)}
					</div>
				)}

				{/* Cooldown overlay sobre o seu próprio assento */}
				{isYou && cooldownTime > 0 && (
					<div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 font-mono text-label bg-ink text-bg px-2 py-0.5 rounded-full shadow-sm motion-reduce:animate-none animate-pulse tracking-caps select-none">
						Aguarde {cooldownTime}s
					</div>
				)}
				{/* Cooldown anunciado pra SR uma vez (texto estático: sem
				    countdown por segundo, que competia com o StatsPill). */}
				{!isYou && cooldownTime > 0 && (
					<span className="sr-only" role="status">
						Aguarde para arremessar de novo.
					</span>
				)}

				{/* Deflect Shield Indicator */}
				{impact === "deflect" && (
					<div className="absolute inset-0 bg-warning-soft border-2 border-warning rounded-card z-30 pointer-events-none flex items-center justify-center motion-reduce:animate-none animate-pulse">
						<span className="text-xl" aria-hidden="true">🛡️</span>
					</div>
				)}

				<SeatPrimitive
					isYou={isYou}
					isHost={player.role === "host"}
					state={state}
					faceUp={faceUp}
					votedMedian={votedMedian}
					unanimous={unanimous}
					className={`arena-seat-card ${impactClass} transition-all duration-200`}
					style={dodgeStyle}
				>
					{/* Avatar circular */}
					<div
						className="w-9 h-9 rounded-full bg-paper-dark flex items-center justify-center font-italic text-vote-numeral text-ink-soft flex-shrink-0 transition-opacity duration-200"
						aria-hidden="true"
						data-testid="seat-avatar"
					>
						{initials}
					</div>

					{/* Nick (truncado) */}
					<div
						className="arena-seat-name font-display font-semibold text-label text-ink max-w-[80px] truncate transition-opacity duration-200"
						title={player.nick}
						data-testid="seat-nick"
					>
						{player.nick}
					</div>

					{/* Badge "VOCÊ" */}
					{isYou && (
						<div
							className="font-mono text-micro-label tracking-caps font-semibold text-coral-deep uppercase py-0.5 px-1.5 border border-coral-deep rounded transition-opacity duration-200"
							data-testid="seat-voc-badge"
							aria-label="Você está neste assento"
						>
							Você
						</div>
					)}

					{/* State pill: AGUARDANDO / VOTOU / face-num */}
					{showFaceNum ? (
						<div
							className="font-italic text-vote-mark text-ink font-bold leading-none mt-1"
							aria-label={`Voto: ${player.value as Vote}`}
							data-testid="seat-face-num"
						>
							{player.value}
						</div>
					) : (
						<span
							className={`font-mono text-label tracking-caps uppercase py-[3px] px-2 border rounded-full bg-paper ${
								player.hasVoted
									? "text-ink border-ink/15"
									: "text-ink-mute border-ink/5"
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
