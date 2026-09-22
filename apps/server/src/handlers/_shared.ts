/**
 * Helpers compartilhados dos handlers WS (SSOT).
 *
 * Antes cada handler repetia:
 *  - guard `hub.getSalaForPlayer(playerId)` + mensagem "não está em nenhuma sala" (4x)
 *  - `catch (e) { if SalaError …; internal_error }` (4x + variante hello)
 *  - união de códigos de erro (5x em handlers + sala.ts + hub.ts)
 */
import type { Hub } from "../hub";
import { SalaError, type Sala } from "../sala";

export type HandlerErrorCode =
	| "invalid_vote"
	| "invalid_phase"
	| "sala_cheia"
	| "sala_nao_encontrada"
	| "invalid_nick"
	| "role_denied"
	| "pauta_cheia"
	| "historia_nao_encontrada"
	| "internal_error";

export interface HandlerError {
	ok: false;
	code: HandlerErrorCode;
	message: string;
}

type NotFoundCode = Extract<
	HandlerErrorCode,
	| "invalid_vote"
	| "invalid_phase"
	| "sala_nao_encontrada"
	| "historia_nao_encontrada"
>;

/**
 * Localiza a sala do player ou retorna outcome de erro pronto.
 * `notFoundCode` preserva o código histórico de cada handler
 * (cast-vote: invalid_vote · reveal/new-round: invalid_phase ·
 * throw: sala_nao_encontrada · pauta #163: historia_nao_encontrada).
 *
 * ATENÇÃO ao estreitar: use `instanceof Sala` — nunca `"code" in`,
 * pois `Sala` também tem campo `code` (código da sala).
 */
export function requireSala(
	hub: Hub,
	playerId: string,
	notFoundCode: NotFoundCode,
): Sala | HandlerError {
	const sala = hub.getSalaForPlayer(playerId);
	if (!sala) {
		return {
			ok: false,
			code: notFoundCode,
			message: `Player ${playerId} não está em nenhuma sala.`,
		};
	}
	return sala;
}

/** Mapeia exceção de domínio para outcome de erro (nunca lança). */
export function mapDomainError(e: unknown): HandlerError {
	if (e instanceof SalaError) {
		return { ok: false, code: e.code, message: e.message };
	}
	const message = e instanceof Error ? e.message : String(e);
	return { ok: false, code: "internal_error", message };
}
