/**
 * Landing — hero Spell split + preview real da mesa + 3 passos assimétricos.
 *
 * - Headline em GradientWaveText (cores esmeralda/zinco da marca),
 *   subhero em BlurReveal.
 * - Preview direito usa peças spell reais (TiltCard + Badge), não fake divs.
 * - CTAs são RichButton com as props confirmadas (color/size/onClick);
 *   data-testid é atributo HTML padrão, repassado ao <button>.
 */
import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessagesSquare, Moon, Sun, UserPlus, Vote } from "lucide-react";
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
		icon: UserPlus,
	},
	{
		title: "Vote",
		body: "Cada pessoa escolhe uma carta em segredo.",
		icon: Vote,
	},
	{
		title: "Revele",
		body: "Revelem juntos e conversem sobre as diferenças.",
		icon: MessagesSquare,
	},
] as const;

const PREVIEW_SEATS = [
	{ initials: "MA", nick: "Marina", vote: "5", variant: "green" },
	{ initials: "RA", nick: "Rafa", vote: "8", variant: "blue" },
	{ initials: "VO", nick: "Você", vote: "5", variant: "green" },
	{ initials: "BI", nick: "Bia", vote: "3", variant: "blue" },
] as const;

export function Landing() {
	const navigate = useNavigate();
	const { theme, toggle } = useTheme();

	const goCreate = useCallback(() => navigate("/join?host=1"), [navigate]);
	const goJoin = useCallback(() => navigate("/join"), [navigate]);

	return (
		<div
			data-testid="page-landing"
			className="flex min-h-dvh flex-col bg-[#09090b] bg-[radial-gradient(ellipse_60%_35%_at_50%_-5%,rgba(52,211,153,0.09),transparent_70%)] text-zinc-100 [html.light_&]:bg-[#f5f5f5] [html.light_&]:bg-[radial-gradient(ellipse_60%_35%_at_50%_-5%,rgba(16,185,129,0.14),transparent_70%)] [html.light_&]:text-zinc-900"
		>
			<header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
				<span className="flex items-center gap-2.5 font-mono text-sm font-semibold tracking-[0.08em] uppercase">
					<span aria-hidden="true" className="grid grid-cols-2 gap-[3px]">
						<span className="h-2 w-2 rounded-[3px] bg-zinc-100 [html.light_&]:bg-zinc-900" />
						<span className="h-2 w-2 rounded-[3px] bg-zinc-100 [html.light_&]:bg-zinc-900" />
						<span className="h-2 w-2 rounded-[3px] bg-zinc-100 [html.light_&]:bg-zinc-900" />
						<span className="h-2 w-2 rounded-[3px] bg-emerald-400" />
					</span>
					Pointly
				</span>
				<nav className="flex items-center gap-3" aria-label="navegação principal">
					<button
						type="button"
						onClick={toggle}
						aria-label={
							theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"
						}
						className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100 [html.light_&]:border-zinc-300 [html.light_&]:text-zinc-600 [html.light_&]:hover:text-zinc-900"
					>
						{theme === "dark" ? (
							<Sun aria-hidden="true" className="h-5 w-5" />
						) : (
							<Moon aria-hidden="true" className="h-5 w-5" />
						)}
					</button>
					<Link
						to="/join"
						className="rounded-full px-2 py-2 font-mono text-sm tracking-wide text-zinc-300 underline-offset-4 hover:text-zinc-100 hover:underline [html.light_&]:text-zinc-600 [html.light_&]:hover:text-zinc-900"
					>
						Entrar
					</Link>
				</nav>
			</header>

			<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pt-10 pb-10 sm:pt-14">
				<div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
					<div className="text-left">
						<p className="mb-4 font-mono text-xs tracking-[0.18em] text-emerald-300/80 uppercase [html.light_&]:text-emerald-700">
							Planning poker para times ágeis
						</p>
						<h1 className="max-w-[16ch] text-5xl leading-[1.02] font-medium tracking-tight text-balance sm:text-6xl">
							<GradientWaveText customColors={["#34d399", "#a1a1aa", "#e4e4e7"]}>
								Planning poker sem fricção
							</GradientWaveText>
						</h1>
						<BlurReveal className="mt-5 max-w-[42ch] text-base leading-relaxed text-zinc-400 sm:text-lg [html.light_&]:text-zinc-600">
							{"Estime histórias com seu time em tempo real — sem cadastro, sem complicação."}
						</BlurReveal>

						<div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
							<RichButton
								color="emerald"
								size="lg"
								onClick={goCreate}
								data-testid="landing-create"
								className="rounded-full px-7"
							>
								Criar uma sala
							</RichButton>
							<RichButton
								color="zinc"
								size="lg"
								onClick={goJoin}
								data-testid="landing-join"
								className="rounded-full px-7"
							>
								Entrar com código
							</RichButton>
						</div>
						<p className="mt-4 font-mono text-xs tracking-wide text-zinc-500">
							Grátis · Até 12 pessoas · Só chegar e votar
						</p>
					</div>

					<div
						aria-label="Exemplo de mesa com quatro votos revelados"
						className="relative mx-auto w-full max-w-md"
					>
						<div
							aria-hidden="true"
							className="absolute -inset-4 rounded-[36px] bg-emerald-500/[0.07] blur-2xl"
						/>
						<div className="relative rounded-[28px] border border-[#26262c] bg-gradient-to-b from-[#141419] to-[#0d0d11] p-5 shadow-[0_32px_80px_-32px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] [html.light_&]:border-zinc-200 [html.light_&]:from-white [html.light_&]:to-zinc-100">
							<div className="rounded-2xl border border-white/[0.07] bg-[radial-gradient(ellipse_60%_55%_at_50%_30%,rgba(52,211,153,0.16),transparent_70%),radial-gradient(ellipse_at_center,#1a1a21_0%,#101014_75%)] px-4 py-7 text-center [html.light_&]:border-zinc-200 [html.light_&]:bg-[radial-gradient(ellipse_60%_55%_at_50%_30%,rgba(16,185,129,0.2),transparent_70%),radial-gradient(ellipse_at_center,#ffffff_0%,#eef4f0_75%)]">
								<p className="text-lg font-medium tracking-tight">
									Vamos conversar?
								</p>
								<p className="mt-1 text-sm text-zinc-400 [html.light_&]:text-zinc-600">
									Cada ponto de vista conta.
								</p>
								<div className="mt-4 flex items-center justify-center gap-2">
									<TiltCard
										tiltLimit={8}
										className="flex h-16 w-12 items-center justify-center rounded-lg border border-[#2b2b31] bg-[#1d1d22] font-mono text-xl text-zinc-100"
									>
										3
									</TiltCard>
									<TiltCard
										tiltLimit={8}
										className="flex h-[72px] w-[52px] items-center justify-center rounded-lg border border-emerald-300 bg-emerald-400 font-mono text-2xl font-semibold text-emerald-950 shadow-[0_12px_32px_-10px_rgba(52,211,153,0.7)]"
									>
										5
									</TiltCard>
									<TiltCard
										tiltLimit={8}
										className="flex h-16 w-12 items-center justify-center rounded-lg border border-[#2b2b31] bg-[#1d1d22] font-mono text-xl text-zinc-100"
									>
										8
									</TiltCard>
								</div>
							</div>
							<ul className="mt-4 grid grid-cols-2 gap-2">
								{PREVIEW_SEATS.map((s) => (
									<li
										key={s.nick}
										className="flex items-center gap-2 rounded-xl border border-[#26262c] bg-[#101013] px-2.5 py-2 [html.light_&]:border-zinc-200 [html.light_&]:bg-white"
									>
										<span
											aria-hidden="true"
											className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-900 font-mono text-[10px] font-semibold text-zinc-100"
										>
											{s.initials}
										</span>
										<span className="min-w-0 flex-1 truncate text-xs font-medium">
											{s.nick}
										</span>
										<Badge
											variant={s.variant as "green" | "blue"}
											className="font-mono tabular-nums"
										>
											{s.vote}
										</Badge>
									</li>
								))}
							</ul>
							<p className="mt-3 text-center font-mono text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
								Exemplo de rodada
							</p>
						</div>
					</div>
				</div>

				<div
					className="mt-14 grid w-full gap-4 text-left md:grid-cols-[1.25fr_1fr_1fr]"
					aria-label="Como funciona"
				>
					{STEPS.map((step, index) => {
						const Icon = step.icon;
						const hero = index === 0;
						return (
							<TiltCard
								key={step.title}
								tiltLimit={5}
								className={
									hero
										? "rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-[#141a17] to-[#101013] p-6 shadow-[0_24px_60px_-32px_rgba(52,211,153,0.4)] [html.light_&]:border-emerald-700/25 [html.light_&]:from-emerald-50 [html.light_&]:to-white"
										: "rounded-2xl border border-[#26262c] bg-[#101013] p-6 [html.light_&]:border-zinc-200 [html.light_&]:bg-white"
								}
							>
								<div className="flex items-center justify-between">
									<span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-emerald-300 [html.light_&]:border-zinc-200 [html.light_&]:bg-zinc-100 [html.light_&]:text-emerald-700">
										<Icon aria-hidden="true" className="h-4 w-4" />
									</span>
									<p
										aria-hidden="true"
										className="font-mono text-xs tracking-[0.14em] text-zinc-500"
									>
										0{index + 1}
									</p>
								</div>
								<h2 className="mt-4 text-xl font-medium tracking-tight">
									{step.title}
								</h2>
								<p className="mt-1.5 text-sm leading-relaxed text-zinc-400 [html.light_&]:text-zinc-600">
									{step.body}
								</p>
							</TiltCard>
						);
					})}
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

			<footer className="mx-auto w-full max-w-6xl px-5 py-6 text-center font-mono text-xs tracking-wide text-zinc-500">
				Pointly · Sem cadastro. Sem complicação.
			</footer>
		</div>
	);
}
