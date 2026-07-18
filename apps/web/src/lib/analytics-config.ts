/**
 * analytics-config — single source of truth for the GA measurement ID.
 *
 * Why a separate file: Vite's `import.meta.env` is statically replaced at build
 * time. If we read it inline in `analytics.ts`, every test that imports
 * `analytics.ts` would snapshot the build-time value — making it impossible
 * to test the "no ID in dev" branch without rebuilding.
 *
 * By isolating the env read in this module, tests can override the value via
 * `__setGaMeasurementIdForTests()` (no `mock.module` plumbing required) to
 * exercise both branches (with-ID and without-ID).
 *
 * Branded type `GaMeasurementId` documents where validated IDs are expected
 * (compile-time hint; runtime validation happens in `validateGaId`).
 */

declare global {
	interface ImportMetaEnv {
		readonly VITE_GA_MEASUREMENT_ID?: string;
	}
	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

/** Tipo `GaMeasurementId` documenta onde uma string validada é esperada.
 *  Não é branded (validado em runtime por `validateGaId`); alias de string
 *  pra clareza nas call sites. */
export type GaMeasurementId = string;

/**
 * Override de teste. Quando setado (não-undefined), retorna em vez de
 * ler do ambiente. **Apenas para testes** — production lê sempre do env.
 */
let testOverride: string | undefined | null = undefined;

/**
 * Lê `VITE_GA_MEASUREMENT_ID` do ambiente Vite (build-time inlined).
 * Retorna `undefined` em dev sem `.env.local` ou em prod sem env var.
 */
export function getGaMeasurementId(): string | undefined {
	if (testOverride !== undefined && testOverride !== null) {
		return testOverride;
	}
	return import.meta.env.VITE_GA_MEASUREMENT_ID;
}

/**
 * **Apenas para testes** — sobrescreve o valor que `getGaMeasurementId`
 * retorna. Chamar com `undefined` ou `null` pra resetar (volta a ler do env).
 */
export function __setGaMeasurementIdForTests(value: string | undefined | null): void {
	testOverride = value;
}