import { expect, test } from "@playwright/test";
import { newPlayer, wirePlayer } from "./helpers/room";

for (const path of ["/join", "/join?mode=join", "/join?code=AB12"]) {
	test(`entrada cabe na primeira tela: ${path}`, async ({ browser }, testInfo) => {
		const { page, ctx } = await newPlayer(browser, testInfo);
		const player = wirePlayer(page, "EntryAudit");
		try {
			await page.goto(path);
			await expect(page.locator("#nick")).toBeVisible();
			const submit = page.locator('button[type="submit"][form="join-form"]');
			await expect(submit).toBeInViewport({ ratio: 1 });
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
			await expect(page.getByTestId("join-options-toggle")).toHaveAttribute("aria-expanded", "false");
			await testInfo.attach("entry-initial", { body: await page.screenshot(), contentType: "image/png" });
			player.guard.assertClean();
		} finally {
			player.guard.detach();
			await ctx.close();
		}
	});
}
