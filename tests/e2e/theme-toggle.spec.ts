/**
 * theme-toggle.spec.ts — regression test for fix a726fe3 (theme data-theme).
 *
 * Cobre o bug "theme toggle não alterna para light quando SO é dark":
 * o provider antigo manipulava `class="dark"` no `<html>` e o CSS usava
 * `:root:not(.dark)` no media query `(prefers-color-scheme: dark)` —
 * esse seletor sobrescrevia a escolha manual do user. O fix troca pra
 * `data-theme="light"|"dark"` que tem precedência sobre a media query.
 *
 * **Semântica do toggle (tri-state persistido, by design)**:
 *   - `null` (auto-detect): respeita `prefers-color-scheme` via media query.
 *   - `"light"|"dark"` (manual): gravado em `localStorage` + `data-theme`,
 *     **persiste entre reloads**. Toggle é cíclico (dark↔light) e FIXA
 *     a escolha manual; só voltar pra `null` requer `localStorage.clear()`.
 *
 * **Cenários**:
 *  1. THEME-01: SO light + click 1 → data-theme=dark, bg charcoal.
 *  2. THEME-02: SO light + click 2 → data-theme=light (manual, persiste), bg paper.
 *  3. THEME-03 (regressão a726fe3): SO dark + click 1 → data-theme=light,
 *     bg paper (antes do fix ficava dark permanente).
 *  4. THEME-04: SO dark + click 2 alterna dark.
 *  5. THEME-05: data-theme persiste entre reloads (localStorage).
 *  6. THEME-06: SO dark + 4 cliques retornam ao tema manual "dark".
 *  7. THEME-07: toggle aria-label acompanha o estado efetivo (sun quando dark).
 *
 * @see commit a726fe3 fix(theme): data-theme attribute em vez de .dark class
 */
import { expect, test } from "@playwright/test";

/** Paper parchment #efe7d2 (light mode body bg). */
const LIGHT_BG = "rgb(239, 231, 210)";
/** Warm charcoal #13120d (dark mode body bg). */
const DARK_BG = "rgb(19, 18, 13)";

/** Espera o body terminar a transição CSS de 200ms (sobe + buffer). */
async function waitForTransition(page: import("@playwright/test").Page) {
	await page.waitForTimeout(350);
}

interface ThemeState {
	classList: string;
	dataTheme: string | null;
	bgVar: string;
	bodyBg: string;
	localStorageTheme: string | null;
}

/** Lê o estado efetivo do tema (atributos + vars + localStorage). */
async function readThemeState(page: import("@playwright/test").Page): Promise<ThemeState> {
	return page.evaluate(() => {
		const html = document.documentElement;
		const cs = getComputedStyle(html);
		return {
			classList: html.className,
			dataTheme: html.getAttribute("data-theme"),
			bgVar: cs.getPropertyValue("--bg").trim(),
			bodyBg: getComputedStyle(document.body).backgroundColor,
			localStorageTheme: (() => {
				try {
					return localStorage.getItem("theme");
				} catch {
					return null;
				}
			})(),
		};
	});
}

