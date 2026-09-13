/**
 * Arena — mesa de votação (Spell dark, coluna única responsiva).
 *
 * - Lê `?code` + sessionStorage (`pointly.nick`); sem nick → `/join` (preserva code)
 * - Conecta via `connectArena` (loops): hello por (re)connect + ticker local
 * - Header: SharePill (código) + theme toggle
 * - Centro: copy por fase + resultado compacto pós-reveal + RevealButton
 * - Desktop: ArenaTable em órbita; mobile: votação antes da lista
 * - Deck (9) + TimerPill (vira "Em discussão" pós-reveal)
 * - R/N via mesmo clique do botão (confirmação unificada); ignora inputs/repeat
 * - Projéteis pós-reveal via ProjectileLayer
 * - Espelhos e2e: `__POINTLY_SALA__/__POINTLY_CONSENSUS__/__POINTLY_PLAYER_ID__`
 *   + DEV `__POINTLY_TEST__ { setSala, reset }`
 */
import type { ProjectileType, SalaState, Vote } from "@planning-poker/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Deck } from "@/components/arena/deck";
import { EmptyOverlay } from "@/components/arena/empty-overlay";
import { ArenaTable } from "@/components/arena/arena-table";
import { ProjectileLayer } from "@/components/arena/projectiles";
import { RevealButton } from "@/components/arena/reveal-button";
import { SeatCard } from "@/components/arena/seat-card";
import { SharePill } from "@/components/arena/share-pill";
import { StatsPill } from "@/components/arena/stats-pill";
import { TimerPill } from "@/components/arena/timer-pill";
import {
	connectArena,
	readStoredCode,
	readStoredNick,
	type ArenaConnection,
} from "@/lib/loops";
import { getOrCreateUUID } from "@/lib/identity";
import { useDesktop } from "@/lib/use-desktop";
import { useSalaStore } from "@/store/sala";
import { useTheme } from "@/theme/theme";

function isTypingTarget(e: KeyboardEvent): boolean {
	const t = e.target as HTMLElement | null;
	if (!t) return false;
	return (
		t instanceof window.HTMLInputElement ||
		t instanceof window.HTMLTextAreaElement ||
		t.isContentEditable
	);
}

