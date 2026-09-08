/** Full room recovery page. */
import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/site-header";
import { Button } from "../components/ui/button";
import "../styles/entry.css";

const MAX_PLAYERS = 12;

export function Full() {
	const navigate = useNavigate();
	const goCreate = useCallback(
		(): void => navigate("/join?host=1"),
		[navigate],
	);
	const goHome = useCallback((): void => navigate("/"), [navigate]);
	const titleRef = useRef<HTMLHeadingElement>(null);
	useEffect(() => {
		titleRef.current?.focus();
	}, []);

	return (
		<div data-testid="page-full" className="entry-page">
			<SiteHeader
				brandTestId="full-back"
				actions={<span className="entry-header-label">Sala cheia</span>}
			/>
			<main className="recovery-main">
				<section
					className="recovery-shell"
					aria-labelledby="full-title"
					data-od-id="full-card"
				>
					<div className="recovery-mark" aria-hidden="true">
						12
					</div>
					<p className="entry-eyebrow">Capacidade máxima</p>
					<h1
						id="full-title"
						ref={titleRef}
						className="recovery-title"
						tabIndex={-1}
					>
						Sala cheia<span aria-hidden="true">.</span>
					</h1>
					<div className="recovery-count">
						<strong data-testid="full-count">{MAX_PLAYERS}</strong>
						<span>/ {MAX_PLAYERS} · máximo atingido</span>
					</div>
					<p className="recovery-copy">
						Esta sala já tem {MAX_PLAYERS} jogadores. Crie uma sala nova para
						continuar a rodada com o seu time.
					</p>
					<div className="recovery-actions">
						<Button
							variant="coral"
							size="lg"
							onClick={goCreate}
							className="w-full sm:w-auto"
							data-testid="full-create-new"
						>
							Criar sala nova <span aria-hidden="true">↗</span>
						</Button>
						<Button
							variant="default"
							size="lg"
							onClick={goHome}
							className="w-full sm:w-auto"
							data-testid="full-retry"
						>
							Voltar ao início
						</Button>
					</div>
				</section>
			</main>
		</div>
	);
}
