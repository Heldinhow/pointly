/**
 * First-party visit counting — unidade (VisitCounter) + HTTP (beacon/get).
 *
 * Relógio fake injeta `now` pra atravessar a virada do dia em
 * America/Sao_Paulo sem flaky de timezone.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, test } from "bun:test";
import { app, __resetHubForTests } from "./index";
import {
	LIVE_WINDOW_MS,
	VisitCounter,
	isBotUserAgent,
	saoPauloDay,
} from "./visits";

const UA = "Mozilla/5.0 (X11; Linux x86_64) Chrome/131.0 Safari/537.36";

/** Meio-dia em SP (fora da borda do DST): `2026-10-24T15:00:00Z`. */
const NOON_SP = Date.UTC(2026, 9, 24, 15, 0, 0);
const DAY_MS = 86_400_000;

function counterAt(nowMs: number, dataFile?: string): { counter: VisitCounter; clock: { now: number } } {
	const clock = { now: nowMs };
	return {
		counter: new VisitCounter({ now: () => clock.now, dataFile }),
		clock,
	};
}

const STATS_TOKEN = "test-stats-token";

beforeEach(() => {
	__resetHubForTests();
	process.env.STATS_API_TOKEN = STATS_TOKEN;
});

/** GET autenticado (Bearer por padrão) — o endpoint é token-only. */
async function visitsGet(
	ip = "203.0.113.20",
	headers: Record<string, string> = { authorization: `Bearer ${STATS_TOKEN}` },
): Promise<Response> {
	return app.fetch(
		new Request("http://test.local/api/stats/visits", { headers }),
		{ ip },
	);
}

describe("saoPauloDay", () => {
	test("vira o dia às 03:00Z (= 00:00 em SP, UTC-3)", () => {
		expect(saoPauloDay(Date.UTC(2026, 9, 24, 2, 59, 59))).toBe("2026-10-23");
		expect(saoPauloDay(Date.UTC(2026, 9, 24, 3, 0, 0))).toBe("2026-10-24");
	});
});

