/**
 * Server HTTP integration tests — `GET /api/v1/salas/:code`.
 *
 * @see .specs/features/validate-room-existence/spec.md AC-1..AC-3
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { app, hub, __resetHubForTests } from "./index";
import type { Player } from "@planning-poker/shared";

function makeHost(id: string, nick: string): Player {
	return {
		id,
		uuid: `00000000-0000-4000-8000-${id.padStart(12, "0")}`,
		nick,
		role: "host",
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: Date.now(),
	};
}

beforeEach(() => {
	__resetHubForTests();
});

describe("GET /api/v1/salas/:code", () => {
	test("200 quando sala existe — payload inclui code, playerCount, phase", async () => {
		const { sala } = hub.createSala(makeHost("p1", "Ana"));
		const res = await app.fetch(
			new Request(`http://test.local/api/v1/salas/${sala.code}`),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.code).toBe(sala.code);
		expect(body.exists).toBe(true);
		expect(body.playerCount).toBe(1);
		expect(body.phase).toBe("idle");
	});

	test("404 quando sala não existe", async () => {
		const res = await app.fetch(
			new Request("http://test.local/api/v1/salas/ZZZZ"),
		);
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.code).toBe("ZZZZ");
		expect(body.exists).toBe(false);
	});

	test("400 quando code tem shape inválido (curto)", async () => {
		const res = await app.fetch(
			new Request("http://test.local/api/v1/salas/AB"),
		);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("invalid_code");
	});

	test("400 quando code tem chars não-alfanum", async () => {
		const res = await app.fetch(
			new Request("http://test.local/api/v1/salas/AB%D"), // % escapado vira AB%D
		);
		// Hono faz decode do param; "/AB%D" → "AB%D" → falha regex → 400.
		expect(res.status).toBe(400);
	});

	test("code lowercase na URL é normalizado pra UPPERCASE antes do lookup", async () => {
		const { sala } = hub.createSala(makeHost("p1", "Ana"));
		const res = await app.fetch(
			new Request(`http://test.local/api/v1/salas/${sala.code.toLowerCase()}`),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.code).toBe(sala.code.toUpperCase());
	});
});
