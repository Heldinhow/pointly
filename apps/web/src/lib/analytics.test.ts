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

describe("analytics (com Measurement ID)", () => {
	beforeEach(() => {
		setGaEnv(GA_ID);
	});

	test("initAnalytics carrega gtag.js uma vez e configura", () => {
		initAnalytics();
		initAnalytics();

		const scripts = document.querySelectorAll<HTMLScriptElement>(
			'script[src*="googletagmanager.com/gtag/js"]',
		);
		expect(scripts.length).toBe(1);
		expect(scripts[0]?.src).toContain(`id=${GA_ID}`);
		expect(typeof window.gtag).toBe("function");
		expect(Array.isArray(window.dataLayer)).toBe(true);

		const serialized = JSON.stringify(window.dataLayer);
		expect(serialized).toContain('"config"');
		expect(serialized).toContain(GA_ID);
		expect(serialized).toContain('"send_page_view":false');
	});

	test("trackPageView e trackEvent chamam gtag mockado", () => {
		initAnalytics();
		const calls: unknown[][] = [];
		window.gtag = (...args: unknown[]) => {
			calls.push(args);
		};

		trackPageView("/en/guides", "Guides");
		trackEvent("room_created", { source: "join" });

		expect(calls).toEqual([
			["event", "page_view", { page_path: "/en/guides", page_title: "Guides" }],
			["event", "room_created", { source: "join" }],
		]);
	});

	test("helpers de produto disparam os nomes canônicos", () => {
		initAnalytics();
		const names: string[] = [];
		window.gtag = (command: unknown, name: unknown) => {
			if (command === "event" && typeof name === "string") names.push(name);
		};

		trackRoomCreated();
		trackRoomJoined();
		trackVoteCast();
		trackVotesRevealed();
		trackNewRound();

		expect(names).toEqual([
			"room_created",
			"room_joined",
			"vote_cast",
			"votes_revealed",
			"new_round",
		]);
	});

	test("track* sem gtag após reset de window continuam seguros", () => {
		initAnalytics();
		delete window.gtag;
		expect(() => {
			trackPageView("/");
			trackRoomCreated();
		}).not.toThrow();
	});

	test("ID com whitespace é aparado (trim)", () => {
		setGaEnv("  G-TRIMMED  ");
		initAnalytics();
		const scripts = document.querySelectorAll<HTMLScriptElement>(
			'script[src*="googletagmanager.com/gtag/js"]',
		);
		expect(scripts.length).toBe(1);
		expect(scripts[0]?.src).toContain("id=G-TRIMMED");
		expect(scripts[0]?.src).not.toContain("%20");
	});

	test("ID é URL-encoded no src do script", () => {
		setGaEnv("G-TE ST&X");
		initAnalytics();
		const scripts = document.querySelectorAll<HTMLScriptElement>(
			'script[src*="googletagmanager.com/gtag/js"]',
		);
		expect(scripts[0]?.src).toContain("id=G-TE%20ST%26X");
	});

	test("trackPageView sem title não envia page_title", () => {
		initAnalytics();
		const calls: unknown[][] = [];
		window.gtag = (...args: unknown[]) => {
			calls.push(args);
		};

		trackPageView("/planejamento");

		expect(calls).toEqual([
			["event", "page_view", { page_path: "/planejamento" }],
		]);
	});

	test("trackPageView sanitiza o path antes de enviar", () => {
		initAnalytics();
		const calls: unknown[][] = [];
		window.gtag = (...args: unknown[]) => {
			calls.push(args);
		};

		trackPageView("/s/ABCD");

		expect(calls).toEqual([
			["event", "page_view", { page_path: "/s/[room]" }],
		]);
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
