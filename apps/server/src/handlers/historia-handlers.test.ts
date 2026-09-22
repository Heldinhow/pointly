/**
 * Pauta handlers unit tests — issue #163 (parent #160).
 *
 * Handlers finos: tradução payload validado → domínio, sem regra de
 * negócio. Cobre os 5 eventos (add/update/move/remove/select):
 * sucesso, role_denied (espectador), invalid_phase (fase), pauta_cheia
 * (51ª), historia_nao_encontrada (id ausente / caller fora da sala) e
 * título vazio (erro legível, sem derrubar — via chamada direta).
 *
 * Run: `bun --filter server test`
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "../hub";
import { handleHello } from "./hello";
import { handleHistoriaAdd } from "./historia-add";
import { handleHistoriaMove } from "./historia-move";
import { handleHistoriaRemove } from "./historia-remove";
import { handleHistoriaSelect } from "./historia-select";
import { handleHistoriaUpdate } from "./historia-update";

const UUID_P1 = "00000000-0000-4000-8000-000000000001";
const UUID_P2 = "00000000-0000-4000-8000-000000000002";
const UUID_SPEC = "00000000-0000-4000-8000-000000000009";

let hub: Hub;

beforeEach(() => {
	hub = new Hub();
});

function createHost(nick = "Ana"): { playerId: string; code: string } {
	const result = handleHello(hub, { uuid: UUID_P1, nick });
	expect(result.ok).toBe(true);
	if (!result.ok) throw new Error("setup falhou");
	return { playerId: result.playerId, code: result.sala.code };
}

function addSpectator(code: string): string {
	const result = handleHello(hub, {
		uuid: UUID_SPEC,
		nick: "Olho",
		code,
		spectate: true,
	});
	expect(result.ok).toBe(true);
	if (!result.ok) throw new Error("setup espectador falhou");
	return result.playerId;
}

// ---------------------------------------------------------------------------
// historia_add
// ---------------------------------------------------------------------------

describe("handleHistoriaAdd", () => {
	test("válido cria no fim e auto-seleciona a primeira", () => {
		const { playerId, code } = createHost();
		const outcome = handleHistoriaAdd(hub, playerId, { titulo: "H1" });
		expect(outcome.ok).toBe(true);
		if (!outcome.ok) throw new Error("expected ok");
		expect(outcome.historia.titulo).toBe("H1");
		expect(outcome.historia.ordem).toBe(0);
		const sala = hub.getSala(code)!;
		expect(sala.pauta).toHaveLength(1);
		expect(sala.historiaAtualId).toBe(outcome.historia.id);
	});

	test("espectador recebe role_denied", () => {
		const { code } = createHost();
		const specId = addSpectator(code);
		const outcome = handleHistoriaAdd(hub, specId, { titulo: "hack" });
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("role_denied");
	});

	test("51ª recebe pauta_cheia", () => {
		const { playerId } = createHost();
		for (let i = 0; i < 50; i++) {
			const r = handleHistoriaAdd(hub, playerId, { titulo: `H${i}` });
			expect(r.ok).toBe(true);
		}
		const outcome = handleHistoriaAdd(hub, playerId, { titulo: "H50" });
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("pauta_cheia");
	});

	test("caller fora da sala recebe historia_nao_encontrada", () => {
		const outcome = handleHistoriaAdd(hub, "p_fantasma", { titulo: "H" });
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("historia_nao_encontrada");
	});

	test("título vazio (chamada direta) retorna erro legível sem lançar", () => {
		const { playerId } = createHost();
		const outcome = handleHistoriaAdd(hub, playerId, { titulo: "" });
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(typeof outcome.message).toBe("string");
		expect(outcome.message.length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// historia_update
// ---------------------------------------------------------------------------

describe("handleHistoriaUpdate", () => {
	test("válido edita título last-write-wins", () => {
		const { playerId } = createHost();
		const created = handleHistoriaAdd(hub, playerId, { titulo: "Antes" });
		expect(created.ok).toBe(true);
		if (!created.ok) throw new Error("setup falhou");
		const outcome = handleHistoriaUpdate(hub, playerId, {
			id: created.historia.id,
			titulo: "Depois",
		});
		expect(outcome.ok).toBe(true);
		if (!outcome.ok) throw new Error("expected ok");
		expect(outcome.historia.titulo).toBe("Depois");
	});

	test("criterio null limpa o critério", () => {
		const { playerId, code } = createHost();
		const created = handleHistoriaAdd(hub, playerId, {
			titulo: "T",
			criterio: "c1",
		});
		expect(created.ok).toBe(true);
		if (!created.ok) throw new Error("setup falhou");
		const outcome = handleHistoriaUpdate(hub, playerId, {
			id: created.historia.id,
			criterio: null,
		});
		expect(outcome.ok).toBe(true);
		expect(hub.getSala(code)!.getHistoria(created.historia.id)!.criterio).toBeUndefined();
	});

	test("espectador recebe role_denied", () => {
		const { playerId, code } = createHost();
		const created = handleHistoriaAdd(hub, playerId, { titulo: "T" });
		if (!created.ok) throw new Error("setup falhou");
		const specId = addSpectator(code);
		const outcome = handleHistoriaUpdate(hub, specId, {
			id: created.historia.id,
			titulo: "hack",
		});
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("role_denied");
	});

	test("id ausente recebe historia_nao_encontrada", () => {
		const { playerId } = createHost();
		const outcome = handleHistoriaUpdate(hub, playerId, {
			id: "h_fantasma",
			titulo: "X",
		});
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("historia_nao_encontrada");
	});
});

// ---------------------------------------------------------------------------
// historia_move
// ---------------------------------------------------------------------------

describe("handleHistoriaMove", () => {
	test("válido reordena e reindexa", () => {
		const { playerId, code } = createHost();
		const h1 = handleHistoriaAdd(hub, playerId, { titulo: "H1" });
		handleHistoriaAdd(hub, playerId, { titulo: "H2" });
		const h3 = handleHistoriaAdd(hub, playerId, { titulo: "H3" });
		if (!h1.ok || !h3.ok) throw new Error("setup falhou");
		const outcome = handleHistoriaMove(hub, playerId, {
			id: h3.historia.id,
			toIndex: 0,
		});
		expect(outcome.ok).toBe(true);
		if (!outcome.ok) throw new Error("expected ok");
		expect(outcome.pauta[0]!.id).toBe(h3.historia.id);
		expect(hub.getSala(code)!.pauta.map((h) => h.ordem)).toEqual([0, 1, 2]);
	});

	test("mover a ativa em voting recebe invalid_phase", () => {
		const { playerId } = createHost();
		// segundo votante para phase ficar em voting (não revealable)
		const bob = handleHello(hub, {
			uuid: UUID_P2,
			nick: "Bob",
			code: hub.activeCodes()[0]!,
		});
		if (!bob.ok) throw new Error("setup falhou");
		const h1 = handleHistoriaAdd(hub, playerId, { titulo: "H1" });
		handleHistoriaAdd(hub, playerId, { titulo: "H2" });
		if (!h1.ok) throw new Error("setup falhou");
		hub.getSala(hub.activeCodes()[0]!)!.castVote(playerId, "5");
		expect(hub.getSala(hub.activeCodes()[0]!)!.phase).toBe("voting");
		const outcome = handleHistoriaMove(hub, playerId, {
			id: h1.historia.id,
			toIndex: 1,
		});
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("invalid_phase");
	});

	test("espectador recebe role_denied", () => {
		const { playerId, code } = createHost();
		const h1 = handleHistoriaAdd(hub, playerId, { titulo: "H1" });
		handleHistoriaAdd(hub, playerId, { titulo: "H2" });
		if (!h1.ok) throw new Error("setup falhou");
		const specId = addSpectator(code);
		const outcome = handleHistoriaMove(hub, specId, {
			id: h1.historia.id,
			toIndex: 1,
		});
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("role_denied");
	});
});

// ---------------------------------------------------------------------------
// historia_remove
// ---------------------------------------------------------------------------

describe("handleHistoriaRemove", () => {
	test("válido remove e reindexa", () => {
		const { playerId, code } = createHost();
		const h1 = handleHistoriaAdd(hub, playerId, { titulo: "H1" });
		const h2 = handleHistoriaAdd(hub, playerId, { titulo: "H2" });
		if (!h1.ok || !h2.ok) throw new Error("setup falhou");
		// tira H1 da ativa para remover sem bloqueio de fase
		expect(handleHistoriaSelect(hub, playerId, { historiaId: h2.historia.id }).ok).toBe(true);
		const outcome = handleHistoriaRemove(hub, playerId, { id: h1.historia.id });
		expect(outcome.ok).toBe(true);
		expect(hub.getSala(code)!.pauta.map((h) => h.id)).toEqual([h2.historia.id]);
		expect(hub.getSala(code)!.pauta[0]!.ordem).toBe(0);
	});

	test("apagar a ativa em voting recebe invalid_phase", () => {
		const { playerId } = createHost();
		const bob = handleHello(hub, {
			uuid: UUID_P2,
			nick: "Bob",
			code: hub.activeCodes()[0]!,
		});
		if (!bob.ok) throw new Error("setup falhou");
		const h1 = handleHistoriaAdd(hub, playerId, { titulo: "H1" });
		handleHistoriaAdd(hub, playerId, { titulo: "H2" });
		if (!h1.ok) throw new Error("setup falhou");
		hub.getSala(hub.activeCodes()[0]!)!.castVote(playerId, "5");
		expect(hub.getSala(hub.activeCodes()[0]!)!.phase).toBe("voting");
		const outcome = handleHistoriaRemove(hub, playerId, { id: h1.historia.id });
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("invalid_phase");
	});

	test("espectador recebe role_denied", () => {
		const { playerId, code } = createHost();
		const h1 = handleHistoriaAdd(hub, playerId, { titulo: "H1" });
		if (!h1.ok) throw new Error("setup falhou");
		const specId = addSpectator(code);
		const outcome = handleHistoriaRemove(hub, specId, { id: h1.historia.id });
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("role_denied");
	});
});

// ---------------------------------------------------------------------------
// historia_select
// ---------------------------------------------------------------------------

describe("handleHistoriaSelect", () => {
	test("válido troca a ativa em idle", () => {
		const { playerId, code } = createHost();
		const h1 = handleHistoriaAdd(hub, playerId, { titulo: "H1" });
		const h2 = handleHistoriaAdd(hub, playerId, { titulo: "H2" });
		if (!h1.ok || !h2.ok) throw new Error("setup falhou");
		expect(hub.getSala(code)!.historiaAtualId).toBe(h1.historia.id);
		const outcome = handleHistoriaSelect(hub, playerId, {
			historiaId: h2.historia.id,
		});
		expect(outcome.ok).toBe(true);
		expect(hub.getSala(code)!.historiaAtualId).toBe(h2.historia.id);
	});

	test("troca em voting recebe invalid_phase", () => {
		const { playerId } = createHost();
		const bob = handleHello(hub, {
			uuid: UUID_P2,
			nick: "Bob",
			code: hub.activeCodes()[0]!,
		});
		if (!bob.ok) throw new Error("setup falhou");
		const h1 = handleHistoriaAdd(hub, playerId, { titulo: "H1" });
		const h2 = handleHistoriaAdd(hub, playerId, { titulo: "H2" });
		if (!h1.ok || !h2.ok) throw new Error("setup falhou");
		hub.getSala(hub.activeCodes()[0]!)!.castVote(playerId, "5");
		expect(hub.getSala(hub.activeCodes()[0]!)!.phase).toBe("voting");
		const outcome = handleHistoriaSelect(hub, playerId, {
			historiaId: h2.historia.id,
		});
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("invalid_phase");
	});

	test("espectador recebe role_denied", () => {
		const { playerId, code } = createHost();
		const h1 = handleHistoriaAdd(hub, playerId, { titulo: "H1" });
		if (!h1.ok) throw new Error("setup falhou");
		const specId = addSpectator(code);
		const outcome = handleHistoriaSelect(hub, specId, {
			historiaId: h1.historia.id,
		});
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("role_denied");
	});

	test("id ausente recebe historia_nao_encontrada", () => {
		const { playerId } = createHost();
		const outcome = handleHistoriaSelect(hub, playerId, {
			historiaId: "h_fantasma",
		});
		expect(outcome.ok).toBe(false);
		if (outcome.ok) throw new Error("expected error");
		expect(outcome.code).toBe("historia_nao_encontrada");
	});
});
