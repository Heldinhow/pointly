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
import { useNavigate, Link } from "react-router-dom";
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
			className="surface-noise min-h-screen bg-bg text-ink flex flex-col"
		>
			{/* Metadata strip top */}
			<header className="border-b border-ink/10 py-2.5 flex-shrink-0">
				<div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-16 flex items-center justify-between">
					<div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
						<span
							aria-hidden="true"
							className="inline-block w-1.5 h-1.5 rounded-full bg-coral animate-pulse"
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
						Sala cheia
					</div>
				</div>
			</header>

			{/* Header strip */}
			<div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-16 w-full py-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-ink-faint">
				<span>Sala lotada</span>
				<span>Esta sala atingiu o limite</span>
			</div>

			{/* Stage */}
			<main className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12">
				<Card
					padding="lg"
					className="w-full max-w-[560px] flex flex-col gap-6 transition-shadow duration-200"
					role="alert"
					aria-label="Sala cheia"
					data-od-id="full-card"
				>
					<div className="font-italic italic text-coral text-[36px] leading-none">
						Ø
					</div>
					<h1 className="font-display font-extrabold text-[34px] leading-[1.05] tracking-[-0.03em] text-balance">
						Sala cheia<span className="text-coral">.</span>
					</h1>

					{/* Contagem 12/12 */}
					<div className="flex items-baseline gap-3 py-3.5 border-y border-coral/20 w-full">
						<span
							className="font-italic italic text-coral text-[42px] leading-none"
							data-testid="full-count"
						>
							{MAX_PLAYERS}
						</span>
						<span className="font-mono text-[11px] tracking-wider uppercase text-ink-faint">
							/ {MAX_PLAYERS} · máximo atingido
						</span>
					</div>

					<p className="font-sans text-[14.5px] leading-[1.6] text-ink-mute max-w-[42ch]">
						Esta sala já tem {MAX_PLAYERS} jogadores. Limitamos a mesa a
						{MAX_PLAYERS} assentos para manter a votação síncrona e a
						leitura do resultado clara. Crie uma sala nova ou volte para a
						página inicial e tente um código diferente.
					</p>

					<p className="font-mono text-[10.5px] tracking-[0.04em] uppercase text-ink-faint -mt-2">
						<q className="font-italic italic text-ink-mute normal-case tracking-normal text-[12.5px] mr-1.5">
							Doze cabeças pensam melhor que três.
						</q>
						mesas lotadas rendem mais
					</p>

					{/* Ações */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 mt-1">
						<Button
							variant="coral"
							size="md"
							onClick={goHome}
							className="w-full sm:w-auto"
							data-testid="full-create-new"
						>
							Criar sala nova
							<span aria-hidden="true">↗</span>
						</Button>
						<Button
							variant="default"
							size="md"
							onClick={goHome}
							className="w-full sm:w-auto"
							data-testid="full-back"
						>
							Voltar ao início
						</Button>
					</div>
				</Card>
			</main>
		</div>
	);
}