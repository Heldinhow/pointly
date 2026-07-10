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
import { Card } from "./ui/card";
import { getDismissedEmpty, setDismissedEmpty } from "../lib/storage";

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
	/**
	 * Variante de layout (issue #69 / DESIGN-19).
	 * - "banner" (default): top-strip horizontal sobre o stage (preserva UX existente)
	 * - "side-card": card lateral direito fixo para desktop >=lg. Mais verbose
	 *   (welcome + player count + share link + status). O pai decide
	 *   qual usar com base no viewport (lg+ = side-card, <lg = banner).
	 */
	variant?: "banner" | "side-card";
}

export function EmptyOverlay({ code, onDismiss, shareUrl, variant = "banner" }: EmptyOverlayProps) {
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
				setCopied(true);
			}
		}
	}, [code, shareUrl]);

	// T12 — feedback pós-clique: reverte "Copiado ✓" → "Copiar link" após 2s.
	useEffect(() => {
		if (!copied) return;
		const t = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(t);
	}, [copied]);

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

	// Side-card variant (issue #69 / DESIGN-19): card vertical lateral direito,
	// mais verbose com welcome + codigo + share. Reservado para >=lg.
	if (variant === "side-card") {
		return (
			<aside
				role="status"
				aria-live="polite"
				aria-label={`Bem-vindo a sala ${code}. Convite pelo link.`}
				data-testid="empty-overlay-side-card"
				data-od-id="empty-overlay-side-card"
				className="absolute right-8 top-1/2 -translate-y-1/2 z-10 w-[280px] flex flex-col gap-3"
			>
				<Card padding="md" className="flex flex-col gap-3">
					<div className="flex items-baseline gap-2">
						<span
							className="font-italic italic text-coral text-[26px] leading-none"
							aria-hidden="true"
						>
							Ø
						</span>
						<span className="font-display font-extrabold text-[16px] tracking-[-0.02em]">
							Bem-vindo a sala
						</span>
					</div>

					<div className="flex flex-col gap-1">
						<span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint">
							Codigo
						</span>
						<span className="font-italic italic text-coral text-[20px] leading-none">
							{code}
						</span>
					</div>

					<div className="flex flex-col gap-1">
						<span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint">
							Convite
						</span>
						<button
							type="button"
							onClick={handleCopy}
							className={`border font-mono text-[10px] uppercase tracking-[0.06em] py-2 px-3 rounded-full transition-colors w-full ${
								copied
									? "border-olive bg-olive/10 text-olive"
									: "border-coral text-coral hover:bg-coral hover:text-white"
							}`}
							data-testid="empty-overlay-side-copy"
							aria-label="Copiar link de compartilhamento"
							aria-live="polite"
						>
							{copied ? "Copiado ✓" : "Copiar link"}
						</button>
					</div>

					<div className="flex items-center gap-2 pt-1 border-t border-ink/5">
						<span className="flex h-1.5 w-1.5 relative" aria-hidden="true">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
							<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-coral" />
						</span>
						<span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint">
							Aguardando primeiro jogador
						</span>
					</div>

					<button
						type="button"
						onClick={handleDismiss}
						className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-faint hover:text-ink py-1 underline underline-offset-4 self-end"
						data-testid="empty-overlay-dismiss"
					>
						jogue solo
					</button>
				</Card>
			</aside>
		);
	}

	// Default: banner variant (preserva UX existente em <lg).
	return (
		<div
			role="status"
			aria-live="polite"
			aria-label="Convite para outros jogadores"
			data-testid="empty-overlay"
			data-od-id="empty-overlay"
			className="relative z-10 mx-auto mt-2 mb-3 max-w-[560px] w-full"
		>
			<Card padding="md" className="flex flex-row items-center gap-4 flex-wrap">
				<div className="flex items-baseline gap-3 flex-1 min-w-0">
					<span className="font-mono text-[10px] uppercase tracking-[0.06em] text-coral font-medium whitespace-nowrap">
						Aguardando primeiro jogador
					</span>
					<span className="font-sans text-[12px] leading-[1.4] text-ink-mute">
						Codigo{" "}
						<span className="font-italic italic text-coral text-[14px] leading-none">
							{code}
						</span>
					</span>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleCopy}
						className={`border font-mono text-[10px] uppercase tracking-[0.06em] py-2 px-3.5 rounded-full transition-colors ${
							copied
								? "border-olive bg-olive/10 text-olive"
								: "border-coral text-coral hover:bg-coral hover:text-white"
						}`}
						data-testid="empty-overlay-copy"
						aria-label="Copiar link de compartilhamento"
						aria-live="polite"
					>
						{copied ? "Copiado ✓" : "Copiar link"}
					</button>
					<button
						type="button"
						onClick={handleDismiss}
						className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint hover:text-ink py-2 px-3 underline underline-offset-4"
						data-testid="empty-overlay-dismiss"
					>
						jogue solo
					</button>
				</div>
			</Card>
		</div>
	);
}
