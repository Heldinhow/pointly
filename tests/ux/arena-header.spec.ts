import { expect, test } from "@playwright/test";
import { multiClient } from "../e2e/fixtures/multi-client";

test("navbar stays fixed and compacts after scrolling in both themes", async ({
	page,
}) => {
	await page.goto("/");
	const header = page.getByRole("banner");
	const brand = page.locator(".site-header-brand");
	const actions = page.locator(".site-header-actions");
	const mobile = (page.viewportSize()?.width ?? 1440) <= 600;
	for (const theme of ["light", "dark"]) {
		await page.getByTestId("theme-toggle").click();
		await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
		await page.evaluate(() => window.scrollTo(0, 0));
		await expect(header).toHaveAttribute("data-scrolled", "false");
		// Let the 420ms settle-back transition finish before baselining.
		await page.waitForTimeout(600);
		const before = await Promise.all([
			header.boundingBox(),
			brand.boundingBox(),
			actions.boundingBox(),
		]);
		await page.evaluate(() => window.scrollTo(0, 400));
		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeGreaterThan(48);
		await expect(header).toHaveAttribute("data-scrolled", "true");
		await expect(header).toHaveCSS("position", "fixed");
		if (!mobile) {
			// Settle the 420ms compact transition before measuring.
			await expect
				.poll(() => brand.evaluate((node) => node.getBoundingClientRect().y))
				.toBeGreaterThan(before[1]?.y ?? 0);
		} else {
			await page.waitForTimeout(500);
		}
		const after = await Promise.all([
			header.boundingBox(),
			brand.boundingBox(),
			actions.boundingBox(),
		]);
		// Header keeps its 72px slot; only the groups settle (desktop).
		expect(after[0]?.height).toBe(before[0]?.height);
		expect(after[0]?.y).toBe(before[0]?.y);
		if (mobile) {
			expect(after[1]?.y).toBe(before[1]?.y);
			expect(after[2]?.y).toBe(before[2]?.y);
			await expect(page.getByTestId("cta-nav-join-room")).toBeInViewport();
			await expect(page.getByTestId("cta-nav-create-room")).toBeHidden();
		} else {
			expect((after[1]?.y ?? 0) - (before[1]?.y ?? 0)).toBeGreaterThan(0);
			await expect(page.getByTestId("cta-nav-create-room")).toBeInViewport();
		}
		// Visible surface keeps the theme background (full bar on mobile,
		// compact pill on desktop) instead of transparent page bleed.
		const surface = await header.evaluate((element) => {
			const wide = getComputedStyle(element, "::before");
			const nav = element.querySelector(".site-header-nav");
			if (!nav) throw new Error("Header nav missing");
			const pill = getComputedStyle(nav, "::before");
			return {
				wide: { background: wide.backgroundColor, opacity: wide.opacity },
				pill: { background: pill.backgroundColor, opacity: pill.opacity },
			};
		});
		const expected =
			theme === "light" ? "rgb(245, 245, 245)" : "rgb(17, 17, 17)";
		if (mobile) {
			expect(surface.wide.background).toBe(expected);
			await expect
				.poll(() =>
					header.evaluate(
						(element) =>
							Number.parseFloat(
								getComputedStyle(element, "::before").opacity,
							),
					),
				)
				.toBeGreaterThan(0.9);
		} else {
			expect(surface.pill.background).toBe(expected);
			await expect
				.poll(() =>
					header.evaluate((element) => {
						const nav = element.querySelector(".site-header-nav");
						if (!nav) throw new Error("Header nav missing");
						return Number.parseFloat(
							getComputedStyle(nav, "::before").opacity,
						);
					}),
				)
				.toBeGreaterThan(0.9);
		}
	}
	if (mobile) {
		await page.getByTestId("cta-create-room").click();
	} else {
		await page.getByTestId("cta-nav-create-room").click();
	}
	await expect(page.getByTestId("page-join")).toBeVisible();
	const headerBox = await header.boundingBox();
	const inputBox = await page.getByTestId("nick-input").boundingBox();
	expect(inputBox!.y).toBeGreaterThan(headerBox!.y + headerBox!.height);
});

test("cards animate once, respond to hover and focus, and respect reduced motion", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto("/");
	const card = page.locator(".pointly-mark-back");
	const brand = page.locator(".site-header-brand");
	const mobile = (page.viewportSize()?.width ?? 1440) <= 600;
	if (mobile) {
		// Mobile keeps the wordmark only; the mark is hidden by design.
		await expect(page.locator(".site-header-brand .pointly-mark")).toBeHidden();
		await expect(card).toBeHidden();
		return;
	}
	await expect(card).toHaveCSS("animation-duration", "0.4s");
	await expect(card).toHaveCSS("animation-iteration-count", "1");
	await expect
		.poll(() => card.evaluate((node) => node.getAnimations().length))
		.toBe(0);
	const resting = await card.evaluate(
		(node) => getComputedStyle(node).transform,
	);
	await brand.hover();
	await expect(card).not.toHaveCSS("transform", resting);
	await page.mouse.move(0, 100);
	await expect(card).toHaveCSS("transform", resting);
	await page.getByTestId("theme-toggle").focus();
	await page.keyboard.press("Shift+Tab");
	await expect(brand).toBeFocused();
	await expect(card).not.toHaveCSS("transform", resting);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await expect(card).toHaveCSS("animation-name", "none");
	await expect(card).toHaveCSS("transform", resting);
	await brand.hover();
	await expect(card).toHaveCSS("transform", resting);
});

test("arena has one waiting message and preserves a round between two participants", async ({
	browser,
	viewport,
}, testInfo) => {
	const suite = await multiClient(browser, { clientCount: 2, viewport });
	try {
		const code = await suite.createRoom(0);
		const first = suite.clients[0]!.page;
		const second = suite.clients[1]!.page;
		await expect(
			first.getByText("Aguardando votos…", { exact: true }),
		).toHaveCount(1);
		await expect(first.getByTestId("reveal-button")).not.toHaveAttribute(
			"aria-describedby",
		);
		await expect(first.getByTestId("arena-help-button")).toHaveCount(0);
		for (const colorScheme of ["light", "dark"] as const) {
			await first.emulateMedia({ colorScheme });
			await first.screenshot({
				path: testInfo.outputPath(`arena-${colorScheme}.png`),
				fullPage: true,
			});
		}
		await suite.joinRoom(code, 1);
		await suite.vote(0, "5");
		await expect(first.getByTestId("reveal-button-hint")).toHaveText(
			"1 de 2 votaram.",
		);
		await suite.vote(1, "8");
		await suite.reveal(1);
		await expect(first.getByTestId("reveal-button")).toHaveAttribute(
			"data-reveal-state",
			"post-reveal",
		);
		expect((await suite.consensus(0))?.mean).toBe(6.5);
		expect((await suite.consensus(1))?.mean).toBe(6.5);
		await first.getByTestId("reveal-button").click();
		await expect(first.getByTestId("reveal-button")).toHaveText(
			"Confirmar nova rodada?",
		);
		await expect(second.getByTestId("reveal-button")).toHaveAttribute(
			"data-reveal-state",
			"post-reveal",
		);
		await first.getByTestId("reveal-button").click();
		for (const page of [first, second]) {
			await expect(page.getByTestId("reveal-button")).toBeDisabled();
			await expect(
				page.getByText("Aguardando votos…", { exact: true }),
			).toHaveCount(1);
		}
	} finally {
		await suite.dispose();
	}
});
