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
import { useEffect } from "react";
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
	// Esc fecha o modal.
	useEffect(() => {
		if (!open) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="help-modal-title"
			data-testid="help-modal"
			className="absolute inset-0 bg-bg/92 backdrop-blur-[4px] flex items-center justify-center z-30 transition-opacity duration-200 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]"
		>
			<Card padding="lg" className="w-full max-w-[480px] max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col gap-4 items-start">
				<div className="flex items-baseline gap-3">
					<div className="font-italic italic text-coral text-brand-mark leading-none">
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
					<tbody>
						{ROWS.map((row) => (
							<tr
								key={row.label}
								className="border-t border-ink/5 first:border-t-0"
							>
								<td className="py-2.5 pr-4">
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
								</td>
								<td className="py-2.5 font-sans text-caption text-ink-mute">
									{row.label}
								</td>
							</tr>
						))}
					</tbody>
				</table>

				<Button
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
