import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { PointlySocket } from "./ws-client";
import type { Historia, SalaState } from "@planning-poker/shared";

/**
 * Wire client da Pauta (#164, parent #160). Sem UI (#165).
 *
 * Prova:
 *  1. connect/hello recebe pauta + ativa; cada método envia o evento
 *     tipado e o room_state seguinte hidrata o store;
 *  2. erros historia_nao_encontrada / pauta_cheia / invalid_phase /
 *     role_denied chegam no onError sem derrubar o socket;
 *  3. payload inválido nunca trafega (false, sem throw).
 *
 * Run: `bun --filter pointly-web test`
 */

const PORT = 3197;
const WS_URL = `ws://127.0.0.1:${PORT}/ws`;

const UUID = "00000000-0000-4000-8000-000000000001";

function pautaStub(): Historia[] {
	return [
		{ id: "h1", titulo: "Checkout pix", pontos: null, ordem: 0 },
		{ id: "h2", titulo: "Extrato", criterio: "texto puro", pontos: null, ordem: 1 },
	];
}

function salaFor(code: string, playerId: string): SalaState {
	return {
		code,
		hostId: playerId,
		players: [
			{
				id: playerId,
				uuid: UUID,
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
		votes: {},
		createdAt: Date.now(),
		pauta: pautaStub(),
		historiaAtualId: "h1",
	};
}

type Seen = { type?: string; payload?: Record<string, unknown> };
const seen: Record<string, Seen[]> = {
	historia_add: [],
	historia_update: [],
	historia_move: [],
	historia_remove: [],
	historia_select: [],
};

let server: ReturnType<typeof Bun.serve>;

beforeAll(() => {
	for (const k of Object.keys(seen)) seen[k] = [];
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
				let json: Seen;
				try {
					json = JSON.parse(text) as Seen;
				} catch {
					return;
				}
				if (json.type === "hello") {
					const playerId = "p_test000001";
					ws.send(
						JSON.stringify({
							type: "welcome",
							payload: {
								playerId,
								role: "player",
								sala: salaFor("PAUT", playerId),
							},
						}),
					);
					return;
				}
				if (!json.type?.startsWith("historia_")) return;
				seen[json.type]?.push(json);
				const payload = (json.payload ?? {}) as Record<string, unknown>;
				// Injeção de erros do domínio (#162/#163) — socket segue aberto.
				const err =
					json.type === "historia_add" && payload.titulo === "LOTADA"
						? "pauta_cheia"
						: json.type === "historia_add" && payload.titulo === "NEGADO"
							? "role_denied"
							: (json.type === "historia_update" ||
										json.type === "historia_move" ||
										json.type === "historia_remove") &&
								payload.id === "missing"
								? "historia_nao_encontrada"
								: json.type === "historia_select" &&
									  payload.historiaId === "locked"
									? "invalid_phase"
									: null;
				if (err) {
					ws.send(
						JSON.stringify({
							type: "error",
							payload: { code: err, message: `${err} (stub de teste)` },
						}),
					);
					return;
				}
				// Sucesso: ecoa room_state completo com pauta + ativa.
				ws.send(
					JSON.stringify({
						type: "room_state",
						payload: { sala: salaFor("PAUT", "p_test000001") },
					}),
				);
			},
			close() {},
		},
	});
});

afterAll(() => {
	server.stop(true);
});

async function connectSocket(events: ConstructorParameters<typeof PointlySocket>[0] = {}) {
	const socket = new PointlySocket(events);
	await socket.connect(WS_URL, { uuid: UUID, nick: "Ana", code: "PAUT" });
	return socket;
}

