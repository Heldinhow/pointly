/**
 * Arena shell — T30 (Phase 6) + mobile-first redesign (Phase 7).
 *
 * **Composição**:
 *  - Header: SiteHeader da landing (brand + ThemeToggle + SharePill)
 *  - Stage (main): branch em viewport
 *    - Mobile (<sm, 640px): TimerPill em fluxo + MobilePlayerList
 *      (vertical scroll) + MobileRevealDock (sticky bottom-0)
 *    - Desktop (≥sm): StatsPill + TimerPill counter-scaled + Round-table
 *      trigonométrico + Deck counter-scaled + RevealButton central
 *  - EmptyOverlay (só quando isOnlyPlayer) — sibling
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
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Deck } from "../components/deck";
import { buildShareUrl } from "../components/empty-overlay";
import { EmptyOverlay } from "../components/empty-overlay";
import { MobilePlayerList } from "../components/mobile-arena/MobilePlayerList";
import { MobileRevealDock } from "../components/mobile-arena/MobileRevealDock";
import { ProjectileAnimator } from "../components/projectile-animator";
import { RevealButton } from "../components/reveal-button";
import { Seat } from "../components/seat";
import { SiteHeader } from "../components/site-header";
import { StatsPill } from "../components/stats-pill";
import { TimerPill } from "../components/timer-pill";
import { cn } from "../components/ui/utils";
import { getNick } from "../lib/storage";
import { getStoredUUID, useArenaLoop } from "../lib/use-arena-loop";
import { useIsMobile } from "../lib/use-is-mobile";
import { useKeyboardShortcuts } from "../lib/use-keyboard-shortcuts";
import { useSalaStore } from "../store/sala";
import { assignSeatAngles, seatPosition } from "../lib/arena-geometry";
import "../styles/arena.css";
import "../styles/landing.css";
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
				"inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-sans text-micro-label border cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)] min-h-[44px]",
				"disabled:opacity-50 disabled:cursor-not-allowed",
				copied
					? "bg-success-soft border-success text-success"
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
					className="w-3 h-3 flex-shrink-0"
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
			{!copied && (
				<span className="font-mono text-micro-label uppercase tracking-caps opacity-70">
					Sala
				</span>
			)}
			<span className="font-mono font-bold text-label tabular-nums">
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

	// Saída com sala ativa: o `beforeunload` nativo é o único guardião
	// (recarregar/fechar). Sem `window.confirm` custom duplicando a
	// pergunta na navegação interna da SPA.
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
	// Votos efetivamente dados na rodada (values só existem pós-reveal).
	const roundVotes = useMemo(
		() =>
			(sala?.players ?? [])
				.map((p) => p.value)
				.filter((v): v is NonNullable<typeof v> => v !== null),
		[sala],
	);
	const phase = sala?.phase ?? "idle";
	const faceUp = phase === "revealed";
	const unanimous = consensus?.unanimous ?? false;
	const playerCount = sala?.players.length ?? 0;

	// Copy do centro da mesa por estado (estudo mesa compartilhada):
	// 1 pessoa → convite; todos votaram → beat nomeado + regra do
	// auto-reveal (o que fazer: revelar agora ou aguardar o zero);
	// senão → andamento com contagem.
	const tableCopy =
		playerCount <= 1
			? "Tem lugar para o time."
			: votedCount === playerCount && playerCount > 0
				? "Todos votaram."
				: "Cada um no seu tempo.";
	const tableSub =
		playerCount <= 1
			? "Convide alguém para estimar com você."
			: votedCount === playerCount && playerCount > 0
				? "Revele agora ou aguarde — no zero, revela sozinho."
				: `${votedCount} de ${playerCount} pessoas votaram`;

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

	const stageRef = useRef<HTMLDivElement>(null);

	useKeyboardShortcuts({
		shortcuts: {
			R: () => {
				if ((phase === "voting" || phase === "revealable") && votedCount > 0) handleReveal();
			},
			N: () => {
				if (phase === "revealed") handleNewRound();
			},
		},
	});

	return (
		<div
			data-testid="page-arena"
			className="arena-shell surface-noise min-h-[100dvh] bg-bg text-ink flex flex-col"
		>
			{/* Header — o mesmo da landing (SiteHeader). Na sala, as ações
			    são ThemeToggle + SharePill; o brand volta para o início. */}
			<SiteHeader
				brandLabel="Sair da sala e voltar para a página inicial"
				actions={<SharePill code={code} />}
			/>

			<h1 className="sr-only">
				{code ? `Sala ${code} · rodada ${String(sala?.round ?? 1).padStart(2, "0")}` : "Sala · rodada atual"}
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
										"arena-stage arena-stage-mobile flex-1 relative flex flex-col overflow-hidden pt-[max(env(safe-area-inset-top),0.5rem)]"
						: // Desktop: mantém layout round-table existente com counter-scale.
										"arena-stage arena-stage-desktop flex-1 relative flex flex-col px-4 sm:px-8 lg:px-12 overflow-visible pt-[max(env(safe-area-inset-top),0.875rem)] pb-12"
				}
				style={isMobile ? { minHeight: "60dvh" } : { minHeight: "60vh" }}
			>
				{isOnlyPlayer && code && <EmptyOverlay code={code} />}

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
							unanimous={unanimous}
							consensus={consensus}
							votes={roundVotes}
						/>
						<MobileRevealDock
							phase={phase}
							myVote={myVote}
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
						{!faceUp && (
							<div className="arena-stats hidden sm:block">
								<StatsPill consensus={consensus} />
							</div>
						)}

						<div className="arena-timer">
							<TimerPill />
						</div>

						<div
							className="arena-table-wrap relative w-full max-w-[920px] mt-4 sm:mt-6 lg:mt-8 overflow-visible"
							data-testid="arena-table"
							role="group"
							aria-label="Mesa da rodada"
						>
							<div
								className={`arena-table-inner relative ${faceUp ? "arena-table-revealed" : ""}`}
								data-testid="arena-table-inner"
							>
								<div className="arena-felt" aria-hidden="true" />

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
											className="arena-seat-position absolute"
											style={{
												left: `${(pos.left / 960) * 100}%`,
												top: `${(pos.top / 560) * 100}%`,
												transform: "translate(-50%, -50%)",
												"--seat-card-x": `${-Math.cos(angle * Math.PI / 180) * 96}px`,
												"--seat-card-y": `${-Math.sin(angle * Math.PI / 180) * 74}px`,
												"--seat-card-angle": `${angle - 90}deg`,
												"--reveal-delay": `${(p.seatIndex % 10) * 26}ms`,
											} as CSSProperties}
											data-seat-angle={angle}
											data-seat-index={p.seatIndex}
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

								{/* Centro da mesa em fluxo (estudo): copy do estado +
								    botão empilhados, sem sobreposição. */}
								<div className="arena-center">
									<div className="arena-inlay">
										{faceUp ? (
											<div className="arena-center-stats">
												<StatsPill consensus={consensus} votes={roundVotes} />
											</div>
										) : (
											<>
												<h2
													className="arena-table-copy"
													data-testid="arena-table-copy"
												>
													{tableCopy}
												</h2>
												<p
													className="arena-table-sub"
													data-testid="arena-table-sub"
												>
													{tableSub}
												</p>
											</>
										)}
									</div>
									<div
										className="arena-reveal-slot"
										data-testid="arena-reveal-wrapper"
									>
										<RevealButton
											phase={phase}
											votedCount={votedCount}
											totalPlayers={sala?.players.length ?? 0}
											onReveal={handleReveal}
											onNewRound={handleNewRound}
											mode="inline"
											showShortcutHint
										/>
									</div>
								</div>
							</div>
						</div>

						<div
							className="arena-deck-slot"
							data-testid="arena-deck-wrapper"
						>
							<Deck
								currentVote={myVote}
								onSelect={handleCardSelect}
							/>
						</div>
					</>
				)}

			</main>
		</div>
	);
}
