import { expect, test } from "@playwright/test";
import {
	addStory,
	createRoom,
	joinWithInviteLink,
	joinWithManualCode,
	newPlayer,
	ownPlayerId,
	readInviteUrl,
	vote,
	wirePlayer,
	type Player,
} from "./helpers/room";
import { rawFramesContainUuid } from "./helpers/ws-capture";

/** Assert a newcomer welcome carries no vote from earlier voters. */
function assertWelcomeSecrecy(viewer: Player, expectedRole: "player" | "spectator"): string {
	const fresh = viewer.ws.welcomes[viewer.ws.welcomes.length - 1];
	if (!fresh) throw new Error(`welcome de ${viewer.nick} ausente`);
	expect(fresh.payload.role).toBe(expectedRole);
	expect(fresh.payload.sala.votes).toEqual({});
	for (const p of fresh.payload.sala.players) {
		expect(p.value, `players.value de ${p.nick} no welcome de ${viewer.nick}`).toBeNull();
	}
	const self = fresh.payload.sala.players.find((p) => p.nick === viewer.nick);
	if (!self) throw new Error(`self ${viewer.nick} ausente no próprio welcome`);
	expect(self.id).toBe(fresh.payload.playerId);
	expect(self.role).toBe(expectedRole);
	expect(self.hasVoted).toBe(false);
	if (expectedRole === "spectator") {
		expect(self.seatIndex).toBe(-1);
	} else {
		expect(self.seatIndex).toBeGreaterThanOrEqual(0);
	}
	return self.id;
}

test("late-join após host votar não vaza votos no welcome", async ({ browser }, testInfo) => {
	const hostCtx = await newPlayer(browser, testInfo);
	const betoCtx = await newPlayer(browser, testInfo);
	const carolCtx = await newPlayer(browser, testInfo);
	const host = wirePlayer(hostCtx.page, "Host");
	const beto = wirePlayer(betoCtx.page, "Beto");
	const carol = wirePlayer(carolCtx.page, "Carol");

	try {
		const code = await createRoom(host, "HostLate");
		await addStory(host, "Checkout PIX");
		await vote(host, "8");
		const hostId = ownPlayerId(host);
		const inviteUrl = await readInviteUrl(host, code);

		await joinWithManualCode(beto, code, "BetoLate");
		await expect.poll(() => beto.ws.welcomes.length).toBeGreaterThan(0);
		const betoId = assertWelcomeSecrecy(beto, "player");

		await joinWithInviteLink(carol, inviteUrl, "CarolLate", { spectate: true });
		await expect.poll(() => carol.ws.welcomes.length).toBeGreaterThan(0);
		assertWelcomeSecrecy(carol, "spectator");

		await vote(beto, "5");
		await expect
			.poll(() => {
				const sala = carol.ws.lastRoomState?.payload.sala;
				if (!sala) return "";
				return sala.players
					.filter((p) => p.role !== "spectator")
					.map((p) => `${p.nick}:${p.hasVoted}`)
					.sort()
					.join(",");
			})
			.toBe("BetoLate:true,HostLate:true");

		const betoSala = beto.ws.lastRoomState?.payload.sala;
		if (!betoSala) throw new Error("room_state de BetoLate ausente");
		expect(["voting", "revealable"]).toContain(betoSala.phase);
		expect(betoSala.votes).toEqual({ [betoId]: "5" });
		for (const p of betoSala.players) {
			if (p.id === betoId) {
				expect(p.value).toBe("5");
			} else {
				expect(p.value, `players.value de ${p.nick} visto por BetoLate`).toBeNull();
			}
		}

		const carolSala = carol.ws.lastRoomState?.payload.sala;
		if (!carolSala) throw new Error("room_state de CarolLate ausente");
		expect(["voting", "revealable"]).toContain(carolSala.phase);
		expect(carolSala.votes).toEqual({});
		for (const p of carolSala.players) {
			expect(p.value, `players.value de ${p.nick} visto por CarolLate`).toBeNull();
		}
		expect(carolSala.players.find((p) => p.id === hostId)?.hasVoted).toBe(true);
		expect(beto.playerId ?? ownPlayerId(beto)).toBe(betoId);

		for (const viewer of [host, beto, carol]) {
			expect(rawFramesContainUuid(viewer.ws.frames), `uuid no wire de ${viewer.nick}`).toBeNull();
			expect(viewer.ws.parseErrors, `parse errors de ${viewer.nick}`).toEqual([]);
			viewer.guard.assertClean();
		}
	} finally {
		host.guard.detach();
		beto.guard.detach();
		carol.guard.detach();
		await hostCtx.ctx.close();
		await betoCtx.ctx.close();
		await carolCtx.ctx.close();
	}
});
