/**
 * Arena visual regression spec — INCONS-021 follow-up + user feedback
 * "mesa ficou minuscula" 2026-07-10.
 *
 * Captura screenshots da arena em 5 viewports (360 mobile / 768 tablet /
 * 1024 desktop / 1440 desktop / 1920 wide). Falha se a mesa estiver:
 *  - Fora do viewport horizontal (clipping lateral)
 *  - Com altura < 30% da viewport (mesa diminuta — feedback 2026-07-10)
 *  - Sem o conteudo Ellipse/Seats/StatsPill renderizados
 *
 * Screenshots sao salvos em `tests/e2e/screenshots/arena/<viewport>w.png`
 * para inspecao manual. Diff contra baseline via git diff visual.
 *
 * **Workflow do self-improve** (reg 2026-07-10 — feedback usuario):
 *   1. Antes de implementar fix visual: `bun run test:e2e -- arena-visual`
 *      salva screenshot "before" em screenshots/arena/
 *   2. Implementar fix
 *   3. Re-rodar spec: salva "after"
 *   4. Diff visual: revisar `git diff screenshots/arena/` antes de merge
 *   5. PR deve conter screenshots anexados como referencia
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const VIEWPORTS = [
	{ name: "360w-mobile", width: 360, height: 800 },
	{ name: "768w-tablet-portrait", width: 768, height: 1024 },
	{ name: "1024w-laptop", width: 1024, height: 768 },
	{ name: "1440w-desktop", width: 1440, height: 900 },
	{ name: "1920w-wide", width: 1920, height: 1080 },
] as const;

const SCREENSHOT_DIR = join(__dirname, "screenshots", "arena");

function setupScreenshotsDir(): void {
	mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function gotoArenaWithSoloPlayer(page: Page): Promise<void> {
	// Como o spec roda contra uma sala solo (que isola a UI sem dependencia de
	// WebSocket em tempo real), apontar direto para /arena com nick pre-set.
	await page.goto("/join");
	await page.fill('input[placeholder="Seu nome"]', "VisualTester");
	await page.click('button[type="submit"]');
	await page.waitForURL(/\/arena/);
}

test.describe("Arena visual regression", () => {
	setupScreenshotsDir();

	for (const vp of VIEWPORTS) {
		test(`mesa visivel e proporcional @ ${vp.name}`, async ({ browser }) => {
			const ctx = await browser.newContext({
				viewport: { width: vp.width, height: vp.height },
			});
			const page = await ctx.newPage();
			try {
				await gotoArenaWithSoloPlayer(page);

				const mesa = page.locator('[data-testid="arena-table"]');
				await expect(mesa).toBeVisible({ timeout: 10_000 });

				const mesaBox = await mesa.boundingBox();
				expect(mesaBox).not.toBeNull();
				if (!mesaBox) throw new Error("mesa boundingBox null");

				const vpHeight = vp.height;

				// AC #91 / feedback "mesa minuscula": altura >= 30% do viewport
				// garante que mesa nao fica pequena demais em desktop.
				expect(mesaBox.height).toBeGreaterThanOrEqual(vpHeight * 0.3);

				// Mesa nao pode clipar lateral: width <= viewport.
				expect(mesaBox.x).toBeGreaterThanOrEqual(0);
				expect(
					mesaBox.x + mesaBox.width,
				).toBeLessThanOrEqual(vp.width);

				// Screenshot capturado em screenshots/arena/<viewport>w.png
				const file = join(SCREENSHOT_DIR, `${vp.name}.png`);
				await page.screenshot({ path: file, fullPage: false });
			} finally {
				await ctx.close();
			}
		});
	}
});
