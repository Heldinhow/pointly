/**
 * ws-flicker-reconcile.test.ts — regressão para flicker visual persistente
 * pós-issue #58 + #59 + #92.
 *
 * Sintoma (relatado pelo usuário em prod 2026-07-11, branch loop/issue-66):
 * "quando tem varios usuarios meio que eles ficam se desconectando e
 *  conectando (pelo menos visualmente)".
 *
 * **Cenário coberto**: Bob desconecta (onClose). A janela de debounce de
 * 1.5s (#59) adia o broadcast de "disconnected" para peers. **MAS** o
 * reconciliation broadcast (linha 315 ws.ts) é independente — ele dispara
 * a cada 10s durante voting phase (`tick === 'ticking'`) usando o estado
 * ATUAL da sala, que já tem Bob como `status='disconnected'` desde o
 * `markDisconnected` chamado em `onClose`. Resultado: peers vêem Bob
 * como "disconnected" mesmo dentro da janela de debounce.
 *
 * Se Bob reconectar antes do reconciliation (em <10s), o flicker é
 * mínimo. Mas se o reconciliation coincidir com a janela de debounce
 * (cenário comum: Bob desconectou a 8s do último reconcile, reconnect a
 * 2s depois — peers vêem disconnected entre t=1.5 e t=2), peers notam
 * flicker.
 *
 * **Critério de aceitação**: durante a janela de debounce (1.5s após
 * onClose), nenhum broadcast (scheduled OU reconciliation) deve incluir
 * o player como `status='disconnected'`. Estado interno pode ser
 * 'disconnected' (para o grace period), mas peers NÃO devem ver isso.
 *
 * **Estratégia de fix proposta** (a ser confirmada no Phase 4):
 *  - Broadcast filtra status durante o debounce window
 *  - OU: estado interno NÃO vai para 'disconnected' imediatamente
 *  - OU: reconciliation broadcast pula players com debounce pendente
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { Hub } from "./hub";
import type { ServerToClientEvent } from "@planning-poker/shared";
import { Logger, MemorySink } from "./ws-logger";
import { WSService, type BunWS, type WSContext } from "./ws";

// ---------------------------------------------------------------------------
// Mock BunWS (cópia isolada de ws-flicker.test.ts)
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

	statusOf(playerId: string): string | undefined {
		const last = this.eventsOfType("room_state").at(-1);
		return last?.payload.sala.players.find((p) => p.id === playerId)?.status;
	}
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const ANA_UUID = "00000000-0000-4000-8000-00000000a001";
const BOB_UUID = "00000000-0000-4000-8000-00000000b002";

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WSService — flicker persistido: reconciliation broadcast durante debounce", () => {
	test("reconciliation broadcast DURANTE janela de debounce NÃO deve vazar status='disconnected'", () => {
		// Setup: Ana host + Bob player, ambos em voting phase
		const ana = new MockBunWS("127.0.0.1");
		service.onOpen(ana);
		service.onMessage(
			ana,
			JSON.stringify({
				type: "hello",
				payload: { uuid: ANA_UUID, nick: "Ana" },
			}),
		);
		const code = ana.data.code!;

		const bob = new MockBunWS("127.0.0.2");
		service.onOpen(bob);
		service.onMessage(
			bob,
			JSON.stringify({
				type: "hello",
				payload: { uuid: BOB_UUID, nick: "Bob", code },
			}),
		);
		const bobPlayerId = bob.data.playerId!;
		expect(bobPlayerId).toBeTruthy();

		// Force sala into voting phase (Bob casts a vote)
		service.onMessage(
			bob,
			JSON.stringify({
				type: "cast_vote",
				payload: { value: "5" },
			}),
		);
		// After vote, sala is voting → ticking → server may reconcile.

		// Note the baseline: count Ana's room_state events BEFORE Bob disconnects.
		const baseline = ana.eventsOfType("room_state").length;

		// ── Bob disconnects (t=0) ──
		// markDisconnected runs immediately; scheduled broadcast at t+1.5s.
		service.onClose(bob, 1006, "abnormal_closure");

		// Before debounce expires, manually trigger a reconciliation tick.
		// Reconciliation happens when sala is ticking AND lastBroadcast
		// was >=10s ago. We simulate: pretend lastBroadcastAt was old.
		// (In ws.ts, this is triggered by `service.tick(now)` which checks
		// `tickAllTimers`. We need to set up state such that tick returns
		// 'ticking' and lastBroadcastAt is old enough.)
		//
		// Simulate by calling tick at a time >=10s after the last vote.
		service.tick(Date.now() + 11_000);

		// Assertion: between the disconnect (baseline) and now,
		// NO room_state broadcast received by Ana should show Bob as
		// 'disconnected' (because we're still inside the debounce window).
		const eventsAfterDisconnect = ana.eventsOfType("room_state").slice(baseline);
		for (const ev of eventsAfterDisconnect) {
			const bobInSnapshot = ev.payload.sala.players.find(
				(p) => p.id === bobPlayerId,
			);
			expect(bobInSnapshot?.status).toBe("connected"); // ❌ HOJE FALHA AQUI
		}
	});

	test("reconnect dentro da janela de debounce: peers NÃO devem ver disconnected em nenhum broadcast", () => {
		// Setup similar ao teste anterior
		const ana = new MockBunWS("127.0.0.1");
		service.onOpen(ana);
		service.onMessage(
			ana,
			JSON.stringify({
				type: "hello",
				payload: { uuid: ANA_UUID, nick: "Ana" },
			}),
		);
		const code = ana.data.code!;

		const bob = new MockBunWS("127.0.0.2");
		service.onOpen(bob);
		service.onMessage(
			bob,
			JSON.stringify({
				type: "hello",
				payload: { uuid: BOB_UUID, nick: "Bob", code },
			}),
		);
		const bobPlayerId = bob.data.playerId!;

		// Bob vota → sala entra em voting
		service.onMessage(
			bob,
			JSON.stringify({
				type: "cast_vote",
				payload: { value: "5" },
			}),
		);

		const baseline = ana.eventsOfType("room_state").length;

		// Bob desconecta (t=0)
		service.onClose(bob, 1006, "abnormal_closure");

		// Reconciliation tick acontece durante a janela de debounce (t=1.0)
		service.tick(Date.now() + 1_000);

		// Bob reconecta (t=1.2, ainda dentro do debounce)
		const newBob = new MockBunWS("127.0.0.2");
		service.onOpen(newBob);
		service.onMessage(
			newBob,
			JSON.stringify({
				type: "hello",
				payload: { uuid: BOB_UUID, nick: "Bob", code },
			}),
		);
		expect(newBob.data.playerId).toBe(bobPlayerId);

		// Asserting: Ana NÃO deve ter visto Bob como 'disconnected' em
		// nenhum room_state entre baseline e agora.
		const eventsAfterDisconnect = ana.eventsOfType("room_state").slice(baseline);
		for (const ev of eventsAfterDisconnect) {
			const bobInSnapshot = ev.payload.sala.players.find(
				(p) => p.id === bobPlayerId,
			);
			expect(bobInSnapshot?.status).toBe("connected");
		}
	});
});