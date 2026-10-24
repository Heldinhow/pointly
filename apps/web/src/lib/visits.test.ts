import { describe, expect, test } from "bun:test";
import { sendPageviewBeacon } from "./visits";

describe("sendPageviewBeacon", () => {
	test("usa sendBeacon com corpo vazio (sem path, sem room code)", () => {
		const calls: string[] = [];
		sendPageviewBeacon({
			sendBeacon: (url: string) => {
				calls.push(url);
				return true;
			},
		});
		expect(calls).toEqual(["/api/stats/pageview"]);
	});

	test("sem sendBeacon, cai pro fetch keepalive sem corpo", async () => {
		const calls: Array<{ url: string; init: RequestInit }> = [];
		const fetchImpl = (async (url: string, init?: RequestInit) => {
			calls.push({ url, init: init ?? {} });
			return new Response(null, { status: 204 });
		}) as typeof fetch;
		sendPageviewBeacon({}, fetchImpl);
		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe("/api/stats/pageview");
		expect(calls[0]?.init.method).toBe("POST");
		expect(calls[0]?.init.keepalive).toBe(true);
		expect(calls[0]?.init.body).toBeUndefined();
	});

	test("falha de transporte nunca lança", () => {
		const fetchImpl = (() => {
			throw new Error("offline");
		}) as unknown as typeof fetch;
		expect(() => sendPageviewBeacon({}, fetchImpl)).not.toThrow();
	});
});
