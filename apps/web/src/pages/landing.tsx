/**
 * Landing page — T27 (Phase 6) + Design System Refinements.
 *
 * Página inicial do Pointly com o Design System Atelier Zero completo:
 *  - Metadata strip com pulse dot coral + Vol/Issue/PT-BR no topo
 *  - Side rails 36px (left/right) com rail text vertical (ocultos em telas menores)
 *  - Section rules com numerais romanos (I, II, III, IV, V) separando as seções
 *  - Títulos híbridos misturando Sans Bold + Serif Italic (Playfair Display)
 *  - Mesa de votação mockada interativa (MockTable) com 8 assentos ativos e revelados
 *  - Seção Dark contrastante (Roman IV) com uma prévia do Deck Fibonacci (MockDeck)
 *  - Mega footer com a marca monumental "Pointly."
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

/** Stat rings — números reais. */
const STATS = [
	{ num: "0", label: "Contas" },
	{ num: "12", label: "Assentos" },
	{ num: "60", label: "Seg. para decidir" },
];

/** Capabilities — 4 features. */
const CAPABILITIES = [
	{
		n: "01",
		title: "Sala instantânea",
		body: "Crie um código de 4 letras em menos de 100 ms. Sem cadastro, sem e-mail, sem confirmação.",
	},
	{
		n: "02",
		title: "Deck Fibonacci",
		body: "9 cartas: 0, ½, 1, 2, 3, 5, 8, 13, ☕. A pausa explícita vale como voto — sem custo de coordenação.",
	},
	{
		n: "03",
		title: "Revelar coletivo",
		body: "Vire a mesa com 1 clique. A mediana fica em destaque dourado. Estatísticas instantâneas.",
	},
	{
		n: "04",
		title: "Timer crítico",
		body: "60 s com mudança de cor aos 30 s. Revela sozinho ao expirar. Sem decisões penduradas.",
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
	{ left: "50%", top: "82%" },   // Você (baixo)
	{ left: "18%", top: "72%" },   // Maya (baixo-esquerda)
	{ left: "9%", top: "46%" },    // Rui (esquerda)
	{ left: "18%", top: "20%" },   // Aria (topo-esquerda)
	{ left: "50%", top: "8%" },    // Theo (topo / Host)
	{ left: "82%", top: "20%" },   // Lia (topo-direita)
	{ left: "91%", top: "46%" },   // Ivo (direita)
	{ left: "82%", top: "72%" },   // Nora (baixo-direita)
];

/** Mesa mockada que renderiza os assentos ativos de forma responsiva */
const MockTable = memo(function MockTable() {
	return (
		<div
			className="relative w-full aspect-[4/3] max-w-[620px] mx-auto bg-paper-warm border border-ink/10 rounded-3xl p-4 lg:p-6 shadow-bone overflow-hidden flex flex-col justify-between"
			aria-label="Mesa demonstrativa com 8 jogadores e votos revelados"
			role="img"
		>
			{/* Header da mesa demonstrativa */}
			<div className="flex items-center justify-between border-b border-ink/5 pb-2.5 z-10">
				<div className="font-mono text-[9px] text-ink-faint uppercase tracking-wider flex items-center gap-1.5">
					<span className="inline-block w-1.5 h-1.5 rounded-full bg-coral"></span>
					FIG. 02 · Mesa com Votos Revelados
				</div>
				<div className="font-mono text-[8px] bg-mustard/25 text-ink px-2 py-0.5 rounded border border-mustard/40">
					MÉDIA 6.25 · MEDIANA 5
				</div>
			</div>

			{/* Linha elíptica da mesa */}
			<div className="absolute left-[15%] top-[25%] w-[70%] h-[50%] border border-dashed border-ink/15 rounded-[120px] flex items-center justify-center pointer-events-none">
				<div className="bg-surface border border-ink/10 rounded-full px-4 py-2 text-center shadow-sm">
					<div className="font-display font-bold text-[12px] text-ink">Nova rodada</div>
					<div className="font-mono text-[8px] text-ink-faint uppercase tracking-wide mt-0.5">Limpar Votos</div>
				</div>
			</div>

			{/* Renderização dos Assentos */}
			<div className="absolute inset-0 pt-10 pb-4">
				{MOCK_PLAYERS.map((player, index) => {
					const pos = SEAT_POSITIONS[index] || { left: "0px", top: "0px" };
					const initials = player.nick === "Você" ? "VC" : player.nick.substring(0, 2).toUpperCase();
					const effectiveMedian = player.votedMedian;
					
					return (
						<div
							key={player.id}
							className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
							style={{ left: pos.left, top: pos.top }}
						>
							<div
								className={`relative w-[70px] h-[92px] bg-surface rounded-card border flex flex-col items-center justify-center p-1.5 shadow-sm ${
									player.isYou ? "border-coral border-2" : effectiveMedian ? "border-mustard border-2" : "border-ink/5"
								}`}
								style={{
									boxShadow: effectiveMedian && player.isYou ? "inset 0 0 0 2px var(--mustard)" : "none"
								}}
							>
								{/* Star (Host) */}
								{player.isHost && (
									<span className="absolute top-1 right-1 text-mustard text-[10px] leading-none">★</span>
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
				<span>MOCK DE 8 JOGADORES</span>
				<span>DESTAQUE GOLD PARA MEDIANA (5)</span>
			</div>
		</div>
	);
});

/** Interface do deck mockada para a seção escura */
const MockDeck = memo(function MockDeck() {
	const cards = ["0", "½", "1", "2", "3", "5", "8", "13", "☕"];
	return (
		<div
			className="bg-bg/5 border border-surface/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4"
			aria-label="Deck Fibonacci com a carta 5 selecionada"
			role="img"
		>
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
							<span className={`font-italic italic text-lg ${isSelected ? "text-white" : "text-surface/80"}`}>
								{val}
							</span>
							<span className="font-mono text-[6px] tracking-wide mt-1 uppercase opacity-60">
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
});

/** Componente utilitário para divisores de seção (Section Rules) */
function SectionRule({ roman, title, page }: { roman: string; title: string; page: string }) {
	return (
		<div className="max-w-[1360px] mx-auto px-6 lg:px-16" aria-hidden="true">
			<div className="sec-rule">
				<span className="roman">{roman}</span>
				<span className="meta">{title}</span>
				<span className="page">{page}</span>
			</div>
		</div>
	);
}

export function Landing() {
	const navigate = useNavigate();
	const [joinCode, setJoinCode] = useState("");
	const heroCtaRef = useRef<HTMLButtonElement | null>(null);
	const [heroVisible, setHeroVisible] = useState(false);

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

	const handleCreateRoom = useCallback((): void => {
		navigate("/join?host=1");
	}, [navigate]);

	const handleJoinWithCode = useCallback(
		(e: React.FormEvent): void => {
			e.preventDefault();
			const cleanCode = joinCode.trim().toUpperCase();
			if (cleanCode.length === 4) {
				navigate(`/join?code=${cleanCode}`);
			}
		},
		[joinCode, navigate],
	);

	const navCtaStyle = useMemo(
		() => ({
			opacity: heroVisible ? 0 : 1,
			pointerEvents: (heroVisible ? "none" : "auto") as const,
			transition: "opacity 200ms ease",
		}),
		[heroVisible],
	);

	return (
		<div
			data-testid="page-landing"
			className="surface-noise min-h-screen bg-bg text-ink relative overflow-x-hidden"
		>
			{/* Side Rails (Desktop/Wide) */}
			<div className="side-rail left hidden xl:flex">
				<span className="rail-text">Pointly · Agility with rhythm</span>
			</div>
			<div className="side-rail right hidden xl:flex">
				<span className="rail-text">Vol. 01 / Issue No. 26 · Open Beta</span>
			</div>

			{/* Top Metadata Strip */}
			<div className="border-b border-ink/5 py-3 px-6 lg:px-16 bg-bg text-[10px] uppercase tracking-[0.04em] font-mono text-ink-faint hidden md:block">
				<div className="max-w-[1360px] mx-auto flex justify-between items-center">
					<div className="flex items-center gap-3">
						<span className="flex h-1.5 w-1.5 relative">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
							<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-coral"></span>
						</span>
						<span>Vol. 01 · Issue Nº 26 · Pointly · PT-BR</span>
					</div>
					<div>Planning Poker Efêmero</div>
				</div>
			</div>

			{/* Sticky Navigation */}
			<nav className="py-4 px-6 lg:px-16 max-w-[1360px] mx-auto flex justify-between items-center border-b border-ink/5 sticky top-0 z-10 bg-bg/95 backdrop-blur-sm">
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
				<Button
					variant="coral"
					size="sm"
					onClick={handleCreateRoom}
					data-testid="cta-nav-create-room"
					className="cta-sticky-nav"
					aria-hidden={heroVisible}
					tabIndex={heroVisible ? -1 : 0}
					style={navCtaStyle}
				>
					Criar sala
					<span aria-hidden="true">↗</span>
				</Button>
			</nav>

			{/* Section Rule I - Hero */}
			<SectionRule roman="I." title="INTRODUÇÃO · VOTAÇÃO EFÊMERA" page="PAGE 001" />

			{/* HERO — Roman I */}
			<section
				id="como-funciona"
				className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-16 pt-8 sm:pt-12 pb-12 sm:pb-16 relative"
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
							className="font-display font-extrabold text-[clamp(40px,5vw,80px)] leading-[1.02] tracking-[-0.04em] text-balance"
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
							estimativa do seu time em menos de 60 segundos com salas que somem ao terminar.
						</p>

						<div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8">
							<Button
								variant="coral"
								size="lg"
								onClick={handleCreateRoom}
								data-testid="cta-create-room"
								ref={heroCtaRef}
								id="hero-create-room-cta"
							>
								Criar sala
								<span aria-hidden="true">↗</span>
							</Button>

							<div className="hidden sm:block h-10 w-px bg-ink/10" />

							<form
								onSubmit={handleJoinWithCode}
								className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto"
								data-testid="join-code-form"
							>
								<input
									type="text"
									maxLength={4}
									placeholder="XXXX"
									value={joinCode}
									onChange={(e) =>
										setJoinCode(
											e.target.value
												.toUpperCase()
												.replace(/[^A-Z0-9]/g, ""),
										)
									}
									className="font-mono text-[14px] uppercase py-2.5 px-3 w-32 border border-ink/10 rounded-lg bg-surface text-ink placeholder:text-ink-faint focus:border-coral focus:outline-none transition-colors"
									aria-label="Código da sala de 4 caracteres alfanuméricos"
									aria-describedby="landing-code-hint"
									data-testid="landing-code-input"
								/>
								<Button
									type="submit"
									variant="default"
									size="md"
									disabled={joinCode.length !== 4}
									data-testid="landing-code-submit"
								>
									Entrar
									<span aria-hidden="true">↗</span>
								</Button>
							</form>
							<span
								id="landing-code-hint"
								className="font-mono text-[10px] text-ink-faint uppercase tracking-wider block w-full sm:w-auto mt-0 sm:mt-0 sm:ml-2"
							>
								código de 4 letras
							</span>
						</div>

						{/* Stat rings */}
						<div className="flex gap-8 mt-12 pt-8 border-t border-ink/5">
							{STATS.map((s) => (
								<div
									key={s.label}
									className="flex flex-col gap-1.5 items-start"
								>
									<span className="font-italic italic text-[28px] text-ink w-[40px] h-[40px] border border-dashed border-ink/15 rounded-full flex items-center justify-center">
										{s.num}
									</span>
									<span className="font-mono text-[10px] tracking-[0.06em] uppercase text-ink-faint">
										{s.label}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Stylized Cards Illustration (Hero) */}
					<div className="w-full relative min-h-[420px] sm:min-h-[480px] bg-paper-warm border border-ink/5 rounded-3xl flex items-center justify-center overflow-hidden shadow-bone" aria-hidden="true">
						<div className="relative w-80 h-80 flex items-center justify-center">
							{/* Card 1: '3' */}
							<div className="hero-card-1 absolute w-36 h-52 bg-surface border border-ink/10 rounded-2xl shadow-lg flex items-center justify-center rotate-[-16deg] -translate-x-28 translate-y-3 z-0">
								<span className="font-italic italic text-[56px] text-ink select-none">
									3
								</span>
							</div>
							{/* Card 2: '☕' */}
							<div className="hero-card-2 absolute w-36 h-52 bg-surface border border-ink/10 rounded-2xl shadow-lg flex items-center justify-center rotate-[16deg] translate-x-28 translate-y-5 z-0">
								<div className="flex flex-col items-center justify-center select-none pt-4">
									<svg
										viewBox="0 0 100 100"
										className="w-20 h-20 text-ink relative overflow-visible"
										fill="none"
										stroke="currentColor"
										strokeWidth="3.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										{/* Linhas de vapor animadas */}
										<path
											d="M42,28 Q39,18 43,10 T41,-4"
											className="animate-steam-1 stroke-ink/40"
										/>
										<path
											d="M50,28 Q53,16 47,8 T51,-8"
											className="animate-steam-2 stroke-ink/40"
										/>
										<path
											d="M58,28 Q55,18 59,10 T57,-4"
											className="animate-steam-3 stroke-ink/40"
										/>

										{/* Corpo da Xícara */}
										<path
											d="M28,35 L72,35 L68,70 C67,76 61,82 54,82 L46,82 C39,82 33,76 32,70 Z"
											fill="currentColor"
											fillOpacity="0.05"
										/>
										{/* Alça */}
										<path d="M72,45 C78,45 82,50 81,56 C80,62 73,63 72,63" />
										{/* Prato */}
										<path d="M20,88 L80,88" strokeWidth="4" />
									</svg>
								</div>
							</div>
							{/* Card 3: '5' (Destaque Central) */}
							<div className="hero-card-3 absolute w-44 h-60 bg-surface border-2 border-coral rounded-2xl shadow-xl flex flex-col items-center justify-center z-10">
								<span className="font-italic italic text-[68px] leading-none text-coral select-none">
									5
								</span>
								<span className="font-mono text-[11px] tracking-[0.2em] uppercase text-coral/80 mt-2">
									Mediana
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Section Rule II - About */}
			<SectionRule roman="II." title="CONVERSAÇÃO · FOCO EM TIMES" page="PAGE 002" />

			{/* ABOUT */}
			<section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 relative">
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
					<div className="flex flex-col items-start">
						<h2 className="font-display font-extrabold text-[clamp(32px,4vw,60px)] leading-[1.04] tracking-[-0.035em] text-balance">
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
							O Pointly elimina a burocracia dos cadastros e convites complicados. Você cria a sala, envia a URL para o time no chat da call e começa a estimar. Após todos os jogadores votarem, os resultados revelam a mediana com destaque visual imediato para fomentar o alinhamento saudável.
						</p>
					</div>

					{/* Populated interactive MockTable */}
					<MockTable />
				</div>
			</section>

			{/* Section Rule III - Capabilities */}
			<SectionRule roman="III." title="CAPABILIDADES · FUNCIONALIDADES" page="PAGE 003" />

			{/* CAPABILITIES */}
			<section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-16 py-14 sm:py-20 relative">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
					{CAPABILITIES.map((cap, i) => (
						<Card
							key={cap.n}
							padding="md"
							className="group/cap relative flex flex-col gap-3 bg-surface border border-ink/10 rounded-2xl shadow-bone hover:border-coral hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(237,111,92,0.45)] transition-all duration-300 motion-safe:hover:[transform:translateY(-2px)_rotate(-0.4deg)]"
							data-testid={`cap-card-${cap.n}`}
						>
							<span
								aria-hidden="true"
								className="absolute top-3 right-3 font-italic italic text-coral/0 group-hover/cap:text-coral transition-all duration-500 group-hover/cap:translate-x-0 -translate-x-1 text-[14px] leading-none"
							>
								✦
							</span>
							<div className="flex justify-between items-baseline font-mono text-[10px] tracking-[0.06em] uppercase text-ink-faint">
								<span className="font-italic italic text-coral text-[18px] tracking-normal normal-case font-medium transition-transform duration-300 group-hover/cap:scale-110 origin-left">
									{cap.n}
								</span>
								<span className="relative after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:bg-coral after:scale-x-0 group-hover/cap:after:scale-x-100 after:origin-left after:transition-transform after:duration-300">
									Feature {String(i + 1).padStart(2, "0")}
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

			{/* Section Rule IV - Dark Showcase */}
			<SectionRule roman="IV." title="DEMONSTRAÇÃO · FLUXO DE VOTO" page="PAGE 004" />

			{/* DARK SHOWCASE CONTAINER (Section 6 Style) */}
			<section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-16 py-12 sm:py-16">
				<div className="bg-ink text-surface rounded-3xl p-8 lg:p-16 grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 items-center relative overflow-hidden">
					<div className="absolute inset-0 bg-radial-gradient from-coral/10 to-transparent pointer-events-none"></div>
					<div className="relative z-10">
						<div className="font-mono text-[10px] tracking-[0.2em] text-coral uppercase mb-4">
							ESTADO DE VOTAÇÃO
						</div>
						<h2 className="font-display font-extrabold text-[clamp(28px,3.5vw,52px)] leading-[1.05] tracking-[-0.03em] text-balance">
							Escolhas secretas que viram{" "}
							<em className="font-italic italic font-normal text-coral-soft">
								consenso memorável
							</em>
							.
						</h2>
						<p className="font-sans text-[15px] leading-[1.6] text-surface/70 mt-6 max-w-[46ch]">
							Durante a rodada, as cartas permanecem viradas para baixo para evitar a influência mútua dos votos. O time vota secretamente e o host visualiza o andamento em tempo real.
						</p>
						<ul className="mt-8 space-y-3 font-mono text-[12px] text-surface/80">
							<li className="flex items-center gap-3">
								<span className="w-1.5 h-1.5 rounded-full bg-coral"></span>
								Deck Fibonacci clássico de 9 cartas
							</li>
							<li className="flex items-center gap-3">
								<span className="w-1.5 h-1.5 rounded-full bg-coral"></span>
								Cartas viradas para baixo até alguém revelar
							</li>
							<li className="flex items-center gap-3">
								<span className="w-1.5 h-1.5 rounded-full bg-coral"></span>
								Destaque dourado para os votos que batem com a mediana
							</li>
						</ul>
					</div>

					<div className="relative z-10">
						<MockDeck />
					</div>
				</div>
			</section>

			{/* Section Rule V - Call to Action */}
			<SectionRule roman="V." title="RECOMENDAÇÃO · COMEÇAR JÁ" page="PAGE 005" />

			{/* CTA RIBBON */}
			<section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-16 py-14 sm:py-20 relative">
				<div className="bg-paper-dark rounded-3xl px-6 sm:px-10 lg:px-16 py-14 sm:py-20 text-center relative overflow-hidden border border-ink/5 shadow-bone">
					<h2 className="font-display font-extrabold text-[clamp(32px,4vw,60px)] leading-[1.04] tracking-[-0.035em] max-w-[24ch] mx-auto text-balance">
						Pronto pra começar<span className="text-coral">?</span>
					</h2>
					<p className="font-sans text-[15px] lg:text-[16px] leading-[1.7] text-ink-mute max-w-[50ch] mx-auto mt-4">
						Crie uma sala em menos de 5 segundos. Convide seu time, votem e revelem. Sem cadastros, sem emails, sem dores de cabeça.
					</p>
					<div className="flex items-center justify-center gap-3.5 mt-8">
						<Button
							variant="coral"
							size="lg"
							onClick={handleCreateRoom}
							data-testid="cta-ribbon-create"
							className="shadow-coral"
						>
							Criar sala
							<span aria-hidden="true">↗</span>
						</Button>
					</div>
				</div>
			</section>

			{/* Footer — mega word */}
			<footer className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-16 pt-12 sm:pt-16 pb-8 sm:pb-12 border-t border-ink/10 relative">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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
							O Pointly é um projeto open-source projetado para rodar inteiramente no lado do cliente na versão beta, focado em simplicidade absoluta.
						</p>
					</div>
				</div>

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
