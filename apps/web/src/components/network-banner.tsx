/**
 * NetworkBanner — indicador offline/online.
 *
 * Mostra banner sutil no topo da viewport quando `navigator.onLine === false`.
 * Detecta mudanças via eventos `online`/`offline` do window. Esconde
 * automaticamente quando reconecta.
 *
 * **A11y**:
 *  - role="status" + aria-live="polite" (anuncia transição)
 *  - sr-only copy: "Sem conexão — verifique sua internet"
 *
 * **Visual**:
 *  - bg-coral-soft + text-coral-deep (atenção sem alarme)
 *  - dot pulsing coral (motion-reduce respeitado)
 *  - Position fixed top-0 z-50, safe-area-inset-top respeitado
 *
 * @see .specs/features/mobile-first-join-arena/spec.md FMR-23
 */
import { useEffect, useState } from "react";
import { cn } from "./ui/utils";

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
			data-testid="network-banner"
			className={cn(
				"fixed top-0 left-0 right-0 z-50",
				"bg-coral-soft border-b border-coral/30",
				"flex items-center justify-center gap-2",
				"py-2 px-4 font-mono text-label uppercase tracking-caps text-coral-deep",
				"pt-[max(env(safe-area-inset-top),0.5rem)]",
			)}
		>
			<span
				aria-hidden="true"
				className="inline-block w-1.5 h-1.5 rounded-full bg-coral motion-reduce:animate-none animate-pulse flex-shrink-0"
			/>
			<span>Sem conexão · verifique sua internet</span>
		</div>
	);
}