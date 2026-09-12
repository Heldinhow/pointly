import { expect, test } from "@playwright/test";

test("header adapts without losing focus or exposing controls behind its surface", async ({
	page,
}) => {
	await page.goto("/");
	const header = page.getByRole("banner");
	const mobile = (page.viewportSize()?.width ?? 1440) <= 600;
	const join = page.getByTestId("cta-nav-join-room");
	await expect(header).toHaveAttribute("data-scrolled", "false");
	await join.focus();
	await page.evaluate(() => window.scrollTo(0, 310));
	await expect(header).toHaveAttribute("data-scrolled", "true");
	await expect(join).toBeFocused();
	await expect
		.poll(() =>
			page.locator(".site-header-brand").evaluate((element) => {
				return new DOMMatrix(getComputedStyle(element).transform).m42;
			}),
		)
		.toBe(mobile ? 0 : 8);

	const geometry = await header.evaluate((element) => {
		const brand = element
			.querySelector(".site-header-brand")
			?.getBoundingClientRect();
		const actions = element
			.querySelector(".site-header-actions")
			?.getBoundingClientRect();
		if (!brand || !actions) throw new Error("Header controls missing");
		const surfaceHit = document.elementFromPoint(
			(brand.right + actions.left) / 2,
			50,
		);
		return {
			overlap: brand.right > actions.left,
			insideViewport: brand.left >= 0 && actions.right <= innerWidth,
			interceptsClick: surfaceHit !== null && element.contains(surfaceHit),
			height: element.getBoundingClientRect().height,
			minTouchHeight: Math.min(
				...Array.from(
					element.querySelectorAll("a, button"),
					(control) => control.getBoundingClientRect().height,
				).filter((height) => height > 0),
			),
		};
	});
	expect(geometry).toEqual({
		overlap: false,
		insideViewport: true,
		interceptsClick: true,
		height: 72,
		minTouchHeight: 44,
	});
	await page.evaluate(() => window.scrollTo(0, 0));
	await expect(header).toHaveAttribute("data-scrolled", "false");
	await join.click();
	await expect(page).toHaveURL(/\/join$/);
});

test("mobile keeps the wordmark and one prominent create action", async ({
	page,
}) => {
	test.skip((page.viewportSize()?.width ?? 1440) > 600, "Mobile composition");
	await page.goto("/");
	await expect(
		page.locator(".site-header-brand .pointly-brand > span"),
	).toBeVisible();
	await expect(page.getByTestId("cta-nav-create-room")).toBeHidden();
	await expect(page.locator(".site-header-brand .pointly-mark")).toBeHidden();
	const primary = page.getByTestId("cta-create-room");
	await expect(primary).toBeVisible();
	const width = await primary.evaluate(
		(element) => element.getBoundingClientRect().width,
	);
	expect(width).toBeGreaterThan((page.viewportSize()?.width ?? 390) - 64);
	await expect(page.locator(".landing-player-name")).toHaveCount(4);
	for (const name of await page.locator(".landing-player-name").all()) {
		await expect(name).toBeVisible();
	}
	await primary.click();
	await expect(page).toHaveURL(/\/join\?host=1$/);
	await page.goBack();
	await page.getByTestId("cta-mobile-create-room").click();
	await expect(page).toHaveURL(/\/join\?host=1$/);
});

test("header respects reduced motion in both themes", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	await expect(page.getByTestId("page-landing")).toBeVisible();
	for (const theme of ["light", "dark"]) {
		await page.evaluate((value) => {
			document.documentElement.dataset.theme = value;
			window.scrollTo(0, 310);
		}, theme);
		await expect(page.getByRole("banner")).toHaveAttribute(
			"data-scrolled",
			"true",
		);
		const durations = await page
			.locator(".site-header-brand")
			.evaluate((element) =>
				getComputedStyle(element)
					.transitionDuration.split(",")
					.map(Number.parseFloat),
			);
		expect(durations.every((seconds) => seconds <= 0.00001)).toBe(true);
		await page.evaluate(() => window.scrollTo(0, 0));
		await expect(page.getByRole("banner")).toHaveAttribute(
			"data-scrolled",
			"false",
		);
	}
});
