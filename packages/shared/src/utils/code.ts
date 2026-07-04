/**
 * generateUniqueCode — código curto 4-char alfanumérico (A–Z, 0–9)
 *
 * Phase 2 (T7a). Usa `crypto.getRandomValues` (browser + Bun). Resolve
 * colisões iterando até `maxRetries`; se persistir, throw `CodeCollisionError`.
 *
 * Distribuição uniforme por charset `[A-Z0-9]` → 36^4 = 1.679.616 códigos.
 * Em 12-plyer sala raríssimo colidir — birth-day math: 50% chance em ~1500 codes.
 * Max retries 5 dá 99.85% de cobertura mesmo com alta densidade.
 *
 * @see .specs/features/planning-poker-v1/spec.md F-003
 * @see docs/adr/0005-v1-functional-in-memory-state.md
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LEN = 4;

/**
 * Thrown when `generateUniqueCode` exhausts `maxRetries` without finding a free code.
 */
export class CodeCollisionError extends Error {
	readonly attempts: number;
	constructor(attempts: number) {
		super(
			`Não foi possível gerar código único após ${attempts} tentativas. Salve mais tarde ou aumente maxRetries.`,
		);
		this.name = "CodeCollisionError";
		this.attempts = attempts;
	}
}

/**
 * Gera código 4-char [A-Z0-9] único dentro de `existingCodes`.
 *
 * @param existingCodes Set<string> de códigos em uso
 * @param maxRetries    Máximo de tentativas antes de throw (default: 5)
 * @returns código único
 * @throws {CodeCollisionError}
 */
export function generateUniqueCode(
	existingCodes: Set<string>,
	maxRetries = 5,
): string {
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		const candidate = randomCode();
		if (!existingCodes.has(candidate)) {
			return candidate;
		}
	}
	throw new CodeCollisionError(maxRetries);
}

/**
 * Gera um código aleatório de 4 chars sem checar unicidade.
 * Útil para testes e para a primeira tentativa em loops de retry.
 */
export function randomCode(): string {
	const buf = new Uint32Array(1);
	// Browser + Bun: ambos têm `crypto.getRandomValues` no globalThis.
	globalThis.crypto.getRandomValues(buf);
	const n = buf[0]!;

	// 4 chars * 5 bits = 20 bits. 36^4 ≈ 2^23.2 (precisamos de 23.2 bits).
	// 2 draws dão 64 bits, mais que suficiente.
	const buf2 = new Uint32Array(1);
	globalThis.crypto.getRandomValues(buf2);
	const n2 = buf2[0]!;

	let out = "";
	let val = (BigInt(n) << 32n) | BigInt(n2);
	for (let i = 0; i < CODE_LEN; i++) {
		out += ALPHABET[Number(val % 36n)];
		val = val / 36n;
	}
	return out;
}
