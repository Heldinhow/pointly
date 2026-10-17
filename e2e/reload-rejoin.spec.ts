import { expect, test } from "@playwright/test";
import {
	addStory,
	createRoom,
	joinWithManualCode,
	newPlayer,
	ownPlayerId,
	vote,
	wirePlayer,
} from "./helpers/room";
import { rawFramesContainUuid } from "./helpers/ws-capture";

test("reload restaura assento e voto sem expor voto alheio", async ({ browser }, testInfo) => {
	const anaCtx = await newPlayer(browser, testInfo);
	const betoCtx = await newPlayer(browser, testInfo);
	const ana = wirePlayer(anaCtx.page, "Ana");
	const beto = wirePlayer(betoCtx.page, "Beto");

	try {
		const code = await createRoom(ana, "AnaReload");
		await addStory(ana, "Login social");
		await joinWithManualCode(beto, code, "BetoReload");

		await vote(ana, "8");
		await vote(beto, "5");

		await expect
			.poll(() => {
				const sala = ana.ws.lastRoomState?.payload.sala;
				if (!sala) return "";
				return sala.players
					.filter((p) => p.role !== "spectator")
					.map((p) => `${p.nick}:${p.hasVoted}`)
					.sort()
					.join(",");
			})
			.toBe("AnaReload:true,BetoReload:true");

		const anaIdBefore = ownPlayerId(ana);
		const selfBefore = ana.ws.lastRoomState?.payload.sala.players.find((p) => p.id === anaIdBefore);
		if (!selfBefore) throw new Error("self ausente no room_state pré-reload");
		const seatBefore = selfBefore.seatIndex;
		const roleBefore = selfBefore.role;

		const welcomesBefore = ana.ws.welcomes.length;
		const framesBefore = ana.ws.frames.length;

		await ana.page.reload();
		await expect(ana.page.locator('[data-testid="sala-code"]')).toContainText(code);

		await expect.poll(() => ana.ws.welcomes.length).toBeGreaterThan(welcomesBefore);
		const fresh = ana.ws.welcomes[ana.ws.welcomes.length - 1];
		if (!fresh) throw new Error("welcome pós-rejoin ausente");
		expect(fresh.payload.playerId).toBe(anaIdBefore);
		expect(fresh.payload.role).toBe(roleBefore);
		const freshSelf = fresh.payload.sala.players.find((p) => p.id === anaIdBefore);
		if (!freshSelf) throw new Error("self ausente no welcome fresco");
		expect(freshSelf.seatIndex).toBe(seatBefore);
		expect(freshSelf.role).toBe(roleBefore);
		expect(freshSelf.value).toBe("8");
		const betoId = beto.playerId ?? ownPlayerId(beto);
		expect(fresh.payload.sala.votes[betoId]).toBeUndefined();
		expect(fresh.payload.sala.players.find((p) => p.id === betoId)?.value).toBeNull();

		await expect
			.poll(() => {
				const sala = ana.ws.lastRoomState?.payload.sala;
				const self = sala?.players.find((p) => p.nick === "AnaReload");
				if (!self || !self.hasVoted) return "";
				return `${self.id}:${self.seatIndex}:${self.role}:${self.value}`;
			})
			.toBe(`${anaIdBefore}:${seatBefore}:${roleBefore}:8`);

		const anaIdAfter = ownPlayerId(ana);
		expect(anaIdAfter).toBe(anaIdBefore);
		const sala = ana.ws.lastRoomState?.payload.sala;
		if (!sala) throw new Error("room_state pós-rejoin ausente");
		expect(sala.players.find((p) => p.id === anaIdAfter)?.seatIndex).toBe(seatBefore);
		expect(sala.players.find((p) => p.id === anaIdAfter)?.role).toBe(roleBefore);
		expect(sala.votes[anaIdAfter]).toBe("8");
		await expect(ana.page.locator('button[data-testid="deck-card-8"]')).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		expect(["voting", "revealable"]).toContain(sala.phase);
		expect(sala.votes[betoId]).toBeUndefined();
		expect(sala.players.find((p) => p.nick === "BetoReload")?.value).toBeNull();

		expect(ana.ws.frames.length).toBeGreaterThan(framesBefore);
		expect(rawFramesContainUuid(ana.ws.frames), "uuid no wire após rejoin").toBeNull();
		expect(ana.ws.parseErrors).toEqual([]);
		expect(beto.ws.parseErrors).toEqual([]);

		ana.guard.assertClean();
		beto.guard.assertClean();
	} finally {
		ana.guard.detach();
		beto.guard.detach();
		await anaCtx.ctx.close();
		await betoCtx.ctx.close();
	}
});
