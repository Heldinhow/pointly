/**
 * Phase 4 — Page cleanups spec (BUG-104, BUG-105, BUG-301, BUG-303)
 *
 * Verifica:
 *  - BUG-104: `/join` tem exatamente 1 elemento de navegação de volta
 *    pro `/` — o botão ghost "Voltar". Sem o link `← criar outra sala`.
 *  - BUG-105: `/full` NÃO renderiza substring "sala_cheia" no DOM.
 *  - BUG-301: `/join` mostra "Entrar" no topbar mas NÃO na strip abaixo.
 *  - BUG-303: `/join` input tem `aria-invalid` boolean correto.
 *
 * @see .compozy/tasks/pointly-ux-hardening/task_07.md
 */
import { expect, test } from "@playwright/test";

const WEB = process.env.E2E_WEB_URL ?? "http://localhost:5173";

test("BUG-104: /join tem apenas o botão 'Voltar' como navegação pra /", async ({
	page,
}) => {
	await page.goto(`${WEB}/join?host=1`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector('[data-testid="page-join"]');

	// Botão ghost "Voltar" presente.
	const back = page.locator('[data-testid="join-back"]');
	expect(await back.count()).toBe(1);

	// Link "← criar outra sala" não presente.
	const createAnother = await page
		.locator("text=criar outra sala")
		.count();
	expect(createAnother).toBe(0);
});

test("BUG-105: /full NÃO exibe 'sala_cheia' nem 'error ·'", async ({
	page,
}) => {
	await page.goto(`${WEB}/full`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector('[data-testid="page-full"]');

	const html = await page.content();
	expect(html).not.toContain("sala_cheia");
	expect(html).not.toContain("error ·");

	// Counter 12/12 continua presente.
	const count = await page.locator('[data-testid="full-count"]').textContent();
	expect(count?.trim()).toBe("12");

	// Headline human readable continua.
	expect(await page.locator("h1").textContent()).toMatch(/Sala cheia/);
});

test("BUG-303: /join input tem aria-invalid boolean correto", async ({
	page,
}) => {
	await page.goto(`${WEB}/join?host=1`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector('[data-testid="page-join"]');

	const input = page.locator('[data-testid="nick-input"]');
	await input.waitFor({ state: "attached", timeout: 5_000 });

	// Estado inicial: input vazio → aria-invalid deve ser "false".
	// (Validation type é `{ ok: false, error: "" }` que tem !ok === true
	// MAS error === "" → condição corrigida: !ok && error !== "" → false.)
	const initial = await input.getAttribute("aria-invalid");
	expect(initial).toBe("false");

	// Digita nick inválido (1 char) → erro aparece → aria-invalid = "true".
	await input.fill("a");
	await page.waitForTimeout(150);
	const afterInvalid = await input.getAttribute("aria-invalid");
	expect(afterInvalid).toBe("true");

	// Digita nick válido (>= 2 chars) → aria-invalid volta a "false".
	await input.fill("Helder");
	await page.waitForTimeout(150);
	const afterValid = await input.getAttribute("aria-invalid");
	expect(afterValid).toBe("false");
});

test("BUG-301: /join 'Entrar' no topbar; header strip NÃO repete 'Entrar'", async ({
	page,
}) => {
	await page.goto(`${WEB}/join?host=1`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector('[data-testid="page-join"]');

	// Header strip agora começa com "Sala:" (não mais "Entrar").
	const codeLabel = page.locator('[data-testid="join-code-label"]');
	await codeLabel.waitFor({ state: "attached", timeout: 5_000 });

	// Pega o conteúdo do strip inteiro (irmão do code-label à esquerda).
	const stripDiv = await codeLabel.evaluateHandle((el) => el.parentElement);
	const stripText = await stripDiv.evaluate((el) => el.textContent ?? "");
	expect(stripText).not.toContain("Entrar");

	// Topbar AINDA tem "Entrar" (label à direita do header sticky).
	const topbarText = await page
		.locator("header.fixed, header.sticky, header")
		.first()
		.textContent();
	expect(topbarText).toContain("Entrar");
});
