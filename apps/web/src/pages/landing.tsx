/**
 * Landing page — T27 (Phase 6) + Design System Refinements.
 *
 * Página inicial do Pointly com o Design System Atelier Zero completo:
 *  - Metadata strip minimal no topo (Pulse dot coral + idioma)
 *  - Side rails 36px (left/right) com rail text vertical (ocultos em telas menores)
 *  - Section rules com hairline + título de seção (sem numeral decorativo)
 *  - Títulos híbridos misturando Sans Bold + Serif Italic (Playfair Display)
 *  - Mesa de votação mockada interativa (MockTable) com 8 assentos ativos e revelados
 *  - Seção Dark contrastante com uma prévia do Deck Fibonacci (MockDeck)
 *  - Mega footer com a marca monumental "Pointly."
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

/** Stat rings — apenas métricas numéricas inequívocas. */
const STATS = [
	{ num: "12", label: "Assentos" },
	{ num: "60s", label: "P/ decidir" },
	{ num: "0s", label: "Setup" },
];

/** Capabilities — 4 features. Cada item inclui um ícone Lucide-like (20px coral)
 *  alinhado à direita do título. Os SVGs são aria-hidden para não poluir
 *  screen readers (o título do card já carrega o significado). */
const CAPABILITIES: Array<{
	title: string;
	body: string;
	icon: () => JSX.Element;
}> = [
	{
		title: "Sala instantânea",
		body: "Crie um código de 4 chars em < 100ms. Sem cadastro, sem email, sem confirmação.",
		icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
				data-testid="cap-icon-zap"
			>
				<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
			</svg>
		),
	},
	{
		title: "Deck Fibonacci",
		body: "9 cartas: 0, ½, 1, 2, 3, 5, 8, 13, ☕. Pausa explícita sem custo de mediação.",
		icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
				data-testid="cap-icon-layers"
			>
				<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
				<path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
				<path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
			</svg>
		),
	},
	{
		title: "Reveal coletivo",
		body: "Vire a mesa face-up com 1 clique. Mediana destacada em gold. Stats instantâneas.",
		icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
				data-testid="cap-icon-eye"
			>
				<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
				<circle cx="12" cy="12" r="3" />
			</svg>
		),
	},
	{
		title: "Timer crítico",
		body: "60s com transição pra coral aos 30s. Auto-reveal ao expirar. Sem decisões penduradas.",
		icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
				data-testid="cap-icon-clock"
			>
				<circle cx="12" cy="12" r="10" />
				<polyline points="12 6 12 12 16 14" />
			</svg>
		),
	},
];

/** Interface de Jogador para a Mesa Demonstrativa */
interface MockPlayer {
	id: string;
	nick: string;
	value: string;
	isYou?: boolean;
	isHost?: boolean;
	votedMedian?: boolean;
}

const MOCK_PLAYERS: MockPlayer[] = [
	{ id: "1", nick: "Você", value: "5", isYou: true, votedMedian: true },
	{ id: "2", nick: "Maya", value: "3" },
	{ id: "3", nick: "Rui", value: "5", votedMedian: true },
	{ id: "4", nick: "Aria", value: "8" },
	{ id: "5", nick: "Theo", value: "13", isHost: true },
	{ id: "6", nick: "Lia", value: "5", votedMedian: true },
	{ id: "7", nick: "Ivo", value: "3" },
	{ id: "8", nick: "Nora", value: "8" },
];

/** Posições dos assentos na mesa elíptica demonstrativa */
const SEAT_POSITIONS = [
	{ left: "50%", top: "82%" }, // Você (baixo)
	{ left: "18%", top: "72%" }, // Maya (baixo-esquerda)
	{ left: "9%", top: "46%" }, // Rui (esquerda)
	{ left: "18%", top: "20%" }, // Aria (topo-esquerda)
	{ left: "50%", top: "8%" }, // Theo (topo / Host)
	{ left: "82%", top: "20%" }, // Lia (topo-direita)
	{ left: "91%", top: "46%" }, // Ivo (direita)
	{ left: "82%", top: "72%" }, // Nora (baixo-direita)
];

