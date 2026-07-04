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
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Deck } from "../components/deck";
import { EmptyOverlay } from "../components/empty-overlay";
import { Ellipse } from "../components/ui/ellipse";
import { RevealButton } from "../components/reveal-button";
import { Seat } from "../components/seat";
import { StatsPill } from "../components/stats-pill";
import { TimerPill } from "../components/timer-pill";
import { useArenaLoop, getStoredUUID } from "../lib/use-arena-loop";
import { useSalaStore } from "../store/sala";

/** Raio da mesa em pixels (vide arena.html R_x=420 R_y=240). */
const TABLE_RX = 420;
const TABLE_RY = 240;
/** Centro do Ellipse SVG (960×560). */
const TABLE_CX = 480;
const TABLE_CY = 280;

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

	// Lê nick pré-preenchido do localStorage (UX: se user voltou, preenche)
	const [nick] = useState<string>(() => {
		try {
			return localStorage.getItem("pointly.nick") ?? "";
		} catch {
			return "";
		}
	});
	// UUID persistente (ADR-0009)
	const uuid = getStoredUUID();

	// Conecta ao WS server via composition hook (T38-T41)
	const { castVote, requestReveal, requestNewRound } = useArenaLoop({
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

	return (
		<div
			data-testid="page-arena"
			className="surface-noise min-h-screen bg-bg text-ink flex flex-col overflow-hidden"
		>
			{/* Topbar metadata strip */}
			<header className="border-b border-ink/10 py-2.5 flex-shrink-0">
				<div className="max-w-[1480px] mx-auto px-12 flex items-center justify-between font-mono text-[10px] tracking-[0.06em] uppercase text-ink-faint">
					<div className="flex items-center gap-4">
						<span
							aria-hidden="true"
							className="inline-block w-1.5 h-1.5 rounded-full bg-coral animate-pulse"
						/>
						<span className="font-display font-extrabold text-[15px] tracking-[-0.02em] text-ink normal-case flex items-baseline gap-1.5">
							<span className="font-italic italic text-coral text-[18px] leading-none">
								Ø
							</span>
							Pointly
						</span>
						<span>
							Sala{" "}
							<span className="text-ink font-medium" data-testid="arena-code">
								{code || "—"}
							</span>
						</span>
					</div>
					<div>Fig. 03 · Arena</div>
				</div>
			</header>

			{/* Arena head: round + nick */}
			<div className="max-w-[1480px] mx-auto px-12 w-full py-3.5 flex items-center justify-between flex-shrink-0">
				<span
					className="font-mono text-[10px] tracking-[0.06em] uppercase text-ink-faint"
					data-testid="arena-round"
				>
					Fig. 03 · Round {String(sala?.round ?? 1).padStart(2, "0")}
				</span>
				<span
					className="font-mono text-[10px] tracking-[0.06em] uppercase text-ink-faint"
					data-testid="arena-self-nick"
				>
					Você · <span className="text-ink">{me?.nick ?? "—"}</span>
				</span>
			</div>

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
				<div className="absolute top-3.5 right-12 z-10">
					<TimerPill />
				</div>

				{/* Mesa: Ellipse + 12 Seats + RevealButton central */}
				<div
					className="relative w-[960px] h-[560px] mt-10"
					data-testid="arena-table"
				>
					<Ellipse>
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
									/>
								</div>
							);
						})}
					</Ellipse>

					{/* RevealButton central */}
					<RevealButton
						phase={phase}
						votedCount={votedCount}
						totalPlayers={sala?.players.length ?? 0}
						onReveal={handleReveal}
						onNewRound={handleNewRound}
					/>
				</div>

				{/* Deck dock (bottom center) */}
				<div
					className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
					data-testid="arena-deck-wrapper"
				>
					<Deck
						currentVote={myVote}
						disabled={faceUp}
						onSelect={handleCardSelect}
					/>
				</div>

				{/* Empty overlay (condicional: sala só com você) */}
				{isOnlyPlayer && code && (
					<EmptyOverlay
						code={code}
						onDismiss={() => {
							/* já é dismissado; sessão local */
						}}
					/>
				)}
			</main>
		</div>
	);
}
