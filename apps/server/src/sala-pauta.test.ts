/**
 * Sala Pauta domain tests — issue #162 (parent #160).
 *
 * Domínio em memória na Sala (efêmero): add/update/move/remove/select,
 * historiaAtualId, auto-avanço da Nova Rodada, Pontuação = mediana atual
 * enquanto revealed, last-write-wins, bloqueios por fase, confirmação de
 * pontuada, spectator role_denied, primeira auto-seleciona.
 *
 * Run: `bun --filter server test`
 */
import { describe, expect, test, beforeEach } from "bun:test";
import { Sala, SalaError } from "./sala";
import type { Player } from "@planning-poker/shared";

function makePlayer(
	id: string,
	nick: string,
	role: "host" | "player" | "spectator" = "player",
	joinedAt?: number,
	seatIndex: number | null = null,
): Player {
	return {
		id,
		uuid: `00000000-0000-4000-8000-${id.padStart(12, "0")}`,
		nick,
		role,
		seatIndex: seatIndex ?? 0,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: joinedAt ?? Date.now(),
	};
}

let sala: Sala;

beforeEach(() => {
	const host = makePlayer("p1", "Ana", "host", 1_000);
	sala = new Sala("ABCD", host, 1_000);
});

function expectSalaError(fn: () => unknown, code: SalaError["code"]) {
	try {
		fn();
	} catch (e) {
		expect(e).toBeInstanceOf(SalaError);
		expect((e as SalaError).code).toBe(code);
		return;
	}
	throw new Error(`expected SalaError(${code}) but nothing thrown`);
}

// ---------------------------------------------------------------------------
// add + auto-select + toState
// ---------------------------------------------------------------------------

describe("Pauta — add + primeira auto-seleciona", () => {
	test("sala nova começa com pauta vazia e sem ativa", () => {
		expect(sala.pauta).toEqual([]);
		expect(sala.historiaAtualId).toBeNull();
		const state = sala.toState();
		expect(state.pauta).toEqual([]);
		expect(state.historiaAtualId).toBeNull();
	});

	test("primeira criada auto-seleciona", () => {
		const h = sala.addHistoria("p1", { titulo: "História 1" });
		expect(h.titulo).toBe("História 1");
		expect(h.pontos).toBeNull();
		expect(h.ordem).toBe(0);
		expect(sala.historiaAtualId).toBe(h.id);
	});

	test("segunda criada não rouba a ativa", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		const h2 = sala.addHistoria("p1", { titulo: "H2" });
		expect(sala.historiaAtualId).toBe(h1.id);
		expect(h2.ordem).toBe(1);
		expect(sala.pauta).toHaveLength(2);
	});

	test("toState carrega pauta + historiaAtualId (seleção tardia recebe tudo)", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1", criterio: "crit" });
		const state = sala.toState();
		expect(state.pauta).toHaveLength(1);
		expect(state.pauta![0]!.id).toBe(h1.id);
		expect(state.historiaAtualId).toBe(h1.id);
	});

	test("player (não host) pode criar — democratizado", () => {
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		const h = sala.addHistoria("p2", { titulo: "De Bob" });
		expect(h.titulo).toBe("De Bob");
	});

	test("espectador não cria → role_denied", () => {
		sala.addPlayer({ ...makePlayer("p9", "Olho", "spectator", 1_002), seatIndex: -1 });
		expectSalaError(() => sala.addHistoria("p9", { titulo: "X" }), "role_denied");
	});

	test("51ª rejeita com pauta_cheia", () => {
		for (let i = 0; i < 50; i++) {
			sala.addHistoria("p1", { titulo: `H${i}` });
		}
		expect(sala.pauta).toHaveLength(50);
		expectSalaError(() => sala.addHistoria("p1", { titulo: "H50" }), "pauta_cheia");
	});

	test("id ausente em update/move/remove/select → historia_nao_encontrada", () => {
		expectSalaError(
			() => sala.updateHistoria("p1", "ghost", { titulo: "X" }),
			"historia_nao_encontrada",
		);
		expectSalaError(() => sala.moveHistoria("p1", "ghost", 0), "historia_nao_encontrada");
		expectSalaError(
			() => sala.removeHistoria("p1", "ghost"),
			"historia_nao_encontrada",
		);
		expectSalaError(() => sala.selectHistoria("p1", "ghost"), "historia_nao_encontrada");
	});
});

