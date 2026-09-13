import { Badge } from "@/components/spell/badge";

const SEATS = [
	{ name: "Marina", vote: "5", divergent: false },
	{ name: "Rafa", vote: "8", divergent: true },
	{ name: "Você", vote: "5", divergent: false },
	{ name: "Bia", vote: "3", divergent: false },
] as const;

export function LandingTablePreview() {
	return (
		<section
			role="group"
			aria-label="Exemplo de rodada de Planning Poker"
			className="w-full rounded-[1.75rem] border border-[#315a4a] bg-[#1d4035] p-3 text-[#17221b] shadow-[0_18px_0_#10271f] sm:p-5"
		>
			<div className="rounded-[1.25rem] border border-[#7e9e74] bg-[#b7c9a7] p-4 sm:p-5">
				<div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs font-semibold tracking-wide">
					<Badge className="border border-[#315a4a] bg-[#f3eecf] text-[#17221b]">
						Sala 4K7M
					</Badge>
					<Badge className="border border-[#315a4a] bg-[#f3eecf] text-[#17221b]">
						Rodada 03
					</Badge>
				</div>

				<div className="my-4 rounded-[50%] border-4 border-[#315a4a] bg-[#49785d] px-4 py-5 text-center shadow-inner sm:my-5 sm:py-7">
					<p className="font-mono text-xs font-semibold tracking-[0.16em] text-[#e9dc72] uppercase">
						Estimativa revelada
					</p>
					<p className="mt-1 text-xl font-semibold tracking-tight text-[#f3eecf] sm:text-2xl">
						4/4 votos revelados
					</p>
				</div>

				<ul aria-label="Participantes da rodada" className="grid gap-3 sm:grid-cols-2">
					{SEATS.map((seat) => (
						<li
							key={seat.name}
							className="flex items-center gap-3 rounded-lg border border-[#315a4a] bg-[#d9dfc4] p-2.5 shadow-[3px_3px_0_#315a4a]"
						>
							<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#315a4a] font-mono text-xs font-bold text-[#f3eecf]">
								{seat.name.slice(0, 1)}
							</span>
							<span className="min-w-0 flex-1 text-sm font-semibold">{seat.name}</span>
							<span
								aria-label="Carta revelada"
								className={`grid h-12 w-9 place-items-center rounded border-2 font-mono text-lg font-bold shadow-[2px_2px_0_#315a4a] ${
									seat.divergent
										? "border-[#a54236] bg-[#e2a09a] text-[#5b1d18]"
										: "border-[#315a4a] bg-[#f3eecf] text-[#17221b]"
								}`}
							>
								{seat.vote}
							</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
