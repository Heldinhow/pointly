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
				"inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono",
				"focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] focus-visible:outline-none",
				"disabled:cursor-not-allowed disabled:opacity-50",
				copied
					? "border-emerald-400/40 bg-emerald-950 text-emerald-200"
					: "border-[#26262c] bg-[#101013] text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 [html.light_&]:border-zinc-300 [html.light_&]:bg-white [html.light_&]:text-zinc-700",
			)}
		>
			<span aria-hidden="true" className="text-xs opacity-70">
				{copied ? "✓" : "⧉"}
			</span>
			<span className="text-[10px] tracking-[0.14em] uppercase opacity-70">
				Sala
			</span>
			<span className="text-sm font-bold tracking-wider tabular-nums">
				{copied ? "Copiado!" : code || "—"}
			</span>
		</button>
	);
}
