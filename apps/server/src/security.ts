/**
 * Hardening de borda do servidor (revisão de segurança 2026-10).
 *
 *  - `clientIpFrom`: IP real do cliente atrás do Traefik (hop mais à direita
 *    do `X-Forwarded-For`, só quando `TRUST_PROXY=1`).
 *  - `isOriginAllowed`: bloqueia Cross-Site WebSocket Hijacking no upgrade.
 *  - `TokenBucket`: limite de mensagens por conexão WS.
 *  - `WindowLimiter`: limite por chave (IP) em janela fixa (criação de sala,
 *    lookup de código, hello com código inexistente).
 *
 * Tudo em memória, coerente com ADR-0005 (processo único, sem Redis).
 */

export const DEFAULT_ALLOWED_ORIGINS = [
	"https://pointly.space",
	"https://www.pointly.space",
	"http://localhost:5173",
	"http://localhost:5179",
	"http://127.0.0.1:5173",
	"http://127.0.0.1:5179",
];

/** Lê `ALLOWED_ORIGINS` (lista separada por vírgula) ou usa o default. */
export function parseAllowedOrigins(raw: string | undefined): Set<string> {
	const list = raw
		?.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	return new Set(list && list.length > 0 ? list : DEFAULT_ALLOWED_ORIGINS);
}

/**
 * Origin ausente = cliente não-browser (CLI/testes). CSWSH exige browser, e
 * browser sempre manda Origin no upgrade — então só recusamos Origin presente
 * e fora da lista.
 */
export function isOriginAllowed(
	origin: string | null | undefined,
	allowed: Set<string>,
): boolean {
	if (!origin) return true;
	return allowed.has(origin);
}

/**
 * IP do cliente. Com `trustProxy`, usa o hop mais à direita do
 * `X-Forwarded-For` (o que o nosso proxy acrescentou — não forjável pelo
 * cliente). Sem proxy confiável, o header é ignorado.
 */
export function clientIpFrom(
	xff: string | null | undefined,
	socketIp: string | null | undefined,
	trustProxy: boolean,
): string {
	if (trustProxy && xff) {
		const hops = xff
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		const last = hops[hops.length - 1];
		if (last) return last;
	}
	return socketIp || "unknown";
}

/** Token bucket simples (capacidade + reposição por segundo). */
export class TokenBucket {
	private tokens: number;
	private last: number;

	constructor(
		private readonly capacity: number,
		private readonly refillPerSec: number,
		now: number = Date.now(),
	) {
		this.tokens = capacity;
		this.last = now;
	}

	take(now: number = Date.now()): boolean {
		const elapsed = Math.max(0, now - this.last) / 1000;
		this.tokens = Math.min(
			this.capacity,
			this.tokens + elapsed * this.refillPerSec,
		);
		this.last = now;
		if (this.tokens < 1) return false;
		this.tokens -= 1;
		return true;
	}
}

/** Contador por chave em janela fixa. */
export class WindowLimiter {
	private readonly hits = new Map<string, { start: number; count: number }>();

	constructor(
		private readonly max: number,
		private readonly windowMs: number,
	) {}

	/** Registra uma tentativa; `false` se a chave estourou o limite. */
	hit(key: string, now: number = Date.now()): boolean {
		const entry = this.hits.get(key);
		if (!entry || now - entry.start >= this.windowMs) {
			this.hits.set(key, { start: now, count: 1 });
			return true;
		}
		if (entry.count >= this.max) return false;
		entry.count += 1;
		return true;
	}

	/** Remove janelas expiradas (chamado no tick). */
	prune(now: number = Date.now()): void {
		for (const [key, entry] of this.hits) {
			if (now - entry.start >= this.windowMs) this.hits.delete(key);
		}
	}

	size(): number {
		return this.hits.size;
	}
}

/** Limites padrão (sobrescrevíveis por env no entrypoint). */
export const LIMITS = {
	/** Mensagens WS por conexão: rajada 40, sustentado 20/s. */
	wsMsgBurst: 40,
	wsMsgPerSec: 20,
	/** Salas criadas por IP por minuto. */
	roomCreatePerMin: 10,
	/** Teto global de salas simultâneas no processo. */
	maxSalas: 5000,
	/** Lookups `GET /api/v1/salas/:code` por IP por minuto. */
	lookupPerMin: 30,
	/** `hello` com código inexistente por IP por minuto. */
	unknownCodePerMin: 10,
	/** Beacons `POST /api/stats/pageview` por IP por minuto. */
	pageviewPerMin: 60,
	/** Leituras `GET /api/stats/visits` por IP por minuto. */
	visitsPerMin: 120,
	/** Tamanho máximo de frame WS (bytes). Avatar ≤40KB + folga. */
	maxPayloadBytes: 64 * 1024,
} as const;

export function envInt(raw: string | undefined, fallback: number): number {
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