// ---------------------------------------------------------------------------
// update — last-write-wins, sem override de pontos
// ---------------------------------------------------------------------------

describe("Pauta — update last-write-wins", () => {
	test("edita título e critério; pontos e ordem intactos", () => {
		const h = sala.addHistoria("p1", { titulo: "Antes", criterio: "c1" });
		const out = sala.updateHistoria("p1", h.id, { titulo: "Depois" });
		expect(out.titulo).toBe("Depois");
		expect(out.criterio).toBe("c1");
		expect(out.pontos).toBeNull();
		expect(out.ordem).toBe(0);
	});

	test("criterio null limpa; última escrita vence", () => {
		const h = sala.addHistoria("p1", { titulo: "T", criterio: "c1" });
		sala.updateHistoria("p1", h.id, { titulo: "T2" });
		sala.updateHistoria("p1", h.id, { criterio: null });
		const cur = sala.getHistoria(h.id)!;
		expect(cur.titulo).toBe("T2");
		expect(cur.criterio).toBeUndefined();
	});

	test("texto de pontuada continua editável sem mexer nos pontos", () => {
		const h = sala.addHistoria("p1", { titulo: "T" });
		sala.castVote("p1", "5");
		sala.reveal("p1");
		expect(sala.getHistoria(h.id)!.pontos).toBe(5);
		const out = sala.updateHistoria("p1", h.id, { titulo: "T corrigido" });
		expect(out.titulo).toBe("T corrigido");
		expect(out.pontos).toBe(5);
	});

	test("espectador não edita → role_denied", () => {
		const h = sala.addHistoria("p1", { titulo: "T" });
		sala.addPlayer({ ...makePlayer("p9", "Olho", "spectator", 1_002), seatIndex: -1 });
		expectSalaError(
			() => sala.updateHistoria("p9", h.id, { titulo: "hack" }),
			"role_denied",
		);
	});

	test("update da ativa em voting é permitido (só texto, não invalida voto)", () => {
		const h = sala.addHistoria("p1", { titulo: "T" });
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("revealable");
		const out = sala.updateHistoria("p1", h.id, { titulo: "T2" });
		expect(out.titulo).toBe("T2");
		expect(sala.votes.get("p1")).toBe("5");
	});
});

// ---------------------------------------------------------------------------
// move — ordem estável
// ---------------------------------------------------------------------------

describe("Pauta — move", () => {
	test("reordena e reindexa ordem 0..n-1", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		const h2 = sala.addHistoria("p1", { titulo: "H2" });
		const h3 = sala.addHistoria("p1", { titulo: "H3" });
		sala.moveHistoria("p1", h3.id, 0);
		expect(sala.pauta.map((h) => h.id)).toEqual([h3.id, h1.id, h2.id]);
		expect(sala.pauta.map((h) => h.ordem)).toEqual([0, 1, 2]);
	});

	test("toIndex fora da pauta real → historia_nao_encontrada", () => {
		const h = sala.addHistoria("p1", { titulo: "H1" });
		expectSalaError(() => sala.moveHistoria("p1", h.id, 5), "historia_nao_encontrada");
	});

	test("espectador não reordena → role_denied", () => {
		const h = sala.addHistoria("p1", { titulo: "H1" });
		sala.addHistoria("p1", { titulo: "H2" });
		sala.addPlayer({ ...makePlayer("p9", "Olho", "spectator", 1_002), seatIndex: -1 });
		expectSalaError(() => sala.moveHistoria("p9", h.id, 1), "role_denied");
	});
});

// ---------------------------------------------------------------------------
// remove — confirmação de pontuada
// ---------------------------------------------------------------------------

