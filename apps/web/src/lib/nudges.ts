import type { Lang } from "./i18n";
import type { NudgeId } from "@planning-poker/shared";

/**
 * Catálogo de cutucadas fixas (issue #172) — SSOT dos rótulos do client.
 * Os ids espelham o `NudgeIdSchema` do contrato compartilhado; sem texto
 * livre (sem moderação). Ordem = ordem exibida no menu.
 */
export const NUDGE_CATALOG: ReadonlyArray<{
	id: NudgeId;
	label: Record<Lang, string>;
}> = [
	{ id: "bora", label: { "pt-BR": "Bora!", en: "Let's go!" } },
	{ id: "cafe", label: { "pt-BR": "☕ Café?", en: "☕ Coffee?" } },
	{ id: "polemica", label: { "pt-BR": "Polêmica!", en: "Hot take!" } },
	{ id: "confia", label: { "pt-BR": "Confia", en: "Trust me" } },
];
