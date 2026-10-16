import { describe, expect, test } from "bun:test";
import type { Player } from "@planning-poker/shared";
import { Sala } from "./sala";

function player(id: string, role: Player["role"], seatIndex: number): Player {
	return { id, uuid: `00000000-0000-4000-8000-${String(seatIndex + 2).padStart(12, "0")}`, nick: id, role, seatIndex, hasVoted: false, value: null, status: "connected", joinedAt: seatIndex + 2 };
}
function setup() {
	const sala = new Sala("AB12", player("ana", "host", 0));
	sala.addPlayer(player("beto", "player", 1));
	sala.addPlayer(player("olho", "spectator", -1));
	return sala;
}
describe("snapshot privado", () => {
	test("omite UUID em todas as fases e visões", () => {
		const sala = setup();
		for (const action of [() => {}, () => sala.castVote("ana", "8"), () => sala.castVote("beto", "5"), () => sala.reveal("beto"), () => sala.startNewRound()]) {
			action();
			for (const viewer of [undefined, "ana", "beto", "olho", "desconhecido"]) {
				for (const item of sala.toState(viewer).players) expect(Object.hasOwn(item, "uuid")).toBe(false);
			}
		}
	});
	test("mantém somente o próprio voto sem mutar domínio ou snapshots", () => {
		const sala = setup();
		sala.castVote("ana", "8");
		const own = sala.toState("ana");
		expect(own.votes).toEqual({ ana: "8" });
		expect(own.players.find((p) => p.id === "ana")?.value).toBe("8");
		for (const viewer of [undefined, "beto", "olho", "desconhecido"]) {
			const state = sala.toState(viewer);
			expect(state.votes).toEqual({});
			expect(state.players.find((p) => p.id === "ana")).toMatchObject({ value: null, hasVoted: true });
		}
		expect(sala.getPlayer("ana")?.value).toBe("8");
		expect(own.votes).toEqual({ ana: "8" });
	});
	test("revealable não revela; jogador comum revela e nova rodada limpa", () => {
		const sala = setup();
		sala.castVote("ana", "8");
		sala.castVote("beto", "5");
		expect(sala.phase).toBe("revealable");
		expect(sala.toState("beto").votes).toEqual({ beto: "5" });
		expect(sala.toState("beto").players.find((p) => p.id === "ana")?.value).toBeNull();
		sala.reveal("beto");
		for (const viewer of [undefined, "ana", "beto", "olho"]) {
			expect(sala.toState(viewer).votes).toEqual({ ana: "8", beto: "5" });
			expect(sala.toState(viewer).players.find((p) => p.id === "ana")?.value).toBe("8");
		}
		sala.startNewRound();
		expect(sala.toState("ana").votes).toEqual({});
		expect(sala.toState("ana").players.every((p) => p.value === null && !p.hasVoted)).toBe(true);
	});
});
