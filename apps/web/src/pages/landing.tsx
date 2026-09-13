import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LandingTablePreview } from "@/components/landing/landing-table-preview";
import { BlurReveal } from "@/components/spell/blur-reveal";
import { RichButton } from "@/components/spell/rich-button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/theme/theme";

const STEPS = [
	["Abra", "Crie a sala e compartilhe o código com o time."],
	["Ouça", "Cada pessoa escolhe uma carta antes da conversa."],
	["Conversem", "Revelem juntos e entendam as diferenças."],
] as const;

export function Landing() {
	const navigate = useNavigate();
	const { theme, toggle } = useTheme();
	const goCreate = useCallback(() => navigate("/join?host=1"), [navigate]);
	const goJoin = useCallback(() => navigate("/join"), [navigate]);

	return (
		<div
			data-testid="page-landing"
			className="flex min-h-dvh flex-col bg-[#17221b] text-[#f3eecf] [html.light_&]:bg-[#f3eecf] [html.light_&]:text-[#17221b]"
		>
			<header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
				<span className="flex items-center gap-2.5 font-mono text-sm font-bold tracking-[0.08em] uppercase">
					<span aria-hidden="true" className="grid grid-cols-2 gap-1">
						<span className="h-2 w-2 bg-[#f3eecf] [html.light_&]:bg-[#17221b]" />
						<span className="h-2 w-2 bg-[#f3eecf] [html.light_&]:bg-[#17221b]" />
						<span className="h-2 w-2 bg-[#f3eecf] [html.light_&]:bg-[#17221b]" />
						<span className="h-2 w-2 bg-[#e9dc72]" />
					</span>
					Pointly
				</span>
				<nav className="flex items-center gap-3" aria-label="Navegação principal">
					<button
						type="button"
						onClick={toggle}
						aria-label={
							theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"
						}
						className="grid h-10 w-10 place-items-center border border-[#7e9e74] text-[#f3eecf] transition-colors hover:bg-[#315a4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9dc72] [html.light_&]:text-[#17221b]"
					>
						{theme === "dark" ? (
							<Sun aria-hidden="true" className="h-4 w-4" />
						) : (
							<Moon aria-hidden="true" className="h-4 w-4" />
						)}
					</button>
					<Link
						to="/join"
						className="font-mono text-sm font-semibold underline decoration-[#e9dc72] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9dc72]"
					>
						Entrar
					</Link>
				</nav>
			</header>

			<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-10 pt-8 sm:pt-12">
				<section className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
					<div>
						<p className="font-mono text-xs font-bold tracking-[0.18em] text-[#e9dc72] uppercase">
							Planning poker para times ágeis
						</p>
						<h1 className="mt-4 max-w-[15ch] text-5xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-6xl">
							Estimar é ouvir antes de concordar.
						</h1>
						<BlurReveal className="mt-6 max-w-[42ch] text-base leading-relaxed text-[#c9d3b5] sm:text-lg [html.light_&]:text-[#315a4a]">
							{"Uma mesa simples para expor estimativas, alinhar o time e seguir em frente."}
						</BlurReveal>

						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<RichButton
								color="yellow"
								size="lg"
								onClick={goCreate}
								data-testid="landing-create"
								className="border-[#e9dc72] bg-[#e9dc72] bg-none text-[#17221b] shadow-none inset-shadow-none hover:brightness-95"
							>
								Criar uma sala
							</RichButton>
							<RichButton
								color="zinc"
								size="lg"
								onClick={goJoin}
								data-testid="landing-join"
								className="border-[#7e9e74] bg-transparent bg-none text-[#f3eecf] shadow-none inset-shadow-none hover:bg-[#315a4a] [html.light_&]:text-[#17221b]"
							>
								Entrar com código
							</RichButton>
						</div>
						<p className="mt-4 font-mono text-xs tracking-wide text-[#c9d3b5] [html.light_&]:text-[#315a4a]">
							Sem cadastro. Só chegar e votar.
						</p>
					</div>

					<LandingTablePreview />
				</section>

				<section className="mt-14 grid gap-px overflow-hidden border border-[#7e9e74] bg-[#7e9e74] md:grid-cols-3">
					{STEPS.map(([title, body], index) => (
						<div key={title} className="bg-[#315a4a] p-5 [html.light_&]:bg-[#d9dfc4]">
							<p className="font-mono text-xs font-bold tracking-[0.16em] text-[#e9dc72] [html.light_&]:text-[#a54236]">
								0{index + 1}
							</p>
							<h2 className="mt-6 text-xl font-semibold tracking-tight">{title}</h2>
							<p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-[#c9d3b5] [html.light_&]:text-[#315a4a]">
								{body}
							</p>
						</div>
					))}
				</section>
			</main>

			<footer className="mx-auto w-full max-w-6xl px-5 py-6 font-mono text-xs tracking-wide text-[#c9d3b5] [html.light_&]:text-[#315a4a]">
				Pointly. Estimativas para abrir a conversa.
			</footer>
		</div>
	);
}
