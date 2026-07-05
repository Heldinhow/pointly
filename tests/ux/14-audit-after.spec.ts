/**
 * 14-audit-after.spec.ts — captura de evidências PÓS-FIX.
 *
 * Cada teste nomeia arquivos em `/docs/ux-review/screenshots/after/`
 * no padrão UX-NNN-<slug>.png para serem linkados da coluna
 * "Evidência (after)" de UX_REVIEW.md após cada fix ser aplicado.
 *
 * Iteração 1 cobre: UX-001 (404 editorial), UX-002 (rails mobile),
 * UX-006 (ws-client log), UX-007 (router flags).
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

// =========================================================================
// UX-001: 404 editorial
// =========================================================================
test("UX-001 after — 404 editorial Atelier Zero", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/rota-que-nao-existe", { waitUntil: "networkidle" });
	await page.waitForTimeout(800);

	// Probe do fix
	const probe = await page.evaluate(() => {
		const code = document.querySelector("[data-testid='not-found-code']")?.textContent ?? "";
		const createBtn = document.querySelector("[data-testid='not-found-create']");
		const backBtn = document.querySelector("[data-testid='not-found-back']");
		const card = document.querySelector("[data-od-id='not-found-card']");
		const hero = document.querySelector("h1, h2");
		return {
			hasCode: code.includes("404"),
			hasCreateCta: !!createBtn,
			hasBackBtn: !!backBtn,
			hasCard: !!card,
			hasHeading: !!hero,
			bodyTextSample: (document.body.textContent ?? "").slice(0, 80).trim(),
		};
	});

	await shot(page, "UX-001-after-not-found-editorial");
	test.info().annotations.push({ type: "ux-001-after", description: JSON.stringify(probe) });
});

// =========================================================================
// UX-002: side rails escondidos em mobile
// =========================================================================
test("UX-002 after — side rails escondidos ≤767px", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/", { waitUntil: "networkidle" });
	await page.waitForTimeout(800);

	const probe = await page.evaluate(() => {
		const rails = document.querySelectorAll(".side-rail");
		const hero = document.querySelector("h1");
		return {
			railsCount: rails.length,
			railsVisible: Array.from(rails).map((r) => {
				const cs = getComputedStyle(r);
				return cs.display !== "none";
			}),
			hero: hero?.getBoundingClientRect() ?? null,
		};
	});

	await shot(page, "UX-002-after-rails-hidden-390", false);
	test.info().annotations.push({ type: "ux-002-after", description: JSON.stringify(probe) });
});

// =========================================================================
// UX-006: ws-client sem "refusing to send" no load
// =========================================================================
test("UX-006 after — ws-client sem invalid event warning", async ({ page }) => {
	const warnings: string[] = [];
	page.on("console", (m) => {
		const t = m.text();
		if (t.includes("ws-client") || t.includes("refusing to send")) warnings.push(t);
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD&host=1", { waitUntil: "networkidle" });
	await page.waitForTimeout(3_000);

	const invalid = warnings.filter((w) => w.includes("refusing to send"));

	await shot(page, "UX-006-after-ws-clean-load");
	test.info().annotations.push({
		type: "ux-006-after",
		description: JSON.stringify({
			totalWsWarnings: warnings.length,
			invalidEventCount: invalid.length,
		}),
	});
	expect(invalid.length, "0 invalid event warnings após fix").toBe(0);
});

// =========================================================================
// UX-007: react-router future-flag warnings ≤ 1
// =========================================================================
test("UX-007 after — router v7 flags silenced (≤1 warning)", async ({ page }) => {
	const warnings: string[] = [];
	page.on("console", (m) => {
		if (m.type() === "warning" && m.text().includes("React Router Future Flag Warning")) {
			warnings.push(m.text());
		}
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/", { waitUntil: "networkidle" });
	await page.waitForTimeout(1_500);

	await shot(page, "UX-007-after-router-flags-optin");
	test.info().annotations.push({
		type: "ux-007-after",
		description: JSON.stringify({ futureFlagWarningCount: warnings.length }),
	});
	expect(warnings.length, "≤1 router future-flag warning (v7_startTransition não está em @remix-run/router 1.21)").toBeLessThanOrEqual(1);
});

// =========================================================================
// UX-003: arena empty invite guidance
// =========================================================================
test("UX-003 after — arena empty state has invite copy + CTA", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD&host=1", { waitUntil: "networkidle" });
	await page.waitForTimeout(1_500);

	const probe = await page.evaluate(() => {
		const invite = document.querySelector("[data-testid='arena-empty-invite']");
		const copy = document.querySelector("[data-testid='empty-invite-copy']");
		const reveal = document.querySelector("[data-testid='reveal-button']");
		return {
			hasInviteBlock: !!invite,
			hasCopyCta: !!copy,
			revealHidden: !reveal,
			inviteText: (invite?.textContent ?? "").slice(0, 100),
		};
	});

	await shot(page, "UX-003-after-empty-invite");
	test.info().annotations.push({ type: "ux-003-after", description: JSON.stringify(probe) });
});

// =========================================================================
// UX-005: reveal button escondido quando 0 jogadores
// =========================================================================
test("UX-005 after — reveal button hidden with 0 players", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD&host=1", { waitUntil: "networkidle" });
	await page.waitForTimeout(1_200);

	const probe = await page.evaluate(() => {
		const btn = document.querySelector("[data-testid='reveal-button']");
		return {
			revealInDom: !!btn,
			hidden: btn ? !btn.getBoundingClientRect().width : true,
		};
	});

	await shot(page, "UX-005-after-reveal-hidden");
	test.info().annotations.push({ type: "ux-005-after", description: JSON.stringify(probe) });
});

// =========================================================================
// UX-009: 0 touch targets < 44×44 em mobile
// =========================================================================
test("UX-009 after — touch targets all >= 44×44 in mobile", async ({ page }) => {
	const tiny: { tag: string; text: string; w: number; h: number; selector: string }[] = [];
	await page.setViewportSize({ width: 390, height: 844 });
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
		for (const t of targets) tiny.push({ ...t, selector: `${path} → ${t.selector}` });
	}

	await shot(page, "UX-009-after-touch-targets");
	test.info().annotations.push({
		type: "ux-009-after",
		description: JSON.stringify({ total: tiny.length }),
	});
	expect(tiny.length, "0 interactive elements < 44×44 em mobile após fix").toBe(0);
});
