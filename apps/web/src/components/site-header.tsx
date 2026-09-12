import { type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import "../styles/landing.css";

export interface SiteHeaderProps {
	onCreateRoom?: () => void;
	onJoinRoom?: () => void;
	/** Ações customizadas (ex.: sala usa SharePill). Substitui Entrar/Criar. */
	actions?: ReactNode;
	/** Rótulo do brand (sala: sair da sala). */
	brandLabel?: string;
	brandTestId?: string;
}

export function SiteHeader({
	onCreateRoom,
	onJoinRoom,
	actions,
	brandLabel,
	brandTestId,
}: SiteHeaderProps) {
	const [scrolled, setScrolled] = useState(() => window.scrollY > 48);

	useEffect(() => {
		let frame: number | null = null;
		const onScroll = () => {
			if (frame !== null) return;
			frame = requestAnimationFrame(() => {
				setScrolled(window.scrollY > 48);
				frame = null;
			});
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			if (frame !== null) cancelAnimationFrame(frame);
		};
	}, []);

	return (
		<header
			className="site-header"
			data-site-header="true"
			data-scrolled={scrolled}
		>
			<nav
				className="site-header-nav header-brand-led"
				aria-label="Navegação principal"
			>
				<Link
					to="/"
					className="site-header-brand"
					data-testid={brandTestId}
					aria-label={brandLabel ?? "Pointly — página inicial"}
				>
					<Brand />
				</Link>
				<div className="site-header-actions">
					<ThemeToggle />
					{actions ?? (
						<>
							<button
								type="button"
								className="site-header-join"
								onClick={onJoinRoom}
								data-testid="cta-nav-join-room"
							>
								Entrar
							</button>
							<button
								type="button"
								className="site-header-create"
								onClick={onCreateRoom}
								data-testid="cta-nav-create-room"
							>
								<span>Criar sala</span>
								<svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M3 13 13 3M3 3h10v10"
										stroke="currentColor"
										strokeWidth="1.5"
									/>
								</svg>
							</button>
						</>
					)}
				</div>
			</nav>
		</header>
	);
}

export default SiteHeader;
