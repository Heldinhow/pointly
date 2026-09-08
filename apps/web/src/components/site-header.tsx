import type { ReactNode } from "react";
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
	return (
		<header className="site-header" data-site-header="true">
			<nav className="site-header-nav header-brand-led" aria-label="Navegação principal">
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
								Criar sala <span aria-hidden="true">↗</span>
							</button>
						</>
					)}
				</div>
			</nav>
		</header>
	);
}

export default SiteHeader;
