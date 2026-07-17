/**
 * Diagnose Safari WS failure against PRODUCTION.
 *
 * Replays the user's failure mode: real Safari (via Playwright webkit)
 * opens https://pointly.space/ and tries to create a room. Captures:
 *   - every console message + page error
 *   - every network request (status + URL + protocol)
 *   - every WebSocket frame (open/close/message)
 *   - window.__POINTLY_SALA__ state
 *
 * Unlike diagnose-safari-create.spec.ts, this hits prod (not Vite dev
 * proxy), so it exposes real Traefik routing / WS upgrade behaviour.
 *
 * Run:
 *   PROD_URL=https://pointly.space bunx playwright test \
 *     diagnose-prod-safari.spec.ts --project=webkit
 */
import { test, expect } from "@playwright/test";

const PROD_URL = process.env.PROD_URL ?? "https://pointly.space";

interface CapturedFrame {
	type: "open" | "close" | "message";
	at: number;
	data?: string;
}

test("prod criar-sala — captures WS + console + network (chromium + webkit)", async ({
	page,
	browserName,
}) => {

	const consoleMsgs: { type: string; text: string }[] = [];
	const pageErrors: string[] = [];
	const wsFrames: CapturedFrame[] = [];
	const requests: { url: string; method: string; status?: number; resourceType: string }[] = [];

	page.on("console", (msg) => {
		consoleMsgs.push({ type: msg.type(), text: msg.text() });
	});
	page.on("pageerror", (err) => pageErrors.push(err.message));
	page.on("request", (req) => {
		requests.push({
			url: req.url(),
			method: req.method(),
			resourceType: req.resourceType(),
		});
	});
	page.on("response", (resp) => {
		const r = requests.find((r) => r.url === resp.url() && r.status === undefined);
		if (r) r.status = resp.status();
	});
	page.on("websocket", (ws) => {
		const t0 = Date.now();
		wsFrames.push({ type: "open", at: t0 });
		ws.on("framesent", (f) =>
			wsFrames.push({ type: "message", at: Date.now() - t0, data: f.payload?.toString() }),
		);
		ws.on("framereceived", (f) =>
			wsFrames.push({ type: "message", at: Date.now() - t0, data: f.payload?.toString() }),
		);
		ws.on("close", () => wsFrames.push({ type: "close", at: Date.now() - t0 }));
	});

	const startedAt = Date.now();

	// 1. Go to landing.
	await page.goto(PROD_URL, { waitUntil: "domcontentloaded" });

	// 2. Click "Criar sala" → /join?host=1
	await page.getByTestId("cta-create-room").click();
	await page.waitForURL(/\/join\?host=1/, { timeout: 10000 });

	// 3. Fill nick + submit → /arena/{code}
	await page.locator('input[data-testid="nick-input"]').fill("Luna");
	await page.locator('[data-testid="join-submit"]').click();
	await page.waitForURL(/\/arena/, { timeout: 10000 });

	// 4. Wait up to 8s for the SALA to be fully populated (code in share-pill
	//    + __POINTLY_SALA__ set). Capturing share-pill textContent too early
	//    yields the placeholder "—" before the code is rendered.
	const result = await page.evaluate(async () => {
		const start = Date.now();
		const ok = await new Promise<"sala" | "timeout">((resolve) => {
			const tick = () => {
				const w = window as unknown as { __POINTLY_SALA__?: { code?: string } };
				const pill = document.querySelector('[data-testid="share-pill"]');
				const pillText = pill?.textContent?.trim() ?? "";
				const salaCode = w.__POINTLY_SALA__?.code;
				// Success: share-pill shows a 4-char code AND window state matches.
				if (/^[A-Z0-9]{4}$/.test(pillText) && salaCode && salaCode === pillText) {
					return resolve("sala");
				}
				if (Date.now() - start > 8000) return resolve("timeout");
				setTimeout(tick, 100);
			};
			tick();
		});
		const sharePill = document.querySelector('[data-testid="share-pill"]');
		const emptyOverlay = document.querySelector('[data-testid="empty-overlay"]');
		const sala = (window as unknown as { __POINTLY_SALA__?: { code: string } }).__POINTLY_SALA__;
		return {
			verdict: ok,
			sharePillPresent: !!sharePill,
			sharePillText: sharePill?.textContent?.trim() ?? null,
			emptyOverlayPresent: !!emptyOverlay,
			salaCode: sala?.code ?? null,
		};
	});

	// Always attach full diagnostic, even on success — easier diffing.
	const report = {
		browserName,
		startedAt,
		durationMs: Date.now() - startedAt,
		result,
		consoleMsgs,
		pageErrors,
		requests,
		wsFrames,
	};
	await test.info().attach("prod-safari-diagnostic", {
		body: JSON.stringify(report, null, 2),
		contentType: "application/json",
	});

	// Surface the most actionable signals in the test output.
	console.log(`=== ${browserName} verdict ===`);
	console.log(JSON.stringify(result, null, 2));
	console.log(`=== WS frames (${wsFrames.length}) ===`);
	for (const f of wsFrames) {
		console.log(`[+${f.at}ms] ${f.type}${f.data ? " " + f.data.slice(0, 200) : ""}`);
	}
	console.log(`=== /api and /ws requests ===`);
	for (const r of requests) {
		if (r.url.includes("/api/") || r.url.includes("/ws") || r.url.includes("/arena") || r.url.includes("/join")) {
			console.log(`${r.status ?? "??"} ${r.method} ${r.url}`);
		}
	}
	console.log(`=== pageErrors (${pageErrors.length}) ===`);
	for (const e of pageErrors) console.log(e);
	console.log(`=== console (${consoleMsgs.length}) ===`);
	for (const m of consoleMsgs.slice(0, 30)) console.log(`[${m.type}] ${m.text}`);

	// Hard assertions — capture the real failure mode.
	expect(result.salaCode, `sala.code missing — WS didn't populate state`).toMatch(/^[A-Z0-9]{4}$/);
	expect(result.sharePillText, `share pill text empty`).toMatch(/^[A-Z0-9]{4}$/);
	expect(result.emptyOverlayPresent, `'Convide outros' overlay missing`).toBe(true);
	expect(wsFrames.filter((f) => f.type === "open").length, `WS never opened`).toBeGreaterThan(0);
	expect(wsFrames.filter((f) => f.type === "message").length, `WS never received any message`).toBeGreaterThan(0);
	expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
});
