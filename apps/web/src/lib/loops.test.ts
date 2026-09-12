/**
 * loops — colocated (bun:test). Dispatch S→C com store fake + navigate mock.
 *
 * Cobre: welcome/room_state, vote_cast individual+aggregate (guard revealed),
 * votes_revealed, round_started, player_left, sala_ended (3 reasons),
 * error (sala_cheia→/full; demais→toast sem sair), projectile fan-out,
 * senders C→S sem chaves extras.
 */
import { afterEach, describe, expect, mock, test } from "bun:test";
import "../test-jsdom";
import type { SalaState, ServerToClientEvent, Vote } from "@planning-poker/shared";
import {
	__resetProjectilesForTests,
	connectArena,
	dispatchArenaEvent,
	sendCastVote,
	sendHello,
	sendNewRound,
	sendProjectile,
	sendReveal,
	subscribeProjectiles,
	type LoopsHooks,
	type LoopsStoreApi,
} from "./loops";
import type {
	CreateWSClientOptions,
	WSClient,
	WSStatus,
} from "./ws-client";
import { useSalaStore } from "@/store/sala";
import { __resetToastsForTests } from "@/components/feedback/toast";

function makeSala(overrides: Partial<SalaState> = {}): SalaState {
	return {
		code: "AB12",
		hostId: "p_1",
		players: [
			{
				id: "p_1",
				uuid: "00000000-0000-4000-8000-000000000000",
				nick: "Helder",
				role: "host",
				seatIndex: 0,
				hasVoted: false,
				value: null,
				status: "connected",
				joinedAt: 1,
			},
		],
		phase: "idle",
		round: 1,
		timer: 60,
		votes: {},
		createdAt: 1,
		...overrides,
	};
}

function makeStore(overrides: Partial<LoopsStoreApi> = {}): LoopsStoreApi & {
	calls: string[];
} {
	const calls: string[] = [];
	return {
		calls,
		setSala: (..._a) => void calls.push("setSala"),
		setTimerActive: (..._a) => void calls.push("setTimerActive"),
		setCurrentPlayerId: (..._a) => void calls.push("setCurrentPlayerId"),
		removePlayerById: (..._a) => void calls.push("removePlayerById"),
		markVoted: (..._a) => void calls.push("markVoted"),
		applyReveal: (..._a) => void calls.push("applyReveal"),
		resetForNewRound: (..._a) => void calls.push("resetForNewRound"),
		setSalaEnded: (..._a) => void calls.push("setSalaEnded"),
		getPhase: () => "voting",
		getCode: () => null,
		...overrides,
	};
}

const hooks: LoopsHooks = { navigate: mock(() => {}) };

afterEach(() => {
	__resetProjectilesForTests();
	__resetToastsForTests();
	useSalaStore.getState().reset();
	(hooks.navigate as ReturnType<typeof mock>).mockClear();
});

