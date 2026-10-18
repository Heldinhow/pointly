import { expect, test } from "@playwright/test";
import { newPlayer, wirePlayer } from "./helpers/room";

for (const path of ["/join", "/join?mode=join", "/join?code=AB12"]) {
	test(`opção espectador visível sem seção recolhida: ${path}`, async ({ browser }, testInfo) => {
		const { page, ctx } = await newPlayer(browser, testInfo);
		const player = wirePlayer(page, "EntryAudit");
		try {
			await page.goto(path);
			await expect(page.locator("#nick")).toBeVisible();
			const submit = page.locator('button[type="submit"][form="join-form"]');
			await expect(submit).toBeVisible();
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
			await expect(page.getByTestId("join-options-toggle")).toHaveCount(0);
			if (path === "/join") {
				await expect(page.locator("#spectate")).toHaveCount(0);
			} else {
				await expect(page.locator("#spectate")).toBeVisible();
				await expect(page.locator("#spectate")).toBeEnabled();
				await expect(page.locator(".join-spectate-title")).toContainText("Entrar como espectador");
				await expect(page.locator(".join-spectate-hint")).toContainText("Assiste e reage");
			}
			await testInfo.attach("entry-initial", { body: await page.screenshot(), contentType: "image/png" });
			player.guard.assertClean();
		} finally {
			player.guard.detach();
			await ctx.close();
		}
	});
}
