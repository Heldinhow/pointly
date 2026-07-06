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
 *  - R_x=420, R_y=240 (relativo ao centro do Ellipse 960×560)
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
import { useCallback, useMemo, useState, useEffect } from "react";
import { useSearchParams, Link, useBlocker } from "react-router-dom";
import { buildShareUrl } from "../components/empty-overlay";
import { cn } from "../components/ui/utils";
import { Deck } from "../components/deck";
import { EmptyOverlay } from "../components/empty-overlay";
import { Ellipse } from "../components/ui/ellipse";
import { RevealButton } from "../components/reveal-button";
import { Seat } from "../components/seat";
import { HelpModal } from "../components/help-modal";
import { useKeyboardShortcuts } from "../lib/use-keyboard-shortcuts";
import { StatsPill } from "../components/stats-pill";
import { TimerPill } from "../components/timer-pill";
import { useArenaLoop, getStoredUUID } from "../lib/use-arena-loop";
import { getNick } from "../lib/storage";
import { useSalaStore } from "../store/sala";
import { ProjectileAnimator } from "../components/projectile-animator";

/** Raio da mesa em pixels (vide arena.html R_x=420 R_y=240). */
const TABLE_RX = 420;
const TABLE_RY = 210;
/** Centro do Ellipse SVG (960×560). */
const TABLE_CX = 480;
const TABLE_CY = 250;

/** Share pill — copia link da sala e mostra feedback destacado. */
function SharePill({ code }: { code: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
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
			className={cn(
				"inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.06em] uppercase border transition-all duration-200 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coral",
				copied
					? "bg-olive border-transparent text-white"
					: "bg-surface border-coral text-coral hover:bg-coral hover:text-white",
			)}
			aria-label={
				copied
					? "Link copiado com sucesso"
					: "Copiar link de compartilhamento da sala"
			}
		>
			<span className="font-sans text-[11px] leading-none" aria-hidden="true">
				{copied ? "✓" : "📋"}
			</span>
			<span>{copied ? "Link Copiado!" : `Compartilhar: ${code || "—"}`}</span>
		</button>
	);
}

/** Calcula posição (left, top) para um assento dado seu ângulo (graus, 0=right, 90=bottom). */
export function seatPosition(angleDeg: number): { left: number; top: number } {
	const rad = (angleDeg * Math.PI) / 180;
	return {
		left: TABLE_CX + Math.cos(rad) * TABLE_RX,
		top: TABLE_CY + Math.sin(rad) * TABLE_RY,
	};
}

/** Distribui 12 assentos: VOCÊ no ângulo 90 (bottom); demais 11 em arco. */
function assignSeatAngles(
	mePlayerId: string | null,
	playerIds: string[],
): Map<string, number> {
	const map = new Map<string, number>();
	// VOCÊ travado em 90° (6h)
	if (mePlayerId) map.set(mePlayerId, 90);

	// Demais em arco: 11 assentos a 30° de espaçamento começando em 30°
	const others = playerIds.filter((id) => id !== mePlayerId);
	for (let i = 0; i < others.length; i++) {
		// i=0 → 30°; i=10 → 330° (clockwise)
		const angle = 30 + i * 30;
		map.set(others[i]!, angle);
	}
	return map;
}

