import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	__resetAnalyticsForTests,
	initAnalytics,
	sanitizePagePath,
	trackEvent,
	trackNewRound,
	trackPageView,
	trackRoomCreated,
	trackRoomJoined,
	trackVoteCast,
	trackVotesRevealed,
} from "./analytics";
import {
	ANALYTICS_CONSENT_STORAGE_KEY,
	writeAnalyticsConsent,
} from "./consent";

const GA_ID = "G-TESTMEASURE";

function clearGaEnv(): void {
	delete process.env.VITE_GA_MEASUREMENT_ID;
	delete (import.meta.env as Record<string, string | undefined>)
		.VITE_GA_MEASUREMENT_ID;
}

function setGaEnv(id: string): void {
	process.env.VITE_GA_MEASUREMENT_ID = id;
	(import.meta.env as Record<string, string | undefined>).VITE_GA_MEASUREMENT_ID =
		id;
}

function removeGtagScripts(): void {
	for (const node of document.querySelectorAll(
		'script[src*="googletagmanager.com/gtag/js"]',
	)) {
		node.remove();
	}
}

function dataLayerEntries(): unknown[][] {
	return (window.dataLayer ?? []).map((entry) =>
		Array.from(entry as ArrayLike<unknown>),
	);
}

beforeEach(() => {
	__resetAnalyticsForTests();
	clearGaEnv();
	removeGtagScripts();
	delete window.gtag;
	delete window.dataLayer;
	window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
});

afterEach(() => {
	__resetAnalyticsForTests();
	clearGaEnv();
	removeGtagScripts();
	delete window.gtag;
	delete window.dataLayer;
	window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
});

describe("analytics (sem Measurement ID)", () => {
	test("initAnalytics não injeta script nem cria dataLayer", () => {
		initAnalytics();
		expect(
			document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')
				.length,
		).toBe(0);
		expect(window.dataLayer).toBeUndefined();
		expect(window.gtag).toBeUndefined();
	});

	test("track* são no-op sem rede / sem gtag", () => {
		trackPageView("/join");
		trackEvent("custom");
		trackRoomCreated();
		trackRoomJoined();
		trackVoteCast();
		trackVotesRevealed();
		trackNewRound();
		expect(window.dataLayer).toBeUndefined();
		expect(
			document.querySelectorAll('script[src*="googletagmanager.com"]').length,
		).toBe(0);
	});
});

describe("analytics com ID, sem consentimento", () => {
	beforeEach(() => setGaEnv(GA_ID));

	test("sem escolha salva, initAnalytics não carrega o SDK", () => {
		initAnalytics();
		initAnalytics();
		expect(
			document.querySelectorAll('script[src*="googletagmanager.com"]'),
		).toHaveLength(0);
		expect(window.dataLayer).toBeUndefined();
		expect(window.gtag).toBeUndefined();
	});

	test("Recusar mantém o SDK fora e nenhum evento usa gtag preexistente", () => {
		writeAnalyticsConsent("denied");
		const calls: unknown[][] = [];
		window.gtag = (...args: unknown[]) => {
			calls.push(args);
		};
		initAnalytics();
		trackPageView("/join?code=ABCD");
		trackEvent("custom", { source: "test" });
		trackRoomCreated();
		trackRoomJoined();
		trackVoteCast();
		trackVotesRevealed();
		trackNewRound();
		expect(calls).toEqual([]);
		expect(window.dataLayer).toBeUndefined();
		expect(
			document.querySelectorAll('script[src*="googletagmanager.com"]'),
		).toHaveLength(0);
	});
});

describe("analytics com consentimento concedido", () => {
	beforeEach(() => {
		setGaEnv(GA_ID);
		writeAnalyticsConsent("granted");
	});

	test("carrega gtag.js uma vez com o Measurement ID", () => {
		initAnalytics();
		initAnalytics();
		const scripts = document.querySelectorAll<HTMLScriptElement>(
			'script[src*="googletagmanager.com/gtag/js"]',
		);
		expect(scripts).toHaveLength(1);
		expect(scripts[0]?.src).toContain(GA_ID);
		expect(dataLayerEntries()).toEqual([
			["js", expect.any(Date)],
			["config", GA_ID, { send_page_view: false }],
		]);
		expect(typeof window.gtag).toBe("function");
	});

	test("empurra Arguments para o dataLayer (contrato do gtag.js)", () => {
		initAnalytics();
		trackPageView("/join");
		const layer = window.dataLayer ?? [];
		expect(layer.length).toBeGreaterThan(0);
		for (const entry of layer) {
			expect(Object.prototype.toString.call(entry)).toBe("[object Arguments]");
		}
	});

	test("page_view usa path sanitizado e eventos de produto disparam", () => {
		initAnalytics();
		trackPageView("/s/ABCD");
		trackEvent("custom", { source: "test" });
		trackRoomCreated();
		expect(dataLayerEntries().slice(-3)).toEqual([
			[
				"event",
				"page_view",
				{
					page_path: "/s/[room]",
					page_location: "http://localhost/s/[room]",
				},
			],
			["event", "custom", { source: "test" }],
			["event", "room_created", {}],
		]);
	});

	test("revogar depois de aceitar interrompe novos eventos", () => {
		initAnalytics();
		trackPageView("/join");
		const before = window.dataLayer?.length ?? 0;
		writeAnalyticsConsent("denied");
		trackPageView("/guias");
		trackRoomJoined();
		expect(window.dataLayer?.length).toBe(before);
	});
});

describe("analytics sem Measurement ID", () => {
	test("consentimento concedido não carrega o SDK sem ID", () => {
		writeAnalyticsConsent("granted");
		initAnalytics();
		expect(
			document.querySelectorAll('script[src*="googletagmanager.com"]'),
		).toHaveLength(0);
		expect(window.dataLayer).toBeUndefined();
	});
});

describe("sanitizePagePath (privacidade: sem código de sala no GA4)", () => {
	test("mascara /s/:code e variantes com prefixo de locale", () => {
		expect(sanitizePagePath("/s/ABCD")).toBe("/s/[room]");
		expect(sanitizePagePath("/s/ab12/")).toBe("/s/[room]");
		expect(sanitizePagePath("/en/s/WXYZ")).toBe("/s/[room]");
		expect(sanitizePagePath("/pt-BR/s/WXYZ")).toBe("/s/[room]");
	});

	test("mantém rotas públicas/canônicas como estão", () => {
		expect(sanitizePagePath("/")).toBe("/");
		expect(sanitizePagePath("/join")).toBe("/join");
		expect(sanitizePagePath("/en")).toBe("/en");
		expect(sanitizePagePath("/en/guides")).toBe("/en/guides");
		expect(sanitizePagePath("/guias/como-jogar-planning-poker")).toBe(
			"/guias/como-jogar-planning-poker",
		);
	});

	test("é idempotente (placeholder não é re-mascarado de outro jeito)", () => {
		expect(sanitizePagePath(sanitizePagePath("/s/ABCD"))).toBe("/s/[room]");
	});

	test("nunca retorna código de sala cru em lote de paths reais", () => {
		const samples = [
			"/s/ABCD",
			"/s/ABCD/",
			"/en/s/Q7KX",
			"/join",
			"/",
			"/planning-poker",
		];
		for (const sample of samples) {
			const out = sanitizePagePath(sample);
			expect(out).not.toContain("ABCD");
			expect(out).not.toContain("Q7KX");
		}
		expect(sanitizePagePath("/s/ABCD")).not.toMatch(/\/s\/(?!\[room\])/);
	});
});
