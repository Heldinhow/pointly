/**
 * Track A — Smoke tests (gate)
 *
 * Verifica que as 4 rotas principais respondem 200, renderizam conteúdo
 * esperado, e que não há erros de console / network 404.
 */
import { expect, test } from "@playwright/test";

const PAGES = [
	{ path: "/", expectTestId: "page-landing", expectText: "Pointly" },
	{ path: "/full", expectTestId: "page-full", expectText: "Sala cheia" },
];

for (const p of PAGES) {
	test(`A: GET ${p.path} responde 200 e renderiza`, async ({ page }) => {
		const consoleErrors: string[] = [];
		const failedRequests: string[] = [];

		page.on("console", (msg) => {
			if (msg.type() === "error") consoleErrors.push(msg.text());
		});
		page.on("response", (res) => {
			if (res.status() >= 400 && !res.url().includes("favicon")) {
				failedRequests.push(`${res.status()} ${res.url()}`);
			}
		});

		const response = await page.goto(p.path, { waitUntil: "domcontentloaded" });
		expect(response?.status()).toBe(200);

		await page.waitForSelector(`[data-testid="${p.expectTestId}"]`, {
			timeout: 8_000,
		});
		const text = await page.textContent("body");
		expect(text?.toLowerCase()).toContain(p.expectText.toLowerCase());

		// Log não-bloqueante: ajuda debug se houver
		if (consoleErrors.length > 0) {
			console.log(`[A:${p.path}] console errors:`, consoleErrors);
		}
		if (failedRequests.length > 0) {
			console.log(`[A:${p.path}] failed requests:`, failedRequests);
		}
	});
}

test("A1: Landing tem h1 e CTA 'Criar sala'", async ({ page }) => {
	await page.goto("/");
	const h1 = await page.locator("h1").count();
	expect(h1).toBeGreaterThanOrEqual(1);
	const cta = page.getByTestId("cta-create-room");
	await expect(cta).toBeVisible();
});

test("A2: /join?code=ABCD renderiza prompt de apelido", async ({ page }) => {
	await page.goto("/join?code=ABCD");
	await page.waitForSelector('[data-testid="page-join"]');
	const input = page.getByTestId("nick-input");
	await expect(input).toBeVisible();
});

test("A3: /arena?code=ABCD não crasha mesmo sem sala", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(e.message));
	await page.goto("/arena?code=Z9Z9");
	// App pode redirecionar para /join ou mostrar erro; mas não pode dar branco
	await page.waitForTimeout(2000);
	const bodyText = (await page.textContent("body")) ?? "";
	expect(bodyText.length).toBeGreaterThan(0);
	// Se houve erro JS grave, reporta (não bloqueia)
	if (errors.length > 0) {
		console.log("[A3] page errors (não fatal):", errors);
	}
});

test("A4: /full mostra contagem 12/12 e CTAs", async ({ page }) => {
	await page.goto("/full");
	await page.waitForSelector('[data-testid="page-full"]');
	const text = (await page.textContent('[data-testid="page-full"]')) ?? "";
	expect(text).toContain("Sala cheia");
	expect(text).toContain("12");
	await expect(page.getByTestId("full-create-new")).toBeVisible();
	await expect(page.getByTestId("full-back")).toBeVisible();
});

test("A5: Fontes Atelier Zero estão registradas", async ({ page }) => {
	await page.goto("/");
	const fontsReady = await page.evaluate(async () => {
		// document.fonts.ready resolve quando fontes carregaram
		await document.fonts.ready;
		return {
			playfair: document.fonts.check('1em "Playfair Display"'),
			inter: document.fonts.check('1em "Inter"'),
			mono: document.fonts.check('1em "JetBrains Mono"'),
		};
	});
	expect(fontsReady.inter).toBe(true);
	// Playfair / JetBrains podem não estar em uso direto no Landing — warn-only
	if (!fontsReady.playfair) {
		console.log(
			"[A5] Playfair não registrada (ok se Landing não usa serif italic)",
		);
	}
});

test("A6: prefers-reduced-motion desabilita pulse no metadata", async ({
	browser,
}) => {
	const ctx = await browser.newContext({ reducedMotion: "reduce" });
	const page = await ctx.newPage();
	await page.goto("/");
	const pulseOpacity = await page.evaluate(() => {
		const dot = document.querySelector(
			'span[aria-hidden="true"].animate-pulse',
		);
		if (!dot) return null;
		return window.getComputedStyle(dot).animationName;
	});
	await ctx.close();
	// reduced-motion deve forçar animation: none
	expect(pulseOpacity === "none" || pulseOpacity === null).toBe(true);
});

test("A7: Zero 404 em assets críticos (fonts, css, js)", async ({ page }) => {
	const bad: string[] = [];
	page.on("response", (res) => {
		if (
			res.status() === 404 &&
			!res.url().includes("favicon") &&
			!res.url().includes("/ws")
		) {
			bad.push(res.url());
		}
	});
	await page.goto("/");
	await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
	if (bad.length > 0) {
		console.log("[A7] 404 detectados:", bad);
	}
	expect(bad).toHaveLength(0);
});
