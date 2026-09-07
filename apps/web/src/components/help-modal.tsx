/**
 * HelpModal — modal de atalhos de teclado (ADR-007).
 *
 * Modal pequeno exibido quando o user pressiona `?` (ou `/` em ABNT).
 * Lista os atalhos disponíveis na Arena:
 *  - `R` — revelar votos (fase voting, ≥1 voto)
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
	{ keys: ["N"], label: "Iniciar nova rodada (após a revelação)" },
	{ keys: ["?"], label: "Abrir esta ajuda" },
	{ keys: ["Esc"], label: "Fechar ajuda ou convite" },
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
			<Card padding="md" className="feedback-modal-card w-full min-w-0 max-w-[480px] max-h-[calc(100dvh-3rem)] overflow-y-auto flex flex-col gap-4 items-start">
				<div className="min-w-0">
					<h2
						id="help-modal-title"
						className="font-display font-extrabold text-nav-mark tracking-tight"
					>
						Como jogar
					</h2>
				</div>
				<ol className="list-decimal pl-5 space-y-2 font-sans text-caption text-ink-mute">
					<li>Compartilhe o link da sala e combinem o que vão estimar.</li>
					<li>Escolha uma carta. Seu voto fica oculto para os outros até a revelação. O primeiro voto inicia os 60 segundos.</li>
					<li>Com pelo menos um voto, qualquer participante pode usar Revelar votos. Ao acabar o tempo, os votos são revelados automaticamente.</li>
					<li>Conversem sobre as diferenças. Após a revelação, qualquer participante pode iniciar uma nova rodada, que limpa os votos.</li>
				</ol>
				<h3 className="font-sans font-bold text-caption">Atalhos de teclado</h3>

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
					className="min-h-[44px] rounded-[9px] transition-none"
				>
					Fechar
					<span aria-hidden="true">×</span>
				</Button>
			</Card>
		</div>
	);
}
