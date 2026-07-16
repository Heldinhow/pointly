/**
 * Production routing smoke test — Safari "Criar sala" regression.
 *
 * History (2026-07-16):
 *   The Dokploy/Traefik setup pointed only at the static `web` container
 *   (port 8080) and never at the `server:3001` backend, so:
 *     - GET /api/v1/salas/TEST returned `index.html` (HTML SPA fallback),
 *       not JSON.
 *     - WS Upgrade for /ws returned `HTTP 200` with `index.html`, so
 *       Safari fell back to a one-time "Local Network Access" prompt.
 *       Once dismissed (or auto-dismissed in iOS), Safari silently blocked
 *       every subsequent wss connection to that hostname — making
 *       "Criar sala" appear to "not create valid rooms" in Safari while
 *       working in Chrome (where the prompt is dismissed in one
 *       remembered click).
 *
 * This test hits the **production** HTTPS endpoint directly (NOT the dev
 * Vite proxy that masks the bug) and asserts that:
 *   1. `/api/v1/salas/TEST` returns JSON, not HTML.
 *   2. The app root (`/`) still returns HTML.
 *
 * The /ws Upgrade check is verified out-of-band via curl (see the
 * `curl --http1.1 -H "Upgrade: websocket" ... https://<host>/ws` snippet in
 * the diagnose post-mortem) because Playwright's request context strips the
 * `Connection: Upgrade` header. We cover the UI contract end-to-end in
 * `diagnose-safari-create.spec.ts`.
 *
 * Run:
 *   PROD_URL=https://pointly.space bunx playwright test prod-routing.spec.ts
 */
import { test, expect } from "@playwright/test";

const PROD_URL = process.env.PROD_URL ?? "https://pointly.space";
const SKIP = process.env.SKIP_PROD_SMOKE === "1";

test.describe("production routing (Safari criar-sala regression)", () => {
	test.skip(SKIP, "set PROD_URL or unset SKIP_PROD_SMOKE=1 to enable");

	test("/api/v1/salas/TEST returns JSON, not HTML", async ({ request }) => {
		const resp = await request.get(`${PROD_URL}/api/v1/salas/TEST`);
		const ct = resp.headers()["content-type"] ?? "";
		const body = await resp.text();
		expect(ct, `wrong content-type: ${ct}`).toContain("application/json");
		expect(body, "expected JSON, got HTML").not.toMatch(/^<!doctype/i);
		// Body should be {code,exists} either way — strictly typed outcome.
		const json = JSON.parse(body);
		expect(json.code).toBe("TEST");
		expect(typeof json.exists).toBe("boolean");
	});

	test("/ (app root) still returns the SPA HTML", async ({ request }) => {
		const resp = await request.get(`${PROD_URL}/`);
		const ct = resp.headers()["content-type"] ?? "";
		expect(ct, `wrong content-type for /: ${ct}`).toContain("text/html");
	});
});
