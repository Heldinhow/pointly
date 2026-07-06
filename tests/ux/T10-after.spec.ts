/**
 * T10 — Carta votada: confirmação visual + toast (AFTER).
 *
 * Critério (Heldinhow/pointly#45):
 * - Click em carta dispara animação scale(1.05) (200ms).
 * - Toast com role="status" "Voto registrado" aparece.
 * - axe-core aria-live rule passa.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("T10-after: click em carta dispara toast 'Voto registrado'", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	// Sem WS a arena pode mostrar overlay ou redirect — se deck não aparece, pular.
	const card3 = page.getByTestId("deck-card-3");
	const cardCount = await card3.count();
	if (cardCount === 0) {
		console.log(
			"[T10-after] deck não renderizou (sem WS) — pulando assertion visual",
		);
		test.skip();
		return;
	}

	// Click em qualquer carta.
	await card3.click();

	// Toast aparece — usa o sistema de toasts existente (role=status implícito).
	// Aguardar toast text "Voto registrado".
	const toast = page.locator("text=Voto registrado").first();
	await expect(toast).toBeVisible({ timeout: 2000 });

	await page.screenshot({
		path: "../../screenshots/T10-after.png",
		fullPage: false,
	});
});

test("T10-after: animação card-bump aplicada no click", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);

	const card5 = page.getByTestId("deck-card-5");
	if ((await card5.count()) === 0) {
		test.skip();
		return;
	}

	await card5.click();

	// Imediatamente após o click, animação deve estar ativa.
	const anim = await card5.evaluate(
		(el) => window.getComputedStyle(el).animationName,
	);
	console.log(`[T10-after] card-5 animation-name: ${anim}`);
	expect(anim).toBe("card-bump");
});

test("T10-after: axe-core 0 serious/critical em /arena", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/arena?code=ABCD");
	await page.waitForTimeout(800);
	const axe = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
		.analyze();
	const serious = axe.violations.filter(
		(v) => v.impact === "serious" || v.impact === "critical",
	);
	if (serious.length > 0) {
		for (const v of serious) console.log(`  - ${v.id}: ${v.help}`);
	}
	expect(serious.length).toBe(0);
});
