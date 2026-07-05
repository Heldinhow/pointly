/**
 * Landing page — T27 (Phase 6).
 *
 * Página inicial do Pointly. Editorial fork (landing-only):
 *  - Metadata strip com pulse dot coral + Vol/Issue/PT-BR
 *  - Side rails 36px (left/right) com rail text vertical
 *  - Sticky nav com brandmark `Ø Pointly` + nav items + CTA coral
 *  - Hero (Roman I): headline misturando sans-bold + italic-serif com
 *    coral dot final · lead · CTA primário `Criar sala` + ghost
 *    `Entrar com código` · 3 stat rings · index card 01-04 lateral
 *  - About (Roman II): filed under + parágrafo declarativo
 *  - Capabilities (Roman III): 4 bone-fill cards numerados Playfair Italic
 *  - Method (Roman IV): 4 steps com thumbnails placeholder
 *  - CTA ribbon (Roman V): paper-dark + email pill ghost
 *  - Mega footer: `Pointly.` em Playfair Italic clamp(70px,13vw,200px)
 *
 * **CTAs coral ≤1 por viewport**: apenas o `Criar sala` no hero.
 * Outros CTAs (ghost-pill) não usam coral.
 *
 * **A11y**: h1 hierárquico, h2/h3 com text-content semântico, CTAs
 * focáveis com focus-visible ring coral, aria-label no nav.
 *
 * **Referência**: `design/landing.html` (wireframe legado) e
 * `plan.md` seção 6.2.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T27
 * @see .specs/features/planning-poker-v1/spec.md F-031 (F-ID US-5)
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

/** Stat rings — números reais (vide plan.md 6.2). */
const STATS = [
	{ num: "0", label: "Cadastros" },
	{ num: "12", label: "Assentos" },
	{ num: "60", label: "Seg. p/ decidir" },
];

/** Capabilities — 4 features numeradas. */
const CAPABILITIES = [
	{
		n: "01",
		title: "Sala instantânea",
		body: "Crie um código de 4 chars em < 100ms. Sem cadastro, sem email, sem confirmação.",
	},
	{
		n: "02",
		title: "Deck Fibonacci",
		body: "9 cartas: 0, ½, 1, 2, 3, 5, 8, 13, ☕. Pause explícita sem custo de mediação.",
	},
	{
		n: "03",
		title: "Reveal coletivo",
		body: "Vire a mesa face-up com 1 clique. Mediana destacada em gold. Stats instantâneas.",
	},
	{
		n: "04",
		title: "Timer crítico",
		body: "60s com transição pra coral aos 30s. Auto-reveal ao expirar. Sem decisões penduradas.",
	},
];

