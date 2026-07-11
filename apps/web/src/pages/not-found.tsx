/**
 * NotFound page — UX-001 (editorial 404 base) + UX-017 (editorial parity com Landing).
 *
 * View Atelier Zero completa: Ø mark + "404" display-xl coral com dot,
 * headline em Instrument Serif italic, sub em ink-soft, CTA coral "Criar sala"
 * + ghost "Voltar", `surface-noise::before` aplicado. Composição editorial
 * decorativa à direita do card (parity com Landing hero — UX-015).
 *
 * Atende:
 *  - Nielsen #9 (help users recognize errors)
 *  - Voz editorial Atelier Zero (paper bg, Ø brand mark, terracota accent)
 *  - UX-001: branding + ilustração + CTA de retorno
 *  - UX-017: parity com Landing (display serif + composição editorial)
 *  - A11y: <h1> hierárquico, CTAs focáveis, aria-label no card, role="alert"
 *
 * @see docs/ux-review/UX_REVIEW.md §3 UX-001
 * @see docs/ux-review/iter-4-audit.md §2 UX-017
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
			{/* Metadata strip top — padrão Landing (UX-017 parity) */}
			<header className="border-b border-ink/10 py-3 px-6 lg:px-16 bg-bg text-[10px] uppercase tracking-[0.04em] font-mono text-ink-faint flex-shrink-0">
				<div className="max-w-[1360px] mx-auto flex justify-between items-center">
					<div className="flex items-center gap-3">
						<span className="flex h-1.5 w-1.5 relative">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
							<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-coral" />
						</span>
						<span>Pointly · beta aberto</span>
					</div>
					<div>Voto perdido · Status 404</div>
				</div>
			</header>

			{/* Sticky nav — brand link (parity com Landing) */}
			<nav className="py-4 px-6 lg:px-16 max-w-[1360px] mx-auto flex justify-between items-center border-b border-ink/5 w-full flex-shrink-0">
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
				<span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
					Rota não encontrada
				</span>
			</nav>

			{/* Stage — 2-column editorial (card + composição decorativa) */}
			<main className="flex-1 flex items-center justify-center px-6 lg:px-16 py-10">
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12 items-center w-full max-w-[900px]">
					<Card
						padding="lg"
						className="flex flex-col gap-5"
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

						<h2 className="font-serif italic font-normal text-[clamp(28px,3vw,44px)] leading-[1.05] tracking-[-0.03em]">
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

					{/* Editorial composition — decorative (parity com Landing hero) */}
					<div
						className="hidden lg:block relative w-[260px] h-[260px] mx-auto"
						aria-hidden="true"
						data-testid="not-found-composition"
					>
						<div className="relative w-full h-full">
							{/* Terracota solid circle (back) */}
							<div className="absolute inset-x-0 top-2 mx-auto w-[200px] h-[200px] rounded-full bg-coral" />
							{/* Dotted outline circle (offset) */}
							<div className="absolute inset-0 m-auto w-[230px] h-[230px] rounded-full border-2 border-dashed border-coral/45" />
							{/* Monumental serif glyph Ø */}
							<span className="absolute inset-0 flex items-center justify-center font-serif italic text-[180px] leading-none text-paper-warm select-none">
								<span className="-translate-y-2">Ø</span>
							</span>
							{/* 2 folhas SVG */}
							<svg
								viewBox="0 0 60 60"
								className="absolute top-2 left-2 w-9 h-9 text-coral-soft"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									d="M30 6 C 16 14, 12 32, 30 54 C 48 32, 44 14, 30 6 Z M30 12 L30 50"
									stroke="currentColor"
									strokeWidth="1"
									fill="none"
								/>
							</svg>
							<svg
								viewBox="0 0 60 60"
								className="absolute bottom-2 right-4 w-7 h-7 text-coral-soft rotate-45"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									d="M30 6 C 16 14, 12 32, 30 54 C 48 32, 44 14, 30 6 Z M30 12 L30 50"
									stroke="currentColor"
									strokeWidth="1"
									fill="none"
								/>
							</svg>
							{/* Mono plate label */}
							<span className="absolute bottom-1 right-2 font-mono text-[8px] tracking-[0.18em] uppercase text-coral-soft/90">
								Nº 404
							</span>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
