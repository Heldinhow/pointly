/**
 * Parser genérico de primeira mensagem de erro do Zod.
 * Extraído de `join.tsx` — `identity.ts`/`errors.ts` continuam donos das
 * mensagens, aqui só mora o acesso a `issues[0]`.
 */
export function firstIssueMessage(error: unknown): string {
	if (
		typeof error === "object" &&
		error !== null &&
		"issues" in error &&
		Array.isArray((error as { issues: unknown }).issues)
	) {
		const issues = (error as { issues: Array<{ message?: unknown }> }).issues;
		const message = issues[0]?.message;
		if (typeof message === "string") return message;
	}
	return "Valor inválido.";
}

/** Textos de socket centralizados (antes 6 variantes em `arena.tsx`). */
export const SOCKET_ERROR_COPY = {
	reveal: "Sem conexão com a sala. Recarregue para revelar.",
	newRound: "Sem conexão com a sala. Recarregue para abrir nova rodada.",
	vote: "Sem conexão com a sala. Recarregue para votar.",
	interact: "Sem conexão com a sala. Recarregue para interagir.",
} as const;
