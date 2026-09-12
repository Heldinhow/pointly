/**
 * Toast host — Spell dark (contrato preservado).
 *
 * API pública (outros workers/páginas dependem — não renomear):
 *   - `<ToastHost />` — monta a fila (uma vez no `<App />`)
 *   - `toast(message, opts?)` — enfileira, retorna id
 *   - `dismissToast(id)` — remove pelo id
 *
 * Visual Spell: painel near-black com borda hairline, acento lateral por
 * variante, tipografia Geist + micro-label mono, entrada suave
 * (transform+opacity, colapsa em reduced-motion).
 */
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
	title?: string;
	variant?: ToastVariant;
	/** ms até dispensar sozinho. Default 4000. `0` = fica até dispensar. */
	duration?: number;
}

interface ToastItem {
	id: number;
	message: string;
	title?: string;
	variant: ToastVariant;
	duration: number;
}

type Listener = (items: ToastItem[]) => void;

let nextId = 1;
let queue: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
	for (const l of listeners) l([...queue]);
}

/** Enfileira um toast. Retorna o id (útil p/ `dismissToast`). */
export function toast(message: string, opts: ToastOptions = {}): number {
	const item: ToastItem = {
		id: nextId++,
		message,
		title: opts.title,
		variant: opts.variant ?? "info",
		duration: opts.duration ?? 4000,
	};
	queue = [...queue.slice(-3), item];
	emit();
	if (item.duration > 0) {
		window.setTimeout(() => dismissToast(item.id), item.duration);
	}
	return item.id;
}

/** Remove um toast da fila pelo id. */
export function dismissToast(id: number): void {
	if (!queue.some((t) => t.id === id)) return;
	queue = queue.filter((t) => t.id !== id);
	emit();
}

/** Apenas para testes — limpa a fila. */
export function __resetToastsForTests(): void {
	queue = [];
	emit();
}

const VARIANT_STYLES: Record<ToastVariant, { frame: string; bar: string; tag: string }> = {
	success: {
		frame: "border-emerald-400/25 bg-[#0b1512]/95 text-emerald-50",
		bar: "bg-emerald-400",
		tag: "text-emerald-300",
	},
	error: {
		frame: "border-red-400/25 bg-[#170d0d]/95 text-red-50",
		bar: "bg-red-400",
		tag: "text-red-300",
	},
	info: {
		frame: "border-[#26262c] bg-[#101013]/95 text-zinc-100",
		bar: "bg-zinc-500",
		tag: "text-zinc-400",
	},
};

const VARIANT_TAG: Record<ToastVariant, string> = {
	success: "ok",
	error: "erro",
	info: "mesa",
};

/** Renderiza a fila de toasts. Montado uma vez em `<App />`. */
export function ToastHost() {
	const [items, setItems] = useState<ToastItem[]>(queue);

	useEffect(() => {
		const listener: Listener = (next) => setItems(next);
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}, []);

	if (items.length === 0) return null;

	return (
		<div
			aria-live="polite"
			className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-4 sm:bottom-auto"
		>
			{items.map((item) => {
				const styles = VARIANT_STYLES[item.variant];
				return (
					<div
						key={item.id}
						role={item.variant === "error" ? "alert" : "status"}
						data-toast={item.variant}
						className={cn(
							"pointly-toast pointer-events-auto flex w-full max-w-sm items-stretch gap-3 overflow-hidden rounded-xl border shadow-2xl backdrop-blur",
							styles.frame,
						)}
					>
						<span aria-hidden="true" className={cn("w-1 shrink-0", styles.bar)} />
						<div className="min-w-0 flex-1 px-1 py-3">
							<p
								className={cn(
									"font-mono text-[10px] tracking-[0.16em] uppercase",
									styles.tag,
								)}
							>
								{VARIANT_TAG[item.variant]}
							</p>
							{item.title ? (
								<p className="mt-0.5 text-sm font-semibold">{item.title}</p>
							) : null}
							<p className="mt-0.5 text-sm break-words opacity-90">{item.message}</p>
						</div>
						<button
							type="button"
							onClick={() => dismissToast(item.id)}
							aria-label="Dispensar notificação"
							className="shrink-0 cursor-pointer px-3 text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
						>
							<span aria-hidden="true">×</span>
						</button>
					</div>
				);
			})}
			<style>{`@keyframes pointly-toast-in{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}.pointly-toast{animation:pointly-toast-in 180ms ease-out}@media (prefers-reduced-motion:reduce){.pointly-toast{animation:none}}`}</style>
		</div>
	);
}