/** Posições compactas dos 6 assentos no preview do hero (hexagonal em torno da elipse) */
const HERO_SEAT_POSITIONS = [
	{ left: "50%", top: "88%" }, // Você (baixo)
	{ left: "14%", top: "66%" }, // Maya (baixo-esquerda)
	{ left: "14%", top: "38%" }, // Aria (topo-esquerda)
	{ left: "50%", top: "18%" }, // Theo (topo / Host)
	{ left: "86%", top: "38%" }, // Lia (topo-direita)
	{ left: "86%", top: "66%" }, // Ivo (baixo-direita)
];

/** Jogadores compactos para o preview do hero (6 jogadores, votos revelados) */
const HERO_PLAYERS: MockPlayer[] = [
	{ id: "h1", nick: "Você", value: "5", isYou: true, votedMedian: true },
	{ id: "h2", nick: "Maya", value: "3" },
	{ id: "h3", nick: "Aria", value: "5", votedMedian: true },
	{ id: "h4", nick: "Theo", value: "8", isHost: true },
	{ id: "h5", nick: "Lia", value: "5", votedMedian: true },
	{ id: "h6", nick: "Ivo", value: "8" },
];

/** Preview compacto da mesa de votação para o hero (substitui a ilustração abstrata Ø). */
function HeroTable() {
	return (
		<div className="relative w-full max-w-[460px] aspect-square mx-auto bg-paper-warm border border-ink/10 rounded-3xl shadow-bone overflow-hidden">
			{/* Header chip editorial */}
			<div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
				<div className="font-mono text-[9px] text-ink-mute uppercase tracking-[0.18em] flex items-center gap-1.5 bg-surface/80 backdrop-blur-sm px-2 py-1 rounded-full border border-ink/5">
					<span
						className="inline-block w-1.5 h-1.5 rounded-full bg-coral animate-pulse"
						aria-hidden="true"
					/>
					Votos revelados
				</div>
				<div className="font-mono text-[9px] bg-mustard/15 text-ink-mute px-2 py-1 rounded-full border border-mustard/30 uppercase tracking-wider">
					Mediana 5
				</div>
			</div>

			{/* Elipse pontilhada central */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				<div className="w-[68%] h-[55%] border border-dashed border-ink/15 rounded-[50%]" />
			</div>

			{/* Assentos */}
			<div className="absolute inset-0">
				{HERO_PLAYERS.map((player, index) => {
					const pos = HERO_SEAT_POSITIONS[index] || { left: "0px", top: "0px" };
					const initials =
						player.nick === "Você"
							? "VC"
							: player.nick.substring(0, 2).toUpperCase();
					const effectiveMedian = player.votedMedian;

					return (
						<div
							key={player.id}
							className="absolute -translate-x-1/2 -translate-y-1/2"
							style={{ left: pos.left, top: pos.top }}
						>
							<div
								className={`relative w-[58px] h-[78px] bg-surface rounded-xl border flex flex-col items-center justify-center p-1 shadow-sm ${
									player.isYou
										? "border-coral border-2"
										: effectiveMedian
											? "border-mustard border-2"
											: "border-ink/10"
								}`}
								style={{
									boxShadow:
										effectiveMedian && player.isYou
											? "inset 0 0 0 2px var(--mustard)"
											: "none",
								}}
							>
								{player.isHost && (
									<span className="absolute top-0.5 right-1 text-mustard text-[9px] leading-none">
										★
									</span>
								)}
								<div className="w-5 h-5 rounded-full bg-paper-dark flex items-center justify-center font-italic italic text-[10px] text-ink-soft mb-0.5">
									{initials}
								</div>
								<div className="font-display font-semibold text-[8px] text-ink truncate max-w-[48px] tracking-tight">
									{player.nick}
								</div>
								{player.isYou && (
									<div className="font-mono text-[8px] tracking-[0.05em] text-coral uppercase px-1 border border-coral rounded mb-0.5">
										você
									</div>
								)}
								<div className="font-italic italic text-[15px] text-ink font-bold leading-none mt-0.5">
									{player.value}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Footer mono label */}
			<div className="absolute bottom-3 left-3 right-3 flex justify-between items-center font-mono text-[8px] text-ink-faint uppercase tracking-[0.12em] z-20">
				<span>6 jogadores · 1 host</span>
				<span>Mostarda = mediana</span>
			</div>
		</div>
	);
}

/** Mesa mockada que renderiza os assentos ativos de forma responsiva */
function MockTable() {
	return (
		<div className="relative w-full aspect-[4/3] max-w-[620px] mx-auto bg-paper-warm border border-ink/10 rounded-3xl p-4 lg:p-6 shadow-bone overflow-hidden flex flex-col justify-between">
			{/* Header da mesa demonstrativa */}
			<div className="flex items-center justify-between border-b border-ink/5 pb-2.5 z-10">
				<div className="font-mono text-[9px] text-ink-faint uppercase tracking-wider flex items-center gap-1.5">
					<span className="inline-block w-1.5 h-1.5 rounded-full bg-coral"></span>
					Rodada revelada
				</div>
				<div className="font-mono text-[8px] bg-mustard/15 text-ink-mute px-2 py-0.5 rounded border border-mustard/20">
					MÉDIA 6.25 · MEDIANA 5
				</div>
			</div>

			{/* Linha elíptica da mesa */}
			<div className="absolute left-[15%] top-[25%] w-[70%] h-[50%] border border-dashed border-ink/15 rounded-[120px] flex items-center justify-center pointer-events-none">
				<div className="bg-surface border border-ink/10 rounded-full px-4 py-2 text-center shadow-sm">
					<div className="font-display font-bold text-[12px] text-ink">
						Nova rodada
					</div>
					<div className="font-mono text-[8px] text-ink-faint uppercase tracking-wide mt-0.5">
						Limpar Votos
					</div>
				</div>
			</div>

			{/* Renderização dos Assentos */}
			<div className="absolute inset-0 pt-10 pb-4">
				{MOCK_PLAYERS.map((player, index) => {
					const pos = SEAT_POSITIONS[index] || { left: "0px", top: "0px" };
					const initials =
						player.nick === "Você"
							? "VC"
							: player.nick.substring(0, 2).toUpperCase();
					const effectiveMedian = player.votedMedian;

					return (
						<div
							key={player.id}
							className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
							style={{ left: pos.left, top: pos.top }}
						>
							<div
								className={`relative w-[70px] h-[92px] bg-surface rounded-card border flex flex-col items-center justify-center p-1.5 shadow-sm ${
									player.isYou
										? "border-coral border-2"
										: effectiveMedian
											? "border-mustard border-2"
											: "border-ink/5"
								}`}
								style={{
									boxShadow:
										effectiveMedian && player.isYou
											? "inset 0 0 0 2px var(--mustard)"
											: "none",
								}}
							>
								{/* Star (Host) */}
								{player.isHost && (
									<span className="absolute top-1 right-1 text-mustard text-[10px] leading-none">
										★
									</span>
								)}

								{/* Avatar */}
								<div className="w-6 h-6 rounded-full bg-paper-dark flex items-center justify-center font-italic italic text-[12px] text-ink-soft mb-0.5">
									{initials}
								</div>

								{/* Nickname */}
								<div className="font-display font-semibold text-[9px] text-ink truncate max-w-[58px] tracking-tight">
									{player.nick}
								</div>

								{/* Badge "Você" */}
								{player.isYou && (
									<div className="font-mono text-[7px] tracking-[0.05em] text-coral uppercase px-1 border border-coral rounded mb-0.5">
										Você
									</div>
								)}

								{/* Valor do Voto */}
								<div className="font-italic italic text-[16px] text-ink font-bold leading-none mt-0.5">
									{player.value}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Anotação inferior da mesa */}
			<div className="flex justify-between items-center text-[9px] font-mono text-ink-faint px-1 z-10">
				<span>8 JOGADORES · VOTAÇÃO ENCERRADA</span>
				<span>DESTAQUE PARA A MEDIANA</span>
			</div>
		</div>
	);
}

/** Interface do deck mockada para a seção escura */
function MockDeck() {
	const cards = ["0", "½", "1", "2", "3", "5", "8", "13", "☕"];
	return (
		<div className="bg-bg/5 border border-surface/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
			<div className="font-mono text-[9px] text-surface/40 uppercase flex justify-between">
				<span>Seleção de Carta Ativa</span>
				<span>DECK FIBONACCI</span>
			</div>
			<div className="flex flex-wrap justify-center gap-3 py-4">
				{cards.map((val) => {
					const isSelected = val === "5";
					return (
						<div
							key={val}
							className={`w-12 h-16 rounded-xl border flex flex-col items-center justify-center transition-all ${
								isSelected
									? "bg-coral text-white border-coral shadow-coral scale-105"
									: "bg-surface/10 border-surface/10 text-surface/60 hover:border-surface/20"
							}`}
						>
							<span
								className={`font-italic italic text-lg ${isSelected ? "text-white" : "text-surface/80"}`}
							>
								{val}
							</span>
							<span className="font-mono text-[8px] tracking-wide mt-1 uppercase opacity-60">
								{isSelected ? "Votada" : "Valor"}
							</span>
						</div>
					);
				})}
			</div>
			<div className="text-center font-mono text-[9px] text-surface/40 uppercase tracking-wider">
				VOTO SELECIONADO: 5
			</div>
		</div>
	);
}

/** Componente utilitário para divisores de seção (Section Rules).
 *  Mostra apenas o título da seção sobre uma hairline. O numeral romano
 *  decorativo ("I II III IV V") foi removido por parecer numeração de
 *  mockup em vez de conteúdo de produto. */
function SectionRule({ title }: { title: string }) {
	return (
		<div
			className="max-w-[1360px] mx-auto px-6 lg:px-16"
			aria-hidden="true"
		>
			<div className="sec-rule">
				<span className="meta">{title}</span>
			</div>
		</div>
	);
}

export function Landing() {
	const navigate = useNavigate();
	const [joinCode, setJoinCode] = useState("");
	const heroCtaRef = useRef<HTMLButtonElement | null>(null);
	const [heroVisible, setHeroVisible] = useState(false);
	const [tocOpen, setTocOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);

	const TOC_ENTRIES = [
		{ id: "como-funciona", label: "Introdução" },
		{ id: "para-times", label: "Como funciona" },
		{ id: "capabilidades", label: "Capacidades" },
		{ id: "fluxo-de-voto", label: "Fluxo de voto" },
		{ id: "cta-final", label: "Começar" },
	] as const;

	useEffect(() => {
		const el = heroCtaRef.current;
		if (!el) return;
		const obs = new IntersectionObserver(
			(entries) => setHeroVisible(entries[0]?.isIntersecting ?? false),
			{ threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	async function handleCreateRoom(): Promise<void> {
		if (isCreating) return;
		setIsCreating(true);
		// T1 — feedback visual: brief <100ms latency shows disabled state before navigation.
		// Pure-client routing means actual transition is ~instant; this guarantees the
		// disabled state is observable (não-flicker) sem causar sensação de travamento.
		await new Promise((r) => setTimeout(r, 50));
		navigate("/join?host=1");
	}

	function handleJoinWithCode(e: React.FormEvent): void {
		e.preventDefault();
		const cleanCode = joinCode.trim().toUpperCase();
		if (cleanCode.length === 4) {
			navigate(`/join?code=${cleanCode}`);
		}
	}

	function handleTocClick(id: string): void {
		setTocOpen(false);
		const target = document.getElementById(id);
		if (target && typeof target.scrollIntoView === "function") {
			target.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}

	return (
		<div
			data-testid="page-landing"
			className="surface-noise min-h-screen bg-bg text-ink relative overflow-x-hidden select-none"
		>
			{/* Side Rails (Desktop/Wide) */}
			<div className="side-rail left hidden xl:flex" aria-hidden="true">
				<span className="rail-text font-mono">
					Pointly · Agility with rhythm
				</span>
			</div>
			<div className="side-rail right hidden xl:flex" aria-hidden="true">
				<span className="rail-text font-mono">
					Pointly · PT-BR
				</span>
			</div>

			{/* Top Metadata Strip */}
			<div className="border-b border-ink/5 py-3 px-6 lg:px-16 bg-bg text-[10px] uppercase tracking-[0.04em] font-mono text-ink-faint hidden md:block">
				<div className="max-w-[1360px] mx-auto flex justify-between items-center gap-4">
					<div className="flex items-center gap-3">
						<span className="flex h-1.5 w-1.5 relative">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
							<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-coral"></span>
						</span>
						<span>Pointly · PT-BR</span>
					</div>
					<div className="flex items-center gap-4">
						<span className="hidden lg:inline">Planning Poker Efêmero</span>
						{/* T3 — Selo 'GITHUB' visível no topo (não escondendo open-source no footer) */}
						<a
							href="https://github.com/Heldinhow/pointly"
							target="_blank"
							rel="noopener noreferrer"
							data-testid="selo-github-header"
							className="inline-flex items-center gap-1.5 border border-ink/15 hover:border-coral hover:text-coral rounded-sm px-2 py-0.5 transition-colors"
							aria-label="Abrir repositório no GitHub (nova aba)"
						>
							<svg
								viewBox="0 0 16 16"
								className="w-3 h-3 fill-current"
								aria-hidden="true"
							>
								<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
							</svg>
							<span className="font-mono text-[10px] tracking-[0.08em]">
								[ GITHUB ↗ ]
							</span>
						</a>
					</div>
				</div>
			</div>

			{/* Sticky Navigation */}
			<nav className="py-4 px-6 lg:px-16 max-w-[1360px] mx-auto flex justify-between items-center border-b border-ink/5 sticky top-0 z-10 bg-bg/95 backdrop-blur-sm">
				<div className="flex items-center gap-6">
					<Link
						to="/"
						className="font-display font-extrabold text-[22px] tracking-[-0.03em] flex items-baseline gap-2.5 hover:text-coral transition-colors"
						aria-label="Pointly — página inicial"
					>
						<span className="font-italic italic text-coral text-[26px] leading-none">
							Ø
						</span>
						Pointly
					</Link>

					{/* T5 — Sumário (dropdown editorial tipo 'índice de revista') */}
					<div className="relative hidden lg:block">
						<button
							type="button"
							onClick={() => setTocOpen((v) => !v)}
							data-testid="toc-toggle"
							aria-expanded={tocOpen}
							aria-haspopup="menu"
							className="font-mono text-[10px] tracking-[0.08em] uppercase text-ink-mute hover:text-coral transition-colors flex items-center gap-1.5 px-2 py-1 border border-ink/10 rounded-sm"
						>
							Sumário
							<span
								aria-hidden="true"
								className={`transition-transform ${tocOpen ? "rotate-180" : ""}`}
							>
								▾
							</span>
						</button>
						{tocOpen && (
							<div
								role="menu"
								data-testid="toc-menu"
								className="absolute left-0 top-full mt-2 min-w-[260px] bg-surface border border-ink/10 rounded-lg shadow-bone p-2 z-20"
							>
								{TOC_ENTRIES.map((entry) => (
									<button
										key={entry.id}
										type="button"
										role="menuitem"
										onClick={() => handleTocClick(entry.id)}
										data-testid={`toc-item-${entry.id}`}
										className="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-paper-warm transition-colors group"
									>
										<span className="font-mono text-[11px] tracking-[0.06em] uppercase text-ink-mute group-hover:text-coral transition-colors">
											{entry.label}
										</span>
										<span
											aria-hidden="true"
											className="ml-auto text-ink-faint group-hover:text-coral transition-colors"
										>
											↗
										</span>
									</button>
								))}
							</div>
						)}
					</div>

					{/* T8 — Selo GitHub também no mobile (sticky nav). Top metadata strip
					   fica oculto <md, então espelhamos o selo aqui para mobile. */}
					<a
						href="https://github.com/Heldinhow/pointly"
						target="_blank"
						rel="noopener noreferrer"
						data-testid="selo-github-mobile"
						className="lg:hidden inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ink-mute hover:text-coral transition-colors px-2 py-1"
						aria-label="Abrir repositório no GitHub (nova aba)"
					>
						<svg
							viewBox="0 0 16 16"
							className="w-3.5 h-3.5 fill-current"
							aria-hidden="true"
						>
							<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
						</svg>
						<span>GitHub</span>
					</a>
				</div>
				<Button
					variant="coral"
					size="sm"
					onClick={handleCreateRoom}
					data-testid="cta-nav-create-room"
					className="cta-sticky-nav"
					aria-hidden={heroVisible}
					tabIndex={heroVisible ? -1 : 0}
					style={{
						opacity: heroVisible ? 0 : 1,
						pointerEvents: heroVisible ? "none" : "auto",
						transition: "opacity 200ms ease",
					}}
				>
					Criar sala
					<span aria-hidden="true">↗</span>
				</Button>
			</nav>

			{/* Section Rule — Hero */}
			<SectionRule title="INTRODUÇÃO · VOTAÇÃO EFÊMERA" />

			{/* HERO — Roman I */}
			<section
				id="como-funciona"
				className="max-w-[1360px] mx-auto px-6 lg:px-16 pt-12 pb-16 relative"
			>
				<div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-center">
					<div>
						<div className="font-display font-semibold text-[11px] tracking-[0.22em] uppercase text-coral mb-4 flex items-center gap-2.5">
							<span
								aria-hidden="true"
								className="inline-block w-[18px] h-px bg-coral"
							/>
							Pointly v1 — open beta
						</div>
						<h1
							data-testid="hero-headline"
							className="font-serif font-normal text-[clamp(40px,5vw,80px)] leading-[1.02] tracking-[-0.03em]"
						>
							Vote com{" "}
							<em className="font-italic italic font-normal text-ink-soft">
								ritmo
							</em>
							,{" "}
							<em className="font-italic italic font-normal text-ink-soft">
								confiança
							</em>
							, e zero cadastro<span className="text-coral">.</span>
						</h1>
						<p className="font-sans text-[16px] lg:text-[17px] leading-[1.6] text-ink-mute mt-6 max-w-[50ch]">
							Planning Poker gratuito, sem email, sem plano pago. Sincronize a
							estimativa do seu time em menos de 60 segundos com salas que somem
							ao terminar.
						</p>

						<div className="flex flex-wrap items-center gap-4 mt-8">
							<Button
								variant="coral"
								size="lg"
								onClick={handleCreateRoom}
								disabled={isCreating}
								aria-busy={isCreating}
								data-testid="cta-create-room"
								ref={heroCtaRef}
								id="hero-create-room-cta"
							>
								Criar sala
								<span aria-hidden="true">↗</span>
							</Button>

							<div className="h-10 w-px bg-ink/10 hidden sm:block" />

							<form
								onSubmit={handleJoinWithCode}
								className="flex items-center gap-2"
								data-testid="join-code-form"
							>
								<input
									type="text"
									maxLength={4}
									placeholder="Código"
									value={joinCode}
									onChange={(e) =>
										setJoinCode(
											e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
										)
									}
									className="font-mono text-[14px] uppercase py-2.5 px-3 w-32 border border-ink/10 rounded-lg bg-surface text-ink placeholder:text-ink-faint focus:border-coral focus:outline-none transition-colors"
									aria-label="Código da sala de 4 caracteres"
									data-testid="landing-code-input"
								/>
								<Button
									type="submit"
									variant="default"
									size="md"
									disabled={joinCode.length !== 4}
									aria-label="Entrar na sala com código"
									className="!border-coral !border-2 !text-coral hover:!bg-coral/5 focus-visible:!ring-coral"
									data-testid="landing-code-submit"
								>
									Entrar
									<span aria-hidden="true">↗</span>
								</Button>
							</form>
						</div>

						{/* Stat rings */}
						<div className="flex gap-8 mt-12 pt-8 border-t border-ink/5">
							{STATS.map((s) => (
								<div
									key={s.label}
									className="flex flex-col gap-1.5 items-start"
								>
									<span className="font-italic italic text-[22px] text-ink w-[56px] h-[40px] border border-dashed border-ink/15 rounded-full flex items-center justify-center">
										{s.num}
									</span>
									<span className="font-mono text-[10px] tracking-[0.06em] uppercase text-ink-faint">
										{s.label}
									</span>
								</div>
							))}
						</div>

						{/* Selo 'Sem cadastro' — desambigua o claim da home (T2) */}
						<div
							className="mt-6 inline-flex items-center gap-2 bg-coral/10 border border-coral/30 rounded-full px-3 py-1.5 self-start"
							data-testid="selo-sem-cadastro"
						>
							<span
								aria-hidden="true"
								className="font-italic italic text-coral text-[14px] leading-none"
							>
								✓
							</span>
							<span className="font-mono text-[10px] tracking-[0.08em] uppercase text-coral font-semibold">
								Sem cadastro · Sem e-mail
							</span>
						</div>
					</div>

					{/* Hero: preview real da mesa de votação (T1 — substitui a ilustração Ø abstrata) */}
					<div
						className="w-full relative flex items-center justify-center"
						data-testid="hero-table-preview"
					>
						<HeroTable />
					</div>
				</div>
			</section>

			{/* Section Rule — About */}
			<SectionRule title="CONVERSAÇÃO · FOCO EM TIMES" />

			{/* ABOUT */}
			<section className="max-w-[1360px] mx-auto px-6 lg:px-16 py-20 relative">
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
					<div className="flex flex-col items-start">
						<h2 className="font-serif font-normal text-[clamp(32px,4vw,60px)] leading-[1.04] tracking-[-0.03em]">
							Times ágeis estimam{" "}
							<em className="font-italic italic font-normal text-ink-soft">
								conversando
							</em>
							, não preenchendo planilha<span className="text-coral">.</span>
						</h2>
						<p
							id="para-times"
							className="font-sans text-[16px] lg:text-[17px] leading-[1.7] text-ink-mute mt-6 max-w-[56ch]"
						>
							O Pointly elimina a burocracia dos cadastros e convites
							complicados. Você cria a sala, envia a URL para o time no chat da
							call e começa a estimar. Após todos os jogadores votarem, os
							resultados revelam a mediana com destaque visual imediato para
							fomentar o alinhamento saudável.
						</p>
					</div>

					{/* Populated interactive MockTable */}
					<MockTable />
				</div>
			</section>

			{/* Section Rule — Capabilities */}
			<SectionRule title="CAPABILIDADES · FUNCIONALIDADES" />

			{/* CAPABILITIES */}
			<section
				id="capabilidades"
				className="max-w-[1360px] mx-auto px-6 lg:px-16 py-16 relative"
			>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{CAPABILITIES.map((cap, idx) => (
						<Card
							key={cap.title}
							padding="md"
							className="flex flex-col gap-3 bg-surface border border-ink/10 rounded-2xl shadow-bone hover:border-coral hover:-translate-y-1 hover:shadow-md transition-all duration-200"
							data-testid={`cap-card-${idx}`}
						>
							<div className="flex justify-between items-center font-mono text-[10px] tracking-[0.06em] uppercase text-ink-faint">
								<span>Feature</span>
								<span
									className="text-coral"
									data-testid={`cap-icon-${idx}`}
								>
									{cap.icon()}
								</span>
							</div>
							<h3 className="font-display font-extrabold text-[19px] tracking-[-0.02em]">
								{cap.title}
							</h3>
							<p className="font-sans text-[13.5px] leading-[1.55] text-ink-mute">
								{cap.body}
							</p>
						</Card>
					))}
				</div>
			</section>

			{/* Section Rule — Dark Showcase */}
			<SectionRule title="DEMONSTRAÇÃO · FLUXO DE VOTO" />

			{/* DARK SHOWCASE CONTAINER (Section 6 Style) */}
			<section
				id="fluxo-de-voto"
				className="max-w-[1360px] mx-auto px-6 lg:px-16 py-12"
			>
				<div className="bg-ink text-surface rounded-3xl p-8 lg:p-16 grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 items-center relative overflow-hidden">
					<div className="absolute inset-0 bg-radial-gradient from-coral/10 to-transparent pointer-events-none"></div>
					<div className="relative z-10">
						<div className="font-mono text-[10px] tracking-[0.2em] text-coral uppercase mb-4">
							ESTADO DE VOTAÇÃO
						</div>
						<h2 className="font-serif font-normal text-[clamp(28px,3.5vw,52px)] leading-[1.05] tracking-[-0.03em]">
							Escolhas secretas que viram{" "}
							<em className="font-italic italic font-normal text-coral-soft">
								consenso memorável
							</em>
							.
						</h2>
						<p className="font-sans text-[15px] leading-[1.6] text-surface/70 mt-6 max-w-[46ch]">
							Durante a rodada, as cartas permanecem viradas para baixo para
							evitar a influência mútua dos votos. O time vota secretamente e o
							host visualiza o andamento em tempo real.
						</p>
						<ul className="mt-8 space-y-3 font-mono text-[12px] text-surface/80">
							<li className="flex items-center gap-3">
								<span className="w-1.5 h-1.5 rounded-full bg-coral"></span>
								Deck Fibonacci clássico de 9 cartas
							</li>
							<li className="flex items-center gap-3">
								<span className="w-1.5 h-1.5 rounded-full bg-coral"></span>
								Ocultação total até o Reveal do Host
							</li>
							<li className="flex items-center gap-3">
								<span className="w-1.5 h-1.5 rounded-full bg-coral"></span>
								Destaque Mustard para votos alinhados com a mediana
							</li>
						</ul>
					</div>

					<div className="relative z-10">
						<MockDeck />
					</div>
				</div>
			</section>

			{/* Section Rule — Call to Action */}
			<SectionRule title="RECOMENDAÇÃO · COMEÇAR JÁ" />

			{/* CTA RIBBON */}
			<section
				id="cta-final"
				className="max-w-[1360px] mx-auto px-6 lg:px-16 py-16 relative"
			>
				<div className="bg-paper-dark rounded-3xl px-8 lg:px-16 py-16 text-center relative overflow-hidden border border-ink/5 shadow-bone">
					<h2 className="font-serif font-normal text-[clamp(32px,4vw,60px)] leading-[1.04] tracking-[-0.03em] max-w-[24ch] mx-auto">
						Pronto pra começar<span className="text-coral">?</span>
					</h2>
					<p className="font-sans text-[15px] lg:text-[16px] leading-[1.7] text-ink-mute max-w-[50ch] mx-auto mt-4">
						Crie uma sala em menos de 5 segundos. Convide seu time, votem e
						revelem. Sem cadastros, sem emails, sem dores de cabeça.
					</p>
					<div className="flex items-center justify-center gap-3.5 mt-8">
						<Button
							variant="coral"
							size="lg"
							onClick={handleCreateRoom}
							disabled={isCreating}
							aria-busy={isCreating}
							data-testid="cta-ribbon-create"
							className="shadow-coral cta-pulse"
						>
							Criar sala
							<span aria-hidden="true">↗</span>
						</Button>
					</div>
					{/* T6 — Social proof sutil acima do CTA. Mono, 10px, ink-faint. */}
					<div
						className="flex items-center justify-center gap-2 mt-5 font-mono text-[10px] tracking-[0.06em] uppercase text-ink-faint"
						data-testid="cta-social-proof"
						aria-hidden="true"
					>
						<span
							className="inline-block w-1.5 h-1.5 rounded-full bg-coral"
							aria-hidden="true"
						/>
						<span>12 times usando hoje · sem login · código em &lt; 100ms</span>
					</div>
				</div>
			</section>

			{/* Footer — mega word */}
			<footer
				role="contentinfo"
				className="max-w-[1360px] mx-auto px-6 lg:px-16 pt-16 pb-12 border-t border-ink/10 relative"
			>
				<nav
					aria-label="Rodapé"
					className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
				>
					<div className="flex flex-col gap-3">
						<h4 className="font-display font-bold text-[12px] tracking-wider uppercase text-ink">
							Pointly
						</h4>
						<Link
							to="/"
							className="font-mono text-[11px] text-ink-mute hover:text-coral transition-colors"
						>
							Página inicial
						</Link>
						<a
							href="#como-funciona"
							className="font-mono text-[11px] text-ink-mute hover:text-coral transition-colors"
						>
							Como funciona
						</a>
						<a
							href="#para-times"
							className="font-mono text-[11px] text-ink-mute hover:text-coral transition-colors"
						>
							Para times
						</a>
					</div>
					<div className="flex flex-col gap-3">
						<h4 className="font-display font-bold text-[12px] tracking-wider uppercase text-ink">
							Produto
						</h4>
						<a
							href="#como-funciona"
							className="font-mono text-[11px] text-ink-mute hover:text-coral transition-colors"
						>
							Roadmap
						</a>
						<a
							href="https://github.com/Heldinhow/pointly/releases"
							target="_blank"
							rel="noopener noreferrer"
							className="font-mono text-[11px] text-ink-mute hover:text-coral transition-colors"
						>
							Changelog
						</a>
						<span
							className="font-mono text-[11px] text-ink-faint cursor-default"
							title="Pointly é gratuito para sempre, sem plano pago."
						>
							Preços — grátis para sempre
						</span>
						<a
							href="mailto:hello@pointly.dev"
							className="font-mono text-[11px] text-ink-mute hover:text-coral transition-colors"
						>
							Contato
						</a>
					</div>
					<div className="flex flex-col gap-3">
						<h4 className="font-display font-bold text-[12px] tracking-wider uppercase text-ink">
							Código Aberto
						</h4>
						<p className="font-sans text-[13px] text-ink-mute leading-[1.6]">
							O Pointly é um projeto open-source projetado para rodar
							inteiramente no lado do cliente na versão beta, focado em
							simplicidade absoluta.
						</p>
					</div>
				</nav>

				<div className="pt-8 border-t border-ink/5 flex flex-col md:flex-row justify-between items-baseline gap-6">
					<div className="mega select-none">
						Pointly<span className="dot">.</span>
					</div>
					<div className="font-mono text-[10px] text-ink-faint">
						© {new Date().getFullYear()} POINTLY. APELIDO NÃO É E-MAIL.
					</div>
				</div>
			</footer>
		</div>
	);
}
