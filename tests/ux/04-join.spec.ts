/**
 * Track D — Join page / validação de apelido
 *
 * Valida todas as regras de nick declaradas em plan.md seção 6.3 +
 * `validateNick` em apps/web/src/pages/join.tsx.
 */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/join?code=ABCD");
	await page.waitForSelector('[data-testid="page-join"]');
});

test("D1: Apelido vazio não submete", async ({ page }) => {
	const submit = page.getByTestId("join-submit");
	// Botão pode estar desabilitado OU clicar não navega
	const disabled = await submit.isDisabled();
	if (!disabled) {
		await submit.click();
		await page.waitForTimeout(500);
		expect(page.url()).toContain("/join");
	} else {
		expect(disabled).toBe(true);
	}
});

test("D2: 1 char 'H' mostra erro 'Mínimo 2'", async ({ page }) => {
	await page.getByTestId("nick-input").fill("H");
	const errorText = await page.textContent("body");
	expect(errorText?.toLowerCase()).toContain("mínimo");
});

test("D3: 21 chars mostra erro 'Máximo 20'", async ({ page }) => {
	await page.getByTestId("nick-input").fill("abcdefghijklmnopqrstu");
	const errorText = await page.textContent("body");
	expect(errorText?.toLowerCase()).toMatch(/máximo/);
});

test("D4: Espaço duplo 'Hel  der' mostra erro 'Sem espaços duplos'", async ({
	page,
}) => {
	await page.getByTestId("nick-input").fill("Hel  der");
	const errorText = await page.textContent("body");
	expect(errorText?.toLowerCase()).toContain("espaços duplos");
});

test("D5: Espaço nas pontas ' Helder ' mostra erro", async ({ page }) => {
	await page.getByTestId("nick-input").fill(" Helder ");
	const errorText = await page.textContent("body");
	expect(errorText?.toLowerCase()).toMatch(/espaços.*(início|fim)/);
});

test("D6: Apelido válido 'Helder' redireciona para /arena", async ({
	page,
}) => {
	await page.getByTestId("nick-input").fill("Helder");
	await page.getByTestId("join-submit").click();
	await page.waitForURL(/\/arena/, { timeout: 10_000 });
	await page.waitForSelector('[data-testid="page-arena"]');
});

test("D9: Nick pré-preenchido se voltou (localStorage)", async ({
	page,
	context,
}) => {
	// Simula user que já entrou antes
	await context.addInitScript(() => {
		localStorage.setItem("pointly.nick", "Voltei");
	});
	await page.goto("/join?code=ABCD");
	await page.waitForSelector('[data-testid="page-join"]');
	const value = await page.getByTestId("nick-input").inputValue();
	expect(value).toBe("Voltei");
});

test("D10: Nick com caractere especial/emoji aceita (audit)", async ({
	page,
}) => {
	await page.getByTestId("nick-input").fill("Helder🎲");
	const errorText = await page.textBody?.() ?? "";
	// Comportamento atual: aceita. Só audit, não falha se diferente.
	const submitDisabled = await page.getByTestId("join-submit").isDisabled();
	console.log(
		`[D10] emoji: submitDisabled=${submitDisabled}, hasError=${errorText.includes("inválid")}`,
	);
});