/**
 * Diagnose Safari-specific room-creation bug.
 *
 * Hypothesis:
 *   In Safari, the "Criar sala" flow does NOT show the "Convide outros"
 *   share overlay and/or the room code pill is empty / missing.
 *
 * This spec exercises the full flow in *both* chromium and webkit (which
 * uses the same engine as Safari), and asserts the spec-defined outcome
 * (overlay visible, share pill visible with non-empty code, sala
 * populated) holds in both. If it holds in chromium but fails in
 * webkit, we have a Safari-specific bug.
 *
 * Run:
 *   bunx playwright test diagnose-safari-create.spec.ts \
 *     --project=chromium --project=webkit
 */
import { test, expect } from "@playwright/test";

test("criar sala produce a valid sala + show share overlay (chromium vs webkit)", async ({
	page,
	browserName,
}) => {
	const consoleErrors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
	});
	page.on("pageerror", (err) => consoleErrors.push(err.message));

	await page.goto("/");
	await page.getByTestId("cta-create-room").click();
	await expect(page).toHaveURL(/\/join\?host=1$/);

	// Clear any stale dismissed state — we want a FRESH overlay check.
	await page.evaluate(() => {
		try {
			sessionStorage.removeItem("pointly.dismissedEmpty");
		} catch {
			/* sessionStorage unavailable (private mode) */
		}
	});

	await page.locator('input[data-testid="nick-input"]').fill("Luna");
	await page.locator('[data-testid="join-submit"]').click();

	// Wait for arena.
	await page.waitForURL(/\/arena/, { timeout: 10000 });

	// Give the WS handshake + welcome up to 5s.
	await page.waitForFunction(
		() => (window as unknown as { __POINTLY_SALA__?: unknown }).__POINTLY_SALA__ !== undefined,
		{ timeout: 5000 },
	);

	const result = await page.evaluate(() => {
		const sala = (window as unknown as { __POINTLY_SALA__?: { code: string; players: { id: string }[]; phase: string; round: number } }).__POINTLY_SALA__;
		const emptyOverlay = document.querySelector('[data-testid="empty-overlay"]');
		const sharePill = document.querySelector('[data-testid="share-pill"]');
		const timerValue = document.querySelector('[data-testid="timer-value"]')?.textContent ?? null;
		return {
			url: window.location.href,
			sala,
			sharePillText: sharePill?.textContent?.trim() ?? null,
			sharePillDisabled: (sharePill as HTMLButtonElement | null)?.disabled ?? null,
			sharePillPresent: !!sharePill,
			emptyOverlayPresent: !!emptyOverlay,
			timerText: timerValue,
		};
	});

	// Force a console snapshot — write to file at end for inspection.
	await test.info().attach("diagnostic", {
		body: JSON.stringify({ browserName, result, consoleErrors }, null, 2),
		contentType: "application/json",
	});

	// F-033 / F-013 SPEC: sala criada com code válido + overlay visível.
	expect(result.sala, `${browserName}: sala was not populated`).toBeTruthy();
	expect(result.sala?.code, `${browserName}: sala.code empty`).toMatch(/^[A-Z0-9]{4}$/);
	expect(result.sharePillPresent, `${browserName}: share pill missing`).toBe(true);
	expect(result.sharePillText, `${browserName}: share pill text empty`).toMatch(/^[A-Z0-9]{4}$/);
	expect(result.emptyOverlayPresent, `${browserName}: 'Convide outros' overlay missing`).toBe(true);
	expect(consoleErrors, `${browserName}: console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
