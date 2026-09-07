/**
 * Empty sala invitation panel — T36 (Phase 6) / T06 (Phase 4 fix).
 *
 * Overlay "Convide outros" mostrado quando a sala tem apenas o player local
 * (`selectIsOnlyPlayer` = sala.players.length === 1 && players[0].id === currentPlayerId).
 *
 * **Visual**:
 *  - Painel inline compacto antes da mesa e do baralho
 *  - Share URL readonly + botão 'Copiar link' (clipboard API)
 *  - Botão ghost 'Entrar na mesa mesmo assim' dismissa overlay
 *
 * **Persistência**:
 *  - sessionStorage key 'pointly.dismissedEmpty' para não mostrar de novo
 *  - na mesma sessão (dismissado uma vez, sem re-show)
 *
 * **Auto-dismiss removido (BUG-305)**: clicar "Copiar link" NÃO fecha mais
 * o overlay. O usuário decide quando fechar via "Entrar na mesa" ou Esc.
 * Feedback continua com `Copiado ✓` durante o ciclo de vida do componente.
 *
 * **A11y**:
 *  - role="dialog" + aria-modal="false" (painel não-modal: a mesa segue interativa atrás)
 *  - foco inicial no CTA primário + restore-focus ao dispensar
 *  - Esc fecha o overlay
 *  - aria-label="Convide outros para começar a rodada"
 *
 * @see .specs/features/planning-poker-v1/tasks.md T36
 * @see .specs/features/planning-poker-v1/spec.md F-033
 * @see .compozy/tasks/pointly-ux-hardening/task_06.md
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getDismissedEmpty, setDismissedEmpty } from "../lib/storage";
import { Button } from "./ui/button";

/** Hook utilitário pra construir a share URL (SPA router). */
export function buildShareUrl(origin: string, code: string): string {
	const joinPath = "/join";
	return `${origin}${joinPath}?code=${code}`;
}

export interface EmptyOverlayProps {
	/** Código da sala ativo (exibido na URL). */
	code: string;
	/**
	 * Callback quando user clica 'Entrar na mesa mesmo assim' ou pressiona
	 * Esc. **Opcional** desde T06/BUG-304. A dismissal é controlada
	 * inteiramente por sessionStorage interno — passar `undefined`
	 * significa "não me importo com o evento". Útil pra analytics futura.
	 */
	onDismiss?: () => void;
	/** Override opcional pra URL absoluta (default: window.location.origin). */
	shareUrl?: string;
}

export function EmptyOverlay({ code, onDismiss, shareUrl }: EmptyOverlayProps) {
	const [copied, setCopied] = useState(false);
	// Inicializa direto do sessionStorage (via helper) pra evitar flicker
	// (overlay aparece → useEffect roda → some = CLS ruim).
	const [dismissed, setDismissed] = useState<boolean>(() =>
		getDismissedEmpty(),
	);
	// Restore-focus (mesmo padrão do HelpModal): o overlay foca o CTA
	// primário ao abrir; ao dispensar, devolve o foco a quem tinha antes.
	const restoreRef = useRef<Element | null>(null);

	const handleDismiss = useCallback(() => {
		setDismissed(true);
		setDismissedEmpty();
		onDismiss?.();
		(restoreRef.current as HTMLElement | null)?.focus?.();
	}, [onDismiss]);

	const handleCopy = useCallback(async () => {
		const url = shareUrl ?? buildShareUrl(window.location.origin, code);
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
		} catch {
			// Fallback: select text
			const input = document.getElementById(
				"empty-overlay-share-url",
			) as HTMLInputElement | null;
			if (input) {
				input.select();
			}
		}
	}, [code, shareUrl]);

	// Esc fecha
	useEffect(() => {
		if (dismissed) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") handleDismiss();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [dismissed, handleDismiss]);

	// Foco inicial no CTA primário ao abrir (dialog sem trap completo: overlay não bloqueia a mesa)
	const copyRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (dismissed) return;
		restoreRef.current = document.activeElement;
		copyRef.current?.focus();
	}, [dismissed]);

	if (dismissed) return null;

	const url = shareUrl ?? buildShareUrl(window.location.origin, code);

	return (
		<section
			role="dialog"
			aria-modal="false"
			aria-labelledby="empty-overlay-title"
			aria-describedby="empty-overlay-desc"
			data-testid="empty-overlay"
			data-od-id="empty-overlay"
			className="feedback-empty-panel w-full min-w-0 shrink-0 px-4 py-4 sm:px-6"
		>
			<div
				className="mx-auto w-full min-w-0 max-w-[680px] flex flex-col gap-3 items-start"
			>
				<h2 id="empty-overlay-title" className="font-display font-bold text-xl tracking-tight">
					Convide outros para a mesa
				</h2>
				<p id="empty-overlay-desc" className="font-sans text-caption text-ink-mute">
					Só você está na sala. Compartilhe o link para estimar com o time.
				</p>

				{/* Link de convite */}
				<div
					className="flex items-stretch w-full min-w-0 border border-ink/15 rounded-[9px] bg-surface overflow-hidden"
					data-testid="empty-overlay-share"
				>
					<input
						id="empty-overlay-share-url"
						type="text"
						readOnly
						value={url}
						aria-label="Link de convite da sala"
						className="flex-1 w-0 border-0 bg-transparent py-2 px-3 font-sans text-caption text-ink min-w-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--focus)]"
						data-testid="empty-overlay-share-url"
					/>
					<button
						ref={copyRef}
						type="button"
						onClick={handleCopy}
						className="border-0 bg-coral text-on-accent font-sans font-bold text-caption py-2 px-3 cursor-pointer hover:bg-[var(--accent-hover)] min-h-[44px] flex-shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--focus)]"
						data-testid="empty-overlay-copy"
						aria-label="Copiar link de compartilhamento"
						aria-live="polite"
					>
						{copied ? "Copiado ✓" : "Copiar link"}
					</button>
				</div>

				<Button
					variant="ghost"
					size="md"
					onClick={handleDismiss}
					data-testid="empty-overlay-dismiss"
					className="min-h-[44px] h-auto max-w-full whitespace-normal rounded-[9px] px-0 text-caption transition-none"
				>
					Continuar sem o convite
				</Button>
			</div>
		</section>
	);
}
