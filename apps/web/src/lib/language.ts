/**
 * Seleção de idioma (15.T8): preferência explícita, detecção do navegador e
 * destino de troca a partir do registro canônico (`src/seo/routes.ts`).
 *
 * Regras: só o clique no seletor grava preferência; redirect automático só
 * na raiz e só sem preferência (browser em inglês → `/en`), nunca de EN para PT.
 */

import { SEO_ROUTES } from "@/seo/routes";
import type { Lang } from "./i18n";
import { safeGet, safeSet } from "./storage";

export const LANG_STORAGE_KEY = "pointly.lang";

export function otherLang(lang: Lang): Lang {
	return lang === "en" ? "pt-BR" : "en";
}

/** `/en/` e `/en` são a mesma rota para o seletor (servidor 301 remove a barra). */
function normalizePath(pathname: string): string {
	if (pathname.length > 1 && pathname.endsWith("/")) {
		return pathname.replace(/\/+$/, "");
	}
	return pathname;
}

/** Rotas públicas indexáveis: onde o seletor aparece (fora de `/join`, `/s/*`, 404). */
export function isPublicIndexablePath(pathname: string): boolean {
	const path = normalizePath(pathname);
	return SEO_ROUTES.some((route) => route.indexable && route.path === path);
}

/** Alternate da mesma página no outro idioma; sem alternate, cai na home do idioma. */
export function languageSwitchTarget(pathname: string, lang: Lang): string {
	const path = normalizePath(pathname);
	const target = otherLang(lang);
	const route = SEO_ROUTES.find((candidate) => candidate.path === path);
	const alternate = route?.alternates?.find((alt) => alt.lang === target);
	return alternate?.path ?? (target === "en" ? "/en" : "/");
}

export function readLanguagePreference(): Lang | null {
	const stored = safeGet(LANG_STORAGE_KEY);
	return stored === "en" || stored === "pt-BR" ? stored : null;
}

/** Chamado só no clique do seletor: escolha explícita suprime o redirect. */
export function rememberLanguage(lang: Lang): void {
	safeSet(LANG_STORAGE_KEY, lang);
}

/** Idioma primário do navegador; só inglês conta para o redirect. */
export function browserPrefersEnglish(): boolean {
	if (typeof navigator === "undefined") return false;
	const primary = navigator.languages?.[0] ?? navigator.language;
	return primary?.toLowerCase().startsWith("en") ?? false;
}
