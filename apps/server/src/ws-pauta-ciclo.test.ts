/**
 * WS Pauta — ciclo completo a dois clientes (#166, parent #160).
 *
 * Prova os 3 acceptance bullets de wiring final na Arena, com dois (ou
 * mais) WebSockets reais contra `WSService`/`Hub` em memória — mesmo
 * harness de `ws-pauta.test.ts` (#163), sem trocar de aba:
 *
 *  1. A cria 3 histórias → B recebe pauta + ativa (<1s); A vota/revela
 *     → Pontuação carimbada em B; Nova Rodada auto-avança nas duas
 *  2. Entrada tardia recebe pauta + ativa + Pontuações; F5 (mesmo UUID)
 *     reidrata tudo
 *  3. Editar voto pós-reveal move a Pontuação no outro cliente;
 *     espectador tentando editar recebe role_denied sem efeito; último
 *     a sair apaga a pauta (efêmero)
 *
 * Run: `bun --filter server test`
 */
import { beforeEach, describe, expect, test } from "bun:test";
import type { ServerToClientEvent } from "@planning-poker/shared";
import { Hub } from "./hub";
import { Logger, MemorySink } from "./ws-logger";
import { WSService, type BunWS, type WSContext } from "./ws";

const UUID_ANA = "00000000-0000-4000-8000-000000000001";
const UUID_BOB = "00000000-0000-4000-8000-000000000002";
const UUID_CAROL = "00000000-0000-4000-8000-000000000003";
const UUID_DORA = "00000000-0000-4000-8000-000000000004";
const UUID_OLHO = "00000000-0000-4000-8000-000000000009";

class MockBunWS implements BunWS {
	remoteAddress = "127.0.0.1";
	data: WSContext;
	messages: string[] = [];
	closed = false;
	closeCode: number | null = null;

	constructor(ip = "127.0.0.1") {
		this.remoteAddress = ip;
		this.data = {
			playerId: null,
			code: null,
			ip,
			lastPongAt: Date.now(),
			lastPingAt: Date.now(),
		};
	}

	send(message: string | ArrayBuffer | Uint8Array): void {
		this.messages.push(
			typeof message === "string" ? message : new TextDecoder().decode(message),
		);
	}

	ping(): void {}
	close(code?: number): void {
		this.closed = true;
		if (code !== undefined) this.closeCode = code;
	}
	subscribe(): void {}
	unsubscribe(): void {}

	eventsOfType<T extends ServerToClientEvent["type"]>(
		type: T,
	): Extract<ServerToClientEvent, { type: T }>[] {
		const out: Extract<ServerToClientEvent, { type: T }>[] = [];
		for (const m of this.messages) {
			try {
				const ev = JSON.parse(m) as ServerToClientEvent;
				if (ev.type === type) {
					out.push(ev as Extract<ServerToClientEvent, { type: T }>);
				}
			} catch {
				// skip unparseable
			}
		}
		return out;
	}
}

let hub: Hub;
let service: WSService;
let ana: MockBunWS;
let bob: MockBunWS;

function send(
	ws: MockBunWS,
	type: string,
	payload?: Record<string, unknown>,
): void {
	// O envelope do contrato exige `payload` mesmo quando vazio.
	service.onMessage(ws, JSON.stringify({ type, payload: payload ?? {} }));
}

function hello(
	ws: MockBunWS,
	payload: { uuid: string; nick: string; code?: string; spectate?: boolean },
): void {
	send(ws, "hello", payload);
}

function connect(ip: string, payload: {
	uuid: string;
	nick: string;
	code?: string;
	spectate?: boolean;
}): MockBunWS {
	const ws = new MockBunWS(ip);
	service.onOpen(ws);
	hello(ws, payload);
	return ws;
}

/** Último `room_state` recebido pelo cliente (snapshot canônico). */
function lastRoom(ws: MockBunWS) {
	return ws.eventsOfType("room_state").at(-1)!.payload.sala;
}

function itens(ws: MockBunWS): string[] {
	return lastRoom(ws).pauta!.map((h) => h.titulo);
}

function pontosDe(ws: MockBunWS, id: string): number | null {
	return lastRoom(ws).pauta!.find((h) => h.id === id)!.pontos;
}

/** Cria 3 histórias na Ana e devolve os ids na ordem da pauta. */
function criar3(): [string, string, string] {
	send(ana, "historia_add", { titulo: "Carrinho" });
	send(ana, "historia_add", { titulo: "Checkout" });
	send(ana, "historia_add", { titulo: "PIX" });
	const pauta = lastRoom(ana).pauta!;
	return [pauta[0]!.id, pauta[1]!.id, pauta[2]!.id];
}

