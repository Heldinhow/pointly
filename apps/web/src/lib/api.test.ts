import { describe, expect, test } from "bun:test";
import { JoinError } from "./errors";
import { checkSala } from "./api";

function stubFetch(status: number, body: unknown): typeof fetch {
	return (async () =>
		new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe("checkSala", () => {
	test("200 retorna existência com contagem e fase", async () => {
		const result = await checkSala(
			"AB12",
			stubFetch(200, { code: "AB12", exists: true, playerCount: 2, phase: "voting" }),
		);
		expect(result).toEqual({ status: "exists", playerCount: 2, phase: "voting" });
	});
	test("200 sem campos usa padrões", async () => {
		const result = await checkSala("AB12", stubFetch(200, {}));
		expect(result).toEqual({ status: "exists", playerCount: 0, phase: "idle" });
	});
	test("404 retorna missing", async () => {
		const result = await checkSala(
			"ZZZZ",
			stubFetch(404, { code: "ZZZZ", exists: false }),
		);
		expect(result).toEqual({ status: "missing" });
	});
	test("400 retorna invalid", async () => {
		const result = await checkSala("AB", stubFetch(400, { error: "invalid_code" }));
		expect(result).toEqual({ status: "invalid" });
	});
	test("falha de rede vira JoinError de conexão", async () => {
		const failing = (() => {
			throw new Error("down");
		}) as unknown as typeof fetch;
		const promise = checkSala("AB12", failing);
		await expect(promise).rejects.toBeInstanceOf(JoinError);
		await promise.catch((error: JoinError) => {
			expect(error.code).toBe("connection_failed");
		});
	});
});