export function Landing() {
	const navigate = useNavigate();
	const [joinCode, setJoinCode] = useState("");
	// BUG-103 / ADR-004: hide-on-scroll do CTA coral do sticky-nav quando o
	// CTA coral do hero entra no viewport. Em ≤767px o CTA sticky é excluído
	// via CSS (hero domina). IntersectionObserver monitora o hero CTA.
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

	function handleCreateRoom(): void {
		// Server gera code no `hello` (vide ADR-0009). Navega sem code,
		// server cria sala e atribui role='host'.
		navigate("/join?host=1");
	}

	function handleJoinWithCode(e: React.FormEvent): void {
		e.preventDefault();
		const cleanCode = joinCode.trim().toUpperCase();
		if (cleanCode.length === 4) {
			navigate(`/join?code=${cleanCode}`);
		}
	}

	return (
		<div
			data-testid="page-landing"
			className="surface-noise min-h-screen bg-bg text-ink"
		>
			{/* Sticky nav */}
			<nav className="py-4 px-16 max-w-[1360px] mx-auto flex justify-between items-center border-b border-ink/5 sticky top-0 z-10 bg-bg/95 backdrop-blur-sm">
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

			{/* HERO — Roman I */}
			<section
				id="como-funciona"
				className="max-w-[1360px] mx-auto px-16 pt-16 pb-12 relative"
			>
				<div className="grid grid-cols-[0.78fr_1.22fr] gap-16 items-start pt-12">
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
							className="font-display font-extrabold text-[clamp(48px,5.6vw,90px)] leading-[1.02] tracking-[-0.04em] max-w-[18ch]"
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
						<p className="font-sans text-[17px] leading-[1.6] text-ink-mute mt-6 max-w-[52ch]">
							Planning Poker gratuito, sem email, sem plano pago. Sincronize a
							estimativa do seu time em menos de 60 segundos.
						</p>

						<div className="flex flex-wrap items-center gap-4 mt-9">
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
											e.target.value
												.toUpperCase()
												.replace(/[^A-Z0-9]/g, ""),
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
									data-testid="landing-code-submit"
								>
									Entrar
									<span aria-hidden="true">↗</span>
								</Button>
							</form>
						</div>

						{/* Stat rings */}
						<div className="flex gap-9 mt-12 pt-8 border-t border-ink/5">
							{STATS.map((s) => (
								<div
									key={s.label}
									className="flex flex-col gap-1.5 items-start"
								>
									<span className="font-italic italic text-[32px] text-ink w-[34px] h-[34px] border border-dashed border-ink/15 rounded-full flex items-center justify-center">
										{s.num}
									</span>
									<span className="font-mono text-[10px] tracking-[0.06em] uppercase text-ink-faint">
										{s.label}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Stylized Cards Illustration */}
					<div className="relative min-h-[520px] bg-paper-warm border border-ink/5 rounded-2xl flex items-center justify-center overflow-hidden">
						<div className="relative w-80 h-80 flex items-center justify-center">
							{/* Card 1: '3' */}
							<div className="absolute w-36 h-52 bg-surface border border-ink/10 rounded-2xl shadow-lg flex items-center justify-center rotate-[-16deg] -translate-x-32 translate-y-3 transition-all duration-300 hover:rotate-[-6deg] hover:-translate-y-6 hover:-translate-x-34 hover:scale-105 hover:z-20 z-0">
								<span className="font-italic italic text-[56px] text-ink select-none">
									3
								</span>
							</div>
							{/* Card 2: '☕' */}
							<div className="absolute w-36 h-52 bg-surface border border-ink/10 rounded-2xl shadow-lg flex items-center justify-center rotate-[16deg] translate-x-32 translate-y-5 transition-all duration-300 hover:rotate-[6deg] hover:-translate-y-6 hover:translate-x-34 hover:scale-105 hover:z-20 z-0">
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
							<div className="absolute w-44 h-60 bg-surface border-2 border-coral rounded-2xl shadow-xl flex flex-col items-center justify-center transition-all duration-300 z-10 hover:-translate-y-6 hover:scale-105 hover:z-20">
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

			{/* ABOUT */}
			<section className="max-w-[1360px] mx-auto px-16 py-24 relative border-t border-ink/5">
				<div className="max-w-[800px] mx-auto text-center flex flex-col items-center">
					<h2 className="font-display font-extrabold text-[clamp(38px,4.2vw,66px)] leading-[1.04] tracking-[-0.035em]">
						Times ágeis estimam{" "}
						<em className="font-italic italic font-normal text-ink-soft">
							conversando
						</em>
						, não preenchendo planilha.
					</h2>
					<p
						id="para-times"
						className="font-sans text-[17px] leading-[1.7] text-ink-mute mt-7 max-w-[60ch]"
					>
						O Pointly é um protótipo gratuito de Planning Poker pra times que
						querem estimar trabalho em calls de planning sem fricção. Zero
						cadastro, zero email, zero plano pago.
					</p>
				</div>
			</section>

			{/* CAPABILITIES */}
			<section className="max-w-[1360px] mx-auto px-16 py-24 relative border-t border-ink/5">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
					{CAPABILITIES.map((cap) => (
						<Card
							key={cap.n}
							padding="md"
							className="flex flex-col gap-2.5"
							data-testid={`cap-card-${cap.n}`}
						>
							<div className="flex justify-between items-baseline font-mono text-[10px] tracking-[0.06em] uppercase text-ink-faint">
								<span className="font-italic italic text-coral text-[18px] tracking-normal normal-case">
									{cap.n}
								</span>
								<span>Feature</span>
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

			{/* CTA RIBBON */}
			<section className="max-w-[1360px] mx-auto px-16 py-24 relative border-t border-ink/5">
				<div className="bg-paper-dark rounded-3xl px-16 py-16 text-center mt-9 relative overflow-hidden">
					<h2 className="font-display font-extrabold text-[clamp(38px,4.2vw,66px)] leading-[1.04] tracking-[-0.035em] max-w-[24ch] mx-auto">
						Pronto pra começar<span className="text-coral">?</span>
					</h2>
					<p className="font-sans text-[16px] leading-[1.7] text-ink-mute max-w-[52ch] mx-auto mt-5">
						Crie uma sala em menos de 5 segundos. Convide o time, votem,
						revelem. Sem cadastro, sem confirmação de email, sem plano pago.
					</p>
					<div className="flex items-center justify-center gap-3.5 mt-8">
						<Button
							variant="coral"
							size="lg"
							onClick={handleCreateRoom}
							data-testid="cta-ribbon-create"
						>
							Criar sala
							<span aria-hidden="true">↗</span>
						</Button>
					</div>
				</div>
			</section>

			{/* Footer — mega word */}
			<footer className="max-w-[1360px] mx-auto px-16 pt-16 pb-16 border-t border-ink/10">
				<div className="grid grid-cols-4 gap-8">
					<div className="flex flex-col gap-3">
						<h4 className="font-display font-bold text-[13px] tracking-[-0.02em] uppercase">
							Pointly
						</h4>
						<Link
							to="/"
							className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors"
						>
							Página inicial
						</Link>
						<a
							href="#como-funciona"
							className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors"
						>
							Como funciona
						</a>
						<a
							href="#para-times"
							className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors"
						>
							Para times
						</a>
					</div>
					<div className="flex flex-col gap-3">
						<h4 className="font-display font-bold text-[13px] tracking-[-0.02em] uppercase">
							Produto
						</h4>
						<a
							href="mailto:hello@pointly.dev"
							className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors"
						>
							Contato
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
