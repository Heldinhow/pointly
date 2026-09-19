import type { NudgeId } from "./protocol";

/**
 * Catálogo de cutucadas fixas (issue #172) — SSOT dos rótulos do client.
 * Os ids espelham o `NudgeIdSchema` do contrato compartilhado; sem texto
 * livre (sem moderação). Ordem = ordem exibida no menu.
 */
export const NUDGE_CATALOG: ReadonlyArray<{
	id: NudgeId;
	label: string;
}> = [
	{ id: "bora", label: "Bora!" },
	{ id: "cafe", label: "☕ Café?" },
	{ id: "polemica", label: "Polêmica!" },
	{ id: "confia", label: "Confia" },
];
