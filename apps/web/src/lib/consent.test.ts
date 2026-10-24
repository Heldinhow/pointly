import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	ANALYTICS_CONSENT_STORAGE_KEY,
	hasAnalyticsConsent,
	readAnalyticsConsent,
	subscribeAnalyticsConsent,
	writeAnalyticsConsent,
} from "./consent";

beforeEach(() => {
	window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
});

afterEach(() => {
	window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
});

describe("consentimento de analytics", () => {
	test("sem escolha salva, não há consentimento", () => {
		expect(readAnalyticsConsent()).toBeNull();
		expect(hasAnalyticsConsent()).toBe(false);
	});

	test("Aceitar persiste granted e libera o gate", () => {
		writeAnalyticsConsent("granted");
		expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe(
			"granted",
		);
		expect(readAnalyticsConsent()).toBe("granted");
		expect(hasAnalyticsConsent()).toBe(true);
	});

	test("Recusar persiste denied e mantém o gate fechado", () => {
		writeAnalyticsConsent("denied");
		expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe(
			"denied",
		);
		expect(readAnalyticsConsent()).toBe("denied");
		expect(hasAnalyticsConsent()).toBe(false);
	});

	test("valor desconhecido no storage é tratado como sem escolha", () => {
		window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "yes");
		expect(readAnalyticsConsent()).toBeNull();
		expect(hasAnalyticsConsent()).toBe(false);
	});

	test("mudar a escolha notifica os assinantes", () => {
		let notifications = 0;
		const unsubscribe = subscribeAnalyticsConsent(() => {
			notifications += 1;
		});
		writeAnalyticsConsent("denied");
		writeAnalyticsConsent("granted");
		unsubscribe();
		writeAnalyticsConsent("denied");
		expect(notifications).toBe(2);
		expect(readAnalyticsConsent()).toBe("denied");
	});
});
