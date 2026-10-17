import { expect, test } from "@playwright/test";
import { addStory, createRoom, newPlayer, wirePlayer } from "./helpers/room";
import { rawFramesContainUuid } from "./helpers/ws-capture";

test("pauta destrava deck e nova rodada exige confirmação dupla", async ({
	browser,
}, testInfo) => {
	const soloCtx = await newPlayer(browser, testInfo);
	const solo = wirePlayer(soloCtx.page, "Solo");

	try {
		await createRoom(solo, "SoloPlayer");

		await expect(solo.page.locator('button[data-testid^="deck-card-"]').first()).toBeVisible();
		for (const value of ["0", "1", "5"]) {
			await expect(solo.page.locator(`button[data-testid="deck-card-${value}"]`)).toBeDisabled();
		}

		await expect(solo.page.locator('[data-testid="reveal-button"]')).toBeDisabled();

		const firstStoryAction = solo.page.getByTestId("first-story-action");
		await expect(firstStoryAction).toBeVisible();
		await expect(firstStoryAction).toBeInViewport({ ratio: 1 });
		await firstStoryAction.click();
		await expect(solo.page.locator("#pauta-novo-titulo")).toBeFocused();
		await expect(solo.page.locator("#pauta-novo-titulo")).toBeInViewport();

		await addStory(solo, "Onboarding");
		await expect(firstStoryAction).toHaveCount(0);
		for (const value of ["0", "1", "5"]) {
			await expect(solo.page.locator(`button[data-testid="deck-card-${value}"]`)).toBeEnabled();
		}

		await solo.page.locator('button[data-testid="deck-card-5"]').click();
		await expect(solo.page.locator('button[data-testid="deck-card-5"]')).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await expect(solo.page.locator('[data-testid="reveal-button"]')).toBeEnabled();
		await solo.page.locator('[data-testid="reveal-button"]').click();
		await expect
			.poll(() => solo.ws.lastRoomState?.payload.sala.phase)
			.toBe("revealed");

		await solo.page.locator('[data-testid="new-round-button"]').click();
		await expect(solo.page.locator('[data-testid="new-round-hint"]')).toBeVisible();
		expect(solo.ws.lastRoomState?.payload.sala.phase).toBe("revealed");
		expect(
			Object.keys(solo.ws.lastRoomState?.payload.sala.votes ?? {}).length,
		).toBeGreaterThan(0);

		const roundBefore = solo.ws.lastRoomState?.payload.sala.round ?? 1;
		await solo.page.locator('[data-testid="new-round-button"]').click();
		await expect
			.poll(() => solo.ws.lastRoomState?.payload.sala.phase)
			.toBe("voting");
		await expect
			.poll(() => solo.ws.lastRoomState?.payload.sala.round)
			.toBe(roundBefore + 1);
		await expect
			.poll(() => Object.keys(solo.ws.lastRoomState?.payload.sala.votes ?? {}).length)
			.toBe(0);
		await expect(solo.page.locator('button[data-testid="deck-card-5"]')).toHaveAttribute(
			"aria-pressed",
			"false",
		);

		expect(rawFramesContainUuid(solo.ws.frames), "uuid no wire").toBeNull();
		expect(solo.ws.parseErrors).toEqual([]);
		solo.guard.assertClean();
	} finally {
		solo.guard.detach();
		await soloCtx.ctx.close();
	}
});
