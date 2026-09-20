/**
 * Erro de fluxo de entrada com código de máquina (códigos vindos do servidor
 * ou gerados localmente) e mensagem legível para a interface.
 */
import type { Lang } from "./i18n";

export class JoinError extends Error {
	readonly code: string;

	constructor(code: string, message?: string) {
		super(message ?? code);
		this.name = "JoinError";
		this.code = code;
	}
}

const FRIENDLY_MESSAGES: Record<Lang, Record<string, string>> = {
	"pt-BR": {
		sala_nao_encontrada: "Sala não encontrada. Confira o código.",
		sala_cheia: "Sala cheia. Peça outro código ao time.",
		invalid_nick: "Apelido inválido. Use de 2 a 20 caracteres.",
		invalid_code: "Código inválido. Use 4 letras ou números.",
		role_denied:
			"Espectadores não votam. Para votar, saia e entre como jogador.",
		rate_limited: "Muitas tentativas. Aguarde um segundo e tente de novo.",
		connection_failed:
			"Sem conexão com o servidor. Confira sua internet e tente de novo.",
		hello_timeout: "O servidor demorou a responder. Tente de novo.",
	},
	en: {
		sala_nao_encontrada: "Room not found. Check the code.",
		sala_cheia: "Room is full. Ask the team for another code.",
		invalid_nick: "Invalid nickname. Use 2 to 20 characters.",
		invalid_code: "Invalid code. Use 4 letters or digits.",
		role_denied:
			"Spectators can't vote. To vote, leave and join as a player.",
		rate_limited: "Too many attempts. Wait a second and try again.",
		connection_failed: "No connection to the server. Check your internet and try again.",
		hello_timeout: "The server took too long to respond. Try again.",
	},
};

const GENERIC_MESSAGE: Record<Lang, string> = {
	"pt-BR": "Algo deu errado. Tente de novo.",
	en: "Something went wrong. Try again.",
};

/** Mensagem genérica de falha inesperada no idioma da interface. */
export function genericJoinMessage(lang: Lang = "pt-BR"): string {
	return GENERIC_MESSAGE[lang];
}

/**
 * Traduz um código de erro para texto no idioma da interface. Usa a mensagem
 * do servidor (pt-BR) como fallback no PT; em EN cai na mensagem genérica —
 * nunca exibe o código cru.
 */
export function friendlyJoinMessage(
	code: string,
	fallback?: string,
	lang: Lang = "pt-BR",
): string {
	const translated = FRIENDLY_MESSAGES[lang][code];
	if (translated) return translated;
	if (lang === "en") return genericJoinMessage("en");
	return fallback ?? genericJoinMessage("pt-BR");
}
