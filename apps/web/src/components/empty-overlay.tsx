/**
 * Empty sala overlay — T36 (Phase 6) / T06 (Phase 4 fix).
 *
 * Overlay "Convide outros" mostrado quando a sala tem apenas o player local
 * (`selectIsOnlyPlayer` = sala.players.length === 1 && players[0].id === currentPlayerId).
 *
 * **Visual**:
 *  - Backdrop paper + blur(4px) (vide design/arena.html)
 *  - Card central bone-fill com mark Ø + headline 'Convide outros.' + coral dot
 *  - Share URL readonly + botão 'Copiar link' (clipboard API)
 *  - Botão ghost 'Entrar na mesa mesmo assim' dismissa overlay
 *
 * **Persistência**:
 *  - sessionStorage key 'pointly.dismissedEmpty' para não mostrar de novo
 *  - na mesma sessão (dismissado uma vez)
 *  - T06/BUG-102: o pai (`arena.tsx`) **reseta** essa flag quando
 *    `phase === 'voting' && players.length === 1` numa nova transição,
 *    forçando re-show após reveal→nova rodada em sala solo.
 *    O re-show é feito via `<EmptyOverlay key={nonce} />` — cada key
 *    novo reinicia o `useState` interno (leitura fresca do sessionStorage).
 *
 * **Auto-dismiss removido (BUG-305)**: clicar "Copiar link" NÃO fecha mais
 * o overlay. O usuário decide quando fechar via "Entrar na mesa" ou Esc.
 * Feedback continua com `Copiado ✓` durante o ciclo de vida do componente.
 *
 * **A11y**:
 *  - role="dialog" + aria-modal="true"
 *  - focus trap mínimo (foco no botão primário)
 *  - Esc fecha o overlay
 *  - aria-label="Convide outros para começar a rodada"
 *
 * @see .specs/features/planning-poker-v1/tasks.md T36
 * @see .specs/features/planning-poker-v1/spec.md F-033
 * @see .compozy/tasks/pointly-ux-hardening/task_06.md
 */
import { useCallback, useEffect, useState } from "react";
import { getDismissedEmpty, setDismissedEmpty } from "../lib/storage";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

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

	const handleDismiss = useCallback(() => {
		setDismissed(true);
		setDismissedEmpty();
		onDismiss?.();
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

	if (dismissed) return null;

	const url = shareUrl ?? buildShareUrl(window.location.origin, code);

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Convide outros para começar a rodada"
			data-testid="empty-overlay"
			data-od-id="empty-overlay"
			className="absolute inset-0 bg-bg/92 backdrop-blur-[4px] flex items-center justify-center z-20 transition-opacity duration-200 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]"
		>
			<Card
				padding="lg"
				className="w-full max-w-[560px] max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col gap-5 items-start"
			>
				<div className="font-italic italic text-coral text-[36px] leading-none">
					Ø
				</div>
				<h2 className="font-display font-extrabold text-[28px] tracking-[-0.025em]">
					Convide outros<span className="text-coral">.</span>
				</h2>
				<p className="font-sans text-[14px] leading-[1.55] text-ink-mute">
					Você é o único na sala agora. Compartilhe o link abaixo — quando
					alguém entrar, vocês podem votar juntos.
				</p>

				{/* Share pill */}
				<div
					className="flex items-stretch w-full border border-ink/15 rounded-full bg-paper overflow-hidden"
					data-testid="empty-overlay-share"
				>
					<input
						id="empty-overlay-share-url"
						type="text"
						readOnly
						value={url}
						aria-label="URL de compartilhamento"
						className="flex-1 border-0 bg-transparent py-3.5 px-4 font-mono text-[12px] text-ink outline-none tracking-[0.02em] min-w-0"
						data-testid="empty-overlay-share-url"
					/>
					<button
						type="button"
						onClick={handleCopy}
						className="border-0 bg-coral text-white font-display font-semibold text-[13px] py-3.5 px-5 cursor-pointer hover:bg-coral-soft transition-colors min-h-[44px] flex-shrink-0"
						data-testid="empty-overlay-copy"
						aria-label="Copiar link de compartilhamento"
					>
						{copied ? "Copiado ✓" : "Copiar link"}
					</button>
				</div>

				<Button
					variant="default"
					size="md"
					onClick={handleDismiss}
					data-testid="empty-overlay-dismiss"
					className="min-h-[44px]"
				>
					Entrar na mesa mesmo assim
					<span aria-hidden="true">→</span>
				</Button>
			</Card>
		</div>
	);
}
