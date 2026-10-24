/**
 * Beacon first-party de visitas (`POST /api/stats/pageview`).
 *
 * Independente do consentimento de analytics (LGPD): o beacon não carrega
 * script de terceiro, não envia — e o servidor não armazena — dado pessoal,
 * cookie, fingerprint, path/query (códigos de sala) ou corpo algum.
 */

const BEACON_URL = "/api/stats/pageview";

/** Dispara o beacon de pageview; best-effort, nunca lança. */
export function sendPageviewBeacon(
	navigatorImpl?: { sendBeacon?: (url: string) => boolean },
	fetchImpl: typeof fetch = fetch,
): void {
	try {
		const beacon =
			navigatorImpl?.sendBeacon ??
			(typeof navigator !== "undefined" ? navigator.sendBeacon?.bind(navigator) : undefined);
		if (typeof beacon === "function") {
			beacon(BEACON_URL);
			return;
		}
		void fetchImpl(BEACON_URL, {
			method: "POST",
			keepalive: true,
			credentials: "same-origin",
		});
	} catch {
		// Beacon é best-effort: falha de rede nunca quebra a navegação.
	}
}
