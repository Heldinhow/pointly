/**
 * Full — sala cheia (spell-rebuild).
 *
 * Estática, PT-BR: contagem 12/12 + criar sala nova / voltar ao início.
 * Com `?code=XXXX` (redirect do erro `sala_cheia`): mostra qual sala está
 * cheia + terceira ação "Tentar outro código" → /join.
 * h1 recebe foco no mount. CTAs são RichButton (color/size/onClick
 * confirmados); data-testid é atributo HTML padrão, repassado ao <button>.
 */
import { useCallback, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { RichButton } from "@/components/spell/rich-button";

const MAX_PLAYERS = 12;

export function Full() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const titleRef = useRef<HTMLHeadingElement>(null);

	const code = (searchParams.get("code") || "").toUpperCase();

	useEffect(() => {
		titleRef.current?.focus();
	}, []);

	const goCreate = useCallback(
		() => navigate("/join?host=1"),
		[navigate],
	);
	const goHome = useCallback(() => navigate("/"), [navigate]);
	const goTryOther = useCallback(() => navigate("/join"), [navigate]);

	return (
		<main
			data-testid="page-full"
			className="flex min-h-dvh flex-col items-center bg-[#09090b] bg-[radial-gradient(ellipse_55%_30%_at_50%_0%,rgba(52,211,153,0.07),transparent_70%)] px-5 py-10 text-zinc-100 [html.light_&]:bg-zinc-100 [html.light_&]:text-zinc-900"
		>
			<div className="w-full max-w-md text-center">
				<Link
					to="/"
					className="inline-flex items-center gap-2.5 font-mono text-sm font-semibold tracking-[0.08em] text-zinc-300 uppercase hover:text-zinc-100 [html.light_&]:text-zinc-600 [html.light_&]:hover:text-zinc-900"
				>
					<span aria-hidden="true" className="grid grid-cols-2 gap-[3px]">
						<span className="h-2 w-2 rounded-[3px] bg-current opacity-80" />
						<span className="h-2 w-2 rounded-[3px] bg-current opacity-80" />
						<span className="h-2 w-2 rounded-[3px] bg-current opacity-80" />
						<span className="h-2 w-2 rounded-[3px] bg-emerald-400" />
					</span>
					Pointly
				</Link>

				<div className="mt-6 rounded-2xl border border-[#26262c] bg-[#101013] p-6 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-8 [html.light_&]:border-zinc-200 [html.light_&]:bg-white">
					<p
						aria-hidden="true"
						className="font-mono text-6xl font-semibold tracking-tight text-zinc-700 [html.light_&]:text-zinc-300"
					>
						{MAX_PLAYERS}
					</p>
					<p className="mt-4 font-mono text-xs tracking-[0.14em] text-zinc-500 uppercase">
						Capacidade máxima
					</p>
					<h1
						ref={titleRef}
						tabIndex={-1}
						className="mt-2 text-3xl font-medium tracking-tight"
					>
						{code ? `Sala ${code} está cheia` : "Sala cheia"}
					</h1>
					<p data-testid="full-count" className="mt-3 font-mono text-lg">
						{MAX_PLAYERS}/{MAX_PLAYERS}
					</p>
					<p className="mt-2 text-sm leading-relaxed text-zinc-400">
						{code ? (
							<>
								A sala {code} já tem {MAX_PLAYERS} pessoas. Tente outro
								código ou crie uma sala nova para continuar com o seu time.
							</>
						) : (
							<>
								Esta sala já tem {MAX_PLAYERS} pessoas. Crie uma sala nova
								para continuar com o seu time.
							</>
						)}
					</p>

					<div className="mt-6 flex flex-col gap-3">
						<RichButton
							color="emerald"
							size="lg"
							onClick={goCreate}
							data-testid="full-create-new"
							className="rounded-full"
						>
							Criar sala nova
						</RichButton>
						<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
						<RichButton
							color="zinc"
							size="lg"
							onClick={goHome}
							data-testid="full-retry"
							className="rounded-full sm:flex-1"
						>
							Voltar ao início
						</RichButton>
						{code && (
							<RichButton
								color="zinc"
								size="lg"
								onClick={goTryOther}
								data-testid="full-try-other"
								className="rounded-full sm:flex-1"
							>
								Tentar outro código
							</RichButton>
						)}
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
