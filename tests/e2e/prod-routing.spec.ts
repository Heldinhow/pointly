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
 *   A 2026-07-16 hotfix added /api and /ws routers but only matched
 *   Host(`pointly.space`), not the www subdomain — Chrome users sharing
 *   www links and Safari users landing on www first still hit the SPA
 *   fallback. This test now parameterises against both apex and www
 *   so the same regression cannot reappear silently under a new host.
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
 *   PROD_URL_BASE=https://pointly.space bunx playwright test prod-routing.spec.ts
 */
import { test, expect } from "@playwright/test";

/** Apex domain used by the deployment. */
const PROD_URL_BASE = process.env.PROD_URL_BASE ?? "pointly.space";
const SKIP = process.env.SKIP_PROD_SMOKE === "1";

/** Both the apex and the www subdomain must work — they share the same routing rules. */
const HOSTS = [`https://${PROD_URL_BASE}`, `https://www.${PROD_URL_BASE}`];

test.describe("production routing (Safari criar-sala regression)", () => {
	for (const url of HOSTS) {
		test(`[${url}] /api/v1/salas/TEST returns JSON, not HTML`, async ({
			request,
		}) => {
			test.skip(SKIP, "set PROD_URL_BASE or unset SKIP_PROD_SMOKE=1 to enable");

			const resp = await request.get(`${url}/api/v1/salas/TEST`);
			const ct = resp.headers()["content-type"] ?? "";
			const body = await resp.text();
			expect(ct, `[${url}] wrong content-type: ${ct}`).toContain(
				"application/json",
			);
			expect(body, `[${url}] expected JSON, got HTML`).not.toMatch(
				/^<!doctype/i,
			);
			const json = JSON.parse(body);
			expect(json.code).toBe("TEST");
			expect(typeof json.exists).toBe("boolean");
		});

		test(`[${url}] / (app root) still returns the SPA HTML`, async ({
			request,
		}) => {
			test.skip(SKIP, "set PROD_URL_BASE or unset SKIP_PROD_SMOKE=1 to enable");

			const resp = await request.get(`${url}/`);
			const ct = resp.headers()["content-type"] ?? "";
			expect(ct, `[${url}] wrong content-type for /: ${ct}`).toContain(
				"text/html",
			);
		});
	}
});
