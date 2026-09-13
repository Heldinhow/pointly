/**
 * PageviewTracker + NetworkBanner (fundação dark Spell-UI).
 *
 * PageviewTracker: montado UMA vez no RootLayout — dispara
 * `trackPageview(null, pathname)` no mount e `trackPageview(prev, new)`
 * a cada mudança de pathname. Pathname-only: código de sala
 * (`/arena?code=XXXX`) NUNCA chega ao Google.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { trackPageview } from "@/lib/analytics";
import { cn } from "@/lib/cn";

export function PageviewTracker(): null {
	const location = useLocation();

	useEffect(() => {
		const newPathname = location.pathname;
		const prevPathname = getPreviousPathname();
		trackPageview(prevPathname, newPathname);
		setPreviousPathname(newPathname);
	}, [location.pathname]);

	return null;
}

let previousPathname: string | null = null;

function getPreviousPathname(): string | null {
	return previousPathname;
}

function setPreviousPathname(p: string): void {
	previousPathname = p;
}

/** Reseta o pathname anterior. Apenas para testes. */
export function __resetPreviousPathnameForTests(): void {
	previousPathname = null;
}

/**
 * NetworkBanner — indicador offline-only.
 * Renderiza nada quando online; banner sutil no topo quando
 * `navigator.onLine === false`. Some sozinho ao reconectar.
 */
export function NetworkBanner() {
	const [isOnline, setIsOnline] = useState(() =>
		typeof navigator !== "undefined" ? navigator.onLine : true,
	);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	if (isOnline) return null;

	return (
		<div
			role="status"
			aria-live="polite"
			className={cn(
				"sticky top-0 right-0 left-0 z-50",
				"flex items-center justify-center gap-2",
				"border-b border-red-500/20 bg-red-950/90 px-4 py-2",
				"pt-[max(env(safe-area-inset-top),0.5rem)]",
				"font-mono text-[11px] font-semibold tracking-[0.08em] text-red-200 uppercase",
			)}
		>
			<WifiOff aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
			<span className="sr-only">Sem conexão — verifique sua internet</span>
			<span aria-hidden="true">Sem conexão · verifique sua internet</span>
		</div>
	);
}
