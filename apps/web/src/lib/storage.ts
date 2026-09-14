/**
 * Storage seguro com fallback em memória.
 * SSOT — `identity.ts` e `theme.ts` usavam o mesmo try/catch 5x.
 */

const memoryFallback = new Map<string, string>();

export function safeGet(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return memoryFallback.get(key) ?? null;
	}
}

export function safeSet(key: string, value: string): void {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		memoryFallback.set(key, value);
	}
}

export function safeRemove(key: string): void {
	try {
		window.localStorage.removeItem(key);
	} catch {
		memoryFallback.delete(key);
	}
}

/** Limpa sem lançar quando o storage está indisponível (ex: arena ×3). */
export function safeClear(fn: () => void): void {
	try {
		fn();
	} catch {
		// Storage indisponível — sessão em memória já foi limpa.
	}
}
