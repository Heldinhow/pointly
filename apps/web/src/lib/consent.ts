/**
 * Consentimento de analytics (LGPD): opt-in explícito, persistido no device.
 *
 * Sem escolha salva (`null`), nada de terceiros carrega. A escolha é
 * "granted" | "denied" e pode ser revista depois pelo link do rodapé.
 */

import { safeGet, safeSet } from "./storage";

export type AnalyticsConsent = "granted" | "denied";

export const ANALYTICS_CONSENT_STORAGE_KEY = "pointly.analytics-consent";

const listeners = new Set<() => void>();

export function readAnalyticsConsent(): AnalyticsConsent | null {
	if (typeof window === "undefined") return null;
	const stored = safeGet(ANALYTICS_CONSENT_STORAGE_KEY);
	return stored === "granted" || stored === "denied" ? stored : null;
}

export function hasAnalyticsConsent(): boolean {
	return readAnalyticsConsent() === "granted";
}

export function writeAnalyticsConsent(choice: AnalyticsConsent): void {
	safeSet(ANALYTICS_CONSENT_STORAGE_KEY, choice);
	for (const listener of listeners) listener();
}

/** Observador da escolha (SSOT do re-render do App/banner). */
export function subscribeAnalyticsConsent(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
