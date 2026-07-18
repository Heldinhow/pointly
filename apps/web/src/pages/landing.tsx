import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/site-header";
import { Button } from "../components/ui/button";
import { AeoWidget } from "aeo.js/react";

function SectionRule({ roman, title }: { roman: string; title: string }) {
	return (
		<div className="max-w-[1360px] mx-auto px-6 lg:px-16" aria-hidden="true">
			<div className="sec-rule">
				<span className="roman">{roman}</span>
				<span className="meta">{title}</span>
			</div>
		</div>
	);
}

/** Os 3 passos da seção "Como funciona". */
const HOW_IT_WORKS: { n: string; title: string; body: ReactNode }[] = [
	{
		n: "01",
		title: "Crie a sala instantaneamente",
		body: "Um clique e sua sala está no ar em 100ms. Gratuito para sempre, sem cadastro, e-mail ou paywalls.",
	},
	{
		n: "02",
		title: "Compartilhe com o time",
		body: "Copie o link e envie no chat do seu squad. Até 12 participantes entram em segundos, sem convites.",
	},
	{
		n: "03",
		title: "Estime e revele os votos",
		body: (
			<>
				Cada um vota sob sigilo com o Deck Fibonacci. Ao revelar, a mediana é
				destacada em{" "}
				<span className="text-mustard font-medium">dourado</span> para guiar a
				conversa.
			</>
		),
	},
];

/**
 * Reveal escalonado disparado quando o bloco entra na viewport.
 * Seguro por padrão: sem JS, sem IntersectionObserver ou com
 * prefers-reduced-motion, o conteúdo renderiza visível (nunca "arma"
 * o estado oculto). `useLayoutEffect` arma antes do paint, evitando flash.
 */
function useStaggerReveal<T extends HTMLElement>() {
	const ref = useRef<T>(null);
	const [armed, setArmed] = useState(false);
	const [revealed, setRevealed] = useState(false);

	useLayoutEffect(() => {
		if (typeof IntersectionObserver === "undefined") return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		setArmed(true);
	}, []);

	useEffect(() => {
		if (!armed) return;
		const el = ref.current;
		if (!el) {
			setRevealed(true);
			return;
		}
		const obs = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					setRevealed(true);
					obs.disconnect();
				}
			},
			{ threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, [armed]);

	return { ref, hidden: armed && !revealed, animate: armed && revealed };
}

