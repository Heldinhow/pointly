import type { ProjectileOutcome } from "../schemas/events";

/**
 * Sorteio do desfecho de projétil (espelho server/client).
 * SSOT — antes inline em `apps/server/src/handlers/throw-projectile.ts`.
 *
 * Distribuição: 80% hit (0.20–1.0), 15% dodge (0.05–0.20), 5% deflect (0–0.05).
 * `rand` injetável para testes determinísticos.
 */
export function rollProjectileOutcome(
	rand: number = Math.random(),
): ProjectileOutcome {
	if (rand < 0.05) return "deflect";
	if (rand < 0.2) return "dodge";
	return "hit";
}

/** Cooldown entre arremessos do mesmo sender (ms). */
export const PROJECTILE_COOLDOWN_MS = 2000;
