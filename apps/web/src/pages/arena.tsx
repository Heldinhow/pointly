/**
 * Arena shell — T30 (Phase 6) + mobile-first redesign (Phase 7).
 *
 * **Composição**:
 *  - Header (topbar: wordmark + ThemeToggle + SharePill) — sempre
 *  - Stage (main): branch em viewport
 *    - Mobile (<sm, 640px): TimerPill em fluxo + MobilePlayerList
 *      (vertical scroll) + MobileRevealDock (sticky bottom-0)
 *    - Desktop (≥sm): StatsPill + TimerPill counter-scaled + Round-table
 *      trigonométrico + Deck counter-scaled + RevealButton central
 *  - EmptyOverlay (só quando isOnlyPlayer) + HelpModal — sibling
 *
 * **Counter-Scale Rule (DESIGN.md §4)**: desktop usa `transform: scale()`
 * no arena-table-inner + counter-scale em TimerPill/Deck pra tap targets.
 * Mobile dispensa o scale inteiro (round-table é removido) — Counter-Scale
 * Rule é exclusiva do layout desktop.
 *
 * **WS wire-up** (Phase 7 — T38/T41): useArenaLoop conecta WS + setSala
 * + castVote / requestReveal / requestNewRound / throwProjectile.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T30
 * @see .specs/features/planning-poker-v1/spec.md F-007, F-053
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useSearchParams } from "react-router-dom";
import { Deck } from "../components/deck";
import { buildShareUrl } from "../components/empty-overlay";
import { EmptyOverlay } from "../components/empty-overlay";
import { HelpModal } from "../components/help-modal";
import { MobilePlayerList } from "../components/mobile-arena/MobilePlayerList";
import { MobileRevealDock } from "../components/mobile-arena/MobileRevealDock";
import { ProjectileAnimator } from "../components/projectile-animator";
import { RevealButton } from "../components/reveal-button";
import { Seat } from "../components/seat";
import { StatsPill } from "../components/stats-pill";
import { ThemeToggle } from "../components/theme-toggle";
import { TimerPill } from "../components/timer-pill";
import { Ellipse } from "../components/ui/ellipse";
import { cn } from "../components/ui/utils";
import { getNick } from "../lib/storage";
import { getStoredUUID, useArenaLoop } from "../lib/use-arena-loop";
import { useIsMobile } from "../lib/use-is-mobile";
import { useKeyboardShortcuts } from "../lib/use-keyboard-shortcuts";
import { useSalaStore } from "../store/sala";
import { assignSeatAngles, seatPosition } from "../lib/arena-geometry";
export { seatPosition };

/** Share pill — copia link da sala e mostra feedback destacado. */
function SharePill({ code }: { code: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		// Guard: code vazio (race com welcome do WS) — não copia link quebrado
		if (!code) return;
		const url = buildShareUrl(window.location.origin, code);
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(url);
				setCopied(true);
				setTimeout(() => setCopied(false), 1800);
				return;
			}
		} catch (e) {
			// ignore and proceed to fallback
		}

		// Fallback para navegadores sem Clipboard API / HTTP inseguro
		try {
			const textArea = document.createElement("textarea");
			textArea.value = url;
			textArea.style.position = "fixed";
			textArea.style.opacity = "0";
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			setCopied(true);
			setTimeout(() => setCopied(false), 1800);
		} catch (err) {
			console.error("Cópia falhou", err);
		}
	}, [code]);

	return (
		<button
			type="button"
			onClick={handleCopy}
			data-testid="share-pill"
			disabled={!code}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-micro-label tracking-[0.06em] uppercase border transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-deep focus-visible:ring-offset-1 focus-visible:ring-offset-bg min-h-[44px]",
				"disabled:opacity-50 disabled:cursor-not-allowed",
				copied
					? "bg-olive border-transparent text-white"
					: "bg-surface border-ink/10 text-ink-soft hover:bg-paper-dark hover:border-ink/25 hover:text-ink",
			)}
			aria-label={
				copied
					? "Link copiado com sucesso"
					: code
						? `Copiar link de compartilhamento da sala ${code}`
						: "Aguardando código da sala para copiar link"
			}
			title={!code ? "Código da sala ainda não está disponível" : undefined}
		>
			{copied ? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="w-3 h-3 text-white flex-shrink-0"
					aria-hidden="true"
				>
					<path d="M20 6 9 17l-5-5" />
				</svg>
			) : (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="w-3 h-3 text-ink-soft hover:text-ink flex-shrink-0"
					aria-hidden="true"
				>
					<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
					<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
				</svg>
			)}
			<span>
				{copied ? "Copiado!" : code || "—"}
			</span>
		</button>
	);
}


