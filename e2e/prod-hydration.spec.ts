import { expect, test, type Response } from "@playwright/test";
import { stubAnalyticsNetwork } from "./helpers/analytics";
import { newPlayer } from "./helpers/room";
import { attachErrorGuard } from "./helpers/ws-capture";

/**
 * O build de produção (vite-prerender-plugin) entrega HTML estático e o
 * `main.tsx` hidrata com `hydrateRoot`. O servidor de produção da suíte sobe
 * em 5188 (`scripts/serve-web.mjs`), separado do Vite dev de 5179: só ele
 * reproduz o caminho de hidratação que quebrou em produção (#421).
 */
const PROD_BASE_URL =
	process.env.POINTLY_PROD_BASE_URL ?? "http://localhost:5188";

async function expectPrerendered(
	response: Response | null,
	marker: string,
): Promise<void> {
	expect(response, "navegação sem response HTTP").not.toBeNull();
	expect(response?.status()).toBe(200);
	const html = (await response?.text()) ?? "";
	// HTML pré-renderizado de verdade: #root já vem com markup, não vazio.
	expect(html).toMatch(/<div id="root">\s*</i);
	expect(html).toContain(marker);
}

test("páginas pré-renderizadas hidratam sem erros antes e depois do consentimento", async ({
	browser,
}, testInfo) => {
	const { page, ctx } = await newPlayer(browser, testInfo);
	const guard = attachErrorGuard(page);
	const attempts = await stubAnalyticsNetwork(page);
	const banner = page.getByTestId("analytics-consent-banner");
	try {
		// `/` antes de qualquer escolha: nada de localStorage e nenhum update
		// de consentimento durante a hidratação.
		const home = await page.goto(`${PROD_BASE_URL}/`, {
			waitUntil: "networkidle",
		});
		await expectPrerendered(home, 'data-testid="home-cta-create"');
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(banner).toBeVisible();
		expect(attempts).toEqual([]);
		guard.assertClean();

		// Guia pré-renderizada, ainda sem escolha salva.
		const guide = await page.goto(`${PROD_BASE_URL}/guias/story-points`, {
			waitUntil: "networkidle",
		});
		await expectPrerendered(guide, "Story Points");
		await expect(banner).toBeVisible();
		guard.assertClean();

		// Aceitar na guia grava a escolha; o reload precisa hidratar com ela.
		await page.getByTestId("analytics-consent-accept").click();
		await expect(banner).toHaveCount(0);
		expect(
			await page.evaluate(
				() => window.localStorage.getItem("pointly.analytics-consent"),
			),
		).toBe("granted");
		await expect.poll(() => attempts.length).toBeGreaterThan(0);
		guard.assertClean();

		await page.reload({ waitUntil: "networkidle" });
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		guard.assertClean();

		// `/` com consentimento salvo: era aqui que o #421 estourava no load.
		const homeWithConsent = await page.goto(`${PROD_BASE_URL}/`, {
			waitUntil: "networkidle",
		});
		await expectPrerendered(homeWithConsent, 'data-testid="home-cta-create"');
		await expect(page.getByTestId("home-cta-create")).toBeVisible();
		guard.assertClean();

		await page.reload({ waitUntil: "networkidle" });
		await expect(page.getByTestId("home-cta-create")).toBeVisible();
		guard.assertClean();
	} finally {
		guard.detach();
		await ctx.close();
	}
});
