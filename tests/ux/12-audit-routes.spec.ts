/**
 * 12-audit-routes.spec.ts — UX/UI audit sweep (routes × viewports)
 *
 * FASE: Survey completo (SEM fix). Captura screenshots "antes" para
 * cada rota em cada viewport, focado em detectar problemas visuais,
 * de layout, hierarquia e responsividade. NÃO consome o
 * tests/ux/REPORT.md existente — observação independente.
 *
 * Saídas:
 *  - screenshots full-page em /docs/ux-review/screenshots/before/audit-<route>-<vp>.png
 *  - screenshots de clip paths nomeados em /docs/ux-review/screenshots/before/audit-clip-<route>-<vp>-<name>.png
 *  - console + page errors capturados por teste
 *  - métricas de layout (overflow-x, scrollHeight, etc.) emitidas no test.info().annotations
 */
import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BEFORE_DIR = join(
	process.cwd(),
	"..",
	"..",
	"docs",
	"ux-review",
	"screenshots",
	"before",
);

mkdirSync(BEFORE_DIR, { recursive: true });

// -------------------------------------------------------------------
// Viewports para o audit (subset focado do §5 do AUDIT_SCOPE.md)
// -------------------------------------------------------------------
const VIEWPORTS = [
	{ id: "vp-360", width: 360, height: 800 },
	{ id: "vp-390", width: 390, height: 844 },
	{ id: "vp-820", width: 820, height: 1180 },
	{ id: "vp-1440", width: 1440, height: 900 },
	{ id: "vp-1920", width: 1920, height: 1080 },
] as const;

// -------------------------------------------------------------------
// Routes a auditar
// -------------------------------------------------------------------
const ROUTES: Array<{
	id: string;
	path: string;
	waitFor?: string;
	note?: string;
}> = [
	{ id: "landing", path: "/", waitFor: "body" },
	{
		id: "join-host",
		path: "/join?host=1&code=ABCD",
		waitFor: "[data-testid='join-back'], input[name='nick'], form",
		note: "host entry with code querystring",
	},
	{
		id: "join-guest",
		path: "/join?code=ABCD",
		waitFor: "[data-testid='join-back'], input[name='nick'], form",
	},
	{
		id: "arena-empty",
		path: "/arena?code=ABCD&host=1",
		waitFor: "[data-testid='arena-table'], [data-testid='arena-stage']",
		note: "sala solo com EmptyOverlay visível",
	},
	{ id: "full", path: "/full?code=ZZZZ", waitFor: "body" },
	{ id: "not-found", path: "/rota-inexistente", waitFor: "body" },
];

// -------------------------------------------------------------------
// Helper: instrumentar page com captura de console + errors
// -------------------------------------------------------------------
type Observation = {
	route: string;
	viewport: string;
	consoleErrors: string[];
	pageErrors: string[];
	overflowX: number;
	documentScrollWidth: number;
	documentClientWidth: number;
};

const observations: Observation[] = [];

function instrumentPage(page: Page, routeId: string, viewportId: string) {
	const consoleErrors: string[] = [];
	const pageErrors: string[] = [];
	page.on("console", (msg: ConsoleMessage) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
		if (msg.type() === "warning") consoleErrors.push(`[warn] ${msg.text()}`);
	});
	page.on("pageerror", (err) => pageErrors.push(err.message));
	return {
		collectLayout: async () => {
			const m = await page.evaluate(() => ({
				scrollWidth: document.documentElement.scrollWidth,
				clientWidth: document.documentElement.clientWidth,
				innerWidth: window.innerWidth,
				scrollHeight: document.documentElement.scrollHeight,
				bodyOverflowX: getComputedStyle(document.body).overflowX,
			}));
			return {
				overflowX: m.scrollWidth - m.innerWidth,
				documentScrollWidth: m.scrollWidth,
				documentClientWidth: m.clientWidth,
				bodyOverflowX: m.bodyOverflowX,
				scrollHeight: m.scrollHeight,
			};
		},
		finalize: async (): Promise<Observation> => {
			const layout = await (
				await instrumentPage(page, routeId, viewportId)
			).collectLayout();
			const obs: Observation = {
				route: routeId,
				viewport: viewportId,
				consoleErrors,
				pageErrors,
				overflowX: layout.overflowX,
				documentScrollWidth: layout.documentScrollWidth,
				documentClientWidth: layout.documentClientWidth,
			};
			observations.push(obs);
			return obs;
		},
	};
}

// -------------------------------------------------------------------
// Suite — uma test() por (route × viewport). 5 × 6 = 30 cenários.
// -------------------------------------------------------------------

