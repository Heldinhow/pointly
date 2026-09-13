/**
 * identity — lógica compartilhada de identidade (spell-rebuild).
 *
 * Centraliza o que landing/join/arena consomem:
 *  - normalização/validação de código de sala (4 alfanum maiúsculos)
 *  - validação de apelido (PT-BR, retorna erro ou null)
 *  - persistência best-effort em sessionStorage (privacidade-by-default:
 *    fechar a aba apaga tudo; falhas de storage nunca quebram o fluxo)
 *  - construção da URL de convite + base da API REST
 */

/** Base relativa da API — o Vite proxya `/api` → :3001 em dev. */
export const API_BASE = "/api/v1";

export const NICK_MIN = 2;
export const NICK_MAX = 20;

const CODE_RE = /^[A-Z0-9]{4}$/;
const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const K_UUID = "pointly.uuid";
const K_NICK = "pointly.nick";
const K_CODE = "pointly.code";

/**
 * Normaliza código de sala: NFKD (dobra acentos), remove tudo que não
 * for [A-Za-z0-9], corta em 4, maiúsculas. `"ab-c!"` → `"ABC"`.
 */
export function normalizeCode(raw: string): string {
	return raw
		.normalize("NFKD")
		.replace(/[^A-Za-z0-9]/g, "")
		.slice(0, 4)
		.toUpperCase();
}

/** Código válido = exatamente 4 chars [A-Z0-9] (já normalizado). */
export function isValidCode(code: string): boolean {
	return CODE_RE.test(code);
}

/**
 * Valida apelido. Retorna a mensagem de erro PT-BR ou `null` quando ok.
 * String vazia → `null` (o botão de submit fica disabled em vez de
 * mostrar erro para quem ainda está digitando).
 */
export function validateNick(nick: string): string | null {
	if (nick.length === 0) return null;
	if (nick.length < NICK_MIN) return "Use pelo menos 2 caracteres.";
	if (nick.length > NICK_MAX) return "Use no máximo 20 caracteres.";
	if (/ {2,}/.test(nick)) return "Evite espaços duplos no meio do nome.";
	if (nick !== nick.trim()) return "Remova espaços no início e no fim.";
	return null;
}

function read(key: string): string | null {
	try {
		if (typeof sessionStorage === "undefined") return null;
		return sessionStorage.getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string): void {
	try {
		sessionStorage.setItem(key, value);
	} catch {
		/* storage indisponível (SSR / aba privada) — segue sem persistir */
	}
}

function fallbackUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = Math.floor(Math.random() * 16);
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Lê o UUID de `pointly.uuid`; se ausente/inválido, gera (crypto.randomUUID
 * com fallback), persiste best-effort e retorna.
 */
export function getOrCreateUUID(): string {
	const stored = read(K_UUID);
	if (stored && UUID_RE.test(stored)) return stored;
	const uuid =
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
			? crypto.randomUUID()
			: fallbackUUID();
	write(K_UUID, uuid);
	return uuid;
}

/** Apelido persistido na aba (pré-preenche o join). */
export function getNick(): string | null {
	return read(K_NICK);
}

/** Persiste o apelido. Nunca lança. */
export function setNick(nick: string): void {
	write(K_NICK, nick);
}

/** Código da última sala nesta aba. */
export function getCode(): string | null {
	return read(K_CODE);
}

/** Persiste o código da sala. Nunca lança. */
export function setCode(code: string): void {
	write(K_CODE, code);
}

/** URL de convite: `${origin}/join?code=${code}`. */
export function buildShareUrl(origin: string, code: string): string {
	return `${origin}/join?code=${code}`;
}
