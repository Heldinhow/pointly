import { expect, test } from "@playwright/test";
import { createRoom, newPlayer, wirePlayer } from "./helpers/room";
import { rawFramesContainUuid } from "./helpers/ws-capture";

test("welcome não transmite credencial de reconexão", async ({ browser }, testInfo) => {
	const actor = await newPlayer(browser, testInfo);
	const player = wirePlayer(actor.page, "Identidade");
	try {
		await createRoom(player, "IdentidadeSegura");
		await expect.poll(() => player.ws.frames.length).toBeGreaterThan(0);
		expect(rawFramesContainUuid(player.ws.frames), "credencial exposta no welcome S2C").toBeNull();
		expect(player.ws.parseErrors).toEqual([]);
		await expect.poll(() => player.ws.welcomes.length).toBe(1);
		player.guard.assertClean();
	} finally {
		player.guard.detach();
		player.ws.detach();
		await actor.ctx.close();
	}
});