test.describe("THEME: theme toggle (a726fe3 regression)", () => {
	test("THEME-01: SO light → click 1 aplica dark mode (data-theme=dark, bg charcoal)", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		try {
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			const before = await readThemeState(page);
			expect(before.bodyBg).toBe(LIGHT_BG);
			expect(before.dataTheme).toBeNull();

			await page.getByTestId("theme-toggle").click();
			await waitForTransition(page);

			const after = await readThemeState(page);
			expect(after.dataTheme).toBe("dark");
			expect(after.bodyBg).toBe(DARK_BG);
			expect(after.localStorageTheme).toBe("dark");
		} finally {
			await context.close();
		}
	});

	test("THEME-02: SO light → click 2 fixa 'light' manual (data-theme=light, bg paper, persiste)", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		try {
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			await page.getByTestId("theme-toggle").click(); // light → dark
			await waitForTransition(page);
			expect((await readThemeState(page)).dataTheme).toBe("dark");

			await page.getByTestId("theme-toggle").click(); // dark → light (FIXA manual)
			await waitForTransition(page);

			const state = await readThemeState(page);
			expect(state.dataTheme).toBe("light");
			expect(state.bodyBg).toBe(LIGHT_BG);
			expect(state.localStorageTheme).toBe("light");
		} finally {
			await context.close();
		}
	});

	test("THEME-03 (regressão a726fe3): SO dark → click 1 fixa 'light' manual, NÃO fica dark permanente", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "dark" });
		const page = await context.newPage();
		try {
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			// SO dark → bg charcoal via media query, mas data-theme ausente.
			const before = await readThemeState(page);
			expect(before.bodyBg).toBe(DARK_BG);
			expect(before.dataTheme).toBeNull();

			// user clica toggle: effective=dark (via media query) → toggla pra light.
			// Antes do fix a726fe3, isto falhava: a página ficava dark.
			await page.getByTestId("theme-toggle").click();
			await waitForTransition(page);

			const after = await readThemeState(page);
			expect(after.dataTheme).toBe("light");
			expect(after.bodyBg).toBe(LIGHT_BG);
			expect(after.localStorageTheme).toBe("light");
		} finally {
			await context.close();
		}
	});

	test("THEME-04: SO dark → click 2 alterna pra dark (manual dark)", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "dark" });
		const page = await context.newPage();
		try {
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			await page.getByTestId("theme-toggle").click(); // effective dark → light
			await waitForTransition(page);
			expect((await readThemeState(page)).bodyBg).toBe(LIGHT_BG);

			await page.getByTestId("theme-toggle").click(); // manual light → dark
			await waitForTransition(page);

			const state = await readThemeState(page);
			expect(state.dataTheme).toBe("dark");
			expect(state.bodyBg).toBe(DARK_BG);
			expect(state.localStorageTheme).toBe("dark");
		} finally {
			await context.close();
		}
	});

	test("THEME-05: data-theme persiste em localStorage entre page reloads", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		try {
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			await page.getByTestId("theme-toggle").click();
			await waitForTransition(page);

			await page.reload();
			await page.waitForLoadState("networkidle");
			await waitForTransition(page);

			const state = await readThemeState(page);
			expect(state.dataTheme).toBe("dark");
			expect(state.bodyBg).toBe(DARK_BG);
			expect(state.localStorageTheme).toBe("dark");
		} finally {
			await context.close();
		}
	});

	test("THEME-06: ciclo de 4 cliques (SO dark) volta ao estado manual 'dark'", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "dark" });
		const page = await context.newPage();
		try {
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			// SO dark → effective dark; toggle é dark↔light, então 4 cliques
			// retornam ao ponto de partida (4 inversões = par).
			for (let i = 0; i < 4; i++) {
				await page.getByTestId("theme-toggle").click();
				await waitForTransition(page);
			}

			const state = await readThemeState(page);
			// Cada click flipa; depois de 4x (par) cai em "dark".
			expect(state.dataTheme).toBe("dark");
			expect(state.bodyBg).toBe(DARK_BG);
		} finally {
			await context.close();
		}
	});

	test("THEME-07: aria-label do toggle reflete estado efetivo (sun ↔ moon)", async ({
		browser,
	}) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		try {
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			const btn = page.getByTestId("theme-toggle");
			const initialAria = await btn.getAttribute("aria-label");

			await btn.click(); // light → dark, sun icon
			await waitForTransition(page);
			const darkAria = await btn.getAttribute("aria-label");
			expect(darkAria).not.toBe(initialAria);
			expect(darkAria).toMatch(/claro|light/i);

			await btn.click(); // dark → light, moon icon
			await waitForTransition(page);
			const lightAria = await btn.getAttribute("aria-label");
			expect(lightAria).not.toBe(darkAria);
			expect(lightAria).toMatch(/escuro|dark/i);
		} finally {
			await context.close();
		}
	});
});
