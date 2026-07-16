/**
 * useIsMobile — media query hook para branch mobile-first.
 *
 * **Breakpoint**: `(max-width: 639px)` — abaixo de `sm` (640px) no Tailwind.
 * Qualquer coisa ≥640px trata como "desktop" e mantém o round-table.
 *
 * SSR-safe: retorna `false` no primeiro render (servidor / hidratação) e
 * sincroniza com `matchMedia` no mount via `change` listener. Sem flicker
 * perceptível porque o conteúdo da Arena é renderizado via `position:
 * absolute` + `transform: scale()` — sem layout shift entre branches.
 *
 * `matchMedia` é preferido a `ResizeObserver` aqui porque queremos o
 * ESTADO da media query, não a DIMENSÃO do container (essa info já vem
 * do ResizeObserver do `--arena-scale`).
 *
 * @see DESIGN.md §4 Counter-Scale Rule (mobile branch dispensa o scale)
 */
import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 639px)";

export function useIsMobile(): boolean {
	// Default false no SSR / hidratação. Sync com matchMedia no mount.
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mql = window.matchMedia(MOBILE_QUERY);
		setIsMobile(mql.matches);
		// Modern browsers >= Safari 14 / Chrome 79
		const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	return isMobile;
}
