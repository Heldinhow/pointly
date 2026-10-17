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

beforeEach(() => {
	__resetAnalyticsForTests();
	clearGaEnv();
	removeGtagScripts();
	delete window.gtag;
	delete window.dataLayer;
});

afterEach(() => {
	__resetAnalyticsForTests();
	clearGaEnv();
	removeGtagScripts();
	delete window.gtag;
	delete window.dataLayer;
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

describe("analytics desativado por política de privacidade", () => {
	beforeEach(() => setGaEnv(GA_ID));

	test("ID preenchido não permite carregar o SDK", () => {
		initAnalytics();
		initAnalytics();
		expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(0);
		expect(window.dataLayer).toBeUndefined();
		expect(window.gtag).toBeUndefined();
	});

	test("nenhum evento usa um gtag preexistente", () => {
		const calls: unknown[][] = [];
		window.gtag = (...args: unknown[]) => { calls.push(args); };
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
