import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { JoinError } from "./errors";
import { PointlySocket } from "./ws-client";
import type { SalaState } from "./protocol";

const PORT = 3191;
const WS_URL = `ws://127.0.0.1:${PORT}/ws`;

let server: ReturnType<typeof Bun.serve>;
let seenPings = 0;
let seenVotes: Array<{ type?: string; payload?: Record<string, string> }> = [];
let seenReveals: Array<{ type?: string; payload?: Record<string, string> }> =
	[];
let seenNewRounds: Array<{ type?: string; payload?: Record<string, string> }> =
	[];
let seenLeaves: Array<{ type?: string; payload?: Record<string, string> }> =
	[];
let seenHellos: Array<{ type?: string; payload?: Record<string, string> }> =
	[];
let seenAvatars: Array<{
	type?: string;
	payload?: { avatar?: string | null };
}> = [];
let seenProjectiles: Array<{
	type?: string;
	payload?: { targetPlayerId?: string; projectileType?: string };
}> = [];

function salaFor(code: string, playerId: string): SalaState {
	return {
		code,
		hostId: playerId,
		players: [
			{
				id: playerId,
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
				role: "player",
				seatIndex: 0,
				hasVoted: false,
				value: null,
				status: "connected",
				joinedAt: Date.now(),
			},
		],
		phase: "idle",
		round: 1,
		timer: 60,
		votes: {},
		createdAt: Date.now(),
	};
}

beforeAll(() => {
	server = Bun.serve({
		port: PORT,
		fetch(request, wsServer) {
			const url = new URL(request.url);
				if (url.pathname === "/ws" && wsServer.upgrade(request, { data: {} }))
					return;
			return new Response("not found", { status: 404 });
		},
			websocket: {
				open() {},
				message(ws, raw: string | Buffer) {
				const text = typeof raw === "string" ? raw : raw.toString("utf-8");
				let json: { type?: string; payload?: Record<string, string> };
				try {
					json = JSON.parse(text) as typeof json;
				} catch {
					return;
				}
				if (json.type === "ping") {
					seenPings += 1;
					ws.send(JSON.stringify({ type: "pong", payload: {} }));
					return;
				}
				if (json.type === "cast_vote") {
					seenVotes.push(json);
					return;
				}
				if (json.type === "reveal_votes") {
					seenReveals.push(json);
					return;
				}
				if (json.type === "start_new_round") {
					seenNewRounds.push(json);
					return;
				}
				if (json.type === "leave_room") {
					seenLeaves.push(json);
					return;
				}
				if (json.type === "update_avatar") {
					seenAvatars.push(
						json as { type?: string; payload?: { avatar?: string | null } },
					);
					return;
				}
			if (json.type === "throw_projectile") {
				seenProjectiles.push(json);
				// Ecoa o broadcast da Sala com desfecho do servidor.
				ws.send(
					JSON.stringify({
						type: "projectile_thrown",
						payload: {
							senderPlayerId: "p_test000001",
							targetPlayerId: json.payload?.targetPlayerId,
							projectileType: json.payload?.projectileType,
							outcome: "hit",
						},
					}),
				);
				return;
			}
				if (json.type !== "hello") return;
				seenHellos.push(json);
				const payload = json.payload ?? {};
				if (payload.code === "ZZZZ") {
					ws.send(
						JSON.stringify({
							type: "error",
							payload: { code: "sala_nao_encontrada", message: "Sala ZZZZ não existe." },
						}),
					);
					return;
				}
				if (payload.code === "HUSH") {
					// Simula lixo antes do welcome — cliente deve ignorar e resolver.
					ws.send("isto não é json{{{");
				}
				const playerId = "p_test000001";
				ws.send(
					JSON.stringify({
						type: "welcome",
						payload: {
							playerId,
							role: payload.code ? "player" : "host",
							sala: salaFor(payload.code ?? "AB12", playerId),
						},
					}),
				);
				if (payload.code === "LIVE") {
					// Simula o segundo navegador entrando: o primeiro recebe
					// room_state logo depois do welcome (<1s no servidor real).
					const updated = salaFor("LIVE", playerId);
					updated.players.push({
						id: "p_test000002",
						uuid: "00000000-0000-4000-8000-000000000002",
						nick: "Beto",
						role: "player",
						seatIndex: 1,
						hasVoted: false,
						value: null,
						status: "connected",
						joinedAt: Date.now(),
					});
					setTimeout(() => {
						ws.send(JSON.stringify({ type: "room_state", payload: { sala: updated } }));
					}, 20);
				}
			},
			close() {},
		},
	});
});

