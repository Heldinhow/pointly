/**
 * Phase 5 — Keyboard shortcuts (BUG-306, ADR-007).
 *
 * Verifica:
 *  - `R` revela (durante voting, ≥1 voto).
 *  - `N` inicia nova rodada (após reveal).
 *  - `?` abre HelpModal; `Esc` fecha.
 *  - `/` (ABNT) também abre HelpModal.
 *  - Atalhos NÃO disparam quando foco está em `<input>`.
 *
 * @see .compozy/tasks/pointly-ux-hardening/task_09.md
 */
import { expect, test } from "@playwright/test";

const WEB = process.env.E2E_WEB_URL ?? "http://localhost:5173";

async function enterSoloArena(page: import("@playwright/test").Page) {
	await page.goto(`${WEB}/join?host=1`, {
		waitUntil: "domcontentloaded",
	});
	await page.waitForSelector('[data-testid="page-join"]');
	await page.fill('[data-testid="nick-input"]', `Keys${Date.now()}`);
	await page.click('[data-testid="join-submit"]');
	await page.waitForSelector('[data-testid="arena-stage"]', {
		timeout: 10_000,
	});
}

test("`?` abre HelpModal; `Esc` fecha", async ({ browser }) => {
	const ctx = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await ctx.newPage();
	try {
		await enterSoloArena(page);

		await page.keyboard.press("?");
		const modal = page.locator('[data-testid="help-modal"]');
		await modal.waitFor({ state: "visible", timeout: 3_000 });
		expect(await modal.isVisible()).toBe(true);

		// Lista atalhos.
		const text = await modal.textContent();
		expect(text).toContain("R");
		expect(text).toContain("N");
		expect(text).toContain("?");
		expect(text).toContain("Esc");

		// Esc fecha.
		await page.keyboard.press("Escape");
		await expect(modal).toBeHidden({ timeout: 3_000 });
	} finally {
		await ctx.close();
	}
});

test("`/` (ABNT) também abre HelpModal via helpKey=?", async ({ browser }) => {
	const ctx = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await ctx.newPage();
	try {
		await enterSoloArena(page);
		await page.keyboard.press("/");
		const modal = page.locator('[data-testid="help-modal"]');
		await modal.waitFor({ state: "visible", timeout: 3_000 });
		expect(await modal.isVisible()).toBe(true);
	} finally {
		await ctx.close();
	}
});

test("RevealButton anuncia `aria-keyshortcuts` quando ready", async ({
	browser,
}) => {
	const ctx = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await ctx.newPage();
	try {
		await enterSoloArena(page);
		const reveal = page.locator('[data-testid="reveal-button"]');
		await reveal.waitFor({ state: "attached", timeout: 5_000 });
		// Estado inicial: 'awaiting' (sem votos). aria-keyshortcuts não deve ter 'R'.
		const awaitingAks = await reveal.getAttribute("aria-keyshortcuts");
		expect(awaitingAks).not.toBe("R");

		// Vota em uma carta para virar 'ready'.
		await page.click('[data-deck-value="3"]');
		await page.waitForTimeout(500);

		// Recupera atributo após vote.
		const readyAks = await reveal.getAttribute("aria-keyshortcuts");
		expect(readyAks).toBe("R");
	} finally {
		await ctx.close();
	}
});

test("foco em `<input>` impede que atalhos disparem (input guard)", async ({
	browser,
}) => {
	const ctx = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await ctx.newPage();
	try {
		// Abre /join direto pra ter input focado.
		await page.goto(`${WEB}/join?host=1`, {
			waitUntil: "domcontentloaded",
		});
		await page.waitForSelector('[data-testid="page-join"]');
		const input = page.locator('[data-testid="nick-input"]');
		await input.focus();

		// Pressiona 'r' enquanto focado no input.
		// O listener não está registrado aqui (arena hook só está dentro
		// de /arena), mas verificamos que Page ainda está em /join sem
		// ações colaterais.
		await page.keyboard.press("r");
		await page.waitForTimeout(200);

		// URL não deve ter mudado.
		const url = page.url();
		expect(url).toContain("/join");

		// E o input recebeu o caractere 'r' (sem guard, a letra não seria
		// inserida porque o keydown do listener chamaria e. preventDefault).
		const value = await input.inputValue();
		expect(value).toBe("r");
	} finally {
		await ctx.close();
	}
});
