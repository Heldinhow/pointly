/**
 * 13-audit-elements.spec.ts — captura de evidências POR FINDING
 *
 * Cada teste nomeia arquivos no padrão UX-NNN-<slug>.png para serem
 * linkados diretamente da UX_REVIEW.md. Roda no project=desktop e
 * usa setViewportSize pra cobrir vp-1440 e vp-390.
 *
 * Findings cobertos (sincronizados com UX_REVIEW.md §3):
 *   UX-001 404 sem branding nem CTA
 *   UX-002 side rails colidem com hero em 390px
 *   UX-003 arena vazia sem invite/share proeminente
 *   UX-004 join-host CTA "Entrar" parece disabled
 *   UX-005 arena reveal button ativo com 0 jogadores
 *   UX-006 ws-client invalid event warning
 *   UX-007 react-router v7 future-flag noise
 *   UX-008 deck mobile esconde 0 e ☕ sem peek óbvio
 *   UX-009 touch-targets < 44×44 em mobile (deck cards, pills)
 *   UX-010 axe-core a11y scan (cada rota)
 *   UX-011 prefers-reduced-motion honored
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BEFORE_DIR = join(
	process.cwd(),
	"..",
	"..",
	"docs",
	"ux-review",
	"screenshots",
	"before",
);
mkdirSync(BEFORE_DIR, { recursive: true });

function shot(page: Page, name: string, full = true) {
	return page.screenshot({
		path: join(BEFORE_DIR, `${name}.png`),
		fullPage: full,
	});
}

// =========================================================================
// UX-001: 404 sem branding, ilustração, CTA ou return-home
// =========================================================================
test("UX-001 — 404 page has no brand/illustration/return-CTA", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	const consoleWarn: string[] = [];
	page.on("console", (m) => {
		if (m.type() === "warning" || m.type() === "error") consoleWarn.push(m.text());
	});
	await page.goto("/rota-que-nao-existe", { waitUntil: "networkidle" });
	await page.waitForTimeout(500);

	const txt = (await page.locator("body").innerText()).trim();
	const hasIllustration = await page.locator("svg, img").count();
	const hasReturnCta = await page
		.getByRole("link", { name: /voltar|home|retornar|landing/i })
		.count();
	const hasBrand = await page
		.locator("text=/Pointly|Ø/")
		.count();

	expect(txt.length, "404 body has minimal text").toBeLessThan(50);
	expect(hasIllustration, "404 has no illustration").toBe(0);
	expect(hasReturnCta, "404 has no return CTA").toBe(0);

	await shot(page, "UX-001-not-found-no-cta");
	test.info().annotations.push({
		type: "ux-001-evidence",
		description: JSON.stringify({ bodyText: txt, illustration: hasIllustration, returnCta: hasReturnCta, brand: hasBrand }),
	});
});

// =========================================================================
// UX-002: side rails colidem com hero em 390px
// =========================================================================
test("UX-002 — landing side rails overlap hero @ 390px", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/", { waitUntil: "networkidle" });
	await page.waitForTimeout(800);

	// Medir overlap entre o rail left (.side-rail.left) e o hero
	const collision = await page.evaluate(() => {
		const rails = document.querySelectorAll(".side-rail");
		const hero = document.querySelector("h1");
		if (!hero) return { hasHero: false };
		const heroRect = hero.getBoundingClientRect();
		const out: { rail: string; overlaps: boolean; railRect: DOMRect; heroRect: DOMRect }[] = [];
		rails.forEach((r, i) => {
			const rr = r.getBoundingClientRect();
			const overlap = !(rr.right < heroRect.left || rr.left > heroRect.right);
			out.push({
				rail: `${i === 0 ? "left" : "right"}`,
				overlaps: overlap,
				railRect: { x: rr.x, y: rr.y, width: rr.width, height: rr.height } as DOMRect,
				heroRect: { x: heroRect.x, y: heroRect.y, width: heroRect.width, height: heroRect.height } as DOMRect,
			});
		});
		return { hasHero: true, rails: out };
	});

	test.info().annotations.push({ type: "ux-002-evidence", description: JSON.stringify(collision) });
	expect(collision.hasHero, "hero h1 exists").toBe(true);
	await shot(page, "UX-002-landing-rail-collision-390", false);
});

// =========================================================================
// UX-003: arena vazia sem invite/share proeminente
// =========================================================================
test("UX-003 — empty arena lacks prominent share/invite affordance", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD&host=1", { waitUntil: "networkidle" });
	await page.waitForTimeout(800);

	const shareBtnVisible = await page
		.getByRole("button", { name: /compartilhar|share|copiar|copy/i })
		.count();
	const inviteCta = await page
		.getByText(/convide|invite|compartilhe|share the code/i)
		.count();

	await shot(page, "UX-003-arena-empty-no-invite");
	test.info().annotations.push({
		type: "ux-003-evidence",
		description: JSON.stringify({ shareButtonCount: shareBtnVisible, inviteTextCount: inviteCta }),
	});
});

// =========================================================================
// UX-004: join-host CTA Entrar parece disabled (cor pálida)
// =========================================================================
test("UX-004 — join-host primary CTA looks disabled when empty", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/join?host=1&code=ABCD", { waitUntil: "networkidle" });
	await page.waitForTimeout(500);

	const cta = page.getByRole("button", { name: /entrar/i }).first();
	await cta.waitFor({ state: "visible" });

	const ctaState = await cta.evaluate((el) => {
		const cs = getComputedStyle(el);
		return {
			disabled: (el as HTMLButtonElement).disabled,
			opacity: cs.opacity,
			bg: cs.backgroundColor,
			color: cs.color,
			cursor: cs.cursor,
		};
	});

	await shot(page, "UX-004-join-host-empty-cta");
	test.info().annotations.push({ type: "ux-004-evidence", description: JSON.stringify(ctaState) });
});

// =========================================================================
// UX-005: arena reveal button ativo com 0 jogadores / 0 votos
// =========================================================================
test("UX-005 — reveal button visible with 0 players, 0 votes", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD&host=1", { waitUntil: "networkidle" });
	await page.waitForTimeout(800);

	const revealBtn = page.getByRole("button", { name: /revelar votos/i }).first();
	const visible = await revealBtn.isVisible().catch(() => false);
	const isDisabled = visible ? await revealBtn.isDisabled() : null;
	const text = visible ? await revealBtn.innerText() : "(missing)";

	await shot(page, "UX-005-arena-reveal-empty");
	test.info().annotations.push({
		type: "ux-005-evidence",
		description: JSON.stringify({ visible, isDisabled, text }),
	});
});

// =========================================================================
// UX-006: ws-client invalid event warning
// =========================================================================
test("UX-006 — ws-client warns refusing to send invalid event", async ({ page }) => {
	const warnings: string[] = [];
	page.on("console", (m) => {
		const t = m.text();
		if (t.includes("ws-client") || t.includes("refusing to send")) warnings.push(t);
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD&host=1", { waitUntil: "networkidle" });
	await page.waitForTimeout(2_000);
	const invalidEventWarn = warnings.filter((w) => w.includes("refusing to send"));

	test.info().annotations.push({
		type: "ux-006-evidence",
		description: JSON.stringify({ totalWarnings: warnings.length, invalidEventCount: invalidEventWarn.length }),
	});
	expect(invalidEventWarn.length, "ws-client refuses to send invalid event on arena load").toBeGreaterThan(0);
});

// =========================================================================
// UX-007: react-router v7 future-flag noise
// =========================================================================
test("UX-007 — react-router v7 future-flag warnings per page", async ({ page }) => {
	const warnings: string[] = [];
	page.on("console", (m) => {
		if (m.type() === "warning" && m.text().includes("React Router Future Flag Warning")) {
			warnings.push(m.text());
		}
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/", { waitUntil: "networkidle" });
	await page.waitForTimeout(1_500);

	test.info().annotations.push({
		type: "ux-007-evidence",
		description: JSON.stringify({ futureFlagWarningCount: warnings.length }),
	});
	expect(warnings.length, "router warns v7 flags not opted-in").toBeGreaterThan(0);
});

// =========================================================================
// UX-008: deck mobile mostra só 7 de 9 cards (0 e ☕ escondidos)
// =========================================================================
test("UX-008 — deck mobile hides 0 and ☕ cards without clear peek", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/arena?code=ABCD&host=1", { waitUntil: "networkidle" });
	await page.waitForTimeout(800);

	const cards = await page.evaluate(() => {
		const deck = document.querySelector(".fib-deck");
		if (!deck) return { found: false };
		const list = Array.from(deck.querySelectorAll("[data-testid='fib-card'], button"));
		return {
			found: true,
			total: list.length,
			items: list.map((el) => ({
				text: (el.textContent ?? "").trim().slice(0, 8),
				visible: el.getBoundingClientRect().left >= 0 && el.getBoundingClientRect().right <= window.innerWidth,
				rect: el.getBoundingClientRect(),
			})),
			scrollWidth: deck.scrollWidth,
			clientWidth: deck.clientWidth,
		};
	});

	test.info().annotations.push({ type: "ux-008-evidence", description: JSON.stringify(cards) });
	await shot(page, "UX-008-deck-mobile-peek", false);
	expect(cards.found).toBe(true);
});

// =========================================================================
// UX-009: touch targets < 44x44 em mobile
// =========================================================================
test("UX-009 — touch targets < 44x44 in mobile", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const tinyTargets: { tag: string; text: string; w: number; h: number; selector: string }[] = [];

	for (const path of ["/", "/join?host=1&code=ABCD", "/arena?code=ABCD&host=1", "/full?code=ZZZZ"]) {
		await page.goto(path, { waitUntil: "networkidle" });
		await page.waitForTimeout(400);
		const targets = await page.evaluate(() => {
			const sel = "button, a[href], [role='button'], input, [tabindex='0']";
			const out: { tag: string; text: string; w: number; h: number; selector: string }[] = [];
			document.querySelectorAll(sel).forEach((el) => {
				const r = el.getBoundingClientRect();
				if (r.width === 0 || r.height === 0) return;
				if (r.width < 44 || r.height < 44) {
					out.push({
						tag: el.tagName,
						text: (el.textContent ?? "").trim().slice(0, 40),
						w: Math.round(r.width),
						h: Math.round(r.height),
						selector: el.tagName.toLowerCase(),
					});
				}
			});
			return out;
		});
		for (const t of targets) tinyTargets.push({ ...t, selector: `${path} → ${t.selector}` });
	}

	test.info().annotations.push({
		type: "ux-009-evidence",
		description: JSON.stringify({ total: tinyTargets.length, sample: tinyTargets.slice(0, 15) }),
	});
});

// =========================================================================
// UX-010: axe-core a11y scan em cada rota (vp-1440)
// =========================================================================
for (const path of ["/", "/join?host=1&code=ABCD", "/arena?code=ABCD&host=1", "/full?code=ZZZZ"]) {
	test(`UX-010 — axe-core a11y @ ${path}`, async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(path, { waitUntil: "networkidle" });
		await page.waitForTimeout(500);
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();
		const serious = results.violations.filter((v) =>
			["critical", "serious"].includes(v.impact ?? ""),
		);
		test.info().annotations.push({
			type: `ux-010-${path}-evidence`,
			description: JSON.stringify({
				total: results.violations.length,
				seriousOrCritical: serious.length,
				violations: results.violations.map((v) => ({
					id: v.id,
					impact: v.impact,
					help: v.help,
					nodes: v.nodes.length,
				})),
			}),
		});
		await shot(page, `UX-010-a11y-${(path === "/" ? "landing" : path).replace(/[?&=/]/g, "_").replace(/^_+/, "")}`);
	});
}

// =========================================================================
// UX-011: prefers-reduced-motion honored
// =========================================================================
test("UX-011 — prefers-reduced-motion honored on landing", async ({ browser }) => {
	const context = await browser.newContext({
		viewport: { width: 1440, height: 900 },
		reducedMotion: "reduce",
	});
	const page = await context.newPage();
	await page.goto("/", { waitUntil: "networkidle" });
	await page.waitForTimeout(800);

	const animations = await page.evaluate(() => {
		const all = Array.from(document.querySelectorAll("*"));
		const moving: { tag: string; cls: string; anim: string; dur: string }[] = [];
		all.forEach((el) => {
			const cs = getComputedStyle(el);
			const dur = cs.animationDuration;
			const name = cs.animationName;
			if (name && name !== "none" && dur !== "0s") {
				moving.push({
					tag: el.tagName,
					cls: el.className.toString().slice(0, 40),
					anim: name,
					dur,
				});
			}
		});
		return moving;
	});

	test.info().annotations.push({ type: "ux-011-evidence", description: JSON.stringify({ movingCount: animations.length, sample: animations.slice(0, 10) }) });
	await shot(page, "UX-011-reduced-motion");
	await context.close();
});