describe("Pauta — remove", () => {
	test("remove sem pontos com gesto simples e reindexa", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		const h2 = sala.addHistoria("p1", { titulo: "H2" });
		sala.removeHistoria("p1", h1.id);
		expect(sala.pauta.map((h) => h.id)).toEqual([h2.id]);
		expect(sala.pauta[0]!.ordem).toBe(0);
	});

	test("remover a ativa limpa historiaAtualId", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		sala.addHistoria("p1", { titulo: "H2" });
		expect(sala.historiaAtualId).toBe(h1.id);
		sala.removeHistoria("p1", h1.id);
		expect(sala.historiaAtualId).toBeNull();
	});

	test("apagar pontuada sem flag nega com invalid_phase", () => {
		const h = sala.addHistoria("p1", { titulo: "H1" });
		sala.castVote("p1", "5");
		sala.reveal("p1");
		expect(sala.getHistoria(h.id)!.pontos).toBe(5);
		// nova rodada para sair de revealed e poder apagar sem bloqueio de fase
		sala.startNewRound();
		expectSalaError(() => sala.removeHistoria("p1", h.id), "invalid_phase");
		expect(sala.getHistoria(h.id)).toBeDefined();
	});

	test("apagar pontuada com confirmScored remove", () => {
		const h = sala.addHistoria("p1", { titulo: "H1" });
		sala.castVote("p1", "5");
		sala.reveal("p1");
		sala.startNewRound();
		// após Nova Rodada sem ativa, a pontuada é não-ativa: remove direto
		// (select em voting é invalid_phase por desenho).
		sala.removeHistoria("p1", h.id, { confirmScored: true });
		expect(sala.getHistoria(h.id)).toBeUndefined();
	});

	test("espectador não apaga → role_denied", () => {
		const h = sala.addHistoria("p1", { titulo: "H1" });
		sala.addPlayer({ ...makePlayer("p9", "Olho", "spectator", 1_002), seatIndex: -1 });
		expectSalaError(() => sala.removeHistoria("p9", h.id), "role_denied");
	});
});

// ---------------------------------------------------------------------------
// select — só idle/revealed
// ---------------------------------------------------------------------------

describe("Pauta — select", () => {
	test("troca a ativa em idle", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		const h2 = sala.addHistoria("p1", { titulo: "H2" });
		sala.selectHistoria("p1", h2.id);
		expect(sala.historiaAtualId).toBe(h2.id);
		expect(h1.id).not.toBe(h2.id);
	});

	test("limpar com null em idle", () => {
		sala.addHistoria("p1", { titulo: "H1" });
		sala.selectHistoria("p1", null);
		expect(sala.historiaAtualId).toBeNull();
	});

	test("espectador não seleciona → role_denied", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		sala.addHistoria("p1", { titulo: "H2" });
		sala.addPlayer({ ...makePlayer("p9", "Olho", "spectator", 1_002), seatIndex: -1 });
		expectSalaError(() => sala.selectHistoria("p9", h1.id), "role_denied");
	});
});

// ---------------------------------------------------------------------------
// Bloqueio por fase: apagar/reordenar/selecionar ativa em voting/revealable
// ---------------------------------------------------------------------------

describe("Pauta — bloqueio por fase (ativa em voting/revealable)", () => {
	test("apagar a ativa em voting nega invalid_phase e rodada intacta", () => {
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		sala.addHistoria("p1", { titulo: "H2" });
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("voting");
		const votesBefore = new Map(sala.votes);
		expectSalaError(() => sala.removeHistoria("p1", h1.id), "invalid_phase");
		expect(sala.getHistoria(h1.id)).toBeDefined();
		expect(sala.historiaAtualId).toBe(h1.id);
		expect(sala.phase).toBe("voting");
		expect(Array.from(sala.votes.entries())).toEqual(Array.from(votesBefore.entries()));
	});

	test("mover a ativa em voting nega invalid_phase", () => {
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		sala.addHistoria("p1", { titulo: "H2" });
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("voting");
		expectSalaError(() => sala.moveHistoria("p1", h1.id, 1), "invalid_phase");
		expect(sala.pauta.map((h) => h.id)).toEqual([h1.id, sala.pauta[1]!.id]);
	});

	test("mover NÃO-ativa em voting é permitido", () => {
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		const h2 = sala.addHistoria("p1", { titulo: "H2" });
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("voting");
		sala.moveHistoria("p1", h2.id, 0);
		expect(sala.pauta[0]!.id).toBe(h2.id);
		expect(sala.historiaAtualId).toBe(h1.id);
	});

	test("selecionar outra em voting nega invalid_phase e rodada intacta", () => {
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		const h2 = sala.addHistoria("p1", { titulo: "H2" });
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("voting");
		expectSalaError(() => sala.selectHistoria("p1", h2.id), "invalid_phase");
		expect(sala.historiaAtualId).toBe(h1.id);
		expect(sala.phase).toBe("voting");
	});

	test("bloqueio também vale em revealable", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		const h2 = sala.addHistoria("p1", { titulo: "H2" });
		sala.castVote("p1", "5");
		expect(sala.phase).toBe("revealable");
		expectSalaError(() => sala.removeHistoria("p1", h1.id), "invalid_phase");
		expectSalaError(() => sala.moveHistoria("p1", h1.id, 1), "invalid_phase");
		expectSalaError(() => sala.selectHistoria("p1", h2.id), "invalid_phase");
		expect(sala.historiaAtualId).toBe(h1.id);
		expect(sala.phase).toBe("revealable");
	});
});

