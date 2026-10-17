import { expect, test } from "@playwright/test";
import {
	addStory,
	createRoom,
	extractCode,
	joinWithInviteLink,
	joinWithManualCode,
	newPlayer,
	ownPlayerId,
	readInviteUrl,
	vote,
	wirePlayer,
} from "./helpers/room";
import { rawFramesContainUuid } from "./helpers/ws-capture";

test("fluxo completo com sigilo pré-reveal e nova rodada", async ({ browser }, testInfo) => {
	const anaCtx = await newPlayer(browser, testInfo);
	const betoCtx = await newPlayer(browser, testInfo);
	const carolCtx = await newPlayer(browser, testInfo);
	const ana = wirePlayer(anaCtx.page, "Ana");
	const beto = wirePlayer(betoCtx.page, "Beto");
	const carol = wirePlayer(carolCtx.page, "Carol");

	try {
		const code = await createRoom(ana, "AnaSegura");

		const deckCards = ana.page.locator('button[data-testid^="deck-card-"]');
		await expect(deckCards.first()).toBeVisible();
		for (const value of ["5", "8"]) {
			await expect(ana.page.locator(`button[data-testid="deck-card-${value}"]`)).toBeDisabled();
		}

		await addStory(ana, "Checkout PIX");
		await addStory(ana, "Extrato PDF");
		await expect(ana.page.locator('[data-testid="arena-story-title"]')).toContainText(
			"Checkout PIX",
		);
		for (const value of ["5", "8"]) {
			await expect(ana.page.locator(`button[data-testid="deck-card-${value}"]`)).toBeEnabled();
		}

		const inviteUrl = await readInviteUrl(ana, code);
		expect(extractCode(inviteUrl)).toBe(code);

		await joinWithManualCode(beto, code, "BetoSeguro");
		await joinWithInviteLink(carol, inviteUrl, "CarolEspect", { spectate: true });
		await expect(carol.page.locator('[data-testid="spectators-line"]')).toBeVisible();
		await expect(carol.page.locator('[data-testid="first-story-action"]')).toHaveCount(0);

		for (const value of ["0", "5", "8"]) {
			await expect(carol.page.locator(`button[data-testid="deck-card-${value}"]`)).toBeDisabled();
		}
		await expect(carol.page.locator('[data-testid="deck-selection"]')).toContainText(
			/acompanham|assistindo/i,
		);

		await vote(ana, "8");
		await vote(beto, "5");

		await expect
			.poll(() => {
				const sala = ana.ws.lastRoomState?.payload.sala;
				if (!sala) return "";
				return sala.players
					.filter((p) => p.role !== "spectator" && p.status === "connected")
					.map((p) => `${p.nick}:${p.hasVoted}`)
					.sort()
					.join(",");
			})
			.toBe("AnaSegura:true,BetoSeguro:true");

		const anaId = ownPlayerId(ana);
		const betoId = ownPlayerId(beto);

		for (const [viewer, selfId, selfVote, otherNick] of [
			[ana, anaId, "8", "BetoSeguro"],
			[beto, betoId, "5", "AnaSegura"],
		] as const) {
			const snapshots = viewer.ws.roomStates.filter((s) =>
				["voting", "revealable"].includes(s.payload.sala.phase),
			);
			expect(snapshots.length).toBeGreaterThan(0);
			const voted = snapshots.filter((s) =>
				s.payload.sala.players.some((p) => p.nick === otherNick && p.hasVoted),
			);
			expect(voted.length).toBeGreaterThan(0);
			const bothVoted = voted.filter((s) =>
				s.payload.sala.players.some((p) => p.nick === viewer.nick && p.hasVoted),
			);
			expect(bothVoted.length).toBeGreaterThan(0);
			for (const snap of voted) {
				const { votes, players } = snap.payload.sala;
				const self = players.find((p) => p.nick === viewer.nick);
				const other = players.find((p) => p.nick === otherNick);
				for (const p of players) {
					if (p.id === selfId) continue;
					expect(p.value, `players.value de ${p.nick} visto por ${viewer.nick}`).toBeNull();
				}
				for (const p of players.filter((p) => p.role === "spectator")) {
					expect(p.hasVoted, `espectador ${p.nick} com hasVoted`).toBe(false);
					expect(p.seatIndex, `espectador ${p.nick} com assento`).toBe(-1);
				}
				expect(
					Object.keys(votes).filter((id) => id !== selfId),
					`vazamento no canal votes visto por ${viewer.nick}`,
				).toEqual([]);
				expect(other?.hasVoted).toBe(true);
				expect(other?.value, `canal players.value alheio visto por ${viewer.nick}`).toBeNull();
				if (self?.hasVoted) {
					expect(votes, `canal votes visto por ${viewer.nick}`).toEqual({ [selfId]: selfVote });
					expect(self?.value, `canal players.value próprio (${viewer.nick})`).toBe(selfVote);
				} else {
					expect(votes, `voto antecipado ou de espectador (${viewer.nick})`).toEqual({});
					expect(self?.value).toBeNull();
				}
			}
			expect(rawFramesContainUuid(viewer.ws.frames), `uuid no wire de ${viewer.nick}`).toBeNull();
			expect(viewer.ws.parseErrors, `parse errors de ${viewer.nick}`).toEqual([]);
		}
		expect(rawFramesContainUuid(carol.ws.frames), "uuid no wire da espectadora").toBeNull();
		expect(carol.ws.parseErrors).toEqual([]);

		const carolSelf = carol.ws.lastRoomState?.payload.sala.players.find(
			(p) => p.nick === "CarolEspect",
		);
		expect(carolSelf?.role).toBe("spectator");
		expect(carolSelf?.seatIndex).toBe(-1);
		expect(carolSelf?.hasVoted).toBe(false);

		const carolSala = carol.ws.lastRoomState?.payload.sala;
		if (!carolSala) throw new Error("room_state da espectadora ausente");
		expect(carolSala.votes).toEqual({});
		for (const p of carolSala.players) {
			expect(p.value, `players.value de ${p.nick} visto pela espectadora`).toBeNull();
		}

		await expect(beto.page.locator('[data-testid="reveal-button"]')).toBeEnabled();
		await beto.page.locator('[data-testid="reveal-button"]').click();
		await expect(ana.page.locator('[data-testid="round-label"]')).toContainText(/evelad/i);
		await expect
			.poll(() => ana.ws.lastRoomState?.payload.sala.phase)
			.toBe("revealed");
		await expect(ana.page.locator('[data-testid="stats-result-value"]')).toContainText("6.5");
		await testInfo.attach("revealed-round", { body: await ana.page.screenshot({ fullPage: true }), contentType: "image/png" });

		await expect
			.poll(() => {
				const votes = ana.ws.lastRoomState?.payload.sala.votes ?? {};
				return [votes[anaId], votes[betoId]].join(",");
			})
			.toBe("8,5");

		await vote(ana, "5");
		await expect
			.poll(() => ana.ws.lastRoomState?.payload.sala.phase)
			.toBe("revealed");
		await expect
			.poll(() => {
				const votes = ana.ws.lastRoomState?.payload.sala.votes ?? {};
				return [votes[anaId], votes[betoId]].join(",");
			})
			.toBe("5,5");
		await expect(ana.page.locator('[data-testid="stats-result-value"]')).toContainText("5");

		const roundBefore =
			ana.ws.lastRoomState?.payload.sala.round ?? 1;
		await ana.page.locator('[data-testid="new-round-button"]').click();
		await expect(ana.page.locator('[data-testid="new-round-hint"]')).toBeVisible();
		expect(ana.ws.lastRoomState?.payload.sala.phase).toBe("revealed");

		await ana.page.locator('[data-testid="new-round-button"]').click();
		await expect
			.poll(() => ana.ws.lastRoomState?.payload.sala.phase)
			.toBe("voting");
		await expect
			.poll(() => ana.ws.lastRoomState?.payload.sala.round)
			.toBe(roundBefore + 1);
		await expect
			.poll(() => Object.keys(ana.ws.lastRoomState?.payload.sala.votes ?? {}).length)
			.toBe(0);
		for (const value of ["5", "8"]) {
			await expect(ana.page.locator(`button[data-testid="deck-card-${value}"]`)).toHaveAttribute(
				"aria-pressed",
				"false",
			);
		}
		await expect(ana.page.locator('[data-testid="arena-story-title"]')).toContainText(
			"Extrato PDF",
		);

		for (const viewer of [ana, beto, carol]) {
			expect(rawFramesContainUuid(viewer.ws.frames)).toBeNull();
			expect(viewer.ws.parseErrors).toEqual([]);
		}
		ana.guard.assertClean();
		beto.guard.assertClean();
		carol.guard.assertClean();
	} finally {
		ana.guard.detach();
		beto.guard.detach();
		carol.guard.detach();
		await anaCtx.ctx.close();
		await betoCtx.ctx.close();
		await carolCtx.ctx.close();
	}
});