describe("VisitCounter.record", () => {
	test("dedupe: mesmo IP+UA no mesmo dia conta 1x, IP diferente conta", () => {
		const { counter } = counterAt(NOON_SP);
		expect(counter.record("1.1.1.1", UA)).toBe("counted");
		expect(counter.record("1.1.1.1", UA)).toBe("duplicate");
		expect(counter.record("2.2.2.2", UA)).toBe("counted");
		expect(counter.record("1.1.1.1", `${UA} Mobile`)).toBe("counted");
		expect(counter.snapshot().today).toBe(3);
	});

	test("virada do dia em SP reseta o dedupe (salt descartado)", () => {
		const { counter, clock } = counterAt(NOON_SP);
		expect(counter.record("1.1.1.1", UA)).toBe("counted");
		clock.now += DAY_MS; // mesmo horário, dia seguinte
		expect(saoPauloDay(clock.now)).not.toBe(saoPauloDay(NOON_SP));
		expect(counter.record("1.1.1.1", UA)).toBe("counted");
		const snap = counter.snapshot();
		expect(snap.today).toBe(1);
		expect(snap.last7d).toBe(2);
	});

	test("live5m: janela de 5min expira visitantes antigos", () => {
		const { counter, clock } = counterAt(NOON_SP);
		counter.record("1.1.1.1", UA);
		counter.record("2.2.2.2", UA);
		expect(counter.snapshot().live5m).toBe(2);
		clock.now += LIVE_WINDOW_MS;
		counter.record("3.3.3.3", UA);
		expect(counter.snapshot().live5m).toBe(1);
	});

	test("soma last7d (D..D-6) e ignora D-7", () => {
		const { counter, clock } = counterAt(NOON_SP - 7 * DAY_MS);
		counter.record("9.9.9.9", UA); // D-7: fora da janela
		clock.now += DAY_MS; // D-6: dentro
		counter.record("8.8.8.8", UA);
		clock.now = NOON_SP; // D
		counter.record("1.1.1.1", UA);
		const snap = counter.snapshot();
		expect(snap.today).toBe(1);
		expect(snap.last7d).toBe(2);
		expect(snap.live5m).toBe(1); // só o registro de agora está na janela live
	});

	test("persiste totais por dia e recarrega do arquivo (sem IP/UA)", () => {
		const dir = mkdtempSync(join(tmpdir(), "pointly-visits-"));
		try {
			const file = join(dir, "visits.json");
			const { counter } = counterAt(NOON_SP, file);
			counter.record("1.1.1.1", UA);
			const raw = readFileSync(file, "utf8");
			expect(raw).not.toContain("1.1.1.1");
			expect(raw).not.toContain("Chrome");
			const reloaded = new VisitCounter({ now: () => NOON_SP, dataFile: file });
			expect(reloaded.snapshot().today).toBe(1);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe("isBotUserAgent", () => {
	test("filtra bot/crawler/spider/headless, deixa browser real passar", () => {
		expect(isBotUserAgent("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true);
		expect(isBotUserAgent("Mozilla/5.0 (compatible; bingbot/2.0)")).toBe(true);
		expect(isBotUserAgent("curl/8.0.1")).toBe(true);
		expect(isBotUserAgent("HeadlessChrome/131.0")).toBe(true);
		expect(isBotUserAgent(UA)).toBe(false);
		expect(isBotUserAgent("")).toBe(false);
		expect(isBotUserAgent(null)).toBe(false);
	});
});

describe("POST /api/stats/pageview", () => {
	async function beacon(ip: string, ua = UA, body?: string): Promise<Response> {
		return app.fetch(
			new Request("http://test.local/api/stats/pageview", {
				method: "POST",
				headers: { "user-agent": ua },
				body,
			}),
			{ ip },
		);
	}

	/** Beacon sempre público: sem token, sem CORS e ainda contando. */
	test("204 conta 1x por visitante/dia; repeat é dedupe silencioso", async () => {
		expect((await beacon("203.0.113.1")).status).toBe(204);
		expect((await beacon("203.0.113.1")).status).toBe(204);
		const res = await visitsGet("203.0.113.1");
		expect((await res.json()).today).toBe(1);
	});

	test("bot responde 204 mas não conta", async () => {
		const res = await beacon("203.0.113.2", "Googlebot/2.1");
		expect(res.status).toBe(204);
		const snap = (await (await visitsGet("203.0.113.2")).json()) as {
			today: number;
		};
		expect(snap.today).toBe(0);
	});

	test("413 acima de 1KB (nunca persistimos o corpo)", async () => {
		const res = await beacon("203.0.113.3", UA, "x".repeat(2048));
		expect(res.status).toBe(413);
	});

	test("429 acima de ~60/min por chave derivada do IP (nunca o IP cru)", async () => {
		let last = 0;
		for (let i = 0; i < 61; i++) {
			last = (await beacon("203.0.113.9")).status;
		}
		expect(last).toBe(429);
		const other = await beacon("203.0.113.10");
		expect(other.status).toBe(204);
	});
});

describe("GET /api/stats/visits", () => {
	test("200 + shape com Authorization: Bearer; sem CORS; cache private 30s", async () => {
		const res = await visitsGet();
		expect(res.status).toBe(200);
		expect(res.headers.get("access-control-allow-origin")).toBeNull();
		expect(res.headers.get("cache-control")).toBe("private, max-age=30");
		const body = (await res.json()) as Record<string, unknown>;
		expect(typeof body.today).toBe("number");
		expect(typeof body.last7d).toBe("number");
		expect(typeof body.live5m).toBe("number");
		expect(typeof body.updatedAt).toBe("string");
	});

	test("200 com X-Stats-Key (header alternativo)", async () => {
		const res = await visitsGet("203.0.113.20", { "x-stats-key": STATS_TOKEN });
		expect(res.status).toBe(200);
		expect((await res.json()).today).toBe(0);
	});

	test("401 sem token e com token errado", async () => {
		const missing = await visitsGet("203.0.113.20", {});
		expect(missing.status).toBe(401);
		expect((await missing.json()).error).toBe("unauthorized");

		const wrong = await visitsGet("203.0.113.20", {
			authorization: "Bearer nope",
		});
		expect(wrong.status).toBe(401);
	});

	test("401 também com X-Stats-Key errado e Authorization não-Bearer", async () => {
		const wrongKey = await visitsGet("203.0.113.20", {
			"x-stats-key": "nope",
		});
		expect(wrongKey.status).toBe(401);

		const basic = await visitsGet("203.0.113.20", {
			authorization: `Basic ${STATS_TOKEN}`,
		});
		expect(basic.status).toBe(401);
	});

	test("503 fail closed quando STATS_API_TOKEN não está configurado (mesmo com token)", async () => {
		process.env.STATS_API_TOKEN = "";
		expect((await visitsGet()).status).toBe(503);
		delete process.env.STATS_API_TOKEN;
		expect((await visitsGet()).status).toBe(503);
	});

	test("401 vem antes do rate limit: força bruta não consome a cota", async () => {
		for (let i = 0; i < 130; i++) {
			const res = await visitsGet("203.0.113.22", {
				authorization: "Bearer nope",
			});
			expect(res.status).toBe(401);
		}
		const ok = await visitsGet("203.0.113.22");
		expect(ok.status).toBe(200);
	});

	test("429 acima do limite por IP com token válido", async () => {
		let last = 0;
		for (let i = 0; i < 121; i++) {
			last = (await visitsGet("203.0.113.21")).status;
		}
		expect(last).toBe(429);
	});
});
