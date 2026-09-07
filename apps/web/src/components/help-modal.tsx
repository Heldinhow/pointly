/**
 * HelpModal — modal de atalhos de teclado (ADR-007).
 *
 * Modal pequeno exibido quando o user pressiona `?` (ou `/` em ABNT).
 * Lista os atalhos disponíveis na Arena:
 *  - `R` — revelar votos (host, fase voting, ≥1 voto)
 *  - `N` — nova rodada (qualquer player, fase revealed)
 *  - `?` — abrir este help
 *  - `Esc` — fechar overlays / modais
 *
 * **A11y**: role="dialog" + aria-modal="true" + aria-labelledby;
 * Esc fecha o modal.
 *
 * **Padrão**: segue EmptyOverlay.tsx (mesma família de modais).
 *
 * @see .compozy/tasks/pointly-ux-hardening/task_09.md
 */
import { useEffect, useRef } from "react";
import type * as React from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export interface HelpModalProps {
	/** Quando true, modal renderiza. */
	open: boolean;
	/** Callback pra fechar (Esc ou click no botão). */
	onClose: () => void;
}

/** Linha da tabela de atalhos. */
interface Row {
	/** Texto da tecla (mostrado em monospace pill). */
	keys: string[];
	/** Descrição em PT-BR. */
	label: string;
}

const ROWS: Row[] = [
	{ keys: ["R"], label: "Revelar votos (durante a votação)" },
	{ keys: ["N"], label: "Iniciar nova rodada (após o reveal)" },
	{ keys: ["?"], label: "Abrir este help" },
	{ keys: ["Esc"], label: "Fechar overlays e modais" },
];

export function HelpModal({ open, onClose }: HelpModalProps) {
	const closeRef = useRef<HTMLButtonElement>(null);
	const restoreFocusRef = useRef<HTMLElement | null>(null);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	// Capture the trigger before opening, then return focus to it on close.
	useEffect(() => {
		if (!open) return;
		restoreFocusRef.current = document.activeElement as HTMLElement | null;
		closeRef.current?.focus();

		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			restoreFocusRef.current?.focus();
			restoreFocusRef.current = null;
		};
	}, [open]);

	function trapFocus(e: React.KeyboardEvent<HTMLDivElement>) {
		if (e.key !== "Tab") return;
		const focusables = Array.from(
			e.currentTarget.querySelectorAll<HTMLElement>(
				"button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
			),
		).filter((element) => !element.hasAttribute("disabled"));
		if (focusables.length === 0) return;
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		if (!first || !last) return;
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	if (!open) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="help-modal-title"
			data-testid="help-modal"
			onKeyDown={trapFocus}
			className="feedback-modal-shell fixed inset-0 z-30 flex items-center justify-center px-4 py-6"
		>
			<Card padding="lg" className="feedback-modal-card w-full max-w-[480px] max-h-[calc(100dvh-3rem)] overflow-y-auto flex flex-col gap-4 items-start">
				<div className="flex items-baseline gap-3">
					<div className="font-italic text-coral text-brand-mark leading-none">
						Ø
					</div>
					<h2
						id="help-modal-title"
						className="font-display font-extrabold text-nav-mark tracking-tight"
					>
						Atalhos<span className="text-coral-deep">.</span>
					</h2>
				</div>
				<p className="font-sans text-caption text-ink-mute">
					Navegação rápida pelo teclado. Atalhos também ficam indicados nos
					botões da arena (anunciados pelos leitores de tela).
				</p>

				<table className="w-full mt-1" data-testid="help-modal-shortcuts">
					<caption className="sr-only">Teclas de atalho e ações correspondentes</caption>
					<tbody>
						{ROWS.map((row) => (
							<tr
								key={row.label}
								className="border-t border-ink/5 first:border-t-0"
							>
								<th scope="row" className="py-2.5 pr-4 text-left font-normal">
									<div className="inline-flex gap-1">
										{row.keys.map((k) => (
											<kbd
												key={k}
												className="font-mono text-label uppercase tracking-caps border border-ink/15 bg-paper rounded-md px-2 py-1 text-ink-soft"
												aria-label={`Tecla ${k}`}
											>
												{k}
											</kbd>
										))}
									</div>
								</th>
								<td className="py-2.5 font-sans text-caption text-ink-mute">
									{row.label}
								</td>
							</tr>
						))}
					</tbody>
				</table>

				<Button
					ref={closeRef}
					variant="default"
					size="md"
					onClick={onClose}
					data-testid="help-modal-close"
					className="min-h-[44px]"
				>
					Fechar
					<span aria-hidden="true">×</span>
				</Button>
			</Card>
		</div>
	);
}
