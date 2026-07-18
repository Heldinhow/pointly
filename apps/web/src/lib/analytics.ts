/**
 * Analytics — Google Analytics 4 (gtag.js) com privacy-first defaults.
 *
 * Stack: gtag.js direto (sem GTM). API mínima: init() + trackPageview() +
 * isEnabled(). Runtime loader via `document.createElement('script')` lazy
 * para que `bun run dev` (sem VITE_GA_MEASUREMENT_ID) não faça nenhum
 * request a `googletagmanager.com`.
 *
 * Privacy flags aplicados em init() (GA-08):
 *   - send_page_view: false — SPA: disparamos page_view manualmente
 *   - anonymize_ip: true — IP anonymized
 *   - ads_data_redaction: true — sem advertising features
 *   - cookie_domain: 'none' — zero cookie no domínio Pointly
 *   - client_storage: 'none' — zero localStorage/sessionStorage do GA
 *
 * Strip de query string: callers passam pathname only (window.location.pathname).
 * `trackPageview` nunca aceita URL com query/hash — caller é responsável.
 *
 * Pré-requisito do admin GA4 (responsabilidade do operator):
 *   - Enhanced Measurement → "Page changes" OFF
 *   - Data retention → 2 months
 *   Veja ADR-0012 / docs/adr/0012-google-analytics-privacy-first.md.
 *
 * @see .specs/features/google-analytics/spec.md
 * @see .specs/features/google-analytics/context.md
 * @see docs/adr/0012-google-analytics-privacy-first.md
 * @see memory/ga4-spa-pageview-pattern (gotcha Enhanced Measurement)
 */

import { getGaMeasurementId, type GaMeasurementId } from "./analytics-config";

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

/** True após init() rodar com sucesso (gtag.js carregado + config aplicado). */
let initialized = false;

/** ID validado (formato G-XXXXXX). Snapshot no momento do init. */
let activeId: GaMeasurementId | null = null;

/** Pathname da última pageview disparada. Usado como page_referrer. */
let lastPathname: string | null = null;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Regex do formato GA4 Measurement ID (G-XXXXXX, 1-10 chars alfanuméricos). */
const GA_ID_RE = /^G-[A-Z0-9]{1,10}$/;

/**
 * Valida formato do GA Measurement ID.
 * Retorna string limpa se válido, ou null se inválido (vazio, lowercase, etc).
 */
export function validateGaId(raw: string | undefined | null): GaMeasurementId | null {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!GA_ID_RE.test(trimmed)) return null;
	return trimmed;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

/**
 * Inicializa o Google Analytics 4 com privacy-first defaults.
 *
 * - Idempotente: chamadas múltiplas são no-ops após a primeira com sucesso.
 * - Em dev (sem ID configurada): no-op puro. Zero side effect, zero request.
 * - Em prod (com ID): injeta `<script src="googletagmanager.com/gtag/js?id=...">`
 *   lazy, define `window.dataLayer` + `window.gtag`, e chama
 *   `gtag('config', ID, { send_page_view: false, ...privacyFlags })`.
 *
 * Não chama `gtag('event', 'page_view')` — isso é responsabilidade do
 * `<PageviewTracker />` em mount + mudança de rota.
 */
