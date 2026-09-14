import { z } from "zod";
import { safeGet, safeRemove, safeSet } from "./storage";

/**
 * Identidade client-side: UUID persistido (reconnect), rascunho do apelido
 * (sobrevive ao reload na entrada) e normalização/validação do código.
 */

const UUID_KEY = "pointly-uuid";
const NICK_DRAFT_KEY = "pointly-nick-draft";
const SESSION_KEY = "pointly-session";

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readStored(key: string): string | null {
	return safeGet(key);
}

function writeStored(key: string, value: string): void {
	safeSet(key, value);
}

function removeStored(key: string): void {
	safeRemove(key);
}

function randomUuid(): string {
	try {
		if (
			typeof crypto !== "undefined" &&
			typeof crypto.randomUUID === "function"
		) {
			return crypto.randomUUID();
		}
	} catch {
		// Ambiente sem Web Crypto — cai para o fallback abaixo.
	}
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = Math.floor(Math.random() * 16);
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/** UUID estável do navegador; regenera se o armazenado for inválido. */
export function getOrCreateUuid(): string {
	const stored = readStored(UUID_KEY);
	if (stored && UUID_PATTERN.test(stored)) return stored;
	const fresh = randomUuid();
	writeStored(UUID_KEY, fresh);
	return fresh;
}

export function loadNickDraft(): string {
	return readStored(NICK_DRAFT_KEY) ?? "";
}

export function saveNickDraft(nick: string): void {
	writeStored(NICK_DRAFT_KEY, nick);
}

/**
 * Sessão persistida para continuidade (ticket 09): código da sala + apelido
 * usados no F5 para reenviar `hello` com o mesmo UUID sem duplicar o Player.
 * O servidor reidrata voto, assento e fase a partir do UUID.
 */
export interface PersistedSession {
	code: string;
	nick: string;
}

export function saveSession(code: string, nick: string): void {
	const normalized = normalizeCode(code);
	if (!isValidCode(normalized)) return;
	const trimmed = nick.trim();
	if (trimmed.length < 2) return;
	writeStored(
		SESSION_KEY,
		JSON.stringify({ code: normalized, nick: trimmed }),
	);
}

export function loadSession(): PersistedSession | null {
	const raw = readStored(SESSION_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as Partial<PersistedSession>;
		if (
			typeof parsed.code !== "string" ||
			typeof parsed.nick !== "string" ||
			!isValidCode(normalizeCode(parsed.code)) ||
			parsed.nick.trim().length < 2
		) {
			return null;
		}
		return { code: normalizeCode(parsed.code), nick: parsed.nick.trim() };
	} catch {
		return null;
	}
}

export function clearSession(): void {
	removeStored(SESSION_KEY);
}

/**
 * Normaliza código digitado: maiúsculas, só A-Z0-9, no máximo 4.
 * Idempotente — pode rodar a cada tecla sem acumular efeitos.
 */
export function normalizeCode(raw: string): string {
	return raw
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 4);
}

export function isValidCode(code: string): boolean {
	return /^[A-Z0-9]{4}$/.test(code);
}

export const NickSchema = z
	.string()
	.min(2, "Apelido precisa de ao menos 2 caracteres.")
	.max(20, "Apelido pode ter no máximo 20 caracteres.")
	.refine((value) => value === value.trim(), {
		message: "Apelido não pode começar ou terminar com espaço.",
	})
	.refine((value) => !/\s{2}/.test(value), {
		message: "Apelido não pode ter espaços duplos.",
	});

export const CodeSchema = z
	.string()
	.regex(/^[A-Z0-9]{4}$/, "Código tem 4 letras ou números.");
