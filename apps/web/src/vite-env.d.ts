/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_WS_URL?: string;
	readonly VITE_API_BASE?: string;
	/** GA4 Measurement ID. Empty / unset → analytics no-op. */
	readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface Window {
	dataLayer?: unknown[];
	gtag?: (...args: unknown[]) => void;
}
