/**
 * EmptyOverlay — convite quando a sala tem só o player local (Spell dark).
 *
 * Painel não-modal com share link + copiar. Dismiss persiste na sessão
 * (`pointly.dismissedEmpty`); Esc ou "Entrar na mesa" dispensa.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/spell/copy-button";
import { buildShareUrl } from "./share-pill";

const DISMISS_KEY = "pointly.dismissedEmpty";

function readDismissed(): boolean {
	try {
		return sessionStorage.getItem(DISMISS_KEY) === "1";
	} catch {
		return false;
	}
}

export interface EmptyOverlayProps {
	code: string;
	shareUrl?: string;
	onDismiss?: () => void;
}

export function EmptyOverlay({ code, shareUrl, onDismiss }: EmptyOverlayProps) {
	const [dismissed, setDismissed] = useState<boolean>(readDismissed);
	const copyRef = useRef<HTMLButtonElement>(null);
	const restoreRef = useRef<Element | null>(null);

	const url = shareUrl ?? buildShareUrl(window.location.origin, code);

	const handleDismiss = useCallback(() => {
		setDismissed(true);
		try {
			sessionStorage.setItem(DISMISS_KEY, "1");
		} catch {
			// storage indisponível — dismiss vale só pro render atual
		}
		onDismiss?.();
		(restoreRef.current as HTMLElement | null)?.focus?.();
	}, [onDismiss]);

	const handleCopyFallback = useCallback(() => {
		// CopyButton já tenta `navigator.clipboard`; aqui só o fallback
		// para navegadores sem Clipboard API (via input selecionável).
		const clipboard = navigator.clipboard as unknown as
			| { writeText?: (text: string) => Promise<void> }
			| undefined;
		if (clipboard?.writeText) return;
		try {
			const input = document.getElementById(
				"empty-overlay-share-url",
			) as HTMLInputElement | null;
			input?.select();
			document.execCommand("copy");
		} catch {
			// sem feedback falso
		}
	}, []);

	useEffect(() => {
		if (dismissed) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleDismiss();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [dismissed, handleDismiss]);

	useEffect(() => {
		if (dismissed) return;
		restoreRef.current = document.activeElement;
		copyRef.current?.focus();
	}, [dismissed]);

	if (dismissed) return null;

	return (
		<section
			role="dialog"
			aria-modal="false"
			aria-labelledby="empty-overlay-title"
			aria-describedby="empty-overlay-desc"
			data-testid="empty-overlay"
			className="w-full rounded-2xl border border-dashed border-emerald-400/30 bg-gradient-to-b from-[#12141a] to-[#101013] px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-6 [html.light_&]:border-emerald-700/30 [html.light_&]:bg-white [html.light_&]:from-white [html.light_&]:to-emerald-50/50"
		>
			<p className="font-mono text-[10px] tracking-[0.18em] text-emerald-300/80 uppercase [html.light_&]:text-emerald-700">
				Sala aberta
			</p>
			<h2
				id="empty-overlay-title"
				className="mt-1 text-lg font-medium tracking-tight text-zinc-50 [html.light_&]:text-zinc-900"
			>
				Convide o time para começar
			</h2>
			<p
				id="empty-overlay-desc"
				className="mx-auto mt-1 max-w-sm text-sm text-zinc-400 [html.light_&]:text-zinc-600"
			>
				Compartilhe o link — a mesa libera quando alguém entrar. Você já
				pode escolher sua carta abaixo.
			</p>
			<div data-testid="empty-overlay-share" className="mt-3 flex gap-2">
				<input
					id="empty-overlay-share-url"
					data-testid="empty-overlay-share-url"
					readOnly
					value={url}
					onFocus={(e) => e.target.select()}
					aria-label="Link de compartilhamento da sala"
					className="h-11 min-w-0 flex-1 rounded-lg border border-[#26262c] bg-[#09090b] px-3 font-mono text-xs text-zinc-300 [html.light_&]:border-zinc-300 [html.light_&]:bg-zinc-100 [html.light_&]:text-zinc-700"
				/>
			<CopyButton
				ref={copyRef}
				value={url}
				data-testid="empty-overlay-copy"
				aria-label="Copiar link de compartilhamento da sala"
				title="Copiar link"
				onClick={handleCopyFallback}
				className="h-11 w-11 shrink-0 rounded-lg border border-[#26262c] bg-[#17171b] text-zinc-100 hover:border-zinc-500 [html.light_&]:border-zinc-300 [html.light_&]:bg-zinc-100 [html.light_&]:text-zinc-700"
			/>
			</div>
			<button
				type="button"
				data-testid="empty-overlay-dismiss"
				onClick={handleDismiss}
				className="mt-2 cursor-pointer text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
			>
				Entrar na mesa mesmo assim
			</button>
		</section>
	);
}
