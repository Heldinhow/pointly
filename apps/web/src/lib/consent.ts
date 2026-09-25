import { safeGet, safeSet } from "./storage";

export const ANALYTICS_CONSENT_KEY = "pointly-analytics-consent";

export type AnalyticsConsent = "granted" | "denied" | null;

export function readAnalyticsConsent(): AnalyticsConsent {
	const value = safeGet(ANALYTICS_CONSENT_KEY);
	return value === "granted" || value === "denied" ? value : null;
}

export function saveAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>): void {
	safeSet(ANALYTICS_CONSENT_KEY, consent);
}
