/**
 * GA4 thin wrapper (VITE_GA_MEASUREMENT_ID).
 *
 * Vazio → todos os exports são no-op (zero request a googletagmanager).
 *
 * O script só é carregado após consentimento explícito. Sem Measurement ID,
 * consentimento ou navegador, todos os exports continuam no-op.
 */

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

/** Nomes canônicos dos eventos de produto. */
export const AnalyticsEvent = {
	roomCreated: "room_created",
	roomJoined: "room_joined",
	voteCast: "vote_cast",
	votesRevealed: "votes_revealed",
	newRound: "new_round",
} as const;

export type AnalyticsEventName =
	(typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

/**
 * Sanitiza o path enviado ao GA4 como `page_path`.
 *
 * Privacidade: códigos de sala são identificadores compartilháveis e
 * roteáveis — nunca vão para terceiros.
 * - `/s/:code` (e equivalentes com prefixo de locale, ex. `/en/s/:code`)
 *   → `/s/[room]`
 * - demais paths vão como estão (rotas públicas/canônicas de SEO).
 *
 * A query string NUNCA é enviada: o chamador (App) passa só `pathname`,
 * então `/join?code=XXXX`/`?mode=join` chega ao GA4 como `/join`.
 */
export function sanitizePagePath(pathname: string): string {
	if (/^\/(?:[a-z]{2}(?:-[A-Za-z]{2})?\/)?s\/[^/]+/i.test(pathname)) {
		return "/s/[room]";
	}
	if (pathname === "" || pathname === "/") return "/";
	return pathname.length > 1 ? pathname.replace(/\/+$/, "") || "/" : pathname;
}

let scriptInjected = false;
let analyticsConsent = false;

function measurementId(): string {
	const raw = import.meta.env.VITE_GA_MEASUREMENT_ID;
	return typeof raw === "string" ? raw.trim() : "";
}

function enabled(): boolean {
	return measurementId().length > 0;
}

export function analyticsConfigured(): boolean {
	return enabled();
}

/** Reseta estado interno — SÓ para testes unitários (nunca importar em código de app). */
export function __resetAnalyticsForTests(): void {
	if (import.meta.env.PROD) {
		throw new Error("__resetAnalyticsForTests is test-only");
	}
	scriptInjected = false;
	analyticsConsent = false;
}

/** Atualiza a escolha em memória e só inicializa GA após consentimento. */
export function setAnalyticsConsent(granted: boolean): void {
	analyticsConsent = granted;
	if (granted) return;
	if (scriptInjected && typeof window.gtag === "function") {
		window.gtag("consent", "update", { analytics_storage: "denied" });
	}
}

/**
 * Carrega gtag.js uma vez e configura o Measurement ID.
 * Idempotente; no-op sem ID.
 */
export function initAnalytics(): void {
	if (!analyticsConsent || !enabled() || scriptInjected) return;
	if (typeof window === "undefined" || typeof document === "undefined") return;

	const id = measurementId();
	window.dataLayer = window.dataLayer ?? [];
	if (typeof window.gtag !== "function") {
		window.gtag = function gtag(...args: unknown[]) {
			window.dataLayer?.push(args);
		};
	}

	window.gtag("consent", "update", { analytics_storage: "granted" });
	window.gtag("js", new Date());
	window.gtag("config", id, { send_page_view: false });

	const existing = document.querySelector<HTMLScriptElement>(
		`script[src*="googletagmanager.com/gtag/js"]`,
	);
	if (!existing) {
		const script = document.createElement("script");
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
		document.head.appendChild(script);
	}

	scriptInjected = true;
}

export function trackPageView(path: string, title?: string): void {
	if (!analyticsConsent || !enabled()) return;
	const gtag = window.gtag;
	if (typeof gtag !== "function") return;
	gtag("event", "page_view", {
		page_path: sanitizePagePath(path),
		...(title !== undefined ? { page_title: title } : {}),
	});
}

/**
 * Evento de produto. Prefira os nomes de {@link AnalyticsEvent}
 * (`AnalyticsEventName`); string livre é aceita só para `page_view`
 * interno e futuros eventos ainda não catalogados.
 *
 * Semântica de voto: `vote_cast` dispara uma vez por carta DIFERENTE
 * (revotar a mesma carta é no-op no caller, sem duplo disparo).
 */
export function trackEvent(
	name: AnalyticsEventName | (string & {}),
	params?: AnalyticsParams,
): void {
	if (!analyticsConsent || !enabled()) return;
	const gtag = window.gtag;
	if (typeof gtag !== "function") return;
	gtag("event", name, params ?? {});
}

export function trackRoomCreated(): void {
	trackEvent(AnalyticsEvent.roomCreated);
}

export function trackRoomJoined(): void {
	trackEvent(AnalyticsEvent.roomJoined);
}

export function trackVoteCast(): void {
	trackEvent(AnalyticsEvent.voteCast);
}

export function trackVotesRevealed(): void {
	trackEvent(AnalyticsEvent.votesRevealed);
}

export function trackNewRound(): void {
	trackEvent(AnalyticsEvent.newRound);
}