export function Landing() {
	const navigate = useNavigate();

	const handleCreateRoom = useCallback((): void => {
		navigate("/join?host=1");
	}, [navigate]);

	const handleJoinRoom = useCallback((): void => {
		navigate("/join");
	}, [navigate]);

	const {
		ref: stepsRef,
		hidden: stepsHidden,
		animate: stepsAnimate,
	} = useStaggerReveal<HTMLOListElement>();

	return (
		<div
			data-testid="page-landing"
			className="surface-noise min-h-[100dvh] bg-bg text-ink relative overflow-x-hidden pt-16"
		>
			{/* Sticky Navigation */}
			<SiteHeader onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />

			{/* Section Rule I - Hero */}
			<SectionRule roman="I." title="INTRODUÇÃO · MEIO DE ESTIMATIVA" />

			{/* HERO — Roman I */}
			<section
				id="hero"
				className="max-w-[1360px] mx-auto px-6 lg:px-16 pt-24 sm:pt-32 pb-20 sm:pb-24 relative flex flex-col items-center text-center animate-fade-in-up"
			>
				<div className="flex flex-col items-center text-center max-w-[840px] mx-auto">
					<div
						className="font-mono text-xs tracking-eyebrow uppercase text-coral-deep mb-4 animate-fade-in-up"
						style={{ animationDelay: "100ms" }}
					>
						● Pointly Agility
					</div>
					<h1
						data-testid="hero-headline"
						className="font-display font-extrabold text-display-hero text-balance animate-fade-in-up"
						style={{ animationDelay: "200ms" }}
					>
						Planning Poker com{" "}
						<em className="italic font-normal text-ink-soft">ritmo</em>,{" "}
						<em className="italic font-normal text-ink-soft">confiança</em> e
						zero cadastro<span className="text-coral">.</span>
					</h1>
					<p
						className="font-sans text-base md:text-lg lg:text-xl leading-[1.5] text-ink-mute mt-6 max-w-[52ch] text-pretty animate-fade-in-up"
						style={{ animationDelay: "300ms" }}
					>
						Abra salas de estimativa instantâneas para o seu time. 100%
						gratuito, sem e-mail, sem paywalls e sem burocracia.
					</p>

					{/* Action area: Criar sala e Entrar */}
					<div
						className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full sm:w-auto animate-fade-in-up"
						style={{ animationDelay: "400ms" }}
					>
						<Button
							variant="coral"
							size="lg"
							onClick={handleCreateRoom}
							data-testid="cta-create-room"
							id="hero-create-room-cta"
							className="w-full sm:w-auto px-8"
						>
							Criar sala grátis
							<span aria-hidden="true">↗</span>
						</Button>

						<Button
							variant="default"
							size="lg"
							onClick={handleJoinRoom}
							data-testid="cta-join-room"
							className="w-full sm:w-auto px-8"
						>
							Entrar
						</Button>
					</div>
					<span
						className="font-mono text-xs text-ink-faint uppercase tracking-caps mt-4 animate-fade-in-up"
						style={{ animationDelay: "500ms" }}
					>
						Sem e-mail · Salas efêmeras em memória{" "}
					</span>
				</div>
			</section>

			{/* Section Rule II - Como Funciona */}
			<SectionRule roman="II." title="PROCESSO · COMO FUNCIONA" />

			{/* COMO FUNCIONA */}
			<section
				id="como-funciona"
				aria-labelledby="como-funciona-title"
				className="max-w-[1360px] mx-auto px-6 lg:px-16 py-16 sm:py-24 relative"
			>
				<h2
					id="como-funciona-title"
					className="font-display font-extrabold text-3xl sm:text-4xl tracking-tighter mb-16 text-center text-ink text-balance"
				>
					Como funciona em 3 passos
				</h2>

				<ol
					ref={stepsRef}
					className="mt-12 border-t border-ink/15 divide-y divide-ink/10 list-none"
				>
					{HOW_IT_WORKS.map((step, i) => (
						<li
							key={step.n}
							data-testid={`cap-card-0${i + 1}`}
							className={`group grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-1.5 py-9 sm:py-10 -mx-4 px-4 sm:-mx-6 sm:px-6 items-baseline transition-colors duration-200 hover:bg-ink/[0.03] ${
								stepsHidden ? "opacity-0" : ""
							} ${stepsAnimate ? "animate-fade-in-up" : ""}`}
							style={
								stepsAnimate ? { animationDelay: `${i * 90}ms` } : undefined
							}
						>
							<div className="md:col-span-2">
								<span className="inline-block font-italic italic text-coral text-4xl sm:text-5xl font-semibold leading-none transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
									{step.n}
								</span>
							</div>
							<h3 className="md:col-span-4 font-display font-bold text-lg sm:text-xl leading-snug text-ink text-balance">
								{step.title}
							</h3>
							<p className="md:col-span-6 font-sans text-base leading-relaxed text-ink-mute max-w-[54ch]">
								{step.body}
							</p>
						</li>
					))}
				</ol>
			</section>

			{/* Section Rule III - CTA Final */}
			<SectionRule roman="III." title="AÇÃO · CRIAÇÃO DE SALA" />

			{/* CTA FINAL — mesmo papel do resto da página, sem faixa preta, sem glow, sem borda dupla */}
			<section
				id="cta-final"
				className="bg-bg text-ink px-6 lg:px-16 py-16 sm:py-20 relative"
			>
				<div className="max-w-[1360px] mx-auto text-center flex flex-col items-center">
					<div className="font-mono text-xs tracking-eyebrow uppercase text-coral-deep mb-4">
						● Comece agora
					</div>
					<h2 className="font-display font-extrabold text-3xl sm:text-5xl leading-[1.1] tracking-display max-w-[20ch] text-balance">
						Pronto para estimar com seu time?
					</h2>
					<p className="font-sans text-ink-mute text-sm sm:text-base leading-[1.5] max-w-[40ch] mt-4">
						Crie uma sala e comece a votar agora mesmo.
					</p>
					<div className="mt-8">
						<Button
							variant="default"
							size="lg"
							onClick={handleCreateRoom}
							data-testid="cta-ribbon-create"
							className="w-full sm:w-auto border-ink/25 text-ink hover:border-coral-deep hover:text-coral-deep transition-colors"
						>
							Criar sala grátis
							<span aria-hidden="true">↗</span>
						</Button>
					</div>
				</div>
			</section>

			{/* Section Rule IV - FAQ */}
			<SectionRule roman="IV." title="PERGUNTAS · FAQ INDEXÁVEL" />

			{/* FAQ — English so aeo.js's detectFaqPatterns picks up
			    `How…? / What…? / Is…?` triggers (regex is English-only) and
			    auto-injects FAQPage schema into schema.json. Portuguese-only
			    QA would not trigger. The DOM stays PT-BR friendly via the
			    surrounding context, but questions/answers are intentionally in
			    English for SEO crawler compatibility. */}
			<section
				id="faq"
				aria-labelledby="faq-title"
				className="max-w-[1360px] mx-auto px-6 lg:px-16 py-16 sm:py-24 relative"
			>
				<h2
					id="faq-title"
					className="font-display font-extrabold text-3xl sm:text-4xl tracking-tighter mb-16 text-center text-ink text-balance"
				>
					Perguntas frequentes
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 max-w-[1080px] mx-auto">
					<div>
						<h3 className="font-display font-bold text-lg sm:text-xl leading-snug text-ink text-balance mb-3">
							Is Pointly really free?
						</h3>
						<p className="font-sans text-base leading-relaxed text-ink-mute max-w-[54ch]">
							Yes. No freemium tiers, no paywall, no card required. Each
							room runs entirely in-memory on the backend and disappears
							when the last player leaves — there is no database to bill
							against, which is the only reason the service can stay
							free.
						</p>
					</div>

					<div>
						<h3 className="font-display font-bold text-lg sm:text-xl leading-snug text-ink text-balance mb-3">
							How many players fit in one room?
						</h3>
						<p className="font-sans text-base leading-relaxed text-ink-mute max-w-[54ch]">
							Up to 12 participants per room — sized for typical agile
							teams of 4 to 9 people plus 1 to 3 observers. Rooms that
							hit the cap receive a dedicated /full page instead of
							throwing a runtime error.
						</p>
					</div>

					<div>
						<h3 className="font-display font-bold text-lg sm:text-xl leading-snug text-ink text-balance mb-3">
							How fast can I create a room?
						</h3>
						<p className="font-sans text-base leading-relaxed text-ink-mute max-w-[54ch]">
							About 100 milliseconds from click to room-open-ready. There
							are no intermediate steps: you click Create, choose a
							nickname, and the room is ready for the rest of the team to
							join via a 6-character code.
						</p>
					</div>

					<div>
						<h3 className="font-display font-bold text-lg sm:text-xl leading-snug text-ink text-balance mb-3">
							Does Pointly save my retrospective data?
						</h3>
						<p className="font-sans text-base leading-relaxed text-ink-mute max-w-[54ch]">
							No. Every room is ephemeral: votes, chat messages and
							timers exist only while the room is open. When the last
							player exits, the entire state is discarded — this is the
							design, not a bug.
						</p>
					</div>

					<div>
						<h3 className="font-display font-bold text-lg sm:text-xl leading-snug text-ink text-balance mb-3">
							Does Pointly work on mobile?
						</h3>
						<p className="font-sans text-base leading-relaxed text-ink-mute max-w-[54ch]">
							Yes. The landing page and arena are responsive and tested
							on iPhone SE, iPad, and Android. The arena uses the
							standard Fibonacci deck (0, ½, 1, 2, 3, 5, 8, 13, 21, ?, ☕)
							rendered as large tappable cards optimized for small
							screens.
						</p>
					</div>

					<div>
						<h3 className="font-display font-bold text-lg sm:text-xl leading-snug text-ink text-balance mb-3">
							Can I integrate Pointly with Jira, Linear or Azure DevOps?
						</h3>
						<p className="font-sans text-base leading-relaxed text-ink-mute max-w-[54ch]">
							Not today. Pointly focuses on speed of the session — vote,
							reveal, decide — and does not export to external trackers.
							The revealed round is visible on screen and can be
							transcribed manually. Native integration is on the public
							roadmap.
						</p>
					</div>

					<div>
						<h3 className="font-display font-bold text-lg sm:text-xl leading-snug text-ink text-balance mb-3">
							Are AI bots and crawlers allowed to index Pointly?
						</h3>
						<p className="font-sans text-base leading-relaxed text-ink-mute max-w-[54ch]">
							Yes. The site publishes llms.txt, sitemap.xml, schema.json
							and robots.txt at https://pointly.space/ — all major
							models (GPTBot, ClaudeBot, PerplexityBot, Google-Extended)
							can cite and reference the tool with structured
							metadata.
						</p>
					</div>

					<div>
						<h3 className="font-display font-bold text-lg sm:text-xl leading-snug text-ink text-balance mb-3">
							What deck sizes are supported?
						</h3>
						<p className="font-sans text-base leading-relaxed text-ink-mute max-w-[54ch]">
							The default Fibonacci deck (0, ½, 1, 2, 3, 5, 8, 13, 21,
							“?”, ☕). Hosts pick the active subset per round, and votes
							are median-aggregated (not averaged) to avoid outlier bias
							from single estimators.
						</p>
					</div>
				</div>
			</section>

			{/* Section Rule V - Footer */}
			<SectionRule roman="V." title="INFORMAÇÕES · CRÉDITOS" />

			{/* Footer */}
			<footer className="max-w-[1360px] mx-auto px-6 lg:px-16 py-12 relative">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
					<div className="md:col-span-4 flex flex-col items-start gap-2">
						<Link
							to="/"
							className="font-display font-extrabold text-xl tracking-tighter flex items-baseline gap-2 hover:text-coral-deep transition-colors"
						>
							<span className="font-italic italic text-coral text-2xl leading-none">
								Ø
							</span>
							Pointly
						</Link>
						<p className="font-sans text-xs text-ink-mute max-w-[280px]">
							Planning poker efêmero e gratuito para equipes de alta
							performance.
						</p>
					</div>

					<div className="md:col-span-8 flex flex-wrap justify-start md:justify-end gap-x-8 gap-y-4">
						<a
							href="mailto:hello@pointly.dev"
							className="font-mono text-xs text-ink-mute hover:text-coral-deep transition-colors"
						>
							Suporte / Contato
						</a>
						<span className="font-mono text-xs text-ink-faint">
							© {new Date().getFullYear()} Pointly
						</span>
					</div>
				</div>
			</footer>

			{/* AEO discoverability indicator (landing only). The widget injects
			    a fixed bottom-right pill via `aeo.js/widget`; its inner DOM
			    lives outside Tailwind's reach, so visual styling is whatever
			    aeo.js's bundled CSS does. ARIA-hidden because it's decorative —
			    the real AEO payload is the build-time llms.txt / robots.txt /
			    sitemap.xml / schema.json files (see apps/web/vite.config.ts). */}
			<AeoWidget aria-hidden="true" />
		</div>
	);
}