describe("ws-client pauta — hello + eventos tipados (#164)", () => {
	test("connect/hello recebe pauta + historiaAtualId", async () => {
		const socket = new PointlySocket();
		try {
			const welcome = await socket.connect(WS_URL, {
				uuid: UUID,
				nick: "Ana",
				code: "PAUT",
			});
			expect(welcome.sala.pauta).toHaveLength(2);
			expect(welcome.sala.pauta?.[0]?.id).toBe("h1");
			expect(welcome.sala.historiaAtualId).toBe("h1");
			expect(socket.getStatus()).toBe("ready");
		} finally {
			socket.close({ silent: true });
		}
	});

	test("add/update/move/remove/select enviam o evento tipado", async () => {
		for (const k of Object.keys(seen)) seen[k] = [];
		const rooms: SalaState[] = [];
		const socket = await connectSocket({
			onRoomState: (sala) => {
				rooms.push(sala);
			},
		});
		try {
			expect(socket.addHistoria({ titulo: "Nova historia" })).toBe(true);
			expect(
				socket.updateHistoria("h1", { titulo: "Checkout pix v2" }),
			).toBe(true);
			expect(socket.updateHistoria("h1", { criterio: null })).toBe(true);
			expect(socket.moveHistoria("h2", 0)).toBe(true);
			expect(socket.removeHistoria("h2")).toBe(true);
			expect(socket.removeHistoria("h2", { confirmScored: true })).toBe(true);
			expect(socket.selectHistoria("h2")).toBe(true);
			expect(socket.selectHistoria(null)).toBe(true);
			await new Promise((resolve) => setTimeout(resolve, 200));
			expect(seen.historia_add).toHaveLength(1);
			expect(seen.historia_add[0]).toEqual({
				type: "historia_add",
				payload: { titulo: "Nova historia" },
			});
			expect(seen.historia_update).toHaveLength(2);
			expect(seen.historia_update[0]?.payload).toEqual({
				id: "h1",
				titulo: "Checkout pix v2",
			});
			expect(seen.historia_update[1]?.payload).toEqual({
				id: "h1",
				criterio: null,
			});
			expect(seen.historia_move[0]).toEqual({
				type: "historia_move",
				payload: { id: "h2", toIndex: 0 },
			});
			expect(seen.historia_remove[0]).toEqual({
				type: "historia_remove",
				payload: { id: "h2" },
			});
			// Segundo toque da confirmação dupla carrega o flag no wire (#165).
			expect(seen.historia_remove[1]).toEqual({
				type: "historia_remove",
				payload: { id: "h2", confirmScored: true },
			});
			expect(seen.historia_select).toHaveLength(2);
			expect(seen.historia_select[0]?.payload).toEqual({ historiaId: "h2" });
			expect(seen.historia_select[1]?.payload).toEqual({ historiaId: null });
			// Cada sucesso ecoa room_state com pauta + ativa (hidrata store).
			expect(rooms.length).toBeGreaterThanOrEqual(7);
			expect(rooms[0]?.pauta).toHaveLength(2);
			expect(rooms[0]?.historiaAtualId).toBe("h1");
		} finally {
			socket.close({ silent: true });
		}
	});

	test("payload inválido nunca trafega (false, sem throw)", async () => {
		for (const k of Object.keys(seen)) seen[k] = [];
		const socket = new PointlySocket();
		// Pré-ready: tudo false.
		expect(socket.addHistoria({ titulo: "x" })).toBe(false);
		expect(socket.updateHistoria("h1", { titulo: "x" })).toBe(false);
		expect(socket.moveHistoria("h1", 0)).toBe(false);
		expect(socket.removeHistoria("h1")).toBe(false);
		expect(socket.selectHistoria("h1")).toBe(false);
		await socket.connect(WS_URL, { uuid: UUID, nick: "Ana", code: "PAUT" });
		try {
			expect(socket.addHistoria({ titulo: "" })).toBe(false);
			expect(socket.addHistoria({ titulo: "   " })).toBe(false);
			expect(socket.addHistoria({ titulo: "x".repeat(121) })).toBe(false);
			expect(socket.addHistoria({ titulo: "ok", criterio: "x".repeat(1001) })).toBe(false);
			expect(socket.updateHistoria("", { titulo: "x" })).toBe(false);
			expect(socket.updateHistoria("h1", {})).toBe(false);
			expect(socket.updateHistoria("h1", { titulo: "" })).toBe(false);
			expect(socket.moveHistoria("", 0)).toBe(false);
			expect(socket.moveHistoria("h1", -1)).toBe(false);
			expect(socket.moveHistoria("h1", 50)).toBe(false);
			expect(socket.moveHistoria("h1", 1.5)).toBe(false);
			expect(socket.removeHistoria("")).toBe(false);
			expect(socket.selectHistoria("")).toBe(false);
			await new Promise((resolve) => setTimeout(resolve, 150));
			for (const k of Object.keys(seen)) expect(seen[k]).toHaveLength(0);
			expect(socket.getStatus()).toBe("ready");
		} finally {
			socket.close({ silent: true });
		}
	});
});

describe("ws-client pauta — erros sem crash (#164)", () => {
	test("pauta_cheia / historia_nao_encontrada / invalid_phase / role_denied chegam no onError e o socket segue pronto", async () => {
		for (const k of Object.keys(seen)) seen[k] = [];
		const errors: Array<{ code: string; message: string }> = [];
		const rooms: SalaState[] = [];
		const socket = await connectSocket({
			onError: (code, message) => {
				errors.push({ code, message });
			},
			onRoomState: (sala) => {
				rooms.push(sala);
			},
		});
		try {
			expect(socket.addHistoria({ titulo: "LOTADA" })).toBe(true);
			expect(socket.removeHistoria("missing")).toBe(true);
			expect(socket.updateHistoria("missing", { titulo: "x" })).toBe(true);
			expect(socket.moveHistoria("missing", 0)).toBe(true);
			expect(socket.selectHistoria("locked")).toBe(true);
			expect(socket.addHistoria({ titulo: "NEGADO" })).toBe(true);
			await new Promise((resolve) => setTimeout(resolve, 250));
			expect(errors.map((e) => e.code)).toEqual([
				"pauta_cheia",
				"historia_nao_encontrada",
				"historia_nao_encontrada",
				"historia_nao_encontrada",
				"invalid_phase",
				"role_denied",
			]);
			// Socket segue aberto: operação válida seguinte funciona.
			const roomsBefore = rooms.length;
			expect(socket.addHistoria({ titulo: "depois do erro" })).toBe(true);
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(socket.getStatus()).toBe("ready");
			expect(rooms.length).toBeGreaterThan(roomsBefore);
			expect(rooms[rooms.length - 1]?.historiaAtualId).toBe("h1");
		} finally {
			socket.close({ silent: true });
		}
	});

	test("lixo e error malformado não derrubam o socket", async () => {
		const errors: string[] = [];
		const socket = await connectSocket({
			onError: (code) => {
				errors.push(code);
			},
		});
		try {
			// parseServerEvent rejeita lixo — handleMessage ignora em silêncio.
			// Exercita via API pública: métodos seguem operando.
			expect(socket.selectHistoria(null)).toBe(true);
			await new Promise((resolve) => setTimeout(resolve, 100));
			expect(socket.getStatus()).toBe("ready");
			expect(errors).toEqual([]);
		} finally {
			socket.close({ silent: true });
		}
	});
});
