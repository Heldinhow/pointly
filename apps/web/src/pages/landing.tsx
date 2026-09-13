import {
	computeConsensus,
	isUnanimous,
	type Player,
	type Vote,
} from "@planning-poker/shared";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { SeatCard } from "@/components/arena/seat-card";
import { StatsPill } from "@/components/arena/stats-pill";
import { useTheme } from "@/theme/theme";

const STEPS = [
	{ title: "Crie", body: "Abra uma sala e compartilhe o código com o time." },
	{ title: "Vote", body: "Cada pessoa escolhe uma carta em segredo." },
	{ title: "Revele", body: "Revelem juntos e conversem sobre as diferenças." },
] as const;

// Dados fictícios do exemplo. Nenhuma sala ou conexão com o servidor é criada.
const PREVIEW_PLAYERS: Player[] = ["Marina", "Rafa", "Bia"].map((nick, index) => ({
	id: `example-${index}`,
	uuid: `00000000-0000-4000-8000-00000000000${index}`,
	nick,
	role: index === 0 ? "host" : "player",
	seatIndex: index,
	hasVoted: true,
	value: (["3", "8", "5"] as const)[index]!,
	status: "connected",
	joinedAt: 1,
}));
const PREVIEW_DECK = ["1", "2", "3", "5", "8", "13"] as const;
const CONTROL = "inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-sm font-medium focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] motion-safe:transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40";

export function Landing() {
	const { theme, toggle } = useTheme();
	const [vote, setVote] = useState<Vote | null>(null);
	const [revealed, setRevealed] = useState(false);
	const players: Player[] = [
		...PREVIEW_PLAYERS,
		{
			id: "example-you",
			uuid: "00000000-0000-4000-8000-000000000003",
			nick: "Visitante",
			role: "player",
			seatIndex: 3,
			hasVoted: vote !== null,
			value: vote,
			status: "connected",
			joinedAt: 1,
		},
	];
	const votes: Vote[] = ["3", "8", "5", ...(vote === null ? [] : [vote])];

	return (
		<div data-testid="page-landing" className="flex min-h-dvh flex-col bg-[#09090b] font-sans text-zinc-100 [html.light_&]:bg-[#f5f5f5] [html.light_&]:text-zinc-900">
			<header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
				<span className="flex items-center gap-2.5 font-mono text-sm font-semibold tracking-[0.08em] uppercase">
					<span aria-hidden="true" className="grid grid-cols-2 gap-[3px]">
						<span className="h-2 w-2 rounded-[3px] bg-current" />
						<span className="h-2 w-2 rounded-[3px] bg-current" />
						<span className="h-2 w-2 rounded-[3px] bg-current" />
						<span className="h-2 w-2 rounded-[3px] bg-emerald-400" />
					</span>
					Pointly
				</span>
				<nav className="flex items-center gap-2" aria-label="navegação principal">
					<button type="button" onClick={toggle} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 text-zinc-300 [html.light_&]:border-zinc-300 [html.light_&]:text-zinc-600">
						{theme === "dark" ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}
					</button>
					<Link to="/join" className={CONTROL}>Entrar</Link>
				</nav>
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 pb-12 sm:px-8 sm:pt-16">
				<div className="grid items-start gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
					<div className="text-left lg:pt-8">
						<h1 className="max-w-[15ch] text-[clamp(2.75rem,5vw,4.25rem)] leading-[1.05] font-medium tracking-[-0.03em] text-balance">Planning poker sem fricção</h1>
						<p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-zinc-400 [html.light_&]:text-zinc-600">Estime histórias com seu time em tempo real. Sem cadastro, direto para a conversa.</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
							<Link to="/join?host=1" data-testid="landing-create" className={`${CONTROL} bg-zinc-100 text-zinc-950 [html.light_&]:bg-zinc-900 [html.light_&]:text-white`}>Criar uma sala</Link>
							<Link to="/join" data-testid="landing-join" className={`${CONTROL} border border-zinc-700 [html.light_&]:border-zinc-300`}>Entrar com código</Link>
						</div>
						<p className="mt-4 text-sm text-zinc-400 [html.light_&]:text-zinc-600">Grátis · Sem cadastro · Até 12 pessoas</p>
					</div>

					<section aria-labelledby="preview-title" className="min-w-0">
						<h2 id="preview-title" className="text-lg font-medium">Experimente uma rodada</h2>
						<p className="mt-1 text-sm text-zinc-400 [html.light_&]:text-zinc-600">Uma mesa de exemplo. Escolha sua carta e revele os votos.</p>
						<div className="mt-5 border-y border-[#26262c] py-5 [html.light_&]:border-zinc-300">
							<p className="mb-4 text-sm text-zinc-400 [html.light_&]:text-zinc-600" role="status">
								{revealed
									? "Votos revelados. Conversem sobre as diferenças."
									: vote === null
										? "3 de 4 votaram. Escolha sua carta para completar a mesa."
										: "4 de 4 votaram. Tudo pronto para revelar."}
							</p>
							<ul aria-label="Participantes do exemplo" className="grid gap-2 min-[400px]:grid-cols-2">
								{players.map((player) => (
									<li key={player.id}>
										<SeatCard
											player={player}
											isYou={player.id === "example-you"}
											faceUp={revealed}
											layout="row"
										/>
									</li>
								))}
							</ul>
						</div>
						{revealed ? (
							<div className="mt-5">
								<StatsPill consensus={{ ...computeConsensus(votes), unanimous: isUnanimous(votes) }} votes={votes} />
								<button
									type="button"
									className={`${CONTROL} mt-4 w-full border border-zinc-700 [html.light_&]:border-zinc-300`}
									onClick={() => {
										setVote(null);
										setRevealed(false);
									}}
								>
									Experimentar novamente
								</button>
							</div>
						) : (
							<>
								<fieldset className="mt-5">
									<legend className="text-sm font-medium">Sua estimativa</legend>
									<div className="mt-3 flex flex-wrap gap-2">
										{PREVIEW_DECK.map((value) => (
											<button
												key={value}
												type="button"
												aria-label={`Votar ${value}`}
												aria-pressed={vote === value}
												onClick={() => setVote(value)}
												className={`${CONTROL} h-16 min-w-12 px-3 font-mono text-xl ${vote === value ? "border border-emerald-400 bg-emerald-400 text-emerald-950" : "border border-zinc-700 bg-[#17171b] [html.light_&]:border-zinc-300 [html.light_&]:bg-white"}`}
											>
												{value}
											</button>
										))}
									</div>
								</fieldset>
								<button type="button" disabled={vote === null} onClick={() => setRevealed(true)} className={`${CONTROL} mt-4 w-full border border-zinc-700 [html.light_&]:border-zinc-300`}>Revelar votos</button>
							</>
						)}
					</section>
				</div>

				<ol aria-label="Como funciona" className="mt-16 grid gap-7 border-t border-[#26262c] pt-8 sm:grid-cols-3 sm:gap-8 [html.light_&]:border-zinc-300">
					{STEPS.map((step, index) => <li key={step.title}>
						<h2 className="text-lg font-medium"><span className="mr-3 font-mono text-sm text-zinc-400 [html.light_&]:text-zinc-600">{index + 1}.</span>{step.title}</h2>
						<p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-zinc-400 [html.light_&]:text-zinc-600">{step.body}</p>
					</li>)}
				</ol>
			</main>
			<footer className="mx-auto w-full max-w-6xl px-5 py-6 text-sm text-zinc-400 sm:px-8 [html.light_&]:text-zinc-600">Pointly · A ferramenta some, a conversa fica.</footer>
		</div>
	);
}
