/**
 * ws-flicker.test.ts — regression para issue #59.
 *
 * Sintoma (prod 2026-07-10): peers numa sala de Planning Poker com vários
 * clientes piscam entre 'connected' e 'disconnected' no UI mesmo sem
 * interação humana. PR #58 (38d1f80) corrigiu o ATRASO de broadcast (peers
 * viam status desconectado 60s depois) mas o FLICKER persiste — significa
 * que as transições de status estão acontecendo COM FREQUÊNCIA ALTA DEMAIS
 * no servidor, não é só latência de propagação.
 *
 * **Hipótese deste teste**: reconnect rápido de QUALQUER cliente (close
 * → hello em <100ms) NÃO deveria criar/destruir uma entrada de player.
 * Server precisa ser idempotente: mesmo uuid + code = reidrata mesma
 * entrada (mesmo playerId, joinedAt preservado, voto preservado).
 *
 * **Critério de aceitação**:
 * - Cada reconnect (close+hello com mesmo uuid+code) deve gerar EXATAMENTE
 *   1 mudança de status visível (connected → disconnected → connected = 2 broadcasts).
 * - NUNCA: `player_left` ou `player_joined` para o próprio reconnect.
 * - Em N reconexões consecutivas, o peer deve receber no máximo N×2
 *   `room_state` events com mudança de status — não mais.
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "./hub";
import type { ServerToClientEvent } from "@planning-poker/shared";
import { Logger } from "./ws-logger";
import { MemorySink } from "./ws-logger";
import { WSService, type BunWS, type WSContext } from "./ws";

// ---------------------------------------------------------------------------
// Mock BunWS (cópia isolada de ws.test.ts — não compartilha registry entre
// arquivos para não introduzir acoplamento)
// ---------------------------------------------------------------------------

class MockBunWS implements BunWS {
	remoteAddress = "127.0.0.1";
	data: WSContext;
	messages: string[] = [];
	closed = false;
	closeCode: number | null = null;
	closeReason: string | null = null;
	private subs = new Set<string>();

	constructor(ip = "127.0.0.1") {
		this.remoteAddress = ip;
		this.data = {
			playerId: null,
			code: null,
			ip,
			lastPongAt: Date.now(),
		};
	}

	send(message: string | ArrayBuffer | Uint8Array): void {
		this.messages.push(
			typeof message === "string" ? message : new TextDecoder().decode(message),
		);
	}

	close(code?: number, reason?: string): void {
		this.closed = true;
		if (code !== undefined) this.closeCode = code;
		if (reason !== undefined) this.closeReason = reason;
	}

	subscribe(topic: string): void {
		this.subs.add(topic);
	}

	unsubscribe(topic: string): void {
		this.subs.delete(topic);
	}

	// Helpers ---------------------------------------------------------------

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
				// skip
			}
		}
		return out;
	}

	lastRoomState():
		| Extract<ServerToClientEvent, { type: "room_state" }>
		| null {
		const all = this.eventsOfType("room_state");
		return all[all.length - 1] ?? null;
	}
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let hub: Hub;
let logger: Logger;
let memorySink: MemorySink;
let service: WSService;

beforeEach(() => {
	hub = new Hub();
	memorySink = new MemorySink();
	logger = new Logger(memorySink);
	service = new WSService(hub, logger);
});

const ANA_UUID = "00000000-0000-4000-8000-00000000a001";
const BOB_UUID = "00000000-0000-4000-8000-00000000b002";
const CAL_UUID = "00000000-0000-4000-8000-00000000c003";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ThreeClients = {
	ana: MockBunWS;
	bob: MockBunWS;
	cal: MockBunWS;
	code: string;
	bobPlayerId: string;
};

function setupThreeClients(): ThreeClients {
	const ana = new MockBunWS("127.0.0.1");
	const bob = new MockBunWS("127.0.0.2");
	const cal = new MockBunWS("127.0.0.3");

	service.onOpen(ana);
	service.onMessage(
		ana,
		JSON.stringify({
			type: "hello",
			payload: { uuid: ANA_UUID, nick: "Ana" },
		}),
	);
	const code = ana.data.code!;
	const bobPlayerId_setup: string[] = [];

	service.onOpen(bob);
	const bobMessagesBefore = bob.messages.length;
	service.onMessage(
		bob,
		JSON.stringify({
			type: "hello",
			payload: { uuid: BOB_UUID, nick: "Bob", code },
		}),
	);
	// Captura playerId do welcome do bob
	for (let i = bobMessagesBefore; i < bob.messages.length; i++) {
		try {
			const ev = JSON.parse(bob.messages[i]!);
			if (ev.type === "welcome" && ev.payload?.playerId) {
				bobPlayerId_setup.push(ev.payload.playerId);
				break;
			}
		} catch {
			/* ignore */
		}
	}

	service.onOpen(cal);
	service.onMessage(
		cal,
		JSON.stringify({
			type: "hello",
			payload: { uuid: CAL_UUID, nick: "Cal", code },
		}),
	);

	const bobPlayerId = bobPlayerId_setup[0]!;
	return { ana, bob, cal, code, bobPlayerId };
}

