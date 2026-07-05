/**
 * NotFound page — UX-001 editorial 404.
 *
 * Substitui o componente cru `"Not Found"` que existia antes por uma
 * view Atelier Zero completa: Ø mark + "404" display-xl coral com dot,
 * headline Inter Tight 700, sub em ink-soft, CTA coral "Criar sala"
 * + ghost "Voltar", `surface-noise::before` aplicado.
 *
 * Atende:
 *  - Nielsen #9 (help users recognize errors)
 *  - Voz editorial Atelier Zero (paper bg, Ø brand mark, coral accent)
 *  - A11y: <h1> hierárquico, CTAs focáveis, aria-label no card
 *
 * @see docs/ux-review/UX_REVIEW.md §3 UX-001
 */
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function NotFound() {
	const navigate = useNavigate();

	function handleCreate(): void {
		navigate("/");
	}

	function handleBack(): void {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			navigate("/");
		}
	}

	return (
		<div
			data-testid="page-not-found"
			role="alert"
			className="surface-noise min-h-screen bg-bg text-ink flex flex-col"
		>
			{/* Metadata strip top — mesmo padrão das outras páginas */}
			<header className="border-b border-ink/10 py-2.5 flex-shrink-0">
				<div className="max-w-[1360px] mx-auto px-16 flex items-center justify-between">
					<div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
						<span
							aria-hidden="true"
							className="inline-block w-1.5 h-1.5 rounded-full bg-coral animate-pulse motion-reduce:animate-none"
						/>
						<Link
							to="/"
							className="font-display font-bold text-[15px] tracking-tight text-ink normal-case flex items-baseline gap-1.5 hover:text-coral transition-colors"
							aria-label="Pointly — página inicial"
						>
							<span className="font-italic italic text-coral text-[18px] leading-none">
								Ø
							</span>
							Pointly
						</Link>
					</div>
					<div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
						Rota não encontrada
					</div>
				</div>
			</header>

			{/* Header strip */}
			<div className="max-w-[1360px] mx-auto px-16 w-full py-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-ink-faint">
				<span>Voto perdido</span>
				<span>
					Status <span className="text-ink font-medium">404</span>
				</span>
			</div>

			{/* Stage */}
			<main className="flex-1 flex items-center justify-center px-16 py-10">
				<Card
					padding="lg"
					className="w-[600px] flex flex-col gap-5"
					aria-label="Rota não encontrada"
					data-od-id="not-found-card"
				>
					<div className="font-italic italic text-coral text-[36px] leading-none">
						Ø
					</div>

					{/* Display "404" com dot coral */}
					<h1
						className="font-italic italic text-coral text-display-xl leading-[0.95] tracking-[-0.04em] font-medium"
						data-testid="not-found-code"
					>
						404<span className="text-coral">.</span>
					</h1>

					<h2 className="font-display font-extrabold text-[28px] leading-[1.1] tracking-tight">
						Voto perdido no vazio
						<span className="text-coral">.</span>
					</h2>

					<p className="font-sans text-[14.5px] leading-[1.6] text-ink-mute max-w-[44ch]">
						Esta sala (ou link) não existe — pode ter expirado depois
						do reveal, ou o código foi digitado errado. Volte para a home
						e comece uma nova rodada em menos de 60 segundos.
					</p>

					{/* Ações */}
					<div className="flex items-center gap-3.5 mt-2">
						<Button
							variant="coral"
							size="md"
							onClick={handleCreate}
							data-testid="not-found-create"
						>
							Criar sala
							<span aria-hidden="true">↗</span>
						</Button>
						<Button
							variant="default"
							size="md"
							onClick={handleBack}
							data-testid="not-found-back"
						>
							Voltar
						</Button>
					</div>
				</Card>
			</main>
		</div>
	);
}
