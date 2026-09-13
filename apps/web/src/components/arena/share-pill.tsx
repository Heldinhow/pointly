/**
 * SharePill — badge da sala com copiar-link (Spell dark).
 *
 * Contrato e2e: `data-testid="share-pill"` com o código visível.
 */
import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";

/** `/join?code=XXXX` absoluto (link que o convidado abre). */
export function buildShareUrl(origin: string, code: string): string {
	return `${origin}/join?code=${code}`;
}

export function SharePill({ code }: { code: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		if (!code) return;
		const url = buildShareUrl(window.location.origin, code);
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url);
			} else {
				const ta = document.createElement("textarea");
				ta.value = url;
				ta.style.position = "fixed";
				ta.style.opacity = "0";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				document.body.removeChild(ta);
			}
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1800);
		} catch {
			// clipboard indisponível — mantém o pill clicável, sem feedback falso
		}
	}, [code]);

	return (
		<button
			type="button"
			onClick={handleCopy}
			data-testid="share-pill"
			disabled={!code}
			aria-label={
				copied
					? "Link copiado com sucesso"
					: code
						? `Copiar link de compartilhamento da sala ${code}`
						: "Aguardando código da sala"
			}
			className={cn(
				"inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-3 py-1 font-mono transition-colors duration-150",
				"focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] focus-visible:outline-none",
				"disabled:cursor-not-allowed disabled:opacity-50",
				copied
					? "border-emerald-400/50 bg-emerald-950 text-emerald-200"
					: "border-[#2b2b31] bg-[#101013] text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-zinc-500 hover:text-zinc-100 [html.light_&]:border-zinc-300 [html.light_&]:bg-white [html.light_&]:text-zinc-700",
			)}
		>
			<span aria-hidden="true" className="text-xs opacity-70">
				{copied ? "✓" : "⧉"}
			</span>
			<span className="hidden text-xs sm:inline">
				{copied ? "Copiado!" : "Convidar"}
			</span>
			<span data-testid="arena-code" className="text-sm font-bold tracking-[0.12em] tabular-nums">
				{code || "—"}
			</span>
		</button>
	);
}
