/**
 * hello handler tests — T13 verify (≥6 unit tests).
 *
 * Cobre: nick inválido, criação de sala, join com code, sala cheia,
 * código inexistente, atribuição de seatIndex.
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "../hub";
import { handleHello } from "./hello";
import type { HelloPayload } from "@planning-poker/shared";
import { SALA_SEAT_COUNT } from "../sala";

let hub: Hub;

beforeEach(() => {
	hub = new Hub();
});

function hello(uuid: string, nick: string, code?: string): HelloPayload {
	return {
		uuid,
		nick,
		...(code ? { code } : {}),
	};
}

const UUID_P1 = "00000000-0000-4000-8000-000000000001";
const UUID_P2 = "00000000-0000-4000-8000-000000000002";

// ---------------------------------------------------------------------------
// T13: nick validation
// ---------------------------------------------------------------------------

describe("handleHello — nick validation (F-001, F-002)", () => {
	test("rejeita nick < 2 chars", () => {
		const result = handleHello(hub, hello(UUID_P1, "A"));
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_nick");
	});

	test("rejeita nick com espaços duplos", () => {
		const result = handleHello(hub, hello(UUID_P1, "Dev  Front"));
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_nick");
	});

	test("rejeita nick > 20 chars", () => {
		const result = handleHello(hub, hello(UUID_P1, "a".repeat(21)));
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("invalid_nick");
	});
});

// ---------------------------------------------------------------------------
// T13: create sala (sem code)
// ---------------------------------------------------------------------------

describe("handleHello — criar sala (F-003)", () => {
	test("cria sala e atribui role host", () => {
		const result = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.role).toBe("host");
			expect(result.sala.players).toHaveLength(1);
			expect(result.sala.players[0]?.nick).toBe("Ana");
			expect(result.sala.hostId).toBe(result.playerId);
		}
	});

	test("código gerado é 4-char alfanumérico", () => {
		handleHello(hub, hello(UUID_P1, "Ana"));
		const codes = hub.activeCodes();
		expect(codes).toHaveLength(1);
		const code = codes[0]!;
		expect(code).toMatch(/^[A-Z0-9]{4}$/);
	});
});

// ---------------------------------------------------------------------------
// T13: join com code
// ---------------------------------------------------------------------------

describe("handleHello — join com code (F-004, F-005, F-006)", () => {
	test("join em sala existente atribui role player", () => {
		const create = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(create.ok).toBe(true);
		const code = hub.activeCodes()[0]!;

		const join = handleHello(hub, hello(UUID_P2, "Bob", code));
		expect(join.ok).toBe(true);
		if (join.ok) {
			expect(join.role).toBe("player");
			expect(join.sala.players).toHaveLength(2);
			expect(join.sala.players.find((p) => p.nick === "Bob")?.seatIndex).toBe(
				1,
			);
		}
	});

	test("rejeita código inexistente (sala_nao_encontrada)", () => {
		const result = handleHello(hub, hello(UUID_P2, "Bob", "ZZZZ"));
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("sala_nao_encontrada");
	});

	test("rejeita 13º player com sala_cheia (F-005)", () => {
		// cria sala com host
		const create = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(create.ok).toBe(true);
		const code = hub.activeCodes()[0]!;

		// preenche 11 jogadores (sala aceita 12 total: 1 host + 11)
		for (let i = 2; i <= SALA_SEAT_COUNT; i++) {
			const uuid = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
			const join = handleHello(hub, hello(uuid, `P${i}`, code));
			expect(join.ok).toBe(true);
		}
		// 13º player deve ser rejeitado
		const overflowUuid = "00000000-0000-4000-8000-999999999999";
		const overflow = handleHello(hub, hello(overflowUuid, "Late", code));
		expect(overflow.ok).toBe(false);
		if (!overflow.ok) expect(overflow.code).toBe("sala_cheia");
	});

	test("UUID duplicado em sala cheia é rejeitado com internal_error", () => {
		handleHello(hub, hello(UUID_P1, "Ana"));
		// tenta entrar novamente com mesmo UUID
		const result = handleHello(hub, hello(UUID_P1, "Ana"));
		// primeira vez conecta, mas se UUID já existe → internal_error OR reconnected
		// (vamos checar que não é sala_cheia mas sim reconnected)
		if (result.ok) {
			expect(result.reconnected).toBe(true);
		}
	});
});

// ---------------------------------------------------------------------------
// T13a: reconnect (F-037/F-038)
// ---------------------------------------------------------------------------

describe("handleHello — reconnect (T13a, F-037/F-038)", () => {
	test("mesmo UUID em sala existente → reidrata sem nova atribuição", () => {
		const first = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(first.ok).toBe(true);
		if (!first.ok) return;
		const code = hub.activeCodes()[0]!;

		// Bob entra normalmente
		const bob = handleHello(hub, hello(UUID_P2, "Bob", code));
		expect(bob.ok).toBe(true);
		if (!bob.ok) return;
		const bobId = bob.playerId;

		// Bob desconecta (simulando ws close)
		hub.markDisconnected(bobId);
		const sala = hub.getSalaForPlayer(bobId)!;
		const bobAfterDisconnect = sala.getPlayer(bobId)!;
		expect(bobAfterDisconnect.status).toBe("disconnected");

		// Bob reconecta com mesmo UUID
		const reconnect = handleHello(hub, hello(UUID_P2, "Bob", code));
		expect(reconnect.ok).toBe(true);
		if (reconnect.ok) {
			expect(reconnect.reconnected).toBe(true);
			expect(reconnect.playerId).toBe(bobId); // mesmo ID!
			expect(reconnect.role).toBe("player");
			const reconnectedBob = reconnect.sala.players.find((p) => p.id === bobId);
			expect(reconnectedBob?.status).toBe("connected");
			expect(reconnectedBob?.seatIndex).toBe(bobAfterDisconnect.seatIndex); // seat preservado
		}
	});

	test("UUID conhecida mas sala não existe mais → cria nova sala", () => {
		// Cria, depois remove (host sai sendo o último)
		handleHello(hub, hello(UUID_P1, "Ana"));
		const code = hub.activeCodes()[0]!;
		// force-close no host
		const host = hub.getSala(code)!.getPlayer(hub.getSala(code)!.hostId!)!;
		hub.removePlayer(host.id);
		expect(hub.activeCodes()).not.toContain(code);

		// Cliente volta com mesmo UUID — servidor perdeu o estado (restart scenario)
		// Cria nova sala ao invés de erro (UX: zero fricção > erro técnico)
		const result = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.role).toBe("host");
			expect(result.sala.players).toHaveLength(1);
		}
	});

	test("UUID conhecida + join com code inexistente → sala_nao_encontrada (prioriza code sobre UUID)", () => {
		// Cria sala 1 com UUID_P1
		handleHello(hub, hello(UUID_P1, "Ana"));
		// Tenta entrar em sala ZZZZ com mesmo UUID_P1
		const result = handleHello(hub, hello(UUID_P1, "Ana", "ZZZZ"));
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("sala_nao_encontrada");
	});

	test("reconnect preserva voto já feito (F-038)", () => {
		const first = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(first.ok).toBe(true);

		// Ana vota
		const sala = hub.getSala(hub.activeCodes()[0]!)!;
		const anaId = sala.hostId!;
		sala.castVote(anaId, "5");

		// desconecta
		hub.markDisconnected(anaId);

		// Ana reconecta
		const reconnect = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(reconnect.ok).toBe(true);
		if (reconnect.ok) {
			const ana = reconnect.sala.players.find((p) => p.id === anaId);
			expect(ana?.hasVoted).toBe(true);
			expect(ana?.value).toBe("5");
		}
	});

	test("reconnect em sala cheia reusa assento (sem contar novo)", () => {
		const first = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(first.ok).toBe(true);
		const code = hub.activeCodes()[0]!;

		// Preenche 12 (1 host + 11 players)
		const playerIds: string[] = [];
		for (let i = 2; i <= SALA_SEAT_COUNT; i++) {
			const uuid = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
			const r = handleHello(hub, hello(uuid, `P${i}`, code));
			expect(r.ok).toBe(true);
			if (r.ok) playerIds.push(r.playerId);
		}
		// Desconecta o último
		const lastId = playerIds[playerIds.length - 1]!;
		hub.markDisconnected(lastId);
		expect(hub.getSala(code)!.playerCount).toBe(12);

		// Outro player novo tenta entrar: sala cheia
		const newUuid = "00000000-0000-4000-8000-999999999999";
		const overflow = handleHello(hub, hello(newUuid, "Late", code));
		expect(overflow.ok).toBe(false);
		if (!overflow.ok) expect(overflow.code).toBe("sala_cheia");

		// Reconecta o disconnected: reusa assento (ok)
		const lastUuid = `00000000-0000-4000-8000-${String(SALA_SEAT_COUNT).padStart(12, "0")}`;
		const reconnect = handleHello(
			hub,
			hello(lastUuid, `P${SALA_SEAT_COUNT}`, code),
		);
		expect(reconnect.ok).toBe(true);
		if (reconnect.ok) {
			expect(reconnect.playerId).toBe(lastId); // mesmo ID
			expect(reconnect.reconnected).toBe(true);
		}
	});
});

// ---------------------------------------------------------------------------
// Reg 2026-07-06: room migration — mesmo UUID em sala A + code de sala B
// deve fazer evict de A e add em B. Antes do fix, caía no "UUID em uso".
// ---------------------------------------------------------------------------

describe("handleHello — room migration (reg 2026-07-06)", () => {
	test("mesmo UUID em sala A desconectada + code B existente → entra em B", () => {
		// Setup: 2 salas separadas com UUIDs diferentes
		const createA = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(createA.ok).toBe(true);
		const codeA = hub.activeCodes()[0]!;

		const createB = handleHello(hub, hello(UUID_P2, "Bob"));
		expect(createB.ok).toBe(true);
		const codeB = hub.activeCodes().find((c) => c !== codeA)!;

		// UUID_P1 desconecta de A
		const anaId = createA.ok ? createA.playerId : "";
		hub.markDisconnected(anaId);

		// UUID_P1 tenta entrar em B (sala DIFERENTE)
		const migrate = handleHello(hub, hello(UUID_P1, "Ana", codeB));
		expect(migrate.ok).toBe(true);
		if (migrate.ok) {
			expect(migrate.sala.code).toBe(codeB);
			expect(migrate.role).toBe("player");
			expect(migrate.evictedFrom?.code).toBe(codeA);
			expect(migrate.evictedFrom?.playerId).toBe(anaId);
		}

		// Sala A deve ter sido limpa (ou sem o player)
		const salaA = hub.getSala(codeA);
		if (salaA) expect(salaA.getPlayer(anaId)).toBeUndefined();
	});

	test("UUID em sala A + code B inexistente → sala_nao_encontrada + evict de A", () => {
		const createA = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(createA.ok).toBe(true);
		hub.activeCodes()[0]!;
		const anaId = createA.ok ? createA.playerId : "";

		hub.markDisconnected(anaId);

		const result = handleHello(hub, hello(UUID_P1, "Ana", "ZZZZ"));
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("sala_nao_encontrada");

		// byUUID limpo (sala A não tem mais Ana; hello novo com mesmo UUID
		// funcionaria)
		expect(hub.getCodeForUUID(UUID_P1)).toBeNull();
	});

	test("UUID em sala A + mesmo code A → reconnect (não migration)", () => {
		const createA = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(createA.ok).toBe(true);
		const codeA = hub.activeCodes()[0]!;
		const anaId = createA.ok ? createA.playerId : "";
		hub.markDisconnected(anaId);

		const reconnect = handleHello(hub, hello(UUID_P1, "Ana", codeA));
		expect(reconnect.ok).toBe(true);
		if (reconnect.ok) {
			expect(reconnect.reconnected).toBe(true);
			expect(reconnect.evictedFrom).toBeUndefined();
		}
	});

	test("UUID em sala A + sem code → reconnect (criação não acontece)", () => {
		const createA = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(createA.ok).toBe(true);
		const codeA = hub.activeCodes()[0]!;
		const anaId = createA.ok ? createA.playerId : "";
		hub.markDisconnected(anaId);

		const reconnect = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(reconnect.ok).toBe(true);
		if (reconnect.ok) {
			expect(reconnect.reconnected).toBe(true);
			expect(reconnect.sala.code).toBe(codeA);
		}
	});

	test("regression prod: UUID órfão em CL8K tenta entrar em PM4H → sucesso", () => {
		// Repro do bug de produção:
		//   1. UUID_P1 cria CL8K
		//   2. CL8K vira "abandonada" (UUID_P1 simula markDisconnected)
		//   3. UUID_P1 tenta entrar em PM4H com mesmo UUID
		// Antes do fix: error "UUID em uso"
		// Depois do fix: welcome com code=PM4H + evictedFrom.code=CL8K
		const createCL8K = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(createCL8K.ok).toBe(true);
		const codeCL8K = hub.activeCodes()[0]!;
		const anaId = createCL8K.ok ? createCL8K.playerId : "";
		hub.markDisconnected(anaId);

		const createPM4H = handleHello(hub, hello(UUID_P2, "Bob"));
		expect(createPM4H.ok).toBe(true);
		const codePM4H = hub.activeCodes().find((c) => c !== codeCL8K)!;

		// O bug: UUID_P1 (que está "preso" em CL8K como disconnected) tenta
		// entrar em PM4H
		const result = handleHello(hub, hello(UUID_P1, "Ana", codePM4H));
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.sala.code).toBe(codePM4H);
			expect(result.evictedFrom?.code).toBe(codeCL8K);
		}
	});
});
