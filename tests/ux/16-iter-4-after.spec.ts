/**
 * 16-iter-4-after.spec.ts — captura de evidências PÓS-FIX para iter-4
 * (Open Design reference upgrade).
 *
 * Cobre UX-012..UX-017. Cada teste nomeia arquivos em
 * `/docs/ux-review/screenshots/after/` no padrão UX-NNN-<slug>.png.
 *
 * Refs:
 *  - docs/ux-review/iter-4-audit.md §2 (findings detalhados)
 *  - GitHub issues #12..#17
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const AFTER_DIR = join(
	process.cwd(),
	"..",
	"..",
	"docs",
	"ux-review",
	"screenshots",
	"after",
);
mkdirSync(AFTER_DIR, { recursive: true });

function shot(page: Page, name: string, full = true) {
	return page.screenshot({
		path: join(AFTER_DIR, `${name}.png`),
		fullPage: full,
	});
}

async function probeFontFamily(
	page: Page,
	selector: string,
	expectedFamily: RegExp,
) {
	return page.evaluate(
		({ sel, expSrc }) => {
			const el = document.querySelector(sel);
			if (!el) return { found: false };
			const cs = window.getComputedStyle(el);
			return {
				found: true,
				family: cs.fontFamily,
				matches: expSrc.test(cs.fontFamily),
			};
		},
		{ sel: selector, expSrc: expectedFamily },
	);
}

// =========================================================================
// UX-012 — display headline Inter Tight → Instrument Serif
// =========================================================================
test("UX-012 after — Landing h1/h2 em Instrument Serif (vp-1440)", async ({
	page,
	baseURL,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(baseURL ?? "http://localhost:5173" + "/", {
		waitUntil: "networkidle",
	});
	await page.waitForTimeout(1200);

	const probe = {
		h1: await probeFontFamily(
			page,
			"[data-testid='hero-headline']",
			/Instrument Serif/i,
		),
		h2About: await probeFontFamily(
			page,
			"h2:nth-of-type(1)",
			/Instrument Serif/i,
		),
	};

	await shot(page, "UX-012-after-landing-hero-serif");
	test
		.info()
		.annotations.push({ type: "ux-012-after", description: JSON.stringify(probe) });
	expect(probe.h1.found).toBe(true);
	expect(probe.h1.matches).toBe(true);
});

test("UX-012 after — NotFound h2 em Instrument Serif (vp-1440)", async ({
	page,
	baseURL,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(
		(baseURL ?? "http://localhost:5173") + "/rota-inexistente",
		{ waitUntil: "networkidle" },
	);
	await page.waitForTimeout(1200);

	const probe = await probeFontFamily(
		page,
		"[data-od-id='not-found-card'] h2",
		/Instrument Serif/i,
	);

	await shot(page, "UX-012-after-not-found-serif");
	test
		.info()
		.annotations.push({ type: "ux-012-notfound", description: JSON.stringify(probe) });
	expect(probe.found).toBe(true);
	expect(probe.matches).toBe(true);
});

// =========================================================================
// UX-013 — section markers Roman → Arabic + larger
// =========================================================================
test("UX-013 after — 5 SectionRule markers em arabic + serif (vp-1440)", async ({
	page,
	baseURL,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(baseURL ?? "http://localhost:5173" + "/", {
		waitUntil: "networkidle",
	});
	await page.waitForTimeout(1200);

	const probe = await page.evaluate(() => {
		const romans = Array.from(document.querySelectorAll(".sec-rule .roman"));
		return {
			count: romans.length,
			texts: romans.map((el) => el.textContent?.trim() ?? ""),
			fonts: romans.map((el) => window.getComputedStyle(el).fontFamily),
			sizes: romans.map((el) => window.getComputedStyle(el).fontSize),
			matches: romans.every((el) => {
				const t = el.textContent?.trim() ?? "";
				const f = window.getComputedStyle(el).fontFamily;
				const s = parseFloat(window.getComputedStyle(el).fontSize);
				return /^\d{2}$/.test(t) && /Instrument Serif/i.test(f) && s >= 20;
			}),
		};
	});

	await shot(page, "UX-013-after-section-markers-arabic");
	test
		.info()
		.annotations.push({ type: "ux-013-after", description: JSON.stringify(probe) });
	expect(probe.count).toBe(5);
	expect(probe.matches).toBe(true);
});

// =========================================================================
// UX-014 — terracota token (#d24a2a)
// =========================================================================
test("UX-014 after — CTA coral usa terracota (vp-1440)", async ({
	page,
	baseURL,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(baseURL ?? "http://localhost:5173" + "/", {
		waitUntil: "networkidle",
	});
	await page.waitForTimeout(800);

	const probe = await page.evaluate(() => {
		const btn = document.querySelector(
			"[data-testid='cta-create-room']",
		) as HTMLElement | null;
		if (!btn) return { found: false };
		const cs = window.getComputedStyle(btn);
		return {
			found: true,
			backgroundColor: cs.backgroundColor,
			matches: cs.backgroundColor === "rgb(210, 74, 42)",
		};
	});

	await shot(page, "UX-014-after-terracotta-cta");
	test
		.info()
		.annotations.push({ type: "ux-014-after", description: JSON.stringify(probe) });
	expect(probe.found).toBe(true);
	expect(probe.matches).toBe(true);
});

// =========================================================================
// UX-015 — hero illustration sculptural collage
// =========================================================================
test("UX-015 after — hero collage presente (vp-1440)", async ({
	page,
	baseURL,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(baseURL ?? "http://localhost:5173" + "/", {
		waitUntil: "networkidle",
	});
	await page.waitForTimeout(1200);

	const probe = await page.evaluate(() => {
		// Conta círculos + svg dentro do frame hero
		const heroFrame = document.querySelector(".bg-paper-warm.border.rounded-3xl");
		if (!heroFrame) return { found: false };
		const circles = heroFrame.querySelectorAll("[class*='rounded-full']");
		const svgs = heroFrame.querySelectorAll("svg");
		const glyphs = heroFrame.querySelectorAll("span.font-serif.italic");
		return {
			found: true,
			circleCount: circles.length,
			svgCount: svgs.length,
			glyphCount: glyphs.length,
			matches:
				circles.length >= 2 && svgs.length >= 3 && glyphs.length >= 1,
		};
	});

	await shot(page, "UX-015-after-hero-collage");
	test
		.info()
		.annotations.push({ type: "ux-015-after", description: JSON.stringify(probe) });
	expect(probe.found).toBe(true);
	expect(probe.matches).toBe(true);
});

// =========================================================================
// UX-016 — capability cards numeral 28px serif + hover lift
// =========================================================================
test("UX-016 after — capability numerals em Instrument Serif 28px (vp-1440)", async ({
	page,
	baseURL,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(baseURL ?? "http://localhost:5173" + "/", {
		waitUntil: "networkidle",
	});
	await page.waitForTimeout(1000);

	const probe = await page.evaluate(() => {
		const cards = Array.from(
			document.querySelectorAll("[data-testid^='cap-card-']"),
		);
		const numerals = cards.map((card) => {
			const span = card.querySelector("span.font-serif");
			if (!span) return null;
			const cs = window.getComputedStyle(span);
			return {
				text: span.textContent?.trim() ?? "",
				family: cs.fontFamily,
				size: parseFloat(cs.fontSize),
			};
		});
		return {
			cardCount: cards.length,
			numerals,
			matches: numerals.every(
				(n) =>
					n !== null &&
					/^\d{2}$/.test(n.text) &&
					/Instrument Serif/i.test(n.family) &&
					n.size >= 27,
			),
		};
	});

	await shot(page, "UX-016-after-capability-cards-serif-numeral");
	test
		.info()
		.annotations.push({ type: "ux-016-after", description: JSON.stringify(probe) });
	expect(probe.cardCount).toBe(4);
	expect(probe.matches).toBe(true);
});

// =========================================================================
// UX-017 — NotFound editorial parity (metadata strip + composição)
// =========================================================================
test("UX-017 after — NotFound parity com Landing (vp-1440)", async ({
	page,
	baseURL,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(
		(baseURL ?? "http://localhost:5173") + "/rota-inexistente",
		{ waitUntil: "networkidle" },
	);
	await page.waitForTimeout(1500);

	const probe = await page.evaluate(() => {
		// Verifica metadata strip top (padrão Landing)
		const metaStrip = document.querySelector(
			"[data-testid='page-not-found'] header",
		);
		// Verifica sticky nav com brand link
		const nav = document.querySelector(
			"[data-testid='page-not-found'] nav a[aria-label*='Pointly']",
		);
		// Verifica composição editorial decorativa (data-testid estável)
		const composition = document.querySelector(
			"[data-testid='not-found-composition']",
		);
		const compositionGlyph = composition?.querySelector("span.font-serif");
		// Verifica preservações UX-001
		const notFoundCode = document.querySelector(
			"[data-testid='not-found-code']",
		);
		const createBtn = document.querySelector(
			"[data-testid='not-found-create']",
		);
		const backBtn = document.querySelector("[data-testid='not-found-back']");
		return {
			hasMetaStrip: !!metaStrip,
			hasBrandNav: !!nav,
			hasComposition: !!composition,
			hasCompositionGlyph: !!compositionGlyph,
			hasNotFoundCode: !!notFoundCode,
			hasCreateBtn: !!createBtn,
			hasBackBtn: !!backBtn,
			matches:
				!!metaStrip &&
				!!nav &&
				!!composition &&
				!!compositionGlyph &&
				!!notFoundCode &&
				!!createBtn &&
				!!backBtn,
		};
	});

	await shot(page, "UX-017-after-not-found-parity");
	test
		.info()
		.annotations.push({ type: "ux-017-after", description: JSON.stringify(probe) });
	expect(probe.matches).toBe(true);
});