describe("dispatchArenaEvent", () => {
	test("welcome seta playerId + sala", () => {
		const store = makeStore();
		dispatchArenaEvent(
			store,
			{
				type: "welcome",
				payload: { playerId: "p_1", role: "host", sala: makeSala() },
			},
			hooks,
		);
		expect(store.calls).toEqual(["setCurrentPlayerId", "setSala"]);
	});

	test("room_state chama setSala; player_joined é ignorado", () => {
		const store = makeStore();
		dispatchArenaEvent(
			store,
			{ type: "room_state", payload: { sala: makeSala() } },
			hooks,
		);
		expect(store.calls).toEqual(["setSala"]);
		store.calls.length = 0;
		dispatchArenaEvent(
			store,
			{
				type: "player_joined",
				payload: { player: { id: "p_2", nick: "Maya", seatIndex: 1, role: "player" } },
			} as unknown as ServerToClientEvent,
			hooks,
		);
		expect(store.calls).toEqual([]);
	});

	test("vote_cast individual marca voto + liga timer; aggregate só toasta + liga timer", () => {
		const store = makeStore();
		dispatchArenaEvent(
			store,
			{
				type: "vote_cast",
				payload: { kind: "individual", playerId: "p_1", playerName: "Helder" },
			},
			hooks,
		);
		expect(store.calls).toEqual(["setTimerActive", "markVoted"]);
		store.calls.length = 0;
		dispatchArenaEvent(
			store,
			{ type: "vote_cast", payload: { kind: "aggregate", count: 3 } },
			hooks,
		);
		// aggregate NUNCA adivinha quem votou (sem playerId no payload) —
		// só liga o timer; o N-de-M reconcilia via room_state.
		expect(store.calls).toEqual(["setTimerActive"]);
	});

	test("vote_cast ignorado quando phase revealed", () => {
		const store = makeStore({ getPhase: () => "revealed" });
		dispatchArenaEvent(
			store,
			{
				type: "vote_cast",
				payload: { kind: "individual", playerId: "p_1", playerName: "Helder" },
			},
			hooks,
		);
		expect(store.calls).toEqual([]);
	});

	test("votes_revealed aplica votos + stats; round_started reseta", () => {
		const store = makeStore();
		let applied: unknown = null;
		store.applyReveal = ((v: unknown, s: unknown) => {
			applied = { v, s };
		}) as LoopsStoreApi["applyReveal"];
		dispatchArenaEvent(
			store,
			{
				type: "votes_revealed",
				payload: {
					votes: { p_1: "5" },
					median: 5,
					mean: 5,
					range: [5, 5],
					unanimous: true,
				},
			},
			hooks,
		);
		expect(applied).toEqual({
			v: { p_1: "5" },
			s: { median: 5, mean: 5, range: [5, 5], unanimous: true },
		});
		dispatchArenaEvent(store, { type: "round_started", payload: { round: 2 } }, hooks);
		expect(store.calls).toContain("resetForNewRound");
	});

	test("player_left remove", () => {
		const store = makeStore();
		dispatchArenaEvent(store, { type: "player_left", payload: { playerId: "p_9" } }, hooks);
		expect(store.calls).toEqual(["removePlayerById"]);
	});

	test("sala_ended: toast + nav / nos 3 reasons", () => {
		for (const reason of ["last_left", "server_restart", "replaced"] as const) {
			const store = makeStore();
			dispatchArenaEvent(store, { type: "sala_ended", payload: { reason } }, hooks);
			expect(store.calls).toEqual(["setSalaEnded"]);
			expect(hooks.navigate).toHaveBeenCalledWith("/");
			(hooks.navigate as ReturnType<typeof mock>).mockClear();
		}
	});

	test("error sala_cheia → /full; sala_nao_encontrada → /join; demais → toast sem sair", () => {
		const store = makeStore();
		dispatchArenaEvent(
			store,
			{ type: "error", payload: { code: "sala_cheia" } },
			hooks,
		);
		expect(hooks.navigate).toHaveBeenCalledWith("/full");
		(hooks.navigate as ReturnType<typeof mock>).mockClear();

		dispatchArenaEvent(
			store,
			{ type: "error", payload: { code: "sala_nao_encontrada" } },
			hooks,
		);
		expect(hooks.navigate).toHaveBeenCalledWith("/join");
		(hooks.navigate as ReturnType<typeof mock>).mockClear();

		for (const code of ["invalid_phase", "rate_limited"] as const) {
			dispatchArenaEvent(store, { type: "error", payload: { code } }, hooks);
		}
		expect(hooks.navigate).not.toHaveBeenCalled();
	});

	test("erros de sala preservam ?code= conhecido (store primeiro, hooks depois)", () => {
		const withStoreCode = makeStore({ getCode: () => "AB12" });
		dispatchArenaEvent(
			withStoreCode,
			{ type: "error", payload: { code: "sala_cheia" } },
			hooks,
		);
		expect(hooks.navigate).toHaveBeenCalledWith("/full?code=AB12");
		(hooks.navigate as ReturnType<typeof mock>).mockClear();
		dispatchArenaEvent(
			withStoreCode,
			{ type: "error", payload: { code: "sala_nao_encontrada" } },
			hooks,
		);
		expect(hooks.navigate).toHaveBeenCalledWith("/join?code=AB12");
		(hooks.navigate as ReturnType<typeof mock>).mockClear();

		const withHooksCode = makeStore();
		const hooksWithCode: LoopsHooks = {
			navigate: hooks.navigate,
			code: "ZZ99",
		};
		dispatchArenaEvent(
			withHooksCode,
			{ type: "error", payload: { code: "sala_cheia" } },
			hooksWithCode,
		);
		expect(hooks.navigate).toHaveBeenCalledWith("/full?code=ZZ99");
		(hooks.navigate as ReturnType<typeof mock>).mockClear();
		dispatchArenaEvent(
			withHooksCode,
			{ type: "error", payload: { code: "sala_nao_encontrada" } },
			hooksWithCode,
		);
		expect(hooks.navigate).toHaveBeenCalledWith("/join?code=ZZ99");
		(hooks.navigate as ReturnType<typeof mock>).mockClear();
	});

	test("room_state repassa critical do server + liga timer só com votos", () => {
		const seen: Array<{ sala: SalaState; opts?: unknown }> = [];
		const store = makeStore({
			setSala: ((sala: SalaState, opts?: unknown) => {
				seen.push({ sala, opts });
			}) as LoopsStoreApi["setSala"],
		});
		// critical presente → passthrough (store usa sem recomputar)
		dispatchArenaEvent(
			store,
			{
				type: "room_state",
				payload: { sala: makeSala({ phase: "voting", timer: 45 }), critical: true },
			},
			hooks,
		);
		expect(seen).toHaveLength(1);
		expect(seen[0]?.opts).toMatchObject({ critical: true });
		// voting sem votos (fresh round timer=60) → timer parado
		expect(seen[0]?.opts).toMatchObject({ timerActive: false });

		seen.length = 0;
		dispatchArenaEvent(
			store,
			{
				type: "room_state",
				payload: {
					sala: makeSala({
						phase: "voting",
						timer: 55,
						votes: { p_1: "5" as Vote },
					}),
				},
			},
			hooks,
		);
		expect(seen[0]?.opts).toMatchObject({ timerActive: true });
		// critical omitido → sem override (store faz fallback local)
		expect(seen[0]?.opts).not.toMatchObject({ critical: expect.anything() });
	});

	test("projectile_thrown faz fan-out pros assinantes", () => {
		const store = makeStore();
		const seen: unknown[] = [];
		const unsub = subscribeProjectiles((e) => seen.push(e));
		dispatchArenaEvent(
			store,
			{
				type: "projectile_thrown",
				payload: {
					senderPlayerId: "p_1",
					targetPlayerId: "p_2",
					projectileType: "tomato",
					outcome: "hit",
				},
			},
			hooks,
		);
		expect(seen).toHaveLength(1);
		unsub();
	});
});

