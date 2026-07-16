/**
 * Full page (sala cheia) — T29 (Phase 6).
 *
 * Edge case: tentativa de entrar em sala com 12/12 jogadores.
 * server responde `error { code: 'sala_cheia' }` (T13) → ws-client dispara
 * `setSalaEnded` no store e o cliente redireciona pra cá (T41 wire-up).
 *
 * **Visual**: bone-fill card centralizado, mark Ø + headline 'Sala cheia.'
 * + contagem 12/12 + sub explicativo + CTA coral 'Criar nova sala' (→
 * landing) + ghost 'Voltar' (history.back).
 *
 * **Referência**: `design/full.html` (wireframe legado).
 *
 * **A11y**: card com role="alert" para anunciar contexto; CTAs focáveis;
 * aria-label no card "Sala cheia".
 *
 * @see .specs/features/planning-poker-v1/tasks.md T29
 * @see .specs/features/planning-poker-v1/spec.md F-007 (F-ID US-1)
 */
import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "../components/theme-toggle";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

/** Máximo de jogadores por sala (consistente com SalaState.players.max). */
const MAX_PLAYERS = 12;

export function Full() {
	const navigate = useNavigate();

	// Sai da rota de erro para um destino previsivel: pagina inicial.
	// history.back() foi removido por ser imprevisivel em deep links
	// (pode voltar a uma sala ja encerrada).
	const goHome = useCallback((): void => {
		navigate("/");
	}, [navigate]);

	return (
		<div
			data-testid="page-full"
			className="surface-noise min-h-[100dvh] bg-bg text-ink flex flex-col"
		>
			{/* Metadata strip top */}
			<header className="border-b border-ink/10 py-2.5 flex-shrink-0">
				<div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-16 flex items-center justify-between">
					<div className="flex items-center gap-4 font-mono text-micro-label uppercase tracking-wider text-ink-faint">
						<span
							aria-hidden="true"
							className="inline-block w-1.5 h-1.5 rounded-full bg-coral motion-reduce:animate-none animate-pulse"
						/>
						<Link
							to="/"
							data-testid="full-back"
							className="font-display font-bold text-caption tracking-tight text-ink normal-case flex items-baseline gap-1.5 hover:text-coral-deep transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coral-deep focus-visible:ring-offset-1 focus-visible:ring-offset-bg"
							aria-label="Pointly — página inicial"
						>
							<span className="font-italic italic text-coral text-vote-numeral leading-none">
								Ø
							</span>
							Pointly
						</Link>
					</div>
					<div className="flex items-center gap-4">
						<ThemeToggle />
						<div className="font-mono text-micro-label uppercase tracking-wider text-ink-faint">
							Sala cheia
						</div>
					</div>
				</div>
			</header>

			{/* Header strip */}
			<div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-16 w-full py-4 flex items-center justify-between font-mono text-micro-label uppercase tracking-wider text-ink-faint">
				<span>Sala lotada</span>
				<span>Esta sala atingiu o limite</span>
			</div>

			{/* Stage */}
			<main className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12 pb-[max(env(safe-area-inset-bottom),2rem)]">
				<Card
					padding="lg"
					className="w-full max-w-[560px] flex flex-col gap-6 transition-shadow duration-200"
					role="alert"
					aria-label="Sala cheia"
					data-od-id="full-card"
				>
					<div className="font-italic italic text-coral text-card-mark leading-none">
						Ø
					</div>
					<h1 className="font-display font-extrabold text-card-title text-balance">
						Sala cheia<span className="text-coral-deep">.</span>
					</h1>

					{/* Contagem 12/12 */}
					<div className="flex items-baseline gap-3 py-3.5 border-y border-coral/20 w-full">
						<span
							className="font-italic italic text-coral text-display-xl leading-none"
							data-testid="full-count"
						>
							{MAX_PLAYERS}
						</span>
						<span className="font-mono text-label tracking-wider uppercase text-ink-faint">
							/ {MAX_PLAYERS} · máximo atingido
						</span>
					</div>

					<p className="font-sans text-caption text-ink-mute max-w-[42ch]">
						Esta sala já tem {MAX_PLAYERS} jogadores. Limitamos a mesa a
						{MAX_PLAYERS} assentos para manter a votação síncrona e a leitura do
						resultado clara. Crie uma sala nova ou volte para a página inicial e
						tente um código diferente.
					</p>

					<p className="font-mono text-micro-label tracking-caps uppercase text-ink-faint -mt-2">
						<q className="font-italic italic text-ink-mute normal-case tracking-normal text-caption mr-1.5">
							Doze cabeças pensam melhor que três.
						</q>
						mesas lotadas rendem mais
					</p>

					{/* Ações */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 mt-1">
						<Button
							variant="coral"
							size="lg"
							onClick={goHome}
							className="w-full sm:w-auto"
							data-testid="full-create-new"
						>
							Criar sala nova
							<span aria-hidden="true">↗</span>
						</Button>
						<Button
							variant="default"
							size="lg"
							onClick={() => navigate("/")}
							className="w-full sm:w-auto"
							data-testid="full-retry"
							aria-label="Voltar para a página inicial"
						>
							Voltar
						</Button>
					</div>
				</Card>
			</main>
		</div>
	);
}
