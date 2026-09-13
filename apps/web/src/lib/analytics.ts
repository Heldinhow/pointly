/**
 * Analytics — Google Analytics 4 (gtag.js) com privacy-first defaults.
 *
 * API mínima: init() + trackPageview() + isEnabled().
 * Runtime loader via `document.createElement('script')` lazy para que
 * `bun run dev` (sem VITE_GA_MEASUREMENT_ID) não faça nenhum request
 * a `googletagmanager.com`.
 *
 * Privacy flags aplicados em init():
 *   - send_page_view: false — SPA: page_view é disparado manualmente
 *   - anonymize_ip: true
 *   - ads_data_redaction: true — sem advertising features
 *   - cookie_domain: 'none' — zero cookie no domínio Pointly
 *   - client_storage: 'none' — zero localStorage/sessionStorage do GA
 *
 * Pathname-only: callers passam `location.pathname`, NUNCA href
 * (query string com código de sala vazaria pro Google).
 */

const GA_ID_RE = /^G-[A-Z0-9]{1,10}$/;

let initialized = false;
let activeId: string | null = null;
let lastPathname: string | null = null;

/** Override de teste — apenas para testes. */
let testTrackPageviewImpl: ((prev: string | null, next: string) => void) | null =
	null;

/** Override de teste p/ measurement id — apenas para testes. */
let testGaIdOverride: string | undefined | null | undefined = undefined;

/** Valida formato do GA Measurement ID. Retorna string limpa ou null. */
export function validateGaId(raw: string | undefined | null): string | null {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!GA_ID_RE.test(trimmed)) return null;
	return trimmed;
}

function getGaMeasurementId(): string | undefined {
	if (testGaIdOverride !== undefined && testGaIdOverride !== null) {
		return testGaIdOverride;
	}
	return import.meta.env.VITE_GA_MEASUREMENT_ID;
}

/**
 * Inicializa o GA4 com privacy-first defaults. Idempotente.
 * No-op puro em dev (sem ID configurada). Não dispara page_view —
 * isso é responsabilidade do `<PageviewTracker />`.
 */
export function init(): void {
	if (initialized) return;

	const id = validateGaId(getGaMeasurementId());
	if (!id) {
		if (typeof console !== "undefined" && getGaMeasurementId()) {
			console.warn(
				"[analytics] VITE_GA_MEASUREMENT_ID presente mas formato inválido. Esperado G-XXXXXX.",
			);
		}
		return;
	}

	activeId = id;

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

	const script = document.createElement("script");
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
	document.head.appendChild(script);

	w.gtag("config", id, {
		send_page_view: false,
		anonymize_ip: true,
		ads_data_redaction: true,
		cookie_domain: "none",
		client_storage: "none",
	});

	initialized = true;
}

/**
 * Dispara um hit `page_view` para a nova rota.
 *
 * @param prevPathname Pathname da rota anterior, ou `null` no mount inicial.
 * @param newPathname Pathname da rota nova. **Apenas pathname** — nunca
 *   URL com query/hash (código de sala vazaria pro Google).
 */
export function trackPageview(
	prevPathname: string | null,
	newPathname: string,
): void {
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

/** True se analytics está ativo (init() rodou com ID válida). */
export function isEnabled(): boolean {
	return initialized && activeId !== null;
}

/** Retorna o pathname da última pageview disparada. Útil para testes. */
export function getLastPathname(): string | null {
	return lastPathname;
}

/** Apenas para testes — substitui a implementação de `trackPageview`. */
export function __setTrackPageviewForTests(
	impl: ((prev: string | null, next: string) => void) | null,
): void {
	testTrackPageviewImpl = impl;
}

/** Apenas para testes — sobrescreve o measurement id lido do env. */
export function __setGaMeasurementIdForTests(
	value: string | undefined | null,
): void {
	testGaIdOverride = value;
}

/** Reseta estado interno. Apenas para testes — não usar em produção. */
export function __resetForTests(): void {
	initialized = false;
	activeId = null;
	lastPathname = null;
}
