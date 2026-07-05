/**
 * Storage helper — privacy-by-default (ADR-006).
 *
 * API typed em cima de `sessionStorage`. **Não usa localStorage**:
 * tab-close apaga tudo automaticamente, honrando o claim "zero cadastro,
 * zero rastreamento" sem precisar de consent banner.
 *
 * **Try/catch wrapping**: todos os métodos são SSR-safe e privados-mode-safe.
 * Falhas retornam `null` / `false` em vez de throw.
 *
 * **UUID generation**: continua via `crypto.randomUUID()` no `getUUID()`
 * — só o local de persistência mudou (de localStorage para sessionStorage).
 *
 * **Bridge com T06**: `resetDismissedEmpty()` é o helper que o Arena watcher
 * chama ao detectar transição `phase='voting' && players.length===1`
 * para re-mostrar o EmptyOverlay após dismiss.
 *
 * @see .compozy/tasks/pointly-ux-hardening/task_08.md
 * @see .compozy/tasks/pointly-ux-hardening/adrs/adr-006.md
 */

const K_UUID = "pointly.uuid";
const K_NICK = "pointly.nick";
const K_CODE = "pointly.code";
const K_DISMISSED_EMPTY = "pointly.dismissedEmpty";

/** Lê raw de sessionStorage. Retorna null se indisponível ou chave ausente. */
function rawGet(key: string): string | null {
	try {
		return sessionStorage.getItem(key);
	} catch {
		return null;
	}
}

/** Escreve raw em sessionStorage. Silencioso em falha (SSR / private). */
function rawSet(key: string, value: string): boolean {
	try {
		sessionStorage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}

/** Remove chave de sessionStorage. Silencioso em falha. */
function rawRemove(key: string): boolean {
	try {
		sessionStorage.removeItem(key);
		return true;
	} catch {
		return false;
	}
}

/** Regex validando UUID v4 (formato 8-4-4-4-12). */
const UUID_RE = /^[0-9a-f-]{36}$/i;

/** Gera UUID v4 com fallback para ambientes sem `crypto.randomUUID`. */
function generateUUID(): string {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return "00000000-0000-4000-8000-000000000000".replace(/[018]/g, (c) => {
		const r = Math.random() * 16;
		const v = c === "0" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

// ---------------------------------------------------------------------------
// UUID
// ---------------------------------------------------------------------------

/** Lê UUID do sessionStorage; se ausente/inválido, gera + persiste + retorna. */
export function getUUID(): string {
	const stored = rawGet(K_UUID);
	if (stored && UUID_RE.test(stored)) return stored;
	const uuid = generateUUID();
	rawSet(K_UUID, uuid);
	return uuid;
}

/** Persiste UUID em sessionStorage. Retorna `true` se escreveu OK. */
export function setUUID(uuid: string): boolean {
	if (!UUID_RE.test(uuid)) return false;
	return rawSet(K_UUID, uuid);
}

// ---------------------------------------------------------------------------
// Nick / Code (UX: preenchem se o user voltou na mesma aba)
// ---------------------------------------------------------------------------

export function getNick(): string | null {
	return rawGet(K_NICK);
}

export function setNick(nick: string): boolean {
	return rawSet(K_NICK, nick);
}

export function getCode(): string | null {
	return rawGet(K_CODE);
}

export function setCode(code: string): boolean {
	return rawSet(K_CODE, code);
}

// ---------------------------------------------------------------------------
// EmptyOverlay dismissal flag
// ---------------------------------------------------------------------------

export function getDismissedEmpty(): boolean {
	return rawGet(K_DISMISSED_EMPTY) === "1";
}

export function setDismissedEmpty(): boolean {
	return rawSet(K_DISMISSED_EMPTY, "1");
}

/**
 * Limpa o flag de dismissal para o EmptyOverlay re-aparecer.
 * Usado em T06 quando o Arena detecta transição `voting + solo`.
 */
export function resetDismissedEmpty(): boolean {
	return rawRemove(K_DISMISSED_EMPTY);
}
