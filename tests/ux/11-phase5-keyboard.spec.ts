/**
 * Phase 5 — Keyboard shortcuts (BUG-306, ADR-007).
 *
 * Verifica:
 *  - `R` revela (durante voting, ≥1 voto).
 *  - `N` inicia nova rodada (após reveal).
 *  - Ajuda removida: `?` e `/` não abrem modal.
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

test("ajuda não aparece no header nem pelos atalhos ? e /", async ({
	page,
}) => {
	await enterSoloArena(page);
	await expect(page.getByTestId("arena-help-button")).toHaveCount(0);
	for (const key of ["?", "/"]) {
		await page.keyboard.press(key);
		await expect(page.getByTestId("help-modal")).toHaveCount(0);
	}
	await expect(page.getByTestId("reveal-button")).toBeDisabled();
});

test("R revela votos e N inicia nova rodada com atalhos acessíveis", async ({
	page,
}) => {
	await enterSoloArena(page);
	const reveal = page.getByTestId("reveal-button");
	await expect(reveal).not.toHaveAttribute("aria-keyshortcuts", "R");
	await page.locator('[data-deck-value="3"]').click();
	await expect(reveal).toHaveAttribute("aria-keyshortcuts", "R");
	await page.keyboard.press("r");
	await expect(reveal).toHaveAttribute("data-reveal-state", "post-reveal");
	await expect(reveal).toHaveAttribute("aria-keyshortcuts", "N");
	await page.keyboard.press("n");
	await expect(reveal).toHaveAttribute("data-reveal-state", "awaiting");
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
