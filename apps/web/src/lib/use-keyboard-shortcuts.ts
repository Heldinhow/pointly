/**
 * useKeyboardShortcuts — listener global com input-focus guard (ADR-007).
 *
 * **Comportamento**:
 *  - Registra `keydown` em `window` no mount; cleanup em unmount.
 *  - Ignora keypress quando o foco está em `<input>`, `<textarea>` ou
 *    qualquer elemento `contentEditable` (escrever texto não dispara shortcut).
 *  - Aceita PT-BR ABNT: `?` shortcut também dispara em `/` (já que `?` é
 *    `Shift+/` no US keyboard mas ABNT mapeia diferente).
 *  - Match é case-insensitive.
 *  - Host gate opcional: handlers só rodam se `enabled === true`.
 *
 * **API**:
 *  - `shortcuts`: mapa `key → handler`. Suporta `?` como alias de `/`.
 *  - `enabled`: gate (default true). Use `false` para desabilitar.
 *  - Retorna `{ openHelp, setOpenHelp }` se `helpKey` for provido,
 *    permitindo consumer controlar visibilidade do HelpModal.
 *
 * **A11y**: shortcuts são conveniência — todas as ações têm botões na
 * UI com `aria-keyshortcuts` (vide reveal-button.tsx / new-round).
 *
 * @see .compozy/tasks/pointly-ux-hardening/task_09.md
 * @see .compozy/tasks/pointly-ux-hardening/adrs/adr-007.md
 */
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

/** Handler de atalho. Recebe o evento original (pode usar `preventDefault`). */
export type ShortcutHandler = (e: KeyboardEvent) => void;

/** Mapa de atalhos. Chave pode ser letra ou caractere especial (`?`, `/`, `Escape`). */
export type ShortcutMap = Record<string, ShortcutHandler>;

export interface UseKeyboardShortcutsOptions {
	shortcuts: ShortcutMap;
	/** Gate geral; default true. Quando false, nenhum handler dispara. */
	enabled?: boolean;
	/** Se fornecido (ex: '?'), o hook gerencia estado de help modal. */
	helpKey?: string;
}

/**
 * Hook que registra window keydown listener e mapeia teclas → handlers.
 *
 * @param opts Atalho map + gate + chave opcional de help
 * @returns `{ openHelp, setOpenHelp }` se `helpKey` foi fornecido, senão `null`
 */
export function useKeyboardShortcuts(opts: UseKeyboardShortcutsOptions): {
	openHelp: boolean;
	setOpenHelp: Dispatch<SetStateAction<boolean>>;
} | null {
	const { shortcuts, enabled = true, helpKey } = opts;
	const [openHelp, setOpenHelp] = useState(false);

	useEffect(() => {
		if (!enabled) return;

		function onKey(e: KeyboardEvent): void {
			// Input-focus guard: não dispara em <input>/<textarea>/contentEditable.
			const target = e.target;
			if (target instanceof HTMLElement) {
				const tag = target.tagName;
				if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
					return;
				}
			} else if (target instanceof Element) {
				// Fallback raro (Element sem HTMLElement).
				if (target.getAttribute("contenteditable") === "true") return;
			}

			const key = e.key;
			const upper = key.length === 1 ? key.toUpperCase() : key;

			// 1) Match exato (case-insensitive pra letras).
			const directMatch =
				shortcuts[upper] ?? (key.length === 1 ? shortcuts[key] : undefined);
			if (directMatch) {
				directMatch(e);
				return;
			}

			// 2) `?` mapeia para `/` (PT-BR ABNT).
			if (helpKey && (key === "?" || key === "/") && shortcuts[helpKey]) {
				shortcuts[helpKey](e);
				return;
			}
		}

		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
		};
	}, [enabled, shortcuts, helpKey]);

	if (helpKey === undefined) return null;
	return { openHelp, setOpenHelp };
}