export function Arena() {
	const [searchParams] = useSearchParams();
	const urlCode = (searchParams.get("code") || "").toUpperCase();

	// Lê nick pré-preenchido do sessionStorage (T08 / ADR-006).
	// Tab-close apaga; preenche se voltou na mesma aba.
	const [nick] = useState<string>(() => {
		try {
			return getNick() ?? "";
		} catch {
			// sessionStorage indisponível (modo privado, quota, etc) — não crashar
			return "";
		}
	});
	// UUID persistente (ADR-0009)
	const uuid = getStoredUUID();

	// Conecta ao WS server via composition hook (T38-T41)
	const { castVote, requestReveal, requestNewRound, throwProjectile } =
		useArenaLoop({
			nick,
			code: urlCode,
			uuid,
		});

	const sala = useSalaStore((s) => s.sala);
	const currentPlayerId = useSalaStore((s) => s.currentPlayerId);
	const consensus = useSalaStore((s) => s.consensus);
	const isOnlyPlayer = useSalaStore((s) => {
		const players = s.sala?.players ?? [];
		return players.length === 1 && players[0]?.id === s.currentPlayerId;
	});

	// Mobile-first branch: abaixo de 640px (Tailwind sm) usa o layout de
	// lista + dock sticky. Default `false` no SSR / primeira hidratação —
	// `useEffect` no hook sincroniza com matchMedia no mount sem flicker
	// perceptível (o conteúdo da Arena é absolute/scale-driven).
	const isMobile = useIsMobile();

	// O EmptyOverlay agora permanece ocultado após o primeiro dismiss do usuário na mesma sessão.
	const [emptyOverlayNonce] = useState(0);

	// Intercepta navegações internas da SPA quando o usuário está em uma sala ativa
	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			sala !== null && currentLocation.pathname !== nextLocation.pathname,
	);

	useEffect(() => {
		if (blocker.state === "blocked") {
			const confirmExit = window.confirm(
				"Sair da sala agora? Seu voto e sua participação na rodada atual serão perdidos.",
			);
			if (confirmExit) {
				blocker.proceed();
			} else {
				blocker.reset();
			}
		}
	}, [blocker]);

	// Intercepta recarregamento ou fechamento de aba/janela do navegador
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (sala !== null) {
				e.preventDefault();
				e.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [sala]);

	// Code exibido no topbar: prioriza o do store (server-created sala),
	// cai pro da URL (join flow). Ambos devem ser idênticos após welcome.
	const code = sala?.code ?? urlCode;

	const me = useMemo(
		() => sala?.players.find((p) => p.id === currentPlayerId) ?? null,
		[sala, currentPlayerId],
	);
	const myVote = me?.value ?? null;
	const votedCount = useMemo(
		() => sala?.players.filter((p) => p.hasVoted).length ?? 0,
		[sala],
	);
	const phase = sala?.phase ?? "idle";
	const faceUp = phase === "revealed";
	const unanimous = consensus?.unanimous ?? false;

	// Calcula mediana e votedMedian por player
	const median = consensus?.median ?? null;
	const seatAngles = useMemo(
		() =>
			assignSeatAngles(currentPlayerId, sala?.players.map((p) => p.id) ?? []),
		[currentPlayerId, sala],
	);

	const handleCardSelect = useCallback(
		(
			value: Parameters<typeof Deck>[0]["onSelect"] extends (v: infer V) => void
				? V
				: never,
		): void => {
			// EVR-03 / F-011: clicar na mesma carta que já está votada
			// é no-op client-side. Mesmo com o servidor também
			// suprimindo broadcasts em no-op (T5), este early-return
			// evita o WS round-trip desnecessário (latência ~rede +
			// processamento de handler). Single source of truth:
			// `myVote` é o estado autoritativo pós-reconciliação.
			if (value === myVote) return;
			castVote(value);
		},
		[castVote, myVote],
	);

	const handleReveal = useCallback((): void => {
		requestReveal();
	}, [requestReveal]);

	const handleNewRound = useCallback((): void => {
		requestNewRound();
	}, [requestNewRound]);

	const [openHelp, setOpenHelp] = useState(false);

	// FMR-08/09/22: ResizeObserver mede o stage container e computa
	// `--arena-scale` para a mesa fixa 960×560 caber em qualquer
	// viewport (mobile portrait, landscape, fold). MIN_SCALE 0.45 evita
	// tap targets ficarem inviáveis em viewports extremos.
	//
	// IMPORTANTE: no branch mobile (lista + dock), o round-table NÃO é
	// renderizado. Mesmo assim mantemos o setter de `--arena-scale` para
	// preservar compatibilidade com regras CSS em `index.css` que possam
	// referenciar a var (ex: PulsingDot no header). Mobile não sofre
	// com o valor porque nenhum elemento depende de escala no branch.
	const stageRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) return;

		const TABLE_W = 960;
		const TABLE_H = 560;
		const MIN_SCALE = 0.45;
		const VERTICAL_RESERVE = 220; // header + timer + stats pills + deck

		let raf = 0;
		const compute = () => {
			const sw = stage.clientWidth;
			const sh = stage.clientHeight;
			if (sw === 0 || sh === 0) return;
			const availW = Math.max(0, sw - 32); // px-4 padding each side
			const availH = Math.max(0, sh - VERTICAL_RESERVE);
			const scale = Math.max(
				MIN_SCALE,
				Math.min(1, availW / TABLE_W, availH / TABLE_H),
			);
			stage.style.setProperty("--arena-scale", String(scale));
		};

		const schedule = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(compute);
		};

		schedule();
		const ro = new ResizeObserver(schedule);
		ro.observe(stage);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	}, []);

	useKeyboardShortcuts({
		helpKey: "?",
		shortcuts: {
			R: () => {
				if (phase === "voting" && votedCount > 0) handleReveal();
			},
			N: () => {
				if (phase === "revealed") handleNewRound();
			},
			"?": () => setOpenHelp(true),
		},
	});

	return (
		<div
			data-testid="page-arena"
			className="surface-noise min-h-[100dvh] bg-bg text-ink flex flex-col overflow-hidden"
		>
			{/* Topbar — sempre presente, igual nos dois layouts. pt respeita
			    safe-area iOS via env(). `surface-noise` iguala a textura
			    da página (sem isso o topbar fica flat e aparece como uma
			    "lista" mais escura no meio da página texturizada). */}
			<header className="border-b border-ink/10 py-2.5 flex-shrink-0 pt-[max(env(safe-area-inset-top),0.625rem)] surface-noise">
				<div className="w-full px-4 sm:px-8 flex items-center justify-between font-mono text-micro-label tracking-[0.06em] uppercase text-ink-faint">
					<div className="flex items-center gap-4">
						<span
							aria-hidden="true"
							className="inline-block w-1.5 h-1.5 rounded-full bg-coral motion-reduce:animate-none animate-pulse"
						/>
						<Link
							to="/"
							className="font-display font-extrabold text-nav-wordmark tracking-[-0.02em] text-ink normal-case flex items-baseline gap-1.5 hover:text-coral transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coral-deep focus-visible:ring-offset-1 focus-visible:ring-offset-bg"
							aria-label="Sair da sala e voltar para a página inicial"
						>
							<span className="font-italic italic text-coral text-nav-mark leading-none">
								Ø
							</span>
							Pointly
						</Link>
						<span className="sr-only">
							Sala{" "}
							<span className="text-ink font-medium" data-testid="arena-code">
								{code || "—"}
							</span>
						</span>
					</div>
					<div className="flex items-center gap-3">
						<ThemeToggle />
						<SharePill code={code} />
					</div>
				</div>
			</header>

			<h1 className="sr-only">
				Sala {code || "—"} · rodada {String(sala?.round ?? 1).padStart(2, "0")}
			</h1>
			<div className="hidden">
				<span data-testid="arena-round-hidden-stub">
					Rodada {String(sala?.round ?? 1).padStart(2, "0")}
				</span>
				<span data-testid="arena-self-nick-hidden-stub">
					Você · <span className="text-ink">{me?.nick ?? "—"}</span>
				</span>
			</div>

			{/* Stage — branch mobile/desktop */}
			<main
				ref={stageRef}
				data-testid="arena-stage"
				className={
					isMobile
						? // Mobile: flex-col sem centering vertical — MobilePlayerList
							// faz flex-1 e scrolla internamente, MobileRevealDock sticky
							// fica ancorado no bottom safe-area. Sem arena-scale math.
							"flex-1 relative flex flex-col overflow-hidden pt-[max(env(safe-area-inset-top),0.5rem)]"
						: // Desktop: mantém layout round-table existente com counter-scale.
							"flex-1 relative flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 overflow-hidden pt-[max(env(safe-area-inset-top),0.875rem)] pb-32 sm:pb-36 lg:pb-40"
				}
				style={isMobile ? { minHeight: "60dvh" } : { minHeight: "60vh" }}
			>
				{isMobile ? (
					<>
						{/* PlayerList carrega o TimerPill in-flow dentro do
						    header strip — absoluto colide com o contador de
						    players. Counter-Scale Rule é exclusiva do desktop. */}
						<MobilePlayerList
							players={sala?.players ?? []}
							currentPlayerId={currentPlayerId}
							faceUp={faceUp}
							median={median}
						/>
						<MobileRevealDock
							phase={phase}
							myVote={myVote}
							disabled={false}
							votedCount={votedCount}
							totalPlayers={sala?.players.length ?? 0}
							onSelect={handleCardSelect}
							onReveal={handleReveal}
							onNewRound={handleNewRound}
						/>
					</>
				) : (
					<>
						{/* Desktop round-table — layout existente preservado */}
						<div className="hidden sm:block absolute top-3.5 left-3 sm:left-8 lg:left-12 z-10">
							<StatsPill consensus={consensus} />
						</div>

						<div
							className="absolute top-3.5 right-3 sm:right-8 lg:right-12 z-10 origin-top-right"
							style={{
								transform: `scale(calc(0.9 / var(--arena-scale, 1)))`,
								transformOrigin: "top right",
							}}
						>
							<TimerPill />
						</div>

						<div
							className="relative w-full max-w-[960px] mt-4 sm:mt-6 lg:mt-8 overflow-visible"
							data-testid="arena-table"
							role="group"
							aria-label="Mesa da rodada"
						>
							<div
								className="relative w-[960px] h-[560px] min-w-[960px]"
								data-testid="arena-table-inner"
							>
								<Ellipse width={920} height={500} className="absolute top-[30px] left-[20px]" />

								{sala?.players.map((p) => {
									const angle = seatAngles.get(p.id) ?? 0;
									const pos = seatPosition(angle);
									const isYou = p.id === currentPlayerId;
									const isMedianVote =
										faceUp &&
										median !== null &&
										p.value !== null &&
										(() => {
											const numericValue =
												p.value === "½"
													? 0.5
													: p.value === "☕"
														? null
														: Number(p.value);
											return numericValue === median;
										})();
									return (
										<div
											key={p.id}
											className="absolute"
											style={{
												left: `${pos.left}px`,
												top: `${pos.top}px`,
												transform: "translate(-50%, -50%)",
											}}
											data-seat-angle={angle}
										>
											<Seat
												player={p}
												isYou={isYou}
												faceUp={faceUp}
												votedMedian={Boolean(isMedianVote)}
												unanimous={unanimous}
												onThrow={throwProjectile}
											/>
										</div>
									);
								})}

								<ProjectileAnimator />
							</div>

							<div
								className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
								data-testid="arena-reveal-wrapper"
							>
								<RevealButton
									phase={phase}
									votedCount={votedCount}
									totalPlayers={sala?.players.length ?? 0}
									onReveal={handleReveal}
									onNewRound={handleNewRound}
								/>
							</div>
						</div>

						<div
							className="absolute bottom-2 sm:bottom-3 left-1/2 z-10"
							data-testid="arena-deck-wrapper"
							style={{
								transform: `translate(-50%, 0) scale(calc(1 / var(--arena-scale, 1)))`,
								transformOrigin: "center bottom",
							}}
						>
							<Deck
								currentVote={myVote}
								disabled={false}
								onSelect={handleCardSelect}
							/>
						</div>
					</>
				)}

				{/* Empty overlay (condicional: sala só com você) — sibling
				    comum dos dois branches, z-20 sobre tudo */}
				{isOnlyPlayer && code && (
					<EmptyOverlay key={emptyOverlayNonce} code={code} />
				)}

				<HelpModal open={openHelp} onClose={() => setOpenHelp(false)} />
			</main>
		</div>
	);
}
