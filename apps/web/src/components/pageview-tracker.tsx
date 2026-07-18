/**
 * PageviewTracker — single source of truth for SPA route-change pageviews.
 *
 * Montado UMA vez dentro de `<AppRouter>` (em routes.tsx). Cobre todas as
 * rotas automaticamente (landing, join, arena, full, 404) — adicionar rota
 * nova não exige mudança aqui.
 *
 * Comportamento (GA-19, GA-20):
 *   - Mount inicial: dispara `trackPageview(null, location.pathname)` —
 *     page_referrer=null é interpretado pelo GA como "direct/none" referrer.
 *   - Mudança de pathname: dispara `trackPageview(prev, new)`.
 *
 * Pathname-only (sem query string, sem hash) é enforced por usar
 * `location.pathname` em vez de `location.href`. Código de sala
 * (`/arena?code=ABCD`) NUNCA chega ao Google.
 *
 * @see apps/web/src/lib/analytics.ts
 * @see .specs/features/google-analytics/spec.md (P1 + P4)
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageview } from "../lib/analytics";

export function PageviewTracker(): null {
	const location = useLocation();

	useEffect(() => {
		// location.pathname não inclui query string nem hash (BrowserRouter
		// usa history API, não hash routing). Strip explícito é belt-and-
		// suspenders contra futuros callers que passem location.pathname +
		// search concatenado.
		const newPathname = location.pathname;
		const prevPathname = getPreviousPathname();
		trackPageview(prevPathname, newPathname);
		setPreviousPathname(newPathname);
	}, [location.pathname]);

	return null;
}

// ---------------------------------------------------------------------------
// Module-scoped previous pathname (survives StrictMode double-render + HMR)
// ---------------------------------------------------------------------------

let previousPathname: string | null = null;

function getPreviousPathname(): string | null {
	return previousPathname;
}

function setPreviousPathname(p: string): void {
	previousPathname = p;
}

/**
 * Reseta o pathname anterior. **Apenas para testes** — entre casos de teste
 * precisamos de estado limpo.
 */
export function __resetPreviousPathnameForTests(): void {
	previousPathname = null;
}