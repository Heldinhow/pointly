/**
 * Toast — sistema de notificações efêmeras com auto-dismiss.
 *
 * Phase 5 (T26). Provider + hook. Renderiza no topo central da viewport.
 *
 * Acessibilidade:
 *  - role="status" + aria-live="polite" + aria-atomic="true"
 *  - auto-dismiss 3s (configurável via prop `duration`)
 *  - Suporta prefers-reduced-motion (transição instantânea)
 *
 * Estado local (não conectado ao Zustand store) — UI efêmera não merece
 * re-render global. Cada ToastProvider mantém fila interna.
 */
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type * as React from "react";
import { cn } from "./utils";

export type ToastKind = "info" | "success" | "error";

export type ToastItem = {
	id: string;
	text: string;
	kind: ToastKind;
};

export interface ToastContextValue {
	push: (text: string, kind?: ToastKind) => void;
	dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<ToastKind, string> = {
	info: "bg-surface text-ink border-ink/10",
	success: "bg-coral-soft text-ink border-coral/30",
	error: "bg-coral text-white border-coral",
};

const KIND_LABEL: Record<ToastKind, string> = {
	info: "Info",
	success: "Sucesso",
	error: "Erro",
};

export interface ToastProviderProps {
	children: React.ReactNode;
	/** Default auto-dismiss em ms. Default: 3000. */
	duration?: number;
}

/**
 * Provider — wrap sua app uma vez. Sub-componentes consomem via `useToast()`.
 */
export function ToastProvider({
	children,
	duration = 3000,
}: ToastProviderProps) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const counterRef = useRef(0);

	const dismiss = useCallback((id: string) => {
		setToasts((curr) => curr.filter((t) => t.id !== id));
	}, []);

	const push = useCallback((text: string, kind: ToastKind = "info") => {
		counterRef.current += 1;
		const id = `t_${Date.now().toString(36)}_${counterRef.current}`;
		setToasts((curr) => [...curr, { id, text, kind }]);
	}, []);

	const ctxValue = useMemo<ToastContextValue>(
		() => ({ push, dismiss }),
		[push, dismiss],
	);

	return (
		<ToastContext.Provider value={ctxValue}>
			{children}
			<ToastViewport toasts={toasts} duration={duration} onDismiss={dismiss} />
		</ToastContext.Provider>
	);
}

interface ViewportProps {
	toasts: ToastItem[];
	duration: number;
	onDismiss: (id: string) => void;
}

function ToastViewport({ toasts, duration, onDismiss }: ViewportProps) {
	return (
		<div
			aria-live="polite"
			aria-atomic="true"
			className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
		>
			{toasts.map((t) => (
				<ToastEntry
					key={t.id}
					item={t}
					duration={duration}
					onDismiss={onDismiss}
				/>
			))}
		</div>
	);
}

function ToastEntry({
	item,
	duration,
	onDismiss,
}: {
	item: ToastItem;
	duration: number;
	onDismiss: (id: string) => void;
}) {
	useEffect(() => {
		const handle = setTimeout(() => onDismiss(item.id), duration);
		return () => clearTimeout(handle);
	}, [item.id, duration, onDismiss]);

	return (
		<div
			role="status"
			className={cn(
				"pointer-events-auto rounded-full border px-5 py-2.5 shadow-bone",
				"text-sm font-sans font-medium max-w-md",
				"animate-[fade-in_120ms_ease-out]",
				KIND_STYLES[item.kind],
			)}
		>
			<span className="sr-only">{KIND_LABEL[item.kind]}: </span>
			{item.text}
		</div>
	);
}

/**
 * Hook para consumir o ToastProvider. Throws se chamado fora do provider.
 */
export function useToast(): ToastContextValue {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error("useToast deve ser chamado dentro de <ToastProvider>");
	}
	return ctx;
}
