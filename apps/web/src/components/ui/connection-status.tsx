/**
 * ConnectionStatus — indicator visual de conexão WS.
 *
 * Phase 5 (T26). Pill pequeno com dot (pulse se loading) + label.
 *
 * Variants:
 *  - loading: pulse dot coral + "Conectando…"
 *  - error: coral dot + "Conexão perdida"
 *  - connected: olive dot + "Conectado"
 *
 * Use no header da Arena (ao lado do código da sala) e na tela Join.
 */
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "./utils";

const statusVariants = cva(
	"inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider border",
	{
		variants: {
			variant: {
				loading: "bg-surface text-ink-soft border-ink/10",
				error: "bg-coral-soft text-coral border-coral/30",
				connected: "bg-surface text-olive border-olive/30",
			},
		},
		defaultVariants: {
			variant: "loading",
		},
	},
);

const DOT_COLORS: Record<"loading" | "error" | "connected", string> = {
	loading: "bg-coral",
	error: "bg-coral",
	connected: "bg-olive",
};

const LABELS: Record<"loading" | "error" | "connected", string> = {
	loading: "Conectando…",
	error: "Conexão perdida",
	connected: "Conectado",
};

export interface ConnectionStatusProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
		VariantProps<typeof statusVariants> {
	ref?: React.Ref<HTMLDivElement>;
}

export function ConnectionStatus({
	variant = "loading",
	className,
	ref,
	...props
}: ConnectionStatusProps) {
	const v = variant ?? "loading";
	const label = LABELS[v];
	return (
		<div
			ref={ref}
			role="status"
			aria-live="polite"
			className={cn(statusVariants({ variant: v }), className)}
			{...props}
		>
			<span
				aria-hidden="true"
				className={cn(
					"inline-block w-2 h-2 rounded-full",
					DOT_COLORS[v],
					v === "loading" && "animate-pulse",
				)}
			/>
			<span>{label}</span>
		</div>
	);
}