/**
 * Helper: simula um reconnect do `bob` (close → onOpen → hello com mesmo UUID+code).
 * Retorna o novo MockBunWS.
 */
function reconnectBob(bob: MockBunWS): MockBunWS {
	const uuid = BOB_UUID;
	const code = bob.data.code!;
	const ip = bob.data.ip;

	service.onClose(bob, 1006, "abnormal_closure");

	const newBob = new MockBunWS(ip);
	service.onOpen(newBob);
	service.onMessage(
		newBob,
		JSON.stringify({
			type: "hello",
			payload: { uuid, nick: "Bob", code },
		}),
	);
	return newBob;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WSService — flicker issue #59: debounce de broadcast de disconnect", () => {
	/**
	 * Helper: cria timer helpers que simulam delay em testes sem esperar
	 * tempo real. Não é fake timer do bun:test — versão minimalista
	 * baseada em Map<id, {fn}> controlada pelo teste.
	 */
	function makeFakeTimers(): {
		setTimeoutFn: typeof setTimeout;
		clearTimeoutFn: typeof clearTimeout;
		runAll: () => void;
	} {
		let nextId = 1;
		const handles = new Map<number, { fn: () => void }>();

		const runAll = () => {
			for (const [, h] of [...handles.entries()]) h.fn();
			handles.clear();
		};
		const setTimeoutFn = ((fn: () => void, _ms: number) => {
			const id = nextId++;
			handles.set(id, { fn });
			return id as unknown as ReturnType<typeof setTimeout>;
		}) as unknown as typeof setTimeout;
		const clearTimeoutFn = ((id: unknown) => {
			handles.delete(id as number);
		}) as unknown as typeof clearTimeout;
		return { setTimeoutFn, clearTimeoutFn, runAll };
	}

	test("reconnect dentro de 1.5s: peer NÃO vê broadcast de disconnect (sem flicker)", () => {
		const timers = makeFakeTimers();
		const localService = new WSService(
			hub,
			logger,
			undefined,
			timers.setTimeoutFn,
			timers.clearTimeoutFn,
		);

		const ana = new MockBunWS("127.0.0.1");
		localService.onOpen(ana);
		localService.onMessage(
			ana,
			JSON.stringify({
				type: "hello",
				payload: { uuid: ANA_UUID, nick: "Ana" },
			}),
		);
		const code = ana.data.code!;

		const bob = new MockBunWS("127.0.0.2");
		localService.onOpen(bob);
		localService.onMessage(
			bob,
			JSON.stringify({
				type: "hello",
				payload: { uuid: BOB_UUID, nick: "Bob", code },
			}),
		);
		const bobPlayerId = bob.data.playerId!;
		expect(bobPlayerId).toBeTruthy();

		const baseline = ana.eventsOfType("room_state").length;

		// 1. Bob fecha WS — broadcast agendado, NÃO executa ainda.
		localService.onClose(bob, 1006, "abnormal_closure");
		expect(localService.hasPendingDisconnectBroadcast(bobPlayerId)).toBe(true);

		// 2. Antes da janela expirar, Bob reconecta.
		const newBob = new MockBunWS("127.0.0.2");
		localService.onOpen(newBob);
		localService.onMessage(
			newBob,
			JSON.stringify({
				type: "hello",
				payload: { uuid: BOB_UUID, nick: "Bob", code },
			}),
		);

		// handleHello cancelou o agendamento.
		expect(localService.hasPendingDisconnectBroadcast(bobPlayerId)).toBe(false);
		expect(newBob.data.playerId).toBe(bobPlayerId);

		// 3. Timer expira (sem efeito, foi cancelado).
		timers.runAll();
		expect(localService.hasPendingDisconnectBroadcast(bobPlayerId)).toBe(false);

		// 4. Peer (Ana) NÃO viu broadcast extra de disconnect — só o do
		//    welcome do reconnect.
		const after = ana.eventsOfType("room_state").length;
		expect(after - baseline).toBe(1);

		// 5. Status final do Bob = connected.
		const last = ana.lastRoomState()!;
		const bobFinal = last.payload.sala.players.find(
			(p) => p.id === bobPlayerId,
		);
		expect(bobFinal?.status).toBe("connected");

		// 6. Sem player_left/joined espúrios.
		expect(ana.eventsOfType("player_left")).toHaveLength(0);
		expect(ana.eventsOfType("player_joined")).toHaveLength(0);
	});

	test("disconnect permanente (sem reconnect dentro de 1.5s): peer VÊ status='disconnected'", () => {
		const timers = makeFakeTimers();
		const localService = new WSService(
			hub,
			logger,
			undefined,
			timers.setTimeoutFn,
			timers.clearTimeoutFn,
		);

		const ana = new MockBunWS("127.0.0.1");
		localService.onOpen(ana);
		localService.onMessage(
			ana,
			JSON.stringify({
				type: "hello",
				payload: { uuid: ANA_UUID, nick: "Ana" },
			}),
		);
		const code = ana.data.code!;

		const bob = new MockBunWS("127.0.0.2");
		localService.onOpen(bob);
		localService.onMessage(
			bob,
			JSON.stringify({
				type: "hello",
				payload: { uuid: BOB_UUID, nick: "Bob", code },
			}),
		);
		const bobPlayerId = bob.data.playerId!;

		const baseline = ana.eventsOfType("room_state").length;

		localService.onClose(bob, 1006, "abnormal_closure");
		expect(localService.hasPendingDisconnectBroadcast(bobPlayerId)).toBe(true);

		// Ninguém reconecta. Janela expira.
		timers.runAll();

		const after = ana.eventsOfType("room_state").length;
		expect(after - baseline).toBe(1);
		const last = ana.lastRoomState()!;
		const bobFinal = last.payload.sala.players.find(
			(p) => p.id === bobPlayerId,
		);
		expect(bobFinal?.status).toBe("disconnected");
	});

	test("5 reconnects rápidos: peer vê APENAS 5 broadcasts (reconnect, sem disconnect)", () => {
		const timers = makeFakeTimers();
		const localService = new WSService(
			hub,
			logger,
			undefined,
			timers.setTimeoutFn,
			timers.clearTimeoutFn,
		);

		const ana = new MockBunWS("127.0.0.1");
		localService.onOpen(ana);
		localService.onMessage(
			ana,
			JSON.stringify({
				type: "hello",
				payload: { uuid: ANA_UUID, nick: "Ana" },
			}),
		);
		const code = ana.data.code!;

		const bob = new MockBunWS("127.0.0.2");
		localService.onOpen(bob);
		localService.onMessage(
			bob,
			JSON.stringify({
				type: "hello",
				payload: { uuid: BOB_UUID, nick: "Bob", code },
			}),
		);
		const bobPlayerId = bob.data.playerId!;

		const baseline = ana.eventsOfType("room_state").length;

		let currentBob: MockBunWS = bob;
		for (let i = 0; i < 5; i++) {
			localService.onClose(currentBob, 1006, "abnormal_closure");
			const newBob = new MockBunWS("127.0.0.2");
			localService.onOpen(newBob);
			localService.onMessage(
				newBob,
				JSON.stringify({
					type: "hello",
					payload: { uuid: BOB_UUID, nick: "Bob", code },
				}),
			);
			expect(newBob.data.playerId).toBe(bobPlayerId);
			currentBob = newBob;
		}
		timers.runAll();

		// 5 reconnects com debounce: 5 broadcasts extras (1 por reconnect welcome).
		const after = ana.eventsOfType("room_state").length;
		expect(after - baseline).toBe(5);

		expect(ana.eventsOfType("player_left")).toHaveLength(0);
		expect(ana.eventsOfType("player_joined")).toHaveLength(0);

		const last = ana.lastRoomState()!;
		const bobFinal = last.payload.sala.players.find(
			(p) => p.id === bobPlayerId,
		);
		expect(bobFinal?.status).toBe("connected");

		expect(localService.hasPendingDisconnectBroadcast(bobPlayerId)).toBe(false);

		// **Coverage crítica**: a sala DEVE ter apenas 2 players (Ana + Bob).
		// Cal não foi adicionado porque usamos só 2 clientes neste teste.
		const sala = hub.getSala(code)!;
		expect(sala.playerCount).toBe(2);
		const bobCount = Array.from(sala.players.values()).filter(
			(p) => p.uuid === BOB_UUID,
		).length;
		expect(bobCount).toBe(1);
	});
});

