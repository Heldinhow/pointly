/**
 * useDesktop — breakpoint JS para alternar layouts (mesa vs grade).
 *
 * - Default `false` (mobile-first; SSR/jsdom sem matchMedia rendem a grade).
 * - Testes existentes da arena assumem a grade no jsdom — não mudar o default.
 */
import { useEffect, useState } from "react";

export function useDesktop(breakpointPx = 768): boolean {
	const [isDesktop, setIsDesktop] = useState(false);

	useEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const mq = window.matchMedia(`(min-width: ${breakpointPx}px)`);
		setIsDesktop(mq.matches);
		const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
		if (typeof mq.addEventListener === "function") {
			mq.addEventListener("change", onChange);
			return () => mq.removeEventListener("change", onChange);
		}
		// Safari antigo
		mq.addListener?.(onChange);
		return () => mq.removeListener?.(onChange);
	}, [breakpointPx]);

	return isDesktop;
}
