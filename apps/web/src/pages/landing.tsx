/**
 * Landing — hero Spell dark + 3 passos + stats (spell-rebuild).
 *
 * - Headline em GradientWaveText, subhero em BlurReveal.
 * - CTAs são RichButton com as props confirmadas (color/size/onClick);
 *   data-testid é atributo HTML padrão, repassado ao <button>.
 */
import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Badge } from "@/components/spell/badge";
import { BlurReveal } from "@/components/spell/blur-reveal";
import { GradientWaveText } from "@/components/spell/gradient-wave-text";
import { RichButton } from "@/components/spell/rich-button";
import { TiltCard } from "@/components/spell/tilt-card";
import { useTheme } from "@/theme/theme";

const STEPS = [
	{
		title: "Crie",
		body: "Abra uma sala e compartilhe o código com o time.",
	},
	{
		title: "Vote",
		body: "Cada pessoa escolhe uma carta em segredo.",
	},
	{
		title: "Revele",
		body: "Revelem juntos e conversem sobre as diferenças.",
	},
] as const;

export function Landing() {
	const navigate = useNavigate();
	const { theme, toggle } = useTheme();

	const goCreate = useCallback(() => navigate("/join?host=1"), [navigate]);
	const goJoin = useCallback(() => navigate("/join"), [navigate]);

	return (
		<div
			data-testid="page-landing"
			className="flex min-h-dvh flex-col bg-[#09090b] text-zinc-100 [html.light_&]:bg-[#f5f5f5] [html.light_&]:text-zinc-900"
		>
			<header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
				<span className="font-mono text-sm font-semibold tracking-[0.08em] uppercase">
					Pointly
				</span>
				<nav className="flex items-center gap-4" aria-label="navegação principal">
					<button
						type="button"
						onClick={toggle}
						aria-label={
							theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"
						}
						className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
					>
						{theme === "dark" ? (
							<Sun aria-hidden="true" className="h-5 w-5" />
						) : (
							<Moon aria-hidden="true" className="h-5 w-5" />
						)}
					</button>
					<Link
						to="/join"
						className="font-mono text-sm tracking-wide text-zinc-300 underline-offset-4 hover:text-zinc-100 hover:underline"
					>
						Entrar
					</Link>
				</nav>
			</header>

			<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 pt-14 pb-10 text-center sm:pt-20">
				<p className="mb-5 font-mono text-xs tracking-[0.14em] text-zinc-400 uppercase">
					Planning poker para times ágeis
				</p>
				<h1 className="max-w-3xl text-5xl leading-[1.05] font-medium tracking-tight text-balance sm:text-6xl">
					<GradientWaveText>Planning poker sem fricção</GradientWaveText>
				</h1>
				<BlurReveal className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
					{"Estime histórias com seu time em tempo real — sem cadastro, sem complicação."}
				</BlurReveal>

				<div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
					<RichButton
						color="emerald"
						size="lg"
						onClick={goCreate}
						data-testid="landing-create"
					>
						Criar uma sala
					</RichButton>
					<RichButton
						color="zinc"
						size="lg"
						onClick={goJoin}
						data-testid="landing-join"
					>
						Entrar com código
					</RichButton>
				</div>

				<div
					className="mt-14 grid w-full gap-4 text-left sm:grid-cols-3"
					aria-label="Como funciona"
				>
					{STEPS.map((step, index) => (
						<TiltCard
							key={step.title}
							className="rounded-2xl border border-[#26262c] bg-[#101013] p-6"
						>
							<p
								aria-hidden="true"
								className="font-mono text-xs tracking-[0.14em] text-zinc-500"
							>
								0{index + 1}
							</p>
							<h2 className="mt-2 text-xl font-medium tracking-tight">
								{step.title}
							</h2>
							<p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
								{step.body}
							</p>
						</TiltCard>
					))}
				</div>

				<ul
					className="mt-10 flex flex-wrap items-center justify-center gap-2"
					aria-label="Destaques"
				>
					<li>
						<Badge variant="blue">Até 12 pessoas</Badge>
					</li>
					<li>
						<Badge variant="green">Sem cadastro</Badge>
					</li>
					<li>
						<Badge variant="violet">Tempo real</Badge>
					</li>
				</ul>
			</main>

			<footer className="mx-auto w-full max-w-5xl px-5 py-6 text-center font-mono text-xs tracking-wide text-zinc-500">
				Pointly · Sem cadastro. Sem complicação.
			</footer>
		</div>
	);
}