for (const vp of VIEWPORTS) {
	for (const route of ROUTES) {
		test(`audit @ ${vp.id} ${route.id}`, async ({ page }) => {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			const inst = instrumentPage(page, route.id, vp.id);

			const response = await page.goto(route.path, {
				waitUntil: "networkidle",
				timeout: 15_000,
			});

			// espera por seletor opcional
			if (route.waitFor) {
				try {
					await page.waitForSelector(route.waitFor, { timeout: 5_000 });
				} catch {
					// ignora — vamos capturar mesmo assim
				}
			}
			// tempo extra para fontes/webfont swap
			await page.waitForTimeout(800);

			const status = response?.status() ?? 0;
			test
				.info()
				.annotations.push({ type: "route", description: `${route.path} → ${status}` });

			// full-page screenshot
			await page.screenshot({
				path: join(BEFORE_DIR, `audit-${route.id}-${vp.id}-full.png`),
				fullPage: true,
			});

			// viewport-only screenshot
			await page.screenshot({
				path: join(BEFORE_DIR, `audit-${route.id}-${vp.id}-viewport.png`),
				fullPage: false,
			});

			// coletas finais
			const obs = await inst.finalize();

			// anota métricas no test
			test.info().annotations.push({
				type: "metrics",
				description: JSON.stringify(obs),
			});

			// Assertion só de sanidade — não falha em overflow (vai para raw-observations)
			expect(status, `route ${route.path} returned ${status}`).toBeLessThan(500);
		});
	}
}

// -------------------------------------------------------------------
// Teardown — escreve raw-observations.md com tudo que foi coletado
// -------------------------------------------------------------------
test.afterAll(async () => {
	const fs = await import("node:fs/promises");
	const path = join(
		process.cwd(),
		"..",
		"..",
		"docs",
		"ux-review",
		"raw-observations.md",
	);
	const header = `# Raw Observations — audit-routes sweep

> Gerado em ${new Date().toISOString()} pelo spec \`tests/ux/12-audit-routes.spec.ts\`.
> Independente de \`tests/ux/REPORT.md\` (fresh audit).
> Cobre ${VIEWPORTS.length} viewports × ${ROUTES.length} rotas = ${VIEWPORTS.length * ROUTES.length} cenários.

## Legenda

| Coluna | Significado |
|--------|-------------|
| route | ID da rota auditada (\`${ROUTES.map((r) => r.id).join("`, `")}\`) |
| viewport | ID do viewport (\`${VIEWPORTS.map((v) => v.id).join("`, `")}\`) |
| consoleErrors | Erros/warnings JS console (React/Router/Tailwind/etc.) |
| pageErrors | Unhandled exceptions |
| overflowX | scrollWidth - innerWidth (px). > 0 = overflow horizontal |
| scrollW | document.documentElement.scrollWidth |
| clientW | document.documentElement.clientWidth |

## Observações por cenário

`;

	const lines: string[] = [header];
	lines.push(
		"| route | viewport | scrollW | clientW | overflowX | consoleErrors | pageErrors |",
		"|-------|----------|---------|---------|-----------|---------------|------------|",
	);
	for (const o of observations) {
		lines.push(
			`| \`${o.route}\` | \`${o.viewport}\` | ${o.documentScrollWidth} | ${o.documentClientWidth} | **${o.overflowX}** | ${o.consoleErrors.length === 0 ? "—" : `<pre>${escape(o.consoleErrors.join("\n"))}</pre>`} | ${o.pageErrors.length === 0 ? "—" : `<pre>${escape(o.pageErrors.join("\n"))}</pre>`} |`,
		);
	}
	lines.push("");
	lines.push("## Console errors agregadas (dedup)");
	const errSet = new Map<string, string[]>();
	for (const o of observations) {
		for (const e of [...o.consoleErrors, ...o.pageErrors]) {
			if (!errSet.has(e)) errSet.set(e, []);
			errSet.get(e)!.push(`${o.route}/${o.viewport}`);
		}
	}
	for (const [err, occ] of errSet) {
		lines.push(`- **${occ.length}×** ${err}`);
		lines.push(`    ocorrências: ${occ.slice(0, 8).join(", ")}${occ.length > 8 ? `, +${occ.length - 8}` : ""}`);
	}
	lines.push("");
	lines.push("## Overflows horizontais (overflowX > 0)");
	const overflows = observations.filter((o) => o.overflowX > 0);
	if (overflows.length === 0) {
		lines.push("- (nenhum detectado)");
	} else {
		for (const o of overflows) {
			lines.push(
				`- \`${o.route}\` @ \`${o.viewport}\`: scrollWidth=${o.documentScrollWidth}, innerWidth=${o.documentClientWidth}, overflow=${o.overflowX}px`,
			);
		}
	}

	await fs.writeFile(path, lines.join("\n"), "utf8");
});

function escape(s: string): string {
	return s.replace(/\|/g, "\\|").replace(/`/g, "\\`").replace(/\n/g, " ⏎ ");
}