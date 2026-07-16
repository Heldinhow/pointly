/**
 * cast_vote handler tests — T14 verify (≥4 unit tests).
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "../hub";
import { handleCastVote } from "./cast-vote";
import { handleHello } from "./hello";
import type { CastVotePayload } from "@planning-poker/shared";

let hub: Hub;

beforeEach(() => {
	hub = new Hub();
});

// Helper para criar jogador
function addPlayer(uuid: string, nick: string): { id: string; code: string } {
	const create = handleHello(hub, { uuid, nick });
	if (!create.ok) throw new Error("expected create ok");
	const code = hub.activeCodes()[0]!;
	return { id: create.playerId, code };
}

// ---------------------------------------------------------------------------
// T14: vote normal
// ---------------------------------------------------------------------------

describe("handleCastVote — voto normal (F-009, F-013)", () => {
	test("registra voto e marca hasVoted=true", () => {
		const { id, code } = addPlayer(
			"00000000-0000-4000-8000-000000000001",
			"Ana",
		);
		const payload: CastVotePayload = { value: "5" };
		const result = handleCastVote(hub, id, payload);
		expect(result.ok).toBe(true);
		const sala = hub.getSala(code)!;
		const player = sala.getPlayer(id)!;
		expect(player.hasVoted).toBe(true);
		expect(player.value).toBe("5");
	});

	test("primeiro voto: isFirstVoteOfRound=true e inicia timer", () => {
		const { id, code } = addPlayer(
			"00000000-0000-4000-8000-000000000001",
			"Ana",
		);
		const result = handleCastVote(hub, id, { value: "5" });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.isFirstVoteOfRound).toBe(true);
		const sala = hub.getSala(code)!;
		expect(sala.phase).not.toBe("idle");
		expect(sala.timer).toBe(60);
	});
});

// ---------------------------------------------------------------------------
// T14: idempotência / change vote (F-011)
// ---------------------------------------------------------------------------

describe("handleCastVote — change vote idempotente (F-011)", () => {
	test("trocar voto atualiza in-place", () => {
		const { id, code } = addPlayer(
			"00000000-0000-4000-8000-000000000001",
			"Ana",
		);
		handleCastVote(hub, id, { value: "5" });
		const result = handleCastVote(hub, id, { value: "8" });
		expect(result.ok).toBe(true);
		const sala = hub.getSala(code)!;
		const player = sala.getPlayer(id)!;
		expect(player.value).toBe("8");
	});

	test("trocar voto NÃO é 'first vote of round'", () => {
		const { id } = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		handleCastVote(hub, id, { value: "5" });
		const result = handleCastVote(hub, id, { value: "8" });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.isFirstVoteOfRound).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// T14: rejeições (F-012, un-vote)
// ---------------------------------------------------------------------------

describe("handleCastVote — rejeições", () => {
	test("rejeita un-vote (invalid_vote) — value=null", () => {
		const { id } = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		// null é aceito pelo schema (change-to-nil), mas servidor rejeita
		const result = handleCastVote(hub, id, { value: null });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_vote");
	});

	test("rejeita valor fora do deck (invalid_vote)", () => {
		const { id } = addPlayer("00000000-0000-4000-8000-000000000001", "Ana");
		// TS força o cast; Zod no boundary rejeita, mas o handler é defensivo
		const result = handleCastVote(hub, id, {
			value: "42",
		} as unknown as CastVotePayload);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_vote");
	});

	test("permite vote em fase revealed e atualiza o voto", () => {
		const { id, code } = addPlayer(
			"00000000-0000-4000-8000-000000000001",
			"Ana",
		);
		// força reveal
		const sala = hub.getSala(code)!;
		sala.castVote(id, "5");
		sala.reveal(id);
		expect(sala.phase).toBe("revealed");
		// tentar votar pós-reveal (valor diferente)
		const result = handleCastVote(hub, id, { value: "8" });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.changed).toBe(true); // EVR-04
		expect(sala.getPlayer(id)!.value).toBe("8");
	});

	test("rejeita vote de player não em sala alguma (invalid_vote)", () => {
		const result = handleCastVote(hub, "ghost", { value: "5" });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_vote");
	});
});

// ---------------------------------------------------------------------------
// EVR-14: idempotência pós-reveal (clicou na mesma carta duas vezes)
// ---------------------------------------------------------------------------

describe("handleCastVote — pós-reveal idempotente (EVR-14)", () => {
	test("cast_vote idempotente pós-reveal retorna changed=false sem mutação", () => {
		const { id, code } = addPlayer(
			"00000000-0000-4000-8000-000000000001",
			"Ana",
		);
		const sala = hub.getSala(code)!;
		sala.castVote(id, "5");
		sala.reveal(id);
		expect(sala.phase).toBe("revealed");
		// Act: Ana clica na MESMA carta após o reveal
		const result = handleCastVote(hub, id, { value: "5" });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.changed).toBe(false);
		// Voto permanece "5" sem mutação adicional
		expect(sala.getPlayer(id)!.value).toBe("5");
	});
});