export function Arena() {
	const [searchParams] = useSearchParams();
	const urlCode = (searchParams.get("code") || "").toUpperCase();

	// Lê nick pré-preenchido do sessionStorage (T08 / ADR-006).
	// Tab-close apaga; preenche se voltou na mesma aba.
	const [nick] = useState<string>(() => getNick() ?? "");
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
				"Deseja mesmo sair da sala? Seu voto e participação serão perdidos.",
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

	function handleCardSelect(
		value: Parameters<typeof Deck>[0]["onSelect"] extends (v: infer V) => void
			? V
			: never,
	): void {
		// T38: envia cast_vote via WS
		castVote(value);
	}

	function handleReveal(): void {
		// T39: envia reveal_votes via WS
		requestReveal();
	}

	function handleNewRound(): void {
		// T40: envia start_new_round via WS
		requestNewRound();
	}

	// T09 / BUG-306 / ADR-007 — atalhos de teclado.
	// `R` revela (qualquer player, fase voting, ≥1 voto),
	// `N` inicia nova rodada (qualquer player, fase revealed),
	// `?` / `/` abre help modal, `Esc` fecha modais/overlays.
	// Sem host-gate: ADR-0002 diz que reveal/new-round são ações de
	// qualquer player (regra democratizada).
	const [openHelp, setOpenHelp] = useState(false);
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
			<header className="border-b border-ink/10 py-2.5 flex-shrink-0">
				<div className="max-w-[1360px] mx-auto px-6 flex items-center justify-between">
					<div className="flex items-center gap-4 flex-wrap">
						<Link
							to="/"
							className="font-display font-extrabold text-[18px] tracking-[-0.03em] flex items-baseline gap-1.5 hover:text-coral transition-colors flex-shrink-0"
						>
							<span className="font-italic italic text-coral text-[20px] leading-none">
								Ø
							</span>
							Pointly
						</Link>
						<dl className="font-mono text-[9px] text-ink-faint uppercase tracking-wider flex items-center gap-1.5 flex-wrap m-0">
							<div className="flex items-baseline gap-1">
								<dt>Sala</dt>
								<dd
									className="text-ink font-medium m-0"
									data-testid="arena-code"
								>
									{code || "—"}
								</dd>
							</div>
							<span aria-hidden="true">·</span>
							<div className="flex items-baseline gap-1">
								<dt>Rodada</dt>
								<dd className="text-ink font-medium m-0" data-testid="arena-round">
									{String(sala?.round ?? 1).padStart(2, "0")}
								</dd>
							</div>
							<span aria-hidden="true">·</span>
							<div className="flex items-baseline gap-1">
								<dt>Você</dt>
								<dd
									className="text-ink font-medium m-0"
									data-testid="arena-self-nick"
								>
									{me?.nick ?? "—"}
								</dd>
							</div>
						</dl>
					</div>
					<SharePill code={code} />
				</div>
			</header>

			{/* Stage */}
			<main
				className="flex-1 relative flex flex-col items-center justify-center px-12 overflow-hidden"
				data-testid="arena-stage"
			>
				{/* Stats pill (top-left, absolute) */}
				<div className="absolute top-3.5 left-12 z-10">
					<StatsPill consensus={consensus} />
				</div>

				{/* Timer pill (top-right, absolute) */}
				<div className="hidden md:block absolute top-3.5 right-12 z-10">
					<TimerPill />
				</div>

				{/* Empty overlay (sala solo): banner NÃO-bloqueante acima da mesa.
				   Renderizado antes da mesa para não competir com o deck no
				   bottom-8. Substitui o modal antigo (UX-011 / iter-3 hotfix). */}
				{isOnlyPlayer && code && (
					<EmptyOverlay key={emptyOverlayNonce} code={code} />
				)}

				{/* Mesa: Ellipse + 12 Seats + RevealButton central */}
				<div
					className="relative w-[960px] h-[500px] mt-6"
					data-testid="arena-table"
				>
					<Ellipse
						height={500}
						pulseWhenEmpty={isOnlyPlayer}
					/>

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

					{/* T9 — Skeleton placeholders: 2-3 slots aguardando jogador.
					   Renderiza quando sala é null OU tem <2 players.
					   pointer-events: none + aria-label para AT. */}
					{(sala === null || sala.players.length < 2) &&
						[0, 1, 2]
							.slice(0, sala === null ? 3 : Math.max(0, 3 - sala.players.length))
							.map((slot) => {
							const slotAngles = [180, 220, 140];
							const angle = slotAngles[slot] ?? 180;
							const pos = seatPosition(angle);
							return (
								<div
									key={`slot-${slot}`}
									className="absolute pointer-events-none opacity-30"
									style={{
										left: `${pos.left}px`,
										top: `${pos.top}px`,
										transform: "translate(-50%, -50%)",
									}}
									aria-label="Slot aguardando jogador"
									data-testid={`arena-slot-${slot}`}
								>
									<div className="w-24 h-32 bg-surface rounded-card border border-dashed border-ink/15 flex items-center justify-center">
										<span className="font-mono text-[9px] tracking-[0.08em] uppercase text-ink-faint">
											Aguardando…
										</span>
									</div>
								</div>
							);
						})}

					{/* UX-005: esconde RevealButton enquanto não há jogadores
					   conectados. Sem isso o botão "AGUARDANDO 0 JOGADORES…"
					   compete por atenção com o CTA de invite. */}
					{sala !== null && sala.players.length > 0 && (
						<RevealButton
							phase={phase}
							votedCount={votedCount}
							totalPlayers={sala.players.length}
							onReveal={handleReveal}
							onNewRound={handleNewRound}
						/>
					)}

					{/* Animações de arremessos */}
					<ProjectileAnimator />
				</div>

				{/* Deck dock (bottom center) */}
				<div
					className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 fib-deck-responsive-wrapper sm:w-auto sm:max-w-none"
					data-testid="arena-deck-wrapper"
				>
					<Deck
						currentVote={myVote}
						disabled={false}
						onSelect={handleCardSelect}
					/>
				</div>

				{/* Help modal (atalhos de teclado) — abre com ? */}
				<HelpModal open={openHelp} onClose={() => setOpenHelp(false)} />
			</main>
		</div>
	);
}
