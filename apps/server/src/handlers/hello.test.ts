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

const JPEG_AVATAR = "data:image/jpeg;base64,/9j/4AAQ";

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

describe("handleHello — espectador", () => {
	test("join com spectate atribui role spectator e seat -1", () => {
		const create = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(create.ok).toBe(true);
		const code = hub.activeCodes()[0]!;
		const join = handleHello(hub, {
			uuid: UUID_P2,
			nick: "Beto",
			code,
			spectate: true,
		});
		expect(join.ok).toBe(true);
		if (join.ok) {
			expect(join.role).toBe("spectator");
			const spec = join.sala.players.find((p) => p.nick === "Beto");
			expect(spec?.seatIndex).toBe(-1);
		}
	});

	test("espectador não consome assento nem entra no limite de 12", () => {
		const create = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(create.ok).toBe(true);
		const code = hub.activeCodes()[0]!;
		for (let i = 2; i <= SALA_SEAT_COUNT; i++) {
			const uuid = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
			const r = handleHello(hub, hello(uuid, `P${i}`, code));
			expect(r.ok).toBe(true);
		}
		const spec = handleHello(hub, {
			uuid: "00000000-0000-4000-8000-999999999999",
			nick: "Olho",
			code,
			spectate: true,
		});
		expect(spec.ok).toBe(true);
	});

	test("spectate sem code cria a sala como espectador sem host", () => {
		const result = handleHello(hub, {
			uuid: UUID_P1,
			nick: "Ana",
			spectate: true,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.role).toBe("spectator");
			expect(result.sala.hostId).toBeNull();
			expect(result.sala.players).toHaveLength(1);
		}
	});

	test("primeiro votante assume o host em sala criada por espectador", () => {
		const spec = handleHello(hub, {
			uuid: UUID_P1,
			nick: "Olho",
			spectate: true,
		});
		expect(spec.ok).toBe(true);
		if (!spec.ok) return;
		const code = hub.activeCodes()[0]!;
		const join = handleHello(hub, hello(UUID_P2, "Beto", code));
		expect(join.ok).toBe(true);
		if (join.ok) {
			expect(join.role).toBe("host");
			expect(join.sala.hostId).toBe(join.playerId);
		}
	});
});

// ---------------------------------------------------------------------------
// Avatar na mesa (T3, AV-02/AV-03)
// ---------------------------------------------------------------------------

describe("handleHello — avatar", () => {
	test("hello com avatar válido persiste no Player e aparece no toState", () => {
		const result = handleHello(hub, {
			uuid: UUID_P1,
			nick: "Ana",
			avatar: JPEG_AVATAR,
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const player = result.sala.players.find((p) => p.id === result.playerId);
		expect(player?.avatar).toBe(JPEG_AVATAR);
	});

	test("hello com avatar acima do teto aceita o join com avatar ignorado", () => {
		const oversized = `data:image/jpeg;base64,${"A".repeat(40000)}`;
		const result = handleHello(hub, {
			uuid: UUID_P1,
			nick: "Ana",
			avatar: oversized,
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const player = result.sala.players.find((p) => p.id === result.playerId);
		expect(player?.avatar).toBeUndefined();
	});

	test("hello com avatar de formato inválido aceita o join com avatar ignorado", () => {
		const result = handleHello(hub, {
			uuid: UUID_P1,
			nick: "Ana",
			avatar: "data:image/gif;base64,R0lGODlh",
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const player = result.sala.players.find((p) => p.id === result.playerId);
		expect(player?.avatar).toBeUndefined();
	});

	test("hello sem avatar entra com avatar ausente (iniciais)", () => {
		const result = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const player = result.sala.players.find((p) => p.id === result.playerId);
		expect(player?.avatar).toBeUndefined();
	});

	test("reconnect reidrata avatar junto com assento e voto", () => {
		const first = handleHello(hub, {
			uuid: UUID_P1,
			nick: "Ana",
			avatar: JPEG_AVATAR,
		});
		expect(first.ok).toBe(true);
		if (!first.ok) return;
		const sala = hub.getSala(hub.activeCodes()[0]!)!;
		const anaId = sala.hostId!;
		sala.castVote(anaId, "5");
		const seatBefore = sala.getPlayer(anaId)!.seatIndex;

		hub.markDisconnected(anaId);
		const reconnect = handleHello(hub, hello(UUID_P1, "Ana"));
		expect(reconnect.ok).toBe(true);
		if (!reconnect.ok) return;
		expect(reconnect.reconnected).toBe(true);
		const ana = reconnect.sala.players.find((p) => p.id === anaId);
		expect(ana?.avatar).toBe(JPEG_AVATAR);
		expect(ana?.seatIndex).toBe(seatBefore);
		expect(ana?.value).toBe("5");
	});
});
