import { expect, test } from "@playwright/test";
import { newPlayer } from "./helpers/room";

interface VisitsSnapshot {
	today: number;
	last7d: number;
	live5m: number;
	updatedAt: string;
}

/** Igual ao `STATS_API_TOKEN` do webServer em playwright.config.ts. */
const STATS_TOKEN = "e2e-stats-token";

async function readVisits(request: {
	get: (
		url: string,
		options: { headers: Record<string, string> },
	) => Promise<{ json: () => Promise<VisitsSnapshot> }>;
}): Promise<VisitsSnapshot> {
	// GET protegido: sem token o server responde 401/503 (fail closed).
	return (
		await request.get("/api/stats/visits", {
			headers: { authorization: `Bearer ${STATS_TOKEN}` },
		})
	).json();
}

/**
 * Beacon first-party (`POST /api/stats/pageview`, sem consentimento GA):
 * o page load conta 1x; navegar de rota dedupes o mesmo visitante.
 * UA único por teste: o dedupe é por IP+UA, então sem isso a segunda
 * execução do dia (outro projeto/arquivo, mesmo IP+UA) não incrementaria.
 */
test("page load incrementa today; navegação dedupes o mesmo visitante", async ({
	browser,
	request,
}, testInfo) => {
	const ua = `Mozilla/5.0 (X11; Linux x86_64) Chrome/131.0 Safari/537.36 PointlyVisitsE2E/${Date.now()}`;
	const before = await readVisits(request);
	const { page, ctx } = await newPlayer(browser, testInfo, { userAgent: ua });
	try {
		await page.goto("/");
		await expect
			.poll(async () => (await readVisits(request)).today, { timeout: 15000 })
			.toBe(before.today + 1);

		await page.getByTestId("home-cta-join").click();
		await expect(page.locator("#nick")).toBeVisible();
		// Beacon dispara de novo na troca de rota, mas o mesmo IP+UA
		// no mesmo dia conta uma vez só.
		await page.waitForTimeout(1500);
		const after = await readVisits(request);
		expect(after.today).toBe(before.today + 1);
		expect(after.last7d).toBeGreaterThanOrEqual(after.today);
		expect(after.live5m).toBeGreaterThanOrEqual(1);
		expect(typeof after.updatedAt).toBe("string");
	} finally {
		await ctx.close();
	}
});
