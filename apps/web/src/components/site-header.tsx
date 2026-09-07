import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";

const SCROLL_THRESHOLD = 8;

export interface SiteHeaderProps {
	onCreateRoom?: () => void;
	onJoinRoom?: () => void;
	/** Ações customizadas (ex.: sala usa SharePill). Substitui Entrar/Criar. */
	actions?: ReactNode;
	/** Rótulo do brand (sala: sair da sala). */
	brandLabel?: string;
}

export function SiteHeader({ onCreateRoom, onJoinRoom, actions, brandLabel }: SiteHeaderProps) {
	const [isScrolled, setIsScrolled] = useState(false);
	useEffect(() => {
		const mql = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
		if (mql?.matches) {
			setIsScrolled(true);
			return;
		}
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
		<header className="site-header" data-scrolled={isScrolled}>
			<nav className="site-header-nav" aria-label="Navegação principal">
				<Link to="/" className="site-header-brand" aria-label={brandLabel ?? "Pointly — página inicial"}><Brand /></Link>
				<div className="site-header-actions">
					<ThemeToggle />
					{actions ?? (
						<>
							<button type="button" className="site-header-join" onClick={onJoinRoom} data-testid="cta-nav-join-room">Entrar</button>
							<button type="button" className="site-header-create" onClick={onCreateRoom} data-testid="cta-nav-create-room">Criar sala <span aria-hidden="true">↗</span></button>
						</>
					)}
				</div>
			</nav>
		</header>
	);
}

export default SiteHeader;
