/**
 * WS rate limiter — Phase 3 / T17a
 *
 * Limite simples: max N conexões por segundo por IP, em janela rolling de 1s.
 * Usa `Map<ip, number[]>` em memória; thread-safe o suficiente para Bun single-process.
 *
 * @see spec edge cases "Heartbeat timeout (60s sem ping) | Server desconecta player"
 *       rate limit é anti-spam DoS superficial; v1 não usa Redis.
 */

const WINDOW_MS = 1000;

export class RateLimiter {
	private readonly byIP: Map<string, number[]> = new Map();
	private readonly maxPerWindow: number;

	constructor(maxPerSecond: number) {
		this.maxPerWindow = maxPerSecond;
	}

	/**
	 * Verifica se IP pode conectar agora. Se sim, registra e retorna `true`.
	 * Se não, retorna `false` (sem throw — caller decide ação).
	 *
	 * Janela: timestamps em ms. Limpa entradas > WINDOW_MS.
	 */
	check(ip: string, now: number = Date.now()): boolean {
		const timestamps = this.byIP.get(ip) ?? [];
		// limpa过期
		const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
		if (fresh.length >= this.maxPerWindow) {
			this.byIP.set(ip, fresh);
			return false;
		}
		fresh.push(now);
		this.byIP.set(ip, fresh);
		return true;
	}

	/**
	 * Limpa IPs inativos (> 2x janela). Chamado por job periódico de 10s.
	 */
	tick(now: number = Date.now()): void {
		for (const [ip, timestamps] of this.byIP) {
			const fresh = timestamps.filter((t) => now - t < WINDOW_MS * 2);
			if (fresh.length === 0) {
				this.byIP.delete(ip);
			} else {
				this.byIP.set(ip, fresh);
			}
		}
	}

	/**
	 * @returns número de IPs rastreados (debug/diagnostics).
	 */
	size(): number {
		return this.byIP.size;
	}
}