// ---------------------------------------------------------------------------
// Fluxo ponta-a-ponta #162: 3 histórias → vota #1 → reveal → nova rodada → #2
// ---------------------------------------------------------------------------

describe("Pauta — fluxo Nova Rodada auto-avança", () => {
	test("criar 3, votar #1, revelar, Nova Rodada cai na #2 sozinha", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		const h2 = sala.addHistoria("p1", { titulo: "H2" });
		sala.addHistoria("p1", { titulo: "H3" });
		expect(sala.historiaAtualId).toBe(h1.id);

		sala.castVote("p1", "5");
		sala.reveal("p1");
		expect(sala.getHistoria(h1.id)!.pontos).toBe(5);

		sala.startNewRound();
		expect(sala.historiaAtualId).toBe(h2.id);
		expect(sala.votes.size).toBe(0);
	});

	test("última pontuada → Nova Rodada fica sem ativa", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		// pontua a única
		sala.castVote("p1", "3");
		sala.reveal("p1");
		expect(sala.getHistoria(h1.id)!.pontos).toBe(3);
		sala.startNewRound();
		expect(sala.historiaAtualId).toBeNull();
	});

	test("pula pontuadas e para na próxima não-pontuada", () => {
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		const h2 = sala.addHistoria("p1", { titulo: "H2" });
		const h3 = sala.addHistoria("p1", { titulo: "H3" });
		// pontua #1
		sala.castVote("p1", "5");
		sala.reveal("p1");
		sala.startNewRound();
		expect(sala.historiaAtualId).toBe(h2.id);
		// pontua #2
		sala.castVote("p1", "8");
		sala.reveal("p1");
		expect(sala.getHistoria(h2.id)!.pontos).toBe(8);
		sala.startNewRound();
		expect(sala.historiaAtualId).toBe(h3.id);
		expect(sala.getHistoria(h1.id)!.pontos).toBe(5);
	});
});

// ---------------------------------------------------------------------------
// Pontuação segue recompute pós-reveal
// ---------------------------------------------------------------------------

describe("Pauta — Pontuação segue voto pós-reveal", () => {
	test("trocar voto pós-reveal move a Pontuação da ativa junto", () => {
		sala.addPlayer(makePlayer("p2", "Bob", "player", 1_001));
		const h1 = sala.addHistoria("p1", { titulo: "H1" });
		sala.castVote("p1", "5");
		sala.castVote("p2", "5");
		sala.reveal("p1");
		expect(sala.getHistoria(h1.id)!.pontos).toBe(5);
		sala.castVote("p1", "8");
		expect(sala.getHistoria(h1.id)!.pontos).toBe(6.5);
		expect(sala.phase).toBe("revealed");
	});

	test("reveal sem ativa não quebra (sala legada)", () => {
		// sem pauta: reveal funciona como antes
		sala.castVote("p1", "5");
		const out = sala.reveal("p1");
		expect(out.median).toBe(5);
		expect(sala.historiaAtualId).toBeNull();
	});
});