describe("senders C→S", () => {
	test("payloads strict sem chaves extras; hello omite code vazio", () => {
		const sent: unknown[] = [];
		const ws = { send: (e: unknown) => void sent.push(e) };
		sendHello(ws, {
			uuid: "00000000-0000-4000-8000-000000000000",
			nick: "Helder",
			code: "",
		});
		sendCastVote(ws, "5" as Vote);
		sendReveal(ws);
		sendNewRound(ws);
		sendProjectile(ws, "p_2", "tomato");
		expect(sent).toEqual([
			{
				type: "hello",
				payload: { uuid: "00000000-0000-4000-8000-000000000000", nick: "Helder" },
			},
			{ type: "cast_vote", payload: { value: "5" } },
			{ type: "reveal_votes", payload: {} },
			{ type: "start_new_round", payload: {} },
			{
				type: "throw_projectile",
				payload: { targetPlayerId: "p_2", projectileType: "tomato" },
			},
		]);
	});
});

describe("connectArena close — leave_room", () => {
	function makeFakeFactory() {
		const order: string[] = [];
		const sent: unknown[] = [];
		let opts: CreateWSClientOptions | null = null;
		let status: WSStatus = "open";
		const factory = (o: CreateWSClientOptions): WSClient => {
			opts = o;
			return {
				connect: () => {},
				send: (e: unknown) => {
					order.push(`send:${(e as { type: string }).type}`);
					sent.push(e);
				},
				close: () => void order.push("close"),
				getStatus: () => status,
			};
		};
		const fireWelcome = () =>
			opts?.onEvent({
				type: "welcome",
				payload: { playerId: "p_1", role: "host", sala: makeSala() },
			} as ServerToClientEvent);
		return {
			factory,
			fireWelcome,
			sent,
			order,
			setStatus: (s: WSStatus) => void (status = s),
		};
	}

	function connect(factory: (o: CreateWSClientOptions) => WSClient) {
		return connectArena({
			nick: "Helder",
			code: "AB12",
			uuid: "00000000-0000-4000-8000-000000000000",
			navigate: () => {},
			clientFactory: factory,
		});
	}

	test("welcome recebido + socket aberto → leave_room ANTES do close", () => {
		const fake = makeFakeFactory();
		const conn = connect(fake.factory);
		fake.fireWelcome();
		conn.close();
		expect(fake.sent).toEqual([{ type: "leave_room", payload: {} }]);
		expect(fake.order).toEqual(["send:leave_room", "close"]);
	});

	test("sem welcome → close sem leave_room", () => {
		const fake = makeFakeFactory();
		const conn = connect(fake.factory);
		conn.close();
		expect(fake.sent).toEqual([]);
		expect(fake.order).toEqual(["close"]);
	});

	test("welcome recebido mas socket fechado → close sem leave_room", () => {
		const fake = makeFakeFactory();
		const conn = connect(fake.factory);
		fake.fireWelcome();
		fake.setStatus("closed");
		conn.close();
		expect(fake.sent).toEqual([]);
		expect(fake.order).toEqual(["close"]);
	});
});