export function Arena() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { theme, toggle } = useTheme();
	// Desktop = mesa com assentos em órbita; mobile = grade (nunca os dois:
	// testids `seat-*` precisam ser únicos; jsdom cai na grade).
	const isDesktop = useDesktop();

	const urlCode = (searchParams.get("code") || "").toUpperCase();
	const [nick] = useState<string>(() => readStoredNick() ?? "");
	// UUID validado (regenera se inválido) — mesma chave da join page.
	const [uuid] = useState<string>(getOrCreateUUID);
	const connRef = useRef<ArenaConnection | null>(null);
	const revealRef = useRef<HTMLButtonElement>(null);

	const sala = useSalaStore((s) => s.sala);
	const currentPlayerId = useSalaStore((s) => s.currentPlayerId);
	const consensus = useSalaStore((s) => s.consensus);

	// Sem nick → volta pro join preservando o code
	useEffect(() => {
		if (!nick) {
			const code = urlCode || readStoredCode() || "";
			navigate(code ? `/join?code=${code}` : "/join", { replace: true });
		}
	}, [nick, urlCode, navigate]);

	// Conexão única (StrictMode desligado no main — sem remount quebrando o WS)
	useEffect(() => {
		if (!nick || !uuid) return;
		const conn = connectArena({ nick, code: urlCode, uuid, navigate });
		connRef.current = conn;
		return () => {
			connRef.current = null;
			conn.close();
		};
	}, [nick, urlCode, uuid, navigate]);

	// Guard de saída com sala ativa (reload/fechar aba)
	useEffect(() => {
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (useSalaStore.getState().sala !== null) {
				e.preventDefault();
				e.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", onBeforeUnload);
		return () => window.removeEventListener("beforeunload", onBeforeUnload);
	}, []);

	// Espelhos e2e no window
	useEffect(() => {
		const w = window as unknown as Record<string, unknown>;
		const sync = () => {
			const st = useSalaStore.getState();
			w.__POINTLY_SALA__ = st.sala ?? undefined;
			w.__POINTLY_CONSENSUS__ = st.consensus ?? undefined;
			w.__POINTLY_PLAYER_ID__ = st.currentPlayerId;
		};
		sync();
		const unsub = useSalaStore.subscribe(sync);
		try {
			if (import.meta.env.DEV) {
				w.__POINTLY_TEST__ = {
					setSala: (s: SalaState) => useSalaStore.getState().setSala(s),
					reset: () => useSalaStore.getState().reset(),
				};
			}
		} catch {
			// import.meta indisponível fora do Vite — espelhos já bastam
		}
		return () => {
			unsub();
			try {
				delete w.__POINTLY_SALA__;
				delete w.__POINTLY_CONSENSUS__;
				delete w.__POINTLY_PLAYER_ID__;
				delete w.__POINTLY_TEST__;
			} catch {
				// ignore
			}
		};
	}, []);

	const me = useMemo(
		() => sala?.players.find((p) => p.id === currentPlayerId) ?? null,
		[sala, currentPlayerId],
	);
	const myVote: Vote | null = me?.value ?? null;
	const votedCount = useMemo(
		() => sala?.players.filter((p) => p.hasVoted).length ?? 0,
		[sala],
	);
	const roundVotes = useMemo(
		() =>
			(sala?.players ?? [])
				.map((p) => p.value)
				.filter((v): v is NonNullable<typeof v> => v !== null),
		[sala],
	);
	const phase = sala?.phase ?? "idle";
	const faceUp = phase === "revealed";
	const playerCount = sala?.players.length ?? 0;
	const isOnlyPlayer =
		playerCount === 1 && sala?.players[0]?.id === currentPlayerId;
	const code = sala?.code ?? urlCode;

	const tableCopy =
		faceUp
			? "Votos revelados."
			: playerCount <= 1
			? "Tem lugar para o time."
			: votedCount === playerCount && playerCount > 0
				? "Todos votaram."
				: "Cada um no seu tempo.";
	const tableSub =
		faceUp
			? "Conversem sobre as diferenças."
			: playerCount <= 1
			? "Convide alguém para estimar com você."
			: votedCount === playerCount && playerCount > 0
				? "Revele agora ou aguarde — no zero, revela sozinho."
				: `${votedCount} de ${playerCount} pessoas votaram`;

	const handleCardSelect = useCallback(
		(value: Vote) => {
			// Mesma carta = no-op client-side (server também suprime; evita round-trip)
			if (value === myVote) return;
			connRef.current?.castVote(value);
		},
		[myVote],
	);

	const handleReveal = useCallback(() => {
		connRef.current?.requestReveal();
	}, []);

	const handleNewRound = useCallback(() => {
		connRef.current?.requestNewRound();
	}, []);

	const handleThrow = useCallback(
		(targetPlayerId: string, projectileType: ProjectileType) => {
			connRef.current?.throwProjectile(targetPlayerId, projectileType);
		},
		[],
	);

	// Teclado: R revela, N nova rodada (fora de inputs)
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e)) return;
			const st = useSalaStore.getState();
			const ph = st.sala?.phase ?? "idle";
			const votes = st.sala?.players.filter((p) => p.hasVoted).length ?? 0;
			if (e.key === "r" || e.key === "R") {
				if ((ph === "voting" || ph === "revealable") && votes > 0) {
					e.preventDefault();
					revealRef.current?.click();
				}
			} else if (e.key === "n" || e.key === "N") {
				if (ph === "revealed") {
					e.preventDefault();
					revealRef.current?.click();
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	if (!nick) return null;

	const progressPct =
		playerCount > 0 ? Math.round((votedCount / playerCount) * 100) : 0;

	// Centro da mesa (desktop) = copy da rodada + progresso + reveal.
	// No mobile o mesmo bloco vive na seção de status — uma instância por vez.
	const centerBlock = (
		<div className="w-full">
			{isOnlyPlayer && code && !faceUp ? <EmptyOverlay code={code} /> : (
			<section
				aria-live="polite"
				className="flex flex-col items-center gap-1.5 text-center"
			>
				<h2
					data-testid="arena-table-copy"
					className="max-w-[20ch] text-2xl font-medium tracking-tight text-balance"
				>
					{tableCopy}
				</h2>
				<p
					data-testid="arena-table-sub"
					className="max-w-[32ch] text-sm text-zinc-400 [html.light_&]:text-zinc-600"
				>
					{tableSub}
				</p>
				{!faceUp && playerCount > 1 && (
					<div
						aria-hidden="true"
						className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/10 [html.light_&]:bg-zinc-900/10"
					>
						<div
							className="h-full rounded-full bg-emerald-400 transition-[width] duration-300"
							style={{ width: `${progressPct}%` }}
						/>
					</div>
				)}
			</section>
			)}
			{faceUp && <div className="mt-3"><StatsPill consensus={consensus} votes={roundVotes} compact /></div>}
			<div
				data-testid="arena-reveal-wrapper"
				className="mt-4 flex justify-center"
			>
				<RevealButton
					buttonRef={revealRef}
					phase={phase}
					votedCount={votedCount}
					onReveal={handleReveal}
					onNewRound={handleNewRound}
				/>
			</div>
		</div>
	);

	const deckBlock = (
		<section
			aria-label="Sua votação"
			data-testid="arena-deck-wrapper"
			className="w-full max-w-3xl border-t border-[#26262c] pt-4 pb-2 [html.light_&]:border-zinc-300"
		>
			<div className="mb-3 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center">
				<h2 className="text-sm font-medium">
					{faceUp ? "Você pode ajustar seu voto" : myVote !== null ? `Seu voto: ${myVote} · Você pode mudar de ideia` : "Qual é a sua estimativa?"}
				</h2>
				<p className="hidden text-xs text-zinc-400 sm:block [html.light_&]:text-zinc-600">
					<kbd className="rounded border border-current/30 px-1 font-mono">{faceUp ? "N" : "R"}</kbd> {faceUp ? "nova rodada" : "revelar"}
				</p>
			</div>
			<Deck currentVote={myVote} onSelect={handleCardSelect} />
		</section>
	);

	return (
		<div
			data-testid="page-arena"
			className="flex min-h-dvh flex-col bg-[#09090b] bg-[radial-gradient(ellipse_70%_40%_at_50%_-5%,rgba(52,211,153,0.08),transparent_70%)] text-zinc-100 [html.light_&]:bg-zinc-100 [html.light_&]:bg-[radial-gradient(ellipse_70%_40%_at_50%_-5%,rgba(16,185,129,0.12),transparent_70%)] [html.light_&]:text-zinc-900"
		>
			<header className="sticky top-0 z-40 border-b border-[#26262c] bg-[#09090b] [html.light_&]:border-zinc-200 [html.light_&]:bg-white">
				<div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
				<Link
					to="/"
					aria-label="Pointly — página inicial"
					className="flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
				>
					<span aria-hidden="true" className="grid grid-cols-2 gap-[3px]">
						<span className="h-2 w-2 rounded-[3px] bg-zinc-100 [html.light_&]:bg-zinc-900" />
						<span className="h-2 w-2 rounded-[3px] bg-zinc-100 [html.light_&]:bg-zinc-900" />
						<span className="h-2 w-2 rounded-[3px] bg-zinc-100 [html.light_&]:bg-zinc-900" />
						<span className="h-2 w-2 rounded-[3px] bg-emerald-400" />
					</span>
					<span className="font-mono text-sm font-bold tracking-[0.12em] uppercase">
						Pointly
					</span>
				</Link>
				<div className="flex items-center gap-2">
					<SharePill code={code} />
					<button
						type="button"
						data-testid="theme-toggle"
						onClick={toggle}
						aria-label={
							theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"
						}
						title={theme === "dark" ? "Tema claro" : "Tema escuro"}
						className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#2b2b31] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 [html.light_&]:border-zinc-300 [html.light_&]:text-zinc-600 [html.light_&]:hover:text-zinc-900"
					>
						{theme === "dark" ? (
							<Sun aria-hidden="true" className="h-5 w-5" />
						) : (
							<Moon aria-hidden="true" className="h-5 w-5" />
						)}
					</button>
				</div>
				</div>
			</header>

			<h1 className="sr-only">
				{code
					? `Sala ${code} · rodada ${String(sala?.round ?? 1).padStart(2, "0")}`
					: "Sala · rodada atual"}
			</h1>

			<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-5 px-4 py-5 sm:px-6">
				<div className="flex w-full flex-wrap items-center justify-center gap-2">
					<TimerPill />
				</div>

				{isDesktop ? (
					<ArenaTable
						players={sala?.players ?? []}
						currentPlayerId={currentPlayerId}
						faceUp={faceUp}
						onThrow={handleThrow}
						center={centerBlock}
					/>
				) : (
					<>
						{centerBlock}
						{deckBlock}
						<section
							aria-label={`Jogadores na sala (${playerCount})`}
							className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2"
						>
							{(sala?.players ?? []).map((p) => (
								<SeatCard
									key={p.id}
									player={p}
									isYou={p.id === currentPlayerId}
									faceUp={faceUp}
									onThrow={handleThrow}
								/>
							))}
						</section>
					</>
				)}

				{isDesktop && deckBlock}
			</main>

			<ProjectileLayer />
		</div>
	);
}
