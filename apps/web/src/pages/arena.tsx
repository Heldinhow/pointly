/**
 * Arena shell — T30 (Phase 6).
 *
 * Composição da arena: header + timer/stats pills + mesa (Ellipse + 12 Seats) +
 * deck (dock inferior) + reveal button central + empty overlay condicional.
 *
 * **Estrutura visual** (vide design/arena.html):
 *  - Topbar metadata strip (mono, fig, code)
 *  - Arena head: "FIG. 03 · ROUND 0X" + nick local
 *  - Stage: position relative
 *    - Stats pill (top-left, absoluto)
 *    - Timer pill (top-right, absoluto)
 *    - Ellipse SVG 960×560 com 12 assentos via (cos θ, sin θ) × R
 *    - RevealButton central (absolute, top-1/2 left-1/2)
 *    - Deck dock bottom-center (absolute)
 *    - EmptyOverlay (absolute, full stage) — condicional
 *
 * **Posicionamento dos assentos** (vide plan.md 6.4):
 *  - 12 assentos distribuídos via trig
 *  - VOCÊ travado em 6h (bottom-center)
 *  - Demais 11 em arco (30° de espaçamento)
 *  - R_x=420, R_y=210 (single source of truth em lib/arena-geometry.ts;
 *    `Ellipse 920×500` reserva 40px de folga em cada eixo → rx=(920-80)/2=420,
 *    ry=(500-80)/2=210)
 *
 * **WS wire-up** (Phase 7 — T38/T41):
 *  - Por enquanto stub: aceita props `sala` para testar render
 *  - `useSalaStore` é a single source of truth
 *  - Deck onSelect → log (T38 vai conectar com ws.send cast_vote)
 *  - RevealButton onReveal/onNewRound → log (T39/T40 vão conectar)
 *
 * **A11y**:
 *  - Topbar com fig + code em aria-label
 *  - Timer (role="timer") + Stats (role="status") com aria-live
 *  - Mesa com role="group" + aria-label="Mesa da rodada"
 *  - Deck com role="group" (delegado)
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
			// T38: envia cast_vote via WS
			castVote(value);
		},
		[castVote],
	);

	const handleReveal = useCallback((): void => {
		// T39: envia reveal_votes via WS
		requestReveal();
	}, [requestReveal]);

	const handleNewRound = useCallback((): void => {
		// T40: envia start_new_round via WS
		requestNewRound();
	}, [requestNewRound]);

	// T09 / BUG-306 / ADR-007 — atalhos de teclado.
	// `R` revela (qualquer player, fase voting, ≥1 voto),
	// `N` inicia nova rodada (qualquer player, fase revealed),
	// `?` / `/` abre help modal, `Esc` fecha modais/overlays.
	// Sem host-gate: ADR-0002 diz que reveal/new-round são ações de
	// qualquer player (regra democratizada).
	const [openHelp, setOpenHelp] = useState(false);

	// FMR-08/09/22: ResizeObserver mede o stage container e computa
	// `--arena-scale` para a mesa fixa 960×560 caber em qualquer
	// viewport (mobile portrait, landscape, fold). MIN_SCALE 0.45 evita
	// tap targets ficarem inviáveis em viewports extremos.
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
			className="surface-noise min-h-screen bg-bg text-ink flex flex-col overflow-hidden"
		>
			{/* Topbar metadata strip */}
			<header className="border-b border-ink/10 py-2.5 flex-shrink-0 pt-[max(env(safe-area-inset-top),0.625rem)]">
				<div className="w-full px-8 flex items-center justify-between font-mono text-micro-label tracking-[0.06em] uppercase text-ink-faint">
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
						{/* Código da sala: oculto visualmente, exposto a SR + testes.
						 * O código é mostrado pelo SharePill adjacente para o
						 * usuário copiar. Mantemos este nó pra que o leitor de
						 * tela anuncie o código ao focar o topbar. */}
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

			{/* Arena head: rodape removido — info já vive no Topbar (timer/stats pills).
			 * Strip "Rodada NN" e "Você · {nick}" ficaram ruidosos sem info nova. */}
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

			{/* Stage */}
			<main
				ref={stageRef}
				// pb-32 (128px) reserva espaço na base do stage pro deck dock
				// (counter-scale preservado, ver arena-deck-wrapper). Sem esse
				// padding o flex justify-center empurra a mesa pra baixo e o
				// deck cobre o assento VOCÊ (90°, bottom-center). FMR-09.
				className="flex-1 relative flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 overflow-hidden pt-[max(env(safe-area-inset-top),0.875rem)] pb-32 sm:pb-36 lg:pb-40"
				data-testid="arena-stage"
				style={{ minHeight: "60vh" }}
			>
				{/* Stats pill (top-left, absolute) — oculta em mobile <sm.
				 * Info crítica pós-reveal também aparece no destaque visual
				 * dos assentos mediana, então não há perda de informação. */}
				<div className="hidden sm:block absolute top-3.5 left-3 sm:left-8 lg:left-12 z-10">
					<StatsPill consensus={consensus} />
				</div>

				{/* Timer pill (top-right, absolute) — SEMPRE visível (FMR-11).
				 * Usuário precisa saber se está em estado crítico (≤30s) em
				 * qualquer viewport. Counter-scale (1/arena-scale) mantém o
				 * tamanho visual real do pill mesmo quando o stage é
				 * escalado pra caber na mesa (FMR-10: tap target ≥44). */}
				<div
					className="absolute top-3.5 right-3 sm:right-8 lg:right-12 z-10 origin-top-right"
					style={{
						transform: `scale(calc(0.9 / var(--arena-scale, 1)))`,
						transformOrigin: "top right",
					}}
				>
					<TimerPill />
				</div>

				{/* Mesa: Ellipse + 12 Seats + RevealButton central.
				 * Container responsivo. A mesa interna tem tamanho fixo
				 * 960×560 mas é escalada via `transform: scale(var(--arena-scale))`
				 * (computado por ResizeObserver no stage). FMR-08/09. */}
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

						{/* Seats posicionados via trigonometria */}
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

						{/* RevealButton central — FORA do arena-table-inner (não escalado)
						 * para garantir tap target ≥44px mesmo em escala 0.45 (mobile).
						 * ProjectileAnimator fica DENTRO do scaled inner pra os
						 * projéteis voarem entre assentos nas coords certas. */}
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

				{/* Deck dock (bottom center) — counter-scale (1/arena-scale) pra
				 * cartas manterem tap target ≥44px mesmo em escala 0.45.
				 * Encostado no canto inferior (bottom-2/3) pra maximizar a
				 * distância visual da mesa e nunca encostar no assento VOCÊ. */}
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

				{/* Empty overlay (condicional: sala só com você) */}
				{isOnlyPlayer && code && (
					<EmptyOverlay key={emptyOverlayNonce} code={code} />
				)}

				{/* Help modal (atalhos de teclado) — abre com ? */}
				<HelpModal open={openHelp} onClose={() => setOpenHelp(false)} />
			</main>
		</div>
	);
}
