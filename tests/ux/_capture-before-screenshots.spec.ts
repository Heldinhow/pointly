/**
 * Capture all 12 *-before.png screenshots in one batch.
 *
 * These document the post-fix state (regression baseline). Since the loop
 * already landed, the spec for T-item N produces a screenshot showing what
 * the page looks like after the fix — i.e., the state we want to PRESERVE.
 *
 * Routes mapped per T-item:
 *   T1  /          (landing: CTAs)
 *   T2  /          (landing: Entrar button)
 *   T3  /join      (apelido step)
 *   T4  /          (landing: side-rails)
 *   T5  /          (landing: feature cards)
 *   T6  /          (landing: CTA ribbon)
 *   T7  /arena     (seat mediana — via DOM evaluation, see T7-after)
 *   T8  /          (landing: footer)
 *   T9  /arena     (skeleton slots)
 *   T10 /arena     (deck cards)
 *   T11 /arena     (topbar)
 *   T12 /arena     (empty overlay — synthetic mount not available, use compiled-source check)
 */
import { expect, test } from "@playwright/test";

const ROUTES: Array<{ tn: string; path: string }> = [
	{ tn: "T1", path: "/" },
	{ tn: "T2", path: "/" },
	{ tn: "T3", path: "/join?code=ABCD" },
	{ tn: "T4", path: "/" },
	{ tn: "T5", path: "/" },
	{ tn: "T6", path: "/" },
	{ tn: "T7", path: "/arena?code=ABCD" },
	{ tn: "T8", path: "/" },
	{ tn: "T9", path: "/arena?code=ABCD" },
	{ tn: "T10", path: "/arena?code=ABCD" },
	{ tn: "T11", path: "/arena?code=ABCD" },
	{ tn: "T12", path: "/arena?code=ABCD" },
];

for (const { tn, path } of ROUTES) {
	test(`capture ${tn}-before`, async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(path);
		// 1200ms para arena garantir mount dos slots/deck.
		await page.waitForTimeout(path.startsWith("/arena") ? 1200 : 500);
		await page.screenshot({
			path: `../../screenshots/${tn}-before.png`,
			fullPage: false,
		});
		expect(true).toBe(true);
	});
}