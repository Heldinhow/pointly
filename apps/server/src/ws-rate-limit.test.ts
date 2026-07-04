/**
 * Rate limiter + Logger tests — T17a verify (≥3 unit tests).
 */
import { describe, expect, test } from "bun:test";
import { RateLimiter } from "./ws-rate-limit";
import { Logger, MemorySink } from "./ws-logger";

// ---------------------------------------------------------------------------
// RateLimiter
// ---------------------------------------------------------------------------

describe("RateLimiter", () => {
	test("aceita até maxPerSecond conexões/s por IP", () => {
		const rl = new RateLimiter(5);
		expect(rl.check("1.2.3.4", 1_000)).toBe(true);
		expect(rl.check("1.2.3.4", 1_100)).toBe(true);
		expect(rl.check("1.2.3.4", 1_200)).toBe(true);
		expect(rl.check("1.2.3.4", 1_300)).toBe(true);
		expect(rl.check("1.2.3.4", 1_400)).toBe(true);
	});

	test("rejeita 6ª conexão na mesma janela", () => {
		const rl = new RateLimiter(5);
		for (let i = 0; i < 5; i++) rl.check("1.2.3.4", 1_000 + i * 10);
		expect(rl.check("1.2.3.4", 1_050)).toBe(false);
	});

	test("IPs independentes não compartilham limite", () => {
		const rl = new RateLimiter(2);
		expect(rl.check("1.1.1.1", 1_000)).toBe(true);
		expect(rl.check("1.1.1.1", 1_100)).toBe(true);
		expect(rl.check("2.2.2.2", 1_000)).toBe(true);
		expect(rl.check("2.2.2.2", 1_000)).toBe(true);
		expect(rl.check("3.3.3.3", 1_000)).toBe(true);
	});

	test("tick limpa IPs inativos", () => {
		const rl = new RateLimiter(2);
		rl.check("1.1.1.1", 1_000);
		expect(rl.size()).toBe(1);
		rl.tick(5_000); // bem depois
		expect(rl.size()).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Logger (MemorySink para assertions)
// ---------------------------------------------------------------------------

describe("Logger — MemorySink", () => {
	test("registra connect event", () => {
		const sink = new MemorySink();
		const log = new Logger(sink);
		log.connect("1.2.3.4", "p1", "ABCD");
		expect(sink.entries).toHaveLength(1);
		expect(sink.entries[0]?.event.type).toBe("ws.connect");
		expect(sink.entries[0]?.event).toMatchObject({
			type: "ws.connect",
			ip: "1.2.3.4",
			playerId: "p1",
			salaCode: "ABCD",
		});
	});

	test("registra c2s event com payload summary", () => {
		const sink = new MemorySink();
		const log = new Logger(sink);
		log.event("c2s", "cast_vote", "p1", "ABCD", "{value:5}");
		expect(sink.entries[0]?.event).toMatchObject({
			type: "ws.event",
			direction: "c2s",
			event: "cast_vote",
			playerId: "p1",
			salaCode: "ABCD",
			payloadSummary: "{value:5}",
		});
	});

	test("registra error e ratelimit com level apropriado", () => {
		const sink = new MemorySink();
		const log = new Logger(sink);
		log.error("invalid_nick", "Mínimo 2 caracteres.", "p1", "ABCD");
		log.ratelimit("1.2.3.4", true);
		expect(sink.entries.find((e) => e.event.type === "ws.error")).toBeDefined();
		const rlLog = sink.entries.find((e) => e.event.type === "ws.ratelimit");
		expect(rlLog?.level).toBe("warn"); // rejected=true → warn
	});

	test("registra shutdown", () => {
		const sink = new MemorySink();
		const log = new Logger(sink);
		log.shutdown(3);
		expect(sink.entries[0]?.event).toMatchObject({
			type: "ws.shutdown",
			salasActive: 3,
		});
	});
});
