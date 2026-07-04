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
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

/** Trust Badge — spec US-5 AC2. */
const TRUST_BADGE = "0 cadastros · 4 chars no código";

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

/** Method — 4 steps numerados. */
const METHOD_STEPS = [
	{
		n: "01",
		title: "Criar sala",
		body: "Code de 4 chars gerado on-the-fly. Vire host sem perder voto — todos revelam.",
	},
	{
		n: "02",
		title: "Compartilhar",
		body: "Manda o link no Slack. Cada um entra com apelido, vê seu assento em < 200ms.",
	},
	{
		n: "03",
		title: "Votar",
		body: "Deck Fibonacci embaixo. Voto é idempotente — muda sem expor o valor pros outros.",
	},
	{
		n: "04",
		title: "Revelar",
		body: "1 clique vira a mesa. Mediana gold, stats no topo. Nova rodada limpa tudo.",
	},
];

export function Landing() {
	const navigate = useNavigate();
	const [code, setCode] = useState("");
	const [codeError, setCodeError] = useState("");

	function handleCreateRoom(): void {
		// Server gera code no `hello` (vide ADR-0009). Navega sem code,
		// server cria sala e atribui role='host'.
		navigate("/join?host=1");
	}

	function handleJoinWithCode(e: FormEvent<HTMLFormElement>): void {
		e.preventDefault();
		const trimmed = code.trim().toUpperCase();
		// Validação: 4 chars alfanuméricos (consistente com RoomCodeSchema).
		if (!/^[A-Z0-9]{4}$/.test(trimmed)) {
			setCodeError("Use 4 caracteres [A-Z0-9].");
			return;
		}
		setCodeError("");
		navigate(`/join?code=${trimmed}`);
	}

	return (
		<div
			data-testid="page-landing"
			className="surface-noise min-h-screen bg-bg text-ink"
		>
			{/* Side rails (apenas na landing — bifurcação editorial) */}
			<aside
				aria-hidden="true"
				className="side-rail left"
				style={{
					position: "fixed",
					top: 0,
					bottom: 0,
					left: 0,
					width: "36px",
					zIndex: 3,
					pointerEvents: "none",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					borderRight: "1px solid rgba(21, 20, 15, 0.05)",
				}}
			>
				<span
					style={{
						fontFamily: '"Inter Tight", system-ui, sans-serif',
						fontSize: "10px",
						fontWeight: 600,
						letterSpacing: "0.42em",
						textTransform: "uppercase",
						color: "var(--fg-faint)",
						writingMode: "vertical-rl",
					}}
				>
					POINTLY · MMXXVI
				</span>
			</aside>
			<aside
				aria-hidden="true"
				style={{
					position: "fixed",
					top: 0,
					bottom: 0,
					right: 0,
					width: "36px",
					zIndex: 3,
					pointerEvents: "none",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					borderLeft: "1px solid rgba(21, 20, 15, 0.05)",
				}}
			>
				<span
					style={{
						fontFamily: '"Inter Tight", system-ui, sans-serif',
						fontSize: "10px",
						fontWeight: 600,
						letterSpacing: "0.42em",
						textTransform: "uppercase",
						color: "var(--fg-faint)",
						writingMode: "vertical-rl",
						transform: "rotate(180deg)",
					}}
				>
					PLAN · VOTE · REVEAL
				</span>
			</aside>

			{/* Topbar — metadata strip */}
			<header className="border-b border-ink/10 py-2.5 sticky top-0 z-10 bg-bg/95 backdrop-blur-sm">
				<div className="max-w-[1360px] mx-auto px-16 flex items-center justify-between">
					<div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
						<span
							aria-hidden="true"
							className="inline-block w-1.5 h-1.5 rounded-full bg-coral animate-pulse"
						/>
						<span>Vol. 01 · Issue Nº 26 · Pointly</span>
					</div>
					<div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
						PT-BR · MMXXVI
					</div>
				</div>
			</header>

			{/* Sticky nav */}
			<nav className="py-4 px-16 max-w-[1360px] mx-auto flex justify-between items-baseline border-b border-ink/5">
				<a
					href="/"
					className="font-display font-extrabold text-[22px] tracking-[-0.03em] flex items-baseline gap-2.5"
					aria-label="Pointly — página inicial"
				>
					<span className="font-italic italic text-coral text-[26px] leading-none">
						Ø
					</span>
					Pointly
				</a>
				<div className="flex items-baseline gap-7 font-display text-[13px] text-ink-soft">
					<a
						href="#como-funciona"
						className="hover:text-coral transition-colors"
					>
						Como funciona
					</a>
					<a
						href="#para-times"
						className="hover:text-coral transition-colors"
					>
						Para times
					</a>
					<a
						href="https://github.com"
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-baseline gap-1.5 hover:text-coral transition-colors"
					>
						GitHub
						<span className="text-mustard text-[14px]" aria-hidden="true">
							★
						</span>
					</a>
				</div>
			</nav>

			{/* HERO — Roman I */}
			<section
				id="como-funciona"
				className="max-w-[1360px] mx-auto px-16 pt-16 pb-12 relative"
			>
				{/* sec-rule Roman I */}
				<div className="flex items-center gap-4 pb-4 border-b border-ink/10 font-mono text-[10.5px] tracking-wider uppercase text-ink-faint">
					<span className="font-italic italic text-coral text-[14px] tracking-normal normal-case">
						I.
					</span>
					<span>Hero</span>
					<span className="flex-1 text-center">Filed under: Planning Poker</span>
					<span className="font-display tracking-[0.22em]">001 / 005</span>
				</div>

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
							Vote com <em className="font-italic italic font-normal text-ink-soft">ritmo</em>,{" "}
							<em className="font-italic italic font-normal text-ink-soft">confiança</em>, e
							zero cadastro<span className="text-coral">.</span>
						</h1>
						<p className="font-sans text-[17px] leading-[1.6] text-ink-mute mt-6 max-w-[52ch]">
							Planning Poker gratuito, sem email, sem plano pago. Sincronize a
							estimativa do seu time em menos de 60 segundos.
						</p>

						<div className="flex items-center gap-3.5 mt-9">
							<Button
								variant="coral"
								size="lg"
								onClick={handleCreateRoom}
								data-testid="cta-create-room"
							>
								Criar sala
								<span aria-hidden="true">↗</span>
							</Button>
						</div>

						{/* Ghost CTA: Entrar com código */}
						<form
							onSubmit={handleJoinWithCode}
							className="mt-5 flex items-center gap-3"
						>
							<label
								htmlFor="code-input"
								className="font-mono text-[11px] tracking-[0.06em] uppercase text-ink-faint"
							>
								ou
							</label>
							<input
								id="code-input"
								type="text"
								inputMode="text"
								maxLength={4}
								placeholder="XXXX"
								value={code}
								onChange={(e) => {
									setCode(e.target.value.toUpperCase());
									setCodeError("");
								}}
								aria-label="Código de 4 caracteres da sala"
								aria-invalid={Boolean(codeError)}
								aria-describedby={codeError ? "code-error" : undefined}
								className="w-20 h-10 px-3 bg-paper border border-ink/10 rounded-full text-center font-mono tracking-[0.2em] uppercase text-ink placeholder:text-ink-faint focus:border-coral focus:outline-none transition-colors"
								data-testid="code-input"
							/>
							<Button
								type="submit"
								variant="ghost"
								size="md"
								data-testid="cta-join-with-code"
							>
								Entrar com código
								<span aria-hidden="true">→</span>
							</Button>
							{codeError && (
								<span
									id="code-error"
									role="alert"
									className="font-mono text-[11px] text-coral"
								>
									{codeError}
								</span>
							)}
						</form>

						{/* Trust Badge */}
						<div className="mt-8">
							<span
								data-testid="trust-badge"
								className="font-mono text-[11px] tracking-[0.04em] text-ink-mute inline-flex items-center gap-2 px-3.5 py-2 border border-ink/10 rounded-full uppercase"
							>
								<span
									aria-hidden="true"
									className="inline-block w-1.5 h-1.5 rounded-full bg-coral animate-pulse"
								/>
								{TRUST_BADGE}
							</span>
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

					{/* Hero image placeholder */}
					<div className="relative min-h-[520px] bg-paper-dark rounded-lg flex items-center justify-center">
						<span
							aria-hidden="true"
							className="absolute top-4 left-4 w-[22px] h-[22px] border-l border-t border-ink-faint opacity-50"
						/>
						<span
							aria-hidden="true"
							className="absolute top-4 right-4 w-[22px] h-[22px] border-r border-t border-ink-faint opacity-50"
						/>
						<span
							aria-hidden="true"
							className="absolute bottom-4 left-4 w-[22px] h-[22px] border-l border-b border-ink-faint opacity-50"
						/>
						<span
							aria-hidden="true"
							className="absolute bottom-4 right-4 w-[22px] h-[22px] border-r border-b border-ink-faint opacity-50"
						/>
						<span className="font-mono text-[11px] tracking-[0.06em] uppercase text-ink-faint">
							placeholder · 16 slots
						</span>

						{/* Index card */}
						<aside
							className="absolute top-6 right-6 bg-surface border border-ink/10 rounded-md py-3.5 px-4 font-mono text-[10px] tracking-[0.06em] text-ink-faint uppercase w-[180px]"
							aria-label="Sumário editorial"
						>
							{[
								{ n: "01", label: "Hero" },
								{ n: "02", label: "Sobre" },
								{ n: "03", label: "Capacidades" },
								{ n: "04", label: "Método" },
								{ n: "05", label: "CTA" },
							].map((row, i) => (
								<div
									key={row.n}
									className={`flex justify-between py-1.5 ${
										i === 0 ? "text-ink font-semibold" : ""
									} ${i < 4 ? "border-b border-ink/5" : ""}`}
								>
									<span className={i === 0 ? "text-ink" : "text-coral"}>
										{row.n}
									</span>
									<span className={i === 0 ? "text-ink" : ""}>{row.label}</span>
								</div>
							))}
						</aside>
					</div>
				</div>
			</section>

			{/* ABOUT — Roman II */}
			<section className="max-w-[1360px] mx-auto px-16 py-32 relative">
				<div className="flex items-center gap-4 pb-4 border-b border-ink/10 font-mono text-[10.5px] tracking-wider uppercase text-ink-faint">
					<span className="font-italic italic text-coral text-[14px] tracking-normal normal-case">
						II.
					</span>
					<span>Sobre</span>
					<span className="flex-1 text-center">Filed under: Manifesto</span>
					<span className="font-display tracking-[0.22em]">002 / 005</span>
				</div>

				<div className="grid grid-cols-[1fr_2fr] gap-12 items-start pt-10">
					<aside className="font-mono text-[11px] tracking-[0.06em] text-ink-faint uppercase leading-[2]">
						<div>Filed under: Planning Poker</div>
						<div>Author: Helder</div>
						<div>Issue: Nº 26</div>
						<div>Status: Open beta</div>
					</aside>
					<div>
						<h2 className="font-display font-extrabold text-[clamp(38px,4.2vw,66px)] leading-[1.04] tracking-[-0.035em] max-w-[18ch]">
							Times ágeis estimam{" "}
							<em className="font-italic italic font-normal text-ink-soft">
								conversando
							</em>
							, não preenchendo planilha.
						</h2>
						<p
							id="para-times"
							className="font-sans text-[16px] leading-[1.7] text-ink-mute mt-7 max-w-[60ch]"
						>
							O Pointly é um protótipo gratuito de Planning Poker pra times
							que querem estimar trabalho em calls de planning sem fricção.
							Zero cadastro, zero email, zero plano pago.{" "}
							<strong className="font-semibold text-ink-soft">
								0 contas
							</strong>
							, código de{" "}
							<strong className="font-semibold text-ink-soft">4 chars</strong>
							, deck com{" "}
							<strong className="font-semibold text-ink-soft">9 cartas</strong>
							, mesa com até{" "}
							<strong className="font-semibold text-ink-soft">
								12 jogadores
							</strong>
							. Sem bots, sem histórico, sem integrações.
						</p>
					</div>
				</div>
			</section>

			{/* CAPABILITIES — Roman III */}
			<section className="max-w-[1360px] mx-auto px-16 py-32 relative">
				<div className="flex items-center gap-4 pb-4 border-b border-ink/10 font-mono text-[10.5px] tracking-wider uppercase text-ink-faint">
					<span className="font-italic italic text-coral text-[14px] tracking-normal normal-case">
						III.
					</span>
					<span>Capacidades</span>
					<span className="flex-1 text-center">4 features · bone-fill</span>
					<span className="font-display tracking-[0.22em]">003 / 005</span>
				</div>

				<div className="grid grid-cols-4 gap-4 mt-12">
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

			{/* METHOD — Roman IV */}
			<section className="max-w-[1360px] mx-auto px-16 py-32 relative">
				<div className="flex items-center gap-4 pb-4 border-b border-ink/10 font-mono text-[10.5px] tracking-wider uppercase text-ink-faint">
					<span className="font-italic italic text-coral text-[14px] tracking-normal normal-case">
						IV.
					</span>
					<span>Método</span>
					<span className="flex-1 text-center">4 passos · 60s</span>
					<span className="font-display tracking-[0.22em]">004 / 005</span>
				</div>

				<div className="grid grid-cols-4 gap-4 pb-3.5 border-b border-ink/10 mt-10">
					{METHOD_STEPS.map((step) => (
						<div
							key={step.n}
							className="font-display font-bold text-[14px] tracking-[-0.01em] flex items-center gap-1.5"
						>
							<span className="font-italic italic text-coral text-[16px]">
								{step.n}
							</span>
							<span>{step.title}</span>
							<span
								aria-hidden="true"
								className="text-ink-faint text-[12px] ml-auto"
							>
								→
							</span>
						</div>
					))}
				</div>

				<div className="grid grid-cols-4 gap-4 mt-9">
					{METHOD_STEPS.map((step) => (
						<div
							key={step.n}
							className="flex flex-col gap-3"
							data-testid={`method-step-${step.n}`}
						>
							<div className="relative bg-paper-dark aspect-square rounded-md flex items-center justify-center overflow-hidden">
								<span className="font-mono text-[9.5px] tracking-[0.06em] uppercase text-ink-faint">
									placeholder
								</span>
							</div>
							<p className="font-sans text-[13.5px] leading-[1.55] text-ink-mute">
								{step.body}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* CTA RIBBON — Roman V */}
			<section className="max-w-[1360px] mx-auto px-16 py-32 relative">
				<div className="flex items-center gap-4 pb-4 border-b border-ink/10 font-mono text-[10.5px] tracking-wider uppercase text-ink-faint">
					<span className="font-italic italic text-coral text-[14px] tracking-normal normal-case">
						V.
					</span>
					<span>CTA</span>
					<span className="flex-1 text-center">Crie sua sala agora</span>
					<span className="font-display tracking-[0.22em]">005 / 005</span>
				</div>

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
						<a href="/" className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors">
							Página inicial
						</a>
						<a href="#como-funciona" className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors">
							Como funciona
						</a>
						<a href="#para-times" className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors">
							Para times
						</a>
					</div>
					<div className="flex flex-col gap-3">
						<h4 className="font-display font-bold text-[13px] tracking-[-0.02em] uppercase">
							Produto
						</h4>
						<a href="https://github.com" className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors">
							GitHub
						</a>
						<a href="/changelog" className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors">
							Changelog
						</a>
					</div>
					<div className="flex flex-col gap-3">
						<h4 className="font-display font-bold text-[13px] tracking-[-0.02em] uppercase">
							Recursos
						</h4>
						<a href="/docs" className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors">
							Documentação
						</a>
						<a href="/privacy" className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors">
							Privacidade
						</a>
					</div>
					<div className="flex flex-col gap-3">
						<h4 className="font-display font-bold text-[13px] tracking-[-0.02em] uppercase">
							Contato
						</h4>
						<a href="mailto:hello@pointly.dev" className="font-mono text-[12px] text-ink-mute hover:text-coral transition-colors">
							hello@pointly.dev
						</a>
					</div>
				</div>

				<div
					className="font-italic italic text-ink text-display-xl mt-16 text-center select-none"
					aria-hidden="true"
				>
					Pointly.
				</div>
			</footer>
		</div>
	);
}