describe("WSService — flicker issue #59: idempotência de reconnect", () => {
	test("reconnect único: server reusa o mesmo playerId (reidratação)", () => {
		const { ana, bob } = setupThreeClients();
		const baseline = ana.eventsOfType("room_state").length;

		const newBob = reconnectBob(bob);

		// 1. Server reusou o mesmo playerId.
		expect(newBob.data.playerId).toBe(bob.data.playerId);

		// 2. Nenhum player_left/player_joined para o próprio reconnect.
		expect(ana.eventsOfType("player_left")).toHaveLength(0);
		expect(ana.eventsOfType("player_joined")).toHaveLength(0);

		// 3. **Debounce (issue #59 fix)**: peer NÃO vê broadcast de disconnect.
		//    Só vê 1 broadcast extra (o do welcome do reconnect). Antes do fix,
		//    esse número era 2 (1 disconnect immediate + 1 reconnect welcome).
		const after = ana.eventsOfType("room_state").length;
		expect(after - baseline).toBe(1);

		// 4. Status do Bob volta para 'connected' no último broadcast.
		const lastRS = ana.lastRoomState();
		const bobFinal = lastRS!.payload.sala.players.find(
			(p) => p.id === bob.data.playerId,
		);
		expect(bobFinal?.status).toBe("connected");
	});

	test("5 reconexões rápidas: peer (Ana) NÃO vê player_left/joined, vê no máximo 10 room_states extras", () => {
		const { ana } = setupThreeClients();
		const code = ana.data.code!;
		const initialBobId = Array.from(hub.getSala(code)!.players.values()).find(
			(p) => p.uuid === BOB_UUID,
		)!.id;

		// Encontra o MockBunWS inicial do Bob. Após o setup, o ws que tem
		// playerId === initialBobId é o original — procuramos pela referência
		// armazenada no ctx do próprio registro de conexões. Mas como não temos
		// getter público, usamos uma heurística confiável: o único ws que
		// recebeu 'welcome' como Bob é o que tem data.playerId === initialBobId
		// e data.code === code. Em nosso setup, a única `bob` local é o inicial.
		// Para testes determinísticos, expomos o `bob` original via closure
		// no helper (ver setupThreeClients — aqui usamos trick de games):
		// simulamos 5 reconnects a partir da referência da variável `bob`
		// passada a partir de setupThreeClients(). Mas como `bob` é local ao
		// setup, replicamos a sequência reconectando por uma nova conexão
		// após a primeira iteration — usamos uma referência estática:
		const origBobWs = pickWsByPlayerId(service, initialBobId)!;
		expect(origBobWs).toBeDefined();

		const baseline = ana.eventsOfType("room_state").length;
		let currentBob = origBobWs;
		for (let i = 0; i < 5; i++) {
			currentBob = reconnectBob(currentBob);
			// Cada reconnect preserva o mesmo playerId.
			expect(currentBob.data.playerId).toBe(initialBobId);
		}

		// Verificação: nenhum player_left/joined para o próprio Bob.
		const left = ana.eventsOfType("player_left");
		const joined = ana.eventsOfType("player_joined");
		expect(left).toHaveLength(0);
		expect(joined).toHaveLength(0);

		// **Debounce (issue #59 fix)**: peer só vê 5 broadcasts (reconnect
		// welcome ×5). Antes do fix, eram 10 (5 disconnect immediate + 5
		// reconnect welcome). Com debounce, cada disconnect broadcast é
		// cancelado quando o reconnect chega dentro de 1.5s.
		const after = ana.eventsOfType("room_state");
		const diff = after.length - baseline;
		expect(diff).toBe(5);

		// O último room_state mostra Bob como connected.
		const last = ana.lastRoomState();
		const bobFinal = last!.payload.sala.players.find(
			(p) => p.id === initialBobId,
		);
		expect(bobFinal?.status).toBe("connected");

		// Sala tem APENAS 3 players — Bob não foi duplicado.
		const sala = hub.getSala(code)!;
		expect(sala.playerCount).toBe(3);
		const bobCount = Array.from(sala.players.values()).filter(
			(p) => p.uuid === BOB_UUID,
		).length;
		expect(bobCount).toBe(1);
	});

	test("5 reconexões: sequência de status do Bob segue connected→disconnected→connected sem flicker aleatório", () => {
		const { ana } = setupThreeClients();
		const code = ana.data.code!;
		const initialBobId = Array.from(hub.getSala(code)!.players.values()).find(
			(p) => p.uuid === BOB_UUID,
		)!.id;
		const origBobWs = pickWsByPlayerId(service, initialBobId)!;

		// 5 reconexões.
		let currentBob = origBobWs;
		for (let i = 0; i < 5; i++) {
			currentBob = reconnectBob(currentBob);
		}

		// Captura sequência de status do Bob em cada room_state.
		const roomStates = ana.eventsOfType("room_state");
		const bobStatuses = roomStates
			.map(
				(rs) =>
					rs.payload.sala.players.find((p) => p.id === initialBobId)?.status,
			)
			.filter(
				(s): s is "connected" | "disconnected" => s !== undefined,
			);

		// Última posição deve ser 'connected' (reconnect final bem-sucedido).
		expect(bobStatuses[bobStatuses.length - 1]).toBe("connected");

		// Primeira posição deve ser 'connected' (baseline).
		expect(bobStatuses[0]).toBe("connected");

		// Não deve haver 2 'disconnected' consecutivos
		// (sinal de reconnect duplicado).
		let consecutiveDisconnected = 0;
		let maxConsecutive = 0;
		for (const s of bobStatuses) {
			if (s === "disconnected") {
				consecutiveDisconnected += 1;
				maxConsecutive = Math.max(maxConsecutive, consecutiveDisconnected);
			} else {
				consecutiveDisconnected = 0;
			}
		}
		expect(maxConsecutive).toBeLessThanOrEqual(1);

		// **Debounce (issue #59 fix)**: cada reconnect cancela o disconnect
		// pending, então peer NÃO vê transições de status intermediárias.
		// Só vê 5 transições 'connected' (uma por reconnect welcome).
		// Antes do fix: ≥11 (5 × (D + C)).
		expect(bobStatuses.length).toBeGreaterThanOrEqual(6);
		// Todas posições devem ser 'connected' (nunca viu disconnected).
		expect(bobStatuses.every((s) => s === "connected")).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Helper: encontra o MockBunWS pelo playerId. Como WSService mantém
// connections: Set<BunWS>, podemos iterar via cast. (Test-only; não
// depende de APIs públicas do serviço.)
// ---------------------------------------------------------------------------

function pickWsByPlayerId(
	svc: WSService,
	playerId: string,
): MockBunWS | null {
	// Acessa o Set privado de conexões via cast.
	const internal = svc as unknown as {
		connections: Set<BunWS>;
	};
	for (const ws of internal.connections) {
		if (ws.data.playerId === playerId) {
			return ws as unknown as MockBunWS;
		}
	}
	return null;
}

// ===========================================================================
// Documentação para reprodução manual (Playwright/E2E):
//
// # Como reproduzir o flicker via Playwright (e2e):
//
// 1. Subir dev server:
//      bun run dev
//
// 2. Abrir 3 abas em http://localhost:5173/join:
//      Aba 1: nick="Ana" → criar sala
//      Aba 2: nick="Bob" + code → entrar
//      Aba 3: nick="Cal" + code → entrar
//
// 3. Em DevTools → Network → WS, capturar frames de qualquer aba.
//
// 4. Disparar N reconnects rápidos na aba Bob:
//      for (let i=0;i<5;i++)
//        setTimeout(() => {
//          const ws = new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws');
//          ws.onopen = () => { ws.send(JSON.stringify({type:'hello',payload:{uuid:'<UUID>',nick:'Bob',code:'<CODE>'}})); ws.close(); };
//        }, i*200);
//
// 5. **Antes do fix**: Aba Ana vê N×3 broadcasts (player_left + room_state +
//    room_state com player novo) com flicker — jogador some e volta.
//    **Depois do fix**: N×2 broadcasts, sem player_left/joined.
//
// # Como rodar este unit test:
//
//      cd /tmp/pointly-loop-59
//      bun test src/ws-flicker.test.ts
//
// ===========================================================================
