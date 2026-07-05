/**
 * Phase 4 — EmptyOverlay UX spec (BUG-102, BUG-304, BUG-305)
 *
 * Verifica:
 *  - BUG-102: overlay re-aparece em sala solo após nova rodada
 *    (phase === 'voting' && players.length === 1) depois de dismiss.
 *  - BUG-304: `onDismiss` no Arena é opcional; sem handler explícito
 *    no parent (componente auto-gerencia via sessionStorage).
 *  - BUG-305: clicar "Copiar link" NÃO fecha o overlay.
 *
 * @see .compozy/tasks/pointly-ux-hardening/task_06.md
 */
import { expect, test } from "@playwright/test";

const WEB = process.env.E2E_WEB_URL ?? "http://localhost:5173";

async function enterSoloArena(page: import("@playwright/test").Page) {
	await page.goto(`${WEB}/join?host=1`, {
		waitUntil: "domcontentloaded",
	});
	await page.waitForSelector('[data-testid="page-join"]');
	await page.fill(
		'[data-testid="join-input-nick"]',
		`Overlay${Date.now()}`,
	);
	await page.click('[data-testid="join-enter-room"]');
	await page.waitForSelector('[data-testid="arena-stage"]', {
		timeout: 10_000,
	});
}

test("BUG-102: overlay aparece na primeira entrada em sala solo", async ({
	browser,
}) => {
	const ctx = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await ctx.newPage();
	try {
		// Limpa storage pra garantir estado inicial limpo.
		await page.goto(WEB);
		await page.evaluate(() => sessionStorage.clear());
		await enterSoloArena(page);

		const overlay = page.locator('[data-testid="empty-overlay"]');
		await overlay.waitFor({ state: "visible", timeout: 5_000 });
		expect(await overlay.isVisible()).toBe(true);
	} finally {
		await ctx.close();
	}
});

test("BUG-102: overlay re-aparece após dismiss + nova rodada (solo)", async ({
	browser,
}) => {
	const ctx = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await ctx.newPage();
	try {
		await page.goto(WEB);
		await page.evaluate(() => sessionStorage.clear());
		await enterSoloArena(page);

		// 1) Overlay aparece inicialmente.
		const overlay = page.locator('[data-testid="empty-overlay"]');
		await overlay.waitFor({ state: "visible", timeout: 5_000 });

		// 2) User clica "Entrar na mesa mesmo assim" → overlay desaparece.
		await page.click('[data-testid="empty-overlay-dismiss"]');
		await expect(overlay).toBeHidden({ timeout: 3_000 });

		// 3) sessionStorage agora tem o flag setado.
		const dismissed = await page.evaluate(() =>
			sessionStorage.getItem("pointly.dismissedEmpty"),
		);
		expect(dismissed).toBe("1");

		// 4) Forçar nova rodada: revela, depois reseta. Sem segundo player
		//    o reveal expõe os votos do host. Depois reset → phase=voting
		//    → trigger do useEffect em arena.tsx → sessionStorage limpo
		//    → re-mount do EmptyOverlay → overlay aparece de novo.
		await page.click('[data-testid="reveal-button"]', {
			timeout: 5_000,
		}).catch(() => {
			// Se reveal falhar (timer expirando, etc), segue o teste.
		});

		// Tenta esperar que o botão de nova rodada apareça.
		const newRoundBtn = page.locator(
			'[data-testid="new-round-button"]',
		);
		await newRoundBtn.waitFor({ state: "visible", timeout: 8_000 });
		await newRoundBtn.click();

		// phase volta para voting → overlay deve re-aparecer.
		await overlay.waitFor({ state: "visible", timeout: 5_000 });
		expect(await overlay.isVisible()).toBe(true);
	} finally {
		await ctx.close();
	}
});

test("BUG-305: Copiar link NÃO fecha o overlay", async ({ browser }) => {
	const ctx = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await ctx.newPage();
	try {
		await page.goto(WEB);
		await page.evaluate(() => sessionStorage.clear());
		await enterSoloArena(page);

		const overlay = page.locator('[data-testid="empty-overlay"]');
		await overlay.waitFor({ state: "visible", timeout: 5_000 });

		// Concede permissão de clipboard pro Chromium headless.
		await ctx.grantPermissions(["clipboard-read", "clipboard-write"], {
			origin: WEB,
		});

		await page.click('[data-testid="empty-overlay-copy"]');
		// Espera 2s (1.2s era o timeout antigo + buffer). Overlay deve
		// continuar visível porque removemos o auto-dismiss.
		await page.waitForTimeout(2000);
		expect(await overlay.isVisible()).toBe(true);

		// Feedback visual "Copiado ✓" presente.
		const copyBtn = page.locator('[data-testid="empty-overlay-copy"]');
		const copyText = await copyBtn.textContent();
		expect(copyText?.trim()).toBe("Copiado ✓");
	} finally {
		await ctx.close();
	}
});

test("BUG-304 + Esc: Esc ainda fecha o overlay", async ({ browser }) => {
	const ctx = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await ctx.newPage();
	try {
		await page.goto(WEB);
		await page.evaluate(() => sessionStorage.clear());
		await enterSoloArena(page);

		const overlay = page.locator('[data-testid="empty-overlay"]');
		await overlay.waitFor({ state: "visible", timeout: 5_000 });

		await page.keyboard.press("Escape");
		await expect(overlay).toBeHidden({ timeout: 3_000 });
	} finally {
		await ctx.close();
	}
});
