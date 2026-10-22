/**
 * Hardening de borda — helpers puros + integração com WSService.
 */
import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { Hub } from "./hub";
import { Logger, MemorySink } from "./ws-logger";
import { RateLimiter } from "./ws-rate-limit";
import { WSService, type BunWS, type WSContext, type WSSecurityOptions } from "./ws";
import {
	TokenBucket,
	WindowLimiter,
	clientIpFrom,
	isOriginAllowed,
	parseAllowedOrigins,
} from "./security";

class FakeWS implements BunWS {
	data: WSContext;
	messages: string[] = [];
	closeCode: number | null = null;
	constructor(
		ip: string,
		public remoteAddress = "10.0.0.1",
	) {
		this.data = { playerId: null, code: null, ip, lastPongAt: 0, lastPingAt: 0 };
	}
	send(m: string | ArrayBuffer | Uint8Array): void {
		this.messages.push(typeof m === "string" ? m : new TextDecoder().decode(m));
	}
	close(code?: number): void {
		this.closeCode = code ?? null;
	}
	ping(): void {}
	subscribe(): void {}
	unsubscribe(): void {}
	last(): { type: string; payload: { code?: string; message?: string } } {
		return JSON.parse(this.messages[this.messages.length - 1] ?? "null");
	}
}

function service(opts: Partial<WSSecurityOptions> = {}) {
	const hub = new Hub();
	const svc = new WSService(
		hub,
		new Logger(new MemorySink()),
		new RateLimiter(1000),
		opts,
	);
	return { hub, svc };
}

function hello(ws: FakeWS, svc: WSService, code?: string) {
	svc.onMessage(
		ws,
		JSON.stringify({
			type: "hello",
			payload: { protocolVersion: 2, uuid: randomUUID(), nick: "Ana", ...(code ? { code } : {}) },
		}),
	);
}

describe("clientIpFrom", () => {
	test("com proxy confiável usa o hop mais à direita", () => {
		expect(clientIpFrom("6.6.6.6, 1.2.3.4", "172.18.0.2", true)).toBe("1.2.3.4");
	});
	test("sem proxy confiável ignora X-Forwarded-For (forjável)", () => {
		expect(clientIpFrom("6.6.6.6", "172.18.0.2", false)).toBe("172.18.0.2");
	});
	test("sem header cai no IP do socket", () => {
		expect(clientIpFrom(null, "172.18.0.2", true)).toBe("172.18.0.2");
	});
});

describe("isOriginAllowed", () => {
	const allowed = parseAllowedOrigins(undefined);
	test("aceita produção e dev", () => {
		expect(isOriginAllowed("https://pointly.space", allowed)).toBe(true);
		expect(isOriginAllowed("http://localhost:5179", allowed)).toBe(true);
	});
	test("recusa origem de outro site", () => {
		expect(isOriginAllowed("https://evil.example", allowed)).toBe(false);
	});
	test("sem Origin (cliente não-browser) passa", () => {
		expect(isOriginAllowed(null, allowed)).toBe(true);
	});
	test("ALLOWED_ORIGINS sobrescreve o default", () => {
		const custom = parseAllowedOrigins("https://a.test, https://b.test");
		expect(isOriginAllowed("https://b.test", custom)).toBe(true);
		expect(isOriginAllowed("https://pointly.space", custom)).toBe(false);
	});
});

describe("TokenBucket / WindowLimiter", () => {
	test("bucket esgota na rajada e repõe com o tempo", () => {
		const b = new TokenBucket(2, 1, 0);
		expect(b.take(0)).toBe(true);
		expect(b.take(0)).toBe(true);
		expect(b.take(0)).toBe(false);
		expect(b.take(1000)).toBe(true);
	});
	test("janela bloqueia acima do máximo e reabre depois", () => {
		const w = new WindowLimiter(2, 1000);
		expect(w.hit("k", 0)).toBe(true);
		expect(w.hit("k", 1)).toBe(true);
		expect(w.hit("k", 2)).toBe(false);
		expect(w.hit("k", 1000)).toBe(true);
		w.prune(5000);
		expect(w.size()).toBe(0);
	});
});

describe("WSService — limites de abuso", () => {
	test("flood de mensagens fecha a conexão com 1008", () => {
		const { svc } = service({ wsMsgBurst: 3, wsMsgPerSec: 1 });
		const ws = new FakeWS("1.1.1.1");
		svc.onOpen(ws);
		for (let i = 0; i < 4; i++) {
			svc.onMessage(ws, JSON.stringify({ type: "ping", payload: {} }));
		}
		expect(ws.closeCode).toBe(1008);
	});

	test("usa o IP do upgrade (data.ip) e não o do socket do proxy", () => {
		const { svc } = service();
		const ws = new FakeWS("203.0.113.7", "172.18.0.2");
		svc.onOpen(ws);
		expect(ws.data.ip).toBe("203.0.113.7");
	});

	test("limite de criação de salas por IP", () => {
		const { hub, svc } = service({ roomCreatePerMin: 2 });
		for (let i = 0; i < 3; i++) {
			const ws = new FakeWS("2.2.2.2");
			svc.onOpen(ws);
			hello(ws, svc);
			if (i === 2) expect(ws.last().payload.code).toBe("rate_limited");
			else expect(ws.last().type).toBe("welcome");
		}
		expect(hub.salas.size).toBe(2);
	});

	test("teto global de salas", () => {
		const { hub, svc } = service({ maxSalas: 1 });
		const a = new FakeWS("3.3.3.1");
		const b = new FakeWS("3.3.3.2");
		svc.onOpen(a);
		svc.onOpen(b);
		hello(a, svc);
		hello(b, svc);
		expect(b.last().payload.code).toBe("rate_limited");
		expect(hub.salas.size).toBe(1);
	});

	test("hello com código inexistente é limitado por IP", () => {
		const { svc } = service({ unknownCodePerMin: 2 });
		const codes: (string | undefined)[] = [];
		for (let i = 0; i < 3; i++) {
			const ws = new FakeWS("4.4.4.4");
			svc.onOpen(ws);
			hello(ws, svc, "ZZZZ");
			codes.push(ws.last().payload.code);
		}
		expect(codes[2]).toBe("rate_limited");
		expect(codes[0]).not.toBe("rate_limited");
	});

	test("payload inválido devolve mensagem genérica (sem detalhe do Zod)", () => {
		const { svc } = service();
		const ws = new FakeWS("5.5.5.5");
		svc.onOpen(ws);
		svc.onMessage(ws, JSON.stringify({ type: "cast_vote", payload: { value: {} } }));
		expect(ws.last().payload).toEqual({
			code: "internal_error",
			message: "Mensagem inválida.",
		});
	});
});
