/**
 * SiteHeader — fixed nav da landing.
 *
 * Header fixo da landing. Posição `fixed top-0`, full-width, `z-20`.
 * Estado `is-scrolled` controla o background: transparente no topo da
 * página, `var(--paper-warm)` com border-bottom hairline + shadow
 * sutil após o usuário rolar mais de 8px. A altura
 * (`--header-height: 64px`) é exposta via CSS variable pra que o hero
 * (e qualquer seção futura) possa compensar o offset com
 * `padding-top` / `scroll-margin-top`. O `nav` declara `min-h-16` (64px)
 * pra alinhar matematicamente com a variável.
 *
 * Layout (desktop ≥768px):
 *   <Logo> · <ThemeToggle> · <divisor> · <CriarSala outline>
 *
 * Layout (mobile <768px):
 *   <Logo> · <ThemeToggle> · <CriarSala outline>
 *   (Divisor oculto via `hidden sm:block`)
 *
 * Estado interno:
 *  - `isScrolled`: false até o primeiro scroll válido, depois
 *    `scrollY > 8`. Listener passive + rAF-throttle pra não
 *    martelar `setState` em cada frame de scroll.
 *  - Reduced-motion: lê `prefers-reduced-motion: reduce` uma vez
 *    no mount. Se ativo, força `isScrolled = true` (header sempre
 *    no estado materializado, sem transição visível).
 *
 * Props:
 *  - `onCreateRoom`: callback pra navegação `/join?host=1`. Recebido
 *    por prop pra manter o componente desacoplado do `useNavigate`.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

/** Scroll threshold (em px) acima do qual o header "materializa". */
const SCROLL_THRESHOLD = 8;

export interface SiteHeaderProps {
	/** Callback do botão "Criar sala" — navega pra /join?host=1. */
	onCreateRoom: () => void;
	/** Callback do botão "Entrar" — navega pra /join. */
	onJoinRoom: () => void;
}

/**
 * Header da landing. Fixed no topo, marca à esquerda, toggle de tema
 * e CTA outline à direita. O divisor hairline entre toggle e CTA
 * separa controles de ação primária sem peso visual adicional.
 */
export function SiteHeader({ onCreateRoom, onJoinRoom }: SiteHeaderProps) {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		// Reduced-motion: header sempre no estado scrolled (sem transição
		// visível, sem toggle do data-attribute). Belt-and-suspenders ao
		// global rule in index.css:65-73 que já neutra transições CSS.
		// Guard matchMedia (jsdom + browsers antigos não implementam).
		const mql =
			typeof window.matchMedia === "function"
				? window.matchMedia("(prefers-reduced-motion: reduce)")
				: null;
		if (mql?.matches) {
			setIsScrolled(true);
			return;
		}

		// Lê o estado inicial uma vez (caso a página carregue já rolada —
		// ex: usuário voltou via back-button e o browser restaurou scroll).
		setIsScrolled(window.scrollY > SCROLL_THRESHOLD);

		let pending = false;
		const onScroll = () => {
			if (pending) return;
			pending = true;
			window.requestAnimationFrame(() => {
				setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
				pending = false;
			});
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			data-scrolled={isScrolled}
			className="site-header fixed top-0 left-0 right-0 z-20 border-b border-transparent"
		>
			<nav className="max-w-[1360px] mx-auto min-h-16 py-3 px-6 lg:px-16 flex justify-between items-center gap-4">
				<Link
					to="/"
					className="font-display font-extrabold text-[24px] tracking-[-0.03em] flex items-baseline gap-2 hover:text-coral-deep transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
					aria-label="Pointly — página inicial"
				>
					<span className="font-italic italic text-coral text-[28px] leading-none">
						Ø
					</span>
					Pointly
				</Link>

				<div className="flex items-center gap-3">
					<ThemeToggle />
					<span
						aria-hidden="true"
						className="hidden sm:block w-px h-4 bg-ink/15"
					/>
					<Button
						variant="ghost"
						size="sm"
						onClick={onJoinRoom}
						data-testid="cta-nav-join-room"
					>
						Entrar
					</Button>
					<Button
						variant="coral-outline"
						size="sm"
						onClick={onCreateRoom}
						data-testid="cta-nav-create-room"
					>
						Criar sala
						<span aria-hidden="true">↗</span>
					</Button>
				</div>
			</nav>
		</header>
	);
}

export default SiteHeader;