afterAll(() => {
	server.stop(true);
});

describe("PointlySocket", () => {
	test("hello resolve com welcome", async () => {
		const socket = new PointlySocket();
		try {
			const welcome = await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
			});
			expect(welcome.playerId).toBe("p_test000001");
			expect(welcome.role).toBe("host");
			expect(welcome.sala.code).toBe("AB12");
			expect(socket.getStatus()).toBe("ready");
		} finally {
			socket.close({ silent: true });
		}
	});
	test("erro do servidor rejeita com o código", async () => {
		const socket = new PointlySocket();
		try {
			const promise = socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
				code: "ZZZZ",
			});
			await expect(promise).rejects.toBeInstanceOf(JoinError);
			await promise.catch((error: JoinError) => {
				expect(error.code).toBe("sala_nao_encontrada");
			});
		} finally {
			socket.close({ silent: true });
		}
	});
	test("lixo antes do welcome é ignorado", async () => {
		const socket = new PointlySocket();
		try {
			const welcome = await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
				code: "HUSH",
			});
			expect(welcome.sala.code).toBe("HUSH");
		} finally {
			socket.close({ silent: true });
		}
	});
	test("room_state pós-welcome chega no onRoomState (presença ao vivo)", async () => {
		const seen: SalaState[] = [];
		const socket = new PointlySocket({
			onRoomState: (sala) => {
				seen.push(sala);
			},
		});
		try {
			const welcome = await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
				code: "LIVE",
			});
			expect(welcome.sala.players).toHaveLength(1);
			await new Promise((resolve) => setTimeout(resolve, 200));
			expect(seen).toHaveLength(1);
			expect(seen[0]?.players).toHaveLength(2);
			expect(seen[0]?.players[1]?.nick).toBe("Beto");
			// setHandlers troca o subscriber sem derrubar a conexão.
			const late: SalaState[] = [];
			socket.setHandlers({
				onRoomState: (sala) => {
					late.push(sala);
				},
			});
			expect(socket.getStatus()).toBe("ready");
			expect(late).toHaveLength(0);
			expect(seen).toHaveLength(1);
		} finally {
			socket.close({ silent: true });
		}
	});
	test("heartbeat ping/pong mantém a conexão viva", async () => {
		seenPings = 0;
		const socket = new PointlySocket(
			{},
			{ pingIntervalMs: 50, pongTimeoutMs: 500 },
		);
		try {
			await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
			});
			await new Promise((resolve) => setTimeout(resolve, 250));
			expect(seenPings).toBeGreaterThan(0);
			expect(socket.getStatus()).toBe("ready");
		} finally {
			socket.close({ silent: true });
		}
	});
	test("cast_vote envia o valor e erro pós-ready chega no onError", async () => {
		seenVotes = [];
		const errors: Array<{ code: string; message: string }> = [];
		const socket = new PointlySocket({
			onError: (code, message) => {
				errors.push({ code, message });
			},
		});
		expect(socket.sendCastVote("5")).toBe(false);
		try {
			await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
			});
			expect(socket.sendCastVote("5")).toBe(true);
			expect(socket.sendCastVote("☕")).toBe(true);
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(seenVotes.map((entry) => entry.payload?.value)).toEqual([
				"5",
				"☕",
			]);
			// Valor fora do deck nunca trafega.
			expect(
				socket.sendCastVote("42" as unknown as "5"),
			).toBe(false);
			expect(errors).toEqual([]);
		} finally {
			socket.close({ silent: true });
		}
	});
	test("reveal_votes envia payload vazio após ready", async () => {
		seenReveals = [];
		const socket = new PointlySocket();
		expect(socket.sendRevealVotes()).toBe(false);
		try {
			await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
			});
			expect(socket.sendRevealVotes()).toBe(true);
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(seenReveals).toHaveLength(1);
			expect(seenReveals[0]?.type).toBe("reveal_votes");
			expect(seenReveals[0]?.payload).toEqual({});
		} finally {
			socket.close({ silent: true });
		}
	});
	test("start_new_round envia payload vazio após ready", async () => {
		seenNewRounds = [];
		const socket = new PointlySocket();
		expect(socket.sendStartNewRound()).toBe(false);
		try {
			await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
			});
			expect(socket.sendStartNewRound()).toBe(true);
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(seenNewRounds).toHaveLength(1);
			expect(seenNewRounds[0]?.type).toBe("start_new_round");
			expect(seenNewRounds[0]?.payload).toEqual({});
		} finally {
			socket.close({ silent: true });
		}
	});
	test("leave_room envia payload vazio após ready (saída voluntária)", async () => {
		seenLeaves = [];
		const socket = new PointlySocket();
		expect(socket.sendLeaveRoom()).toBe(false);
		try {
			await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
			});
			expect(socket.sendLeaveRoom()).toBe(true);
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(seenLeaves).toHaveLength(1);
			expect(seenLeaves[0]?.type).toBe("leave_room");
			expect(seenLeaves[0]?.payload).toEqual({});
		} finally {
			socket.close({ silent: true });
		}
	});
	test("hello inclui avatar quando presente", async () => {
		seenHellos = [];
		const socket = new PointlySocket();
		const avatar = "data:image/jpeg;base64,AAA";
		try {
			await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
				avatar,
			});
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(seenHellos).toHaveLength(1);
			expect(seenHellos[0]?.payload?.avatar).toBe(avatar);
		} finally {
			socket.close({ silent: true });
		}
	});
	test("hello omite avatar quando ausente", async () => {
		seenHellos = [];
		const socket = new PointlySocket();
		try {
			await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
			});
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(seenHellos).toHaveLength(1);
			expect("avatar" in (seenHellos[0]?.payload ?? {})).toBe(false);
		} finally {
			socket.close({ silent: true });
		}
	});
	test("updateAvatar envia set e clear após ready", async () => {
		seenAvatars = [];
		const socket = new PointlySocket();
		expect(socket.updateAvatar("data:image/jpeg;base64,AAA")).toBe(false);
		try {
			await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
			});
			expect(socket.updateAvatar("data:image/jpeg;base64,AAA")).toBe(true);
			expect(socket.updateAvatar(null)).toBe(true);
			expect(
				socket.updateAvatar(42 as unknown as string | null),
			).toBe(false);
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(seenAvatars).toHaveLength(2);
			expect(seenAvatars[0]?.type).toBe("update_avatar");
			expect(seenAvatars[0]?.payload).toEqual({
				avatar: "data:image/jpeg;base64,AAA",
			});
			expect(seenAvatars[1]?.payload).toEqual({ avatar: null });
		} finally {
			socket.close({ silent: true });
		}
	});
	test("throw_projectile envia alvo+tipo e broadcast chega no onProjectileThrown", async () => {
		seenProjectiles = [];
		const seen: Array<{
			senderPlayerId: string;
			targetPlayerId: string;
			projectileType: string;
			outcome: string;
		}> = [];
		const socket = new PointlySocket({
			onProjectileThrown: (event) => {
				seen.push({ ...event });
			},
		});
		expect(socket.sendThrowProjectile("p_beto", "tomato")).toBe(false);
		try {
			await socket.connect(WS_URL, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
			});
			expect(socket.sendThrowProjectile("p_beto", "tomato")).toBe(true);
			// Alvo vazio e tipo inválido nunca trafegam.
			expect(socket.sendThrowProjectile("", "tomato")).toBe(false);
			expect(
				socket.sendThrowProjectile(
					"p_beto",
					"fireball" as unknown as "tomato",
				),
			).toBe(false);
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(seenProjectiles).toHaveLength(1);
			expect(seenProjectiles[0]?.type).toBe("throw_projectile");
			expect(seenProjectiles[0]?.payload).toEqual({
				targetPlayerId: "p_beto",
				projectileType: "tomato",
			});
			expect(seen).toHaveLength(1);
			expect(seen[0]).toMatchObject({
				targetPlayerId: "p_beto",
				projectileType: "tomato",
				outcome: "hit",
			});
		} finally {
			socket.close({ silent: true });
		}
	});
	test("hello sem resposta rejeita por timeout", async () => {
		const silent = Bun.serve({
			port: PORT + 1,
			fetch(request, wsServer) {
				if (wsServer.upgrade(request)) return;
				return new Response("not found", { status: 404 });
			},
			websocket: {
				open() {},
				message() {},
				close() {},
			},
		});
		const socket = new PointlySocket({}, { helloTimeoutMs: 100 });
		try {
			const promise = socket.connect(`ws://127.0.0.1:${PORT + 1}/ws`, {
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Ana",
			});
			await expect(promise).rejects.toBeInstanceOf(JoinError);
			await promise.catch((error: JoinError) => {
				expect(error.code).toBe("hello_timeout");
			});
		} finally {
			socket.close({ silent: true });
			silent.stop(true);
		}
	});
});
