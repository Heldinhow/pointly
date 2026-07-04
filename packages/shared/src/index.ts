/**
 * @planning-poker/shared — public API (barrel).
 *
 * Phase 2 (T11). Único ponto de entrada do package.
 *
 *   import {
 *     PlayerSchema,
 *     computeConsensus,
 *     generateUniqueCode,
 *     type SalaState,
 *     type HelloPayload
 *   } from "@planning-poker/shared";
 *
 * Camadas:
 *   schemas/         Zod schemas + types (Sala, Player, events C↔S)
 *   compute/         pure functions (computeConsensus, isUnanimous)
 *   utils/           helpers (generateUniqueCode, CodeCollisionError)
 *   types.ts         z.infer re-exports consolidados
 *
 * @see docs/adr/0008-zustand-zod-shared-schemas.md
 */

// Schemas (Zod runtime)
export * from "./schemas/sala";
export * from "./schemas/events";

// Compute (pure functions)
export * from "./compute/consensus";

// Utils (helpers)
export * from "./utils/code";

// Version (pra telemetry/health checks)
export const SHARED_SCHEMA_VERSION = "0.2.0-shared-final";
