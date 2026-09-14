/**
 * Erro de fluxo de entrada com código de máquina (códigos vindos do servidor
 * ou gerados localmente) e mensagem legível para a interface.
 */
export class JoinError extends Error {
	readonly code: string;

	constructor(code: string, message?: string) {
		super(message ?? code);
		this.name = "JoinError";
		this.code = code;
	}
}

const FRIENDLY_MESSAGES: Record<string, string> = {
	sala_nao_encontrada: "Sala não encontrada. Confira o código.",
	sala_cheia: "Sala cheia. Peça outro código ao time.",
	invalid_nick: "Apelido inválido. Use de 2 a 20 caracteres.",
	invalid_code: "Código inválido. Use 4 letras ou números.",
	rate_limited: "Muitas tentativas. Aguarde um segundo e tente de novo.",
	connection_failed:
		"Sem conexão com o servidor. Confira sua internet e tente de novo.",
	hello_timeout: "O servidor demorou a responder. Tente de novo.",
};

/**
 * Traduz um código de erro para texto em pt-BR. Usa a mensagem do servidor
 * como fallback quando não há tradução — nunca exibe o código cru.
 */
export function friendlyJoinMessage(code: string, fallback?: string): string {
	return FRIENDLY_MESSAGES[code] ?? fallback ?? "Algo deu errado. Tente de novo.";
}
