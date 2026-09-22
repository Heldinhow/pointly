/**
 * WS Pauta dispatch tests — issue #163 (parent #160).
 *
 * Prova dos 3 acceptance bullets via `WSService.onMessage`:
 *  1. Cada evento válido atualiza e broadcast room_state com pauta +
 *     historiaAtualId para toda a sala
 *  2. Spectator editando → role_denied; troca de ativa em voting →
 *     invalid_phase; 51ª → pauta_cheia
 *  3. Payload inválido (título vazio) → erro sem broadcast, socket segue up
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

beforeEach(() => {
	hub = new Hub();
	service = new WSService(hub, new Logger(new MemorySink()));
	ana = new MockBunWS("127.0.0.1");
	bob = new MockBunWS("127.0.0.2");
	service.onOpen(ana);
	service.onOpen(bob);
	service.onMessage(
		ana,
		JSON.stringify({ type: "hello", payload: { uuid: UUID_ANA, nick: "Ana" } }),
	);
	service.onMessage(
		bob,
		JSON.stringify({
			type: "hello",
			payload: { uuid: UUID_BOB, nick: "Bob", code: ana.data.code },
		}),
	);
	ana.messages.length = 0;
	bob.messages.length = 0;
});

// ---------------------------------------------------------------------------
// Bullet 1 — cada evento válido broadcast room_state com pauta + ativa
// ---------------------------------------------------------------------------

describe("WS Pauta — bullet 1: válido atualiza + broadcast room_state", () => {
	test("historia_add broadcast room_state com pauta + historiaAtualId pros dois", () => {
		service.onMessage(
			ana,
			JSON.stringify({
				type: "historia_add",
				payload: { titulo: "Como cliente quero votar" },
			}),
		);

		for (const ws of [ana, bob]) {
			const states = ws.eventsOfType("room_state");
			expect(states.length).toBeGreaterThanOrEqual(1);
			const last = states[states.length - 1]!;
			expect(last.payload.sala.pauta).toHaveLength(1);
			expect(last.payload.sala.pauta![0]!.titulo).toBe(
				"Como cliente quero votar",
			);
			expect(last.payload.sala.historiaAtualId).toBe(
				last.payload.sala.pauta![0]!.id,
			);
		}
	});

	test("historia_update broadcast room_state com texto novo", () => {
		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "Antes" } }),
		);
		const id = ana.eventsOfType("room_state").at(-1)!.payload.sala.pauta![0]!.id;
		ana.messages.length = 0;
		bob.messages.length = 0;

		service.onMessage(
			bob,
			JSON.stringify({
				type: "historia_update",
				payload: { id, titulo: "Depois" },
			}),
		);

		for (const ws of [ana, bob]) {
			const last = ws.eventsOfType("room_state").at(-1)!;
			expect(last.payload.sala.pauta![0]!.titulo).toBe("Depois");
			expect(last.payload.sala.historiaAtualId).toBe(id);
		}
	});

	test("historia_move broadcast room_state reordenado", () => {
		for (const titulo of ["H1", "H2", "H3"]) {
			service.onMessage(
				ana,
				JSON.stringify({ type: "historia_add", payload: { titulo } }),
			);
		}
		const before = ana.eventsOfType("room_state").at(-1)!.payload.sala.pauta!;
		const h3 = before[2]!.id;
		ana.messages.length = 0;
		bob.messages.length = 0;

		service.onMessage(
			ana,
			JSON.stringify({
				type: "historia_move",
				payload: { id: h3, toIndex: 0 },
			}),
		);

		for (const ws of [ana, bob]) {
			const last = ws.eventsOfType("room_state").at(-1)!;
			expect(last.payload.sala.pauta!.map((h) => h.id)[0]).toBe(h3);
			expect(last.payload.sala.pauta!.map((h) => h.ordem)).toEqual([0, 1, 2]);
		}
	});

	test("historia_remove broadcast room_state sem a removida", () => {
		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "H1" } }),
		);
		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "H2" } }),
		);
		const pauta = ana.eventsOfType("room_state").at(-1)!.payload.sala.pauta!;
		const h1 = pauta[0]!.id;
		const h2 = pauta[1]!.id;
		// tira H1 da ativa para remover sem bloqueio de fase
		service.onMessage(
			ana,
			JSON.stringify({
				type: "historia_select",
				payload: { historiaId: h2 },
			}),
		);
		ana.messages.length = 0;
		bob.messages.length = 0;

		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_remove", payload: { id: h1 } }),
		);

		for (const ws of [ana, bob]) {
			const last = ws.eventsOfType("room_state").at(-1)!;
			expect(last.payload.sala.pauta!.map((h) => h.id)).toEqual([h2]);
		}
	});

	test("historia_select broadcast room_state com nova ativa", () => {
		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "H1" } }),
		);
		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "H2" } }),
		);
		const pauta = ana.eventsOfType("room_state").at(-1)!.payload.sala.pauta!;
		const h2 = pauta[1]!.id;
		ana.messages.length = 0;
		bob.messages.length = 0;

		service.onMessage(
			ana,
			JSON.stringify({
				type: "historia_select",
				payload: { historiaId: h2 },
			}),
		);

		for (const ws of [ana, bob]) {
			const last = ws.eventsOfType("room_state").at(-1)!;
			expect(last.payload.sala.historiaAtualId).toBe(h2);
			expect(last.payload.sala.pauta).toHaveLength(2);
		}
	});
});

// ---------------------------------------------------------------------------
// Bullet 2 — role_denied / invalid_phase / pauta_cheia
// ---------------------------------------------------------------------------

describe("WS Pauta — bullet 2: espectador / fase / pauta cheia", () => {
	test("spectator editando recebe role_denied sem broadcast", () => {
		const olho = new MockBunWS("127.0.0.9");
		service.onOpen(olho);
		service.onMessage(
			olho,
			JSON.stringify({
				type: "hello",
				payload: {
					uuid: UUID_OLHO,
					nick: "Olho",
					code: ana.data.code,
					spectate: true,
				},
			}),
		);
		olho.messages.length = 0;
		const roomStatesBefore = ana.eventsOfType("room_state").length;

		service.onMessage(
			olho,
			JSON.stringify({ type: "historia_add", payload: { titulo: "hack" } }),
		);

		const errors = olho.eventsOfType("error");
		expect(errors).toHaveLength(1);
		expect(errors[0]!.payload.code).toBe("role_denied");
		expect(olho.eventsOfType("room_state")).toHaveLength(0);
		expect(ana.eventsOfType("room_state")).toHaveLength(roomStatesBefore);
		expect(olho.closed).toBe(false);
	});

	test("troca de ativa em voting recebe invalid_phase sem invalidar votos", () => {
		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "H1" } }),
		);
		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "H2" } }),
		);
		const pauta = ana.eventsOfType("room_state").at(-1)!.payload.sala.pauta!;
		const h2 = pauta[1]!.id;
		service.onMessage(
			ana,
			JSON.stringify({ type: "cast_vote", payload: { value: "5" } }),
		);
		expect(
			hub.getSala(ana.data.code!)!.phase,
		).toBe("voting");
		ana.messages.length = 0;
		const roomStatesBefore = bob.eventsOfType("room_state").length;

		service.onMessage(
			ana,
			JSON.stringify({
				type: "historia_select",
				payload: { historiaId: h2 },
			}),
		);

		const errors = ana.eventsOfType("error");
		expect(errors).toHaveLength(1);
		expect(errors[0]!.payload.code).toBe("invalid_phase");
		expect(ana.eventsOfType("room_state")).toHaveLength(0);
		expect(bob.eventsOfType("room_state")).toHaveLength(roomStatesBefore);
		// rodada intacta: voto segue lá
		expect(hub.getSala(ana.data.code!)!.votes.get(ana.data.playerId!)).toBe("5");
		expect(ana.closed).toBe(false);
	});

	test("51ª recebe pauta_cheia", () => {
		const sala = hub.getSala(ana.data.code!)!;
		for (let i = 0; i < 50; i++) {
			sala.addHistoria(ana.data.playerId!, { titulo: `H${i}` });
		}
		expect(sala.pauta).toHaveLength(50);
		ana.messages.length = 0;
		bob.messages.length = 0;

		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "H50" } }),
		);

		const errors = ana.eventsOfType("error");
		expect(errors).toHaveLength(1);
		expect(errors[0]!.payload.code).toBe("pauta_cheia");
		expect(ana.eventsOfType("room_state")).toHaveLength(0);
		expect(bob.eventsOfType("room_state")).toHaveLength(0);
		expect(ana.closed).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Bullet 3 — payload inválido: erro sem broadcast, socket segue up
// ---------------------------------------------------------------------------

describe("WS Pauta — bullet 3: payload inválido não derruba o socket", () => {
	test("título vazio retorna erro sem broadcast e socket segue up", () => {
		ana.messages.length = 0;
		bob.messages.length = 0;

		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "" } }),
		);

		const errors = ana.eventsOfType("error");
		expect(errors).toHaveLength(1);
		expect(ana.eventsOfType("room_state")).toHaveLength(0);
		expect(bob.eventsOfType("room_state")).toHaveLength(0);
		expect(bob.messages).toHaveLength(0);
		expect(ana.closed).toBe(false);

		// socket segue funcional: próximo evento válido funciona
		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "Válida" } }),
		);
		const last = ana.eventsOfType("room_state").at(-1)!;
		expect(last.payload.sala.pauta).toHaveLength(1);
		expect(last.payload.sala.pauta![0]!.titulo).toBe("Válida");
		// o outro membro também recebeu
		expect(bob.eventsOfType("room_state").at(-1)!.payload.sala.pauta).toHaveLength(1);
	});

	test("historia_update sem campo editável retorna erro sem broadcast", () => {
		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_add", payload: { titulo: "H1" } }),
		);
		ana.messages.length = 0;
		bob.messages.length = 0;
		const id = hub.getSala(ana.data.code!)!.pauta[0]!.id;

		service.onMessage(
			ana,
			JSON.stringify({ type: "historia_update", payload: { id } }),
		);

		expect(ana.eventsOfType("error")).toHaveLength(1);
		expect(ana.eventsOfType("room_state")).toHaveLength(0);
		expect(bob.eventsOfType("room_state")).toHaveLength(0);
		expect(ana.closed).toBe(false);
	});
});