/** Vota 5/3 na ativa e revela — Pontuação 4 carimbada na primeira. */
function pontuarAtiva(): void {
	send(ana, "cast_vote", { value: "5" });
	send(bob, "cast_vote", { value: "3" });
	send(ana, "reveal_votes");
}

beforeEach(() => {
	hub = new Hub();
	service = new WSService(hub, new Logger(new MemorySink()));
	ana = new MockBunWS("127.0.0.1");
	bob = new MockBunWS("127.0.0.2");
	service.onOpen(ana);
	service.onOpen(bob);
	hello(ana, { uuid: UUID_ANA, nick: "Ana" });
	hello(bob, { uuid: UUID_BOB, nick: "Bob", code: ana.data.code! });
	ana.messages.length = 0;
	bob.messages.length = 0;
});

// ---------------------------------------------------------------------------
// Bullet 1 — dois clientes: criar → B vê → votar/revelar carimba → Nova Rodada
// ---------------------------------------------------------------------------

describe("WS Pauta #166 — ciclo a dois clientes", () => {
	test("A cria 3 e B recebe pauta + ativa em <1s", () => {
		const startedAt = Date.now();
		send(ana, "historia_add", { titulo: "Carrinho" });
		send(ana, "historia_add", { titulo: "Checkout" });
		send(ana, "historia_add", { titulo: "PIX" });
		const elapsed = Date.now() - startedAt;

		expect(elapsed).toBeLessThan(1000);
		expect(itens(bob)).toEqual(["Carrinho", "Checkout", "PIX"]);
		const sala = lastRoom(bob);
		expect(sala.historiaAtualId).toBe(sala.pauta![0]!.id);
		// Ana também recebe o estado canônico (sem broadcast privilegiado).
		expect(itens(ana)).toEqual(itens(bob));
	});

	test("votar + revelar na A carimba a Pontuação na B", () => {
		const [h1] = criar3();
		pontuarAtiva();

		expect(lastRoom(ana).phase).toBe("revealed");
		expect(lastRoom(bob).phase).toBe("revealed");
		expect(pontosDe(bob, h1)).toBe(4);
		expect(pontosDe(ana, h1)).toBe(4);
		// O evento de consenso continua sendo o do reveal manual.
		expect(
			bob.eventsOfType("votes_revealed").at(-1)!.payload.median,
		).toBe(4);
	});

	test("Nova Rodada na A avança a ativa e limpa votos nas duas", () => {
		const [h1, h2] = criar3();
		pontuarAtiva();
		const statesBefore = bob.eventsOfType("room_state").length;

		send(ana, "start_new_round");

		expect(bob.eventsOfType("room_state").length).toBeGreaterThan(
			statesBefore,
		);
		for (const ws of [ana, bob]) {
			const sala = lastRoom(ws);
			expect(sala.round).toBe(2);
			expect(sala.phase).toBe("voting");
			expect(sala.votes).toEqual({});
			expect(sala.historiaAtualId).toBe(h2);
			expect(sala.pauta!.find((h) => h.id === h1)!.pontos).toBe(4);
			expect(sala.players.every((p) => !p.hasVoted && p.value === null)).toBe(
				true,
			);
		}
	});

	test("segundo ciclo: Pontuação avança com o time (h1 → h2 → h3)", () => {
		const [h1, h2, h3] = criar3();
		pontuarAtiva();
		send(ana, "start_new_round");

		pontuarAtiva();
		const sala = lastRoom(bob);
		expect(sala.pauta!.find((h) => h.id === h1)!.pontos).toBe(4);
		expect(sala.pauta!.find((h) => h.id === h2)!.pontos).toBe(4);

		send(ana, "start_new_round");
		expect(lastRoom(bob).historiaAtualId).toBe(h3);
	});
});

// ---------------------------------------------------------------------------
// Bullet 2 — entrada tardia e F5 recebem pauta completa
// ---------------------------------------------------------------------------

