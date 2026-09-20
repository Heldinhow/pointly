/**
 * Parser genérico de primeira mensagem de erro do Zod.
 * Extraído de `join.tsx` — `identity.ts`/`errors.ts` continuam donos das
 * mensagens, aqui só mora o acesso a `issues[0]`.
 */
import type { Lang } from "./i18n";

export function firstIssueMessage(
	error: unknown,
	lang: Lang = "pt-BR",
): string {
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
	return lang === "en" ? "Invalid value." : "Valor inválido.";
}

type SocketErrorCopy = {
	reveal: string;
	newRound: string;
	vote: string;
	interact: string;
};

/** Textos de socket centralizados (antes 6 variantes em `arena.tsx`). */
export const SOCKET_ERROR_COPY: Record<Lang, SocketErrorCopy> = {
	"pt-BR": {
		reveal: "Sem conexão com a sala. Recarregue para revelar.",
		newRound: "Sem conexão com a sala. Recarregue para abrir nova rodada.",
		vote: "Sem conexão com a sala. Recarregue para votar.",
		interact: "Sem conexão com a sala. Recarregue para interagir.",
	},
	en: {
		reveal: "No connection to the room. Reload to reveal.",
		newRound: "No connection to the room. Reload to start a new round.",
		vote: "No connection to the room. Reload to vote.",
		interact: "No connection to the room. Reload to interact.",
	},
};