export function init(): void {
	if (initialized) return;

	const id = validateGaId(getGaMeasurementId());
	if (!id) {
		// Dev ou prod sem env var configurada. Sem warn em dev (caso comum).
		if (typeof console !== "undefined" && getGaMeasurementId()) {
			console.warn(
				"[analytics] VITE_GA_MEASUREMENT_ID presente mas formato inválido. Esperado G-XXXXXX.",
			);
		}
		return;
	}

	activeId = id;

	// gtag.js dataLayer pattern: stack antes do script carregar.
	// Preserva `window.gtag` se já existir (ex.: test stub) — só define a
	// implementação default se ausente. Isso evita reatribuir o stub dos
	// testes a cada init(), o que faria com que calls subsequentes
	// (config, event) bypassem o spy.
	const w = window as unknown as {
		dataLayer: unknown[];
		gtag: (...args: unknown[]) => void;
	};
	w.dataLayer = w.dataLayer || [];
	if (typeof w.gtag !== "function") {
		w.gtag = function gtag(...args: unknown[]) {
			w.dataLayer.push(args);
		};
	}
	w.gtag("js", new Date());

	// Injeta snippet lazy. async=true permite não-bloqueante.
	const script = document.createElement("script");
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
	document.head.appendChild(script);

	// Config com privacy-first defaults. NÃO dispara page_view aqui
	// (send_page_view: false) — <PageviewTracker /> chama trackPageview.
	w.gtag("config", id, {
		send_page_view: false,
		anonymize_ip: true,
		ads_data_redaction: true,
		cookie_domain: "none",
		client_storage: "none",
	});

	initialized = true;
}

// ---------------------------------------------------------------------------
// trackPageview
// ---------------------------------------------------------------------------

/**
 * Dispara um hit `page_view` para a nova rota.
 *
 * Padrão SPA correto (GA-19, memory ga4-spa-pageview-pattern):
 *   1. `gtag('config', ID, { send_page_view: false, page_referrer, page_location, update: true })`
 *      — merge sem reinit, atribui referrer + location novos.
 *   2. `gtag('event', 'page_view', { page_referrer, page_location })`
 *      — dispara o hit com os mesmos valores.
 *
 * @param prevPathname Pathname da rota anterior, ou `null` no mount inicial
 *   (GA interpreta como referrer direto/externo).
 * @param newPathname Pathname da rota nova. **Apenas pathname** — caller
 *   passa `window.location.pathname`, NUNCA `window.location.href`
 *   (query string com código de sala vazaria pro Google).
 */
export function trackPageview(
	prevPathname: string | null,
	newPathname: string,
): void {
	// Permite override em testes (ex.: pageview-tracker.test.tsx) sem ter
	// que mockar o módulo inteiro — abordagem mais surgical.
	if (testTrackPageviewImpl) {
		testTrackPageviewImpl(prevPathname, newPathname);
		return;
	}

	if (!initialized || !activeId) return;
	if (typeof newPathname !== "string" || newPathname.length === 0) return;

	const w = window as unknown as { gtag: (...args: unknown[]) => void };
	w.gtag("config", activeId, {
		send_page_view: false,
		page_referrer: prevPathname ?? undefined,
		page_location: newPathname,
		update: true,
	});
	w.gtag("event", "page_view", {
		page_referrer: prevPathname ?? undefined,
		page_location: newPathname,
	});

	lastPathname = newPathname;
}

/** Override de teste — quando setado, `trackPageview` chama isso em vez do
 *  default. **Apenas para testes.** */
let testTrackPageviewImpl:
	| ((prev: string | null, next: string) => void)
	| null = null;

/**
 * **Apenas para testes** — substitui a implementação de `trackPageview`.
 * Passar `null` pra resetar (volta ao default).
 */
export function __setTrackPageviewForTests(
	impl: ((prev: string | null, next: string) => void) | null,
): void {
	testTrackPageviewImpl = impl;
}

/**
 * Retorna o pathname da última pageview disparada. Útil para testes.
 */
export function getLastPathname(): string | null {
	return lastPathname;
}

// ---------------------------------------------------------------------------
// isEnabled
// ---------------------------------------------------------------------------

/**
 * True se analytics está ativo (init() rodou em prod com ID válida).
 * False em dev ou antes do init() rodar. Útil pra debug e testes.
 */
export function isEnabled(): boolean {
	return initialized && activeId !== null;
}

/**
 * Reseta estado interno. **Apenas para testes** — não usar em produção.
 * Permite re-inicializar o analytics entre casos de teste sem reload.
 */
export function __resetForTests(): void {
	initialized = false;
	activeId = null;
	lastPathname = null;
}