describe("WS Pauta #166 — entrada tardia e F5", () => {
	test("Carol entra com rodada em andamento e recebe pauta + ativa + Pontuações", () => {
		const [h1, h2] = criar3();
		pontuarAtiva();
		send(ana, "start_new_round");
		send(ana, "cast_vote", { value: "8" });
		const statesBefore = bob.eventsOfType("room_state").length;

		const carol = connect("127.0.0.3", {
			uuid: UUID_CAROL,
			nick: "Carol",
			code: ana.data.code!,
		});

		const welcome = carol.eventsOfType("welcome").at(-1)!.payload;
		expect(welcome.sala.pauta!.map((h) => h.titulo)).toEqual([
			"Carrinho",
			"Checkout",
			"PIX",
		]);
		expect(welcome.sala.historiaAtualId).toBe(h2);
		expect(welcome.sala.pauta!.find((h) => h.id === h1)!.pontos).toBe(4);
		expect(welcome.sala.phase).toBe("voting");
		expect(welcome.sala.round).toBe(2);
		// Presença nova chega ao vivo para os que já estavam.
		expect(bob.eventsOfType("room_state").length).toBeGreaterThan(
			statesBefore,
		);
		expect(lastRoom(bob).players.some((p) => p.nick === "Carol")).toBe(true);
	});

	test("F5 (hello com o mesmo UUID) mantém pauta, ativa e Pontuações", () => {
		const [h1] = criar3();
		pontuarAtiva();

		const bobF5 = connect("127.0.0.4", {
			uuid: UUID_BOB,
			nick: "Bob",
			code: ana.data.code!,
		});

		const welcome = bobF5.eventsOfType("welcome").at(-1)!.payload;
		expect(welcome.playerId).toBe(bob.data.playerId!);
		expect(welcome.sala.pauta).toHaveLength(3);
		expect(welcome.sala.historiaAtualId).toBe(h1);
		expect(welcome.sala.pauta!.find((h) => h.id === h1)!.pontos).toBe(4);
		expect(welcome.sala.phase).toBe("revealed");
		// Sem duplicar Player: segue 2 na sala.
		expect(welcome.sala.players).toHaveLength(2);
	});
});

// ---------------------------------------------------------------------------
// Bullet 3 — pós-reveal, espectador e efêmero
// ---------------------------------------------------------------------------

describe("WS Pauta #166 — pós-reveal, espectador e efêmero", () => {
	test("editar o voto pós-reveal atualiza a Pontuação no outro cliente", () => {
		const [h1] = criar3();
		send(ana, "cast_vote", { value: "5" });
		send(bob, "cast_vote", { value: "5" });
		send(ana, "reveal_votes");
		expect(pontosDe(bob, h1)).toBe(5);

		send(ana, "cast_vote", { value: "8" });

		expect(lastRoom(bob).phase).toBe("revealed");
		expect(pontosDe(bob, h1)).toBe(6.5);
		expect(
			bob.eventsOfType("votes_revealed").at(-1)!.payload.median,
		).toBe(6.5);
	});

	test("espectador tentando editar recebe role_denied sem efeito", () => {
		criar3();
		const olho = connect("127.0.0.5", {
			uuid: UUID_OLHO,
			nick: "Olho",
			code: ana.data.code!,
			spectate: true,
		});
		const welcome = olho.eventsOfType("welcome").at(-1)!.payload;
		expect(welcome.role).toBe("spectator");
		const statesBefore = bob.eventsOfType("room_state").length;
		olho.messages.length = 0;

		send(olho, "historia_add", { titulo: "hack" });
		send(olho, "historia_update", {
			id: hub.getSala(ana.data.code!)!.pauta[0]!.id,
			titulo: "hack",
		});

		const errors = olho.eventsOfType("error");
		expect(errors).toHaveLength(2);
		expect(errors.every((e) => e.payload.code === "role_denied")).toBe(true);
		expect(olho.eventsOfType("room_state")).toHaveLength(0);
		expect(bob.eventsOfType("room_state").length).toBe(statesBefore);
		expect(hub.getSala(ana.data.code!)!.pauta).toHaveLength(3);
		expect(olho.closed).toBe(false);
	});

	test("último a sair apaga a pauta e a sala (efêmero natural)", () => {
		criar3();
		const carol = connect("127.0.0.6", {
			uuid: UUID_CAROL,
			nick: "Carol",
			code: ana.data.code!,
		});
		const dora = connect("127.0.0.7", {
			uuid: UUID_DORA,
			nick: "Dora",
			code: ana.data.code!,
		});
		const code = ana.data.code!;
		const salaRef = hub.getSala(code)!;
		expect(salaRef.pauta).toHaveLength(3);

		send(ana, "leave_room");
		send(bob, "leave_room");
		send(carol, "leave_room");
		expect(hub.getSala(code)).toBe(salaRef);
		expect(salaRef.pauta).toHaveLength(3);

		send(dora, "leave_room");

		expect(hub.getSala(code)).toBeNull();
		expect(salaRef.playerCount).toBe(0);
		expect(salaRef.pauta).toHaveLength(0);
		expect(salaRef.historiaAtualId).toBeNull();

		// Quem tentar entrar depois cai em sala_nao_encontrada.
		const zed = connect("127.0.0.8", {
			uuid: "00000000-0000-4000-8000-000000000008",
			nick: "Zed",
			code,
		});
		expect(zed.eventsOfType("error").at(-1)!.payload.code).toBe(
			"sala_nao_encontrada",
		);
	});
});
