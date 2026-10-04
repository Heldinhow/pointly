import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Prensa — F0.3: marca nova do Pointly.
 *
 * "Prensa" é o nome da direção visual; o produto continua chamando Pointly.
 * Lockup construído do zero em Archivo (DESIGN.md §Tipografia): bloco de
 * tipo (quadrado de tinta com "P" de papel + filete de vermelhão) + wordmark
 * em caixa baixa com ponto final de sinal. Nenhuma relação com a marca
 * antiga (swirl + cascata): sem pás, sem giro, sem letras em cascata.
 */

export function PrensaMark({
	size = 28,
	className,
}: {
	size?: number;
	className?: string;
}): React.ReactElement {
	return (
		<span
			aria-hidden="true"
			className={cn("inline-flex shrink-0 flex-col", className)}
			data-slot="prensa-mark"
			style={{ width: size, height: size }}
		>
			<span
				className="flex flex-1 items-center justify-center"
				style={{
					background: "var(--ink)",
					borderRadius: "var(--radius-sm)",
					color: "var(--bg)",
					fontFamily: "var(--font-display)",
					fontSize: size * 0.62,
					fontWeight: 800,
					letterSpacing: "-0.01em",
					lineHeight: 1,
				}}
			>
				P
			</span>
			<span
				aria-hidden="true"
				style={{
					background: "var(--accent)",
					borderRadius: "var(--radius-sm)",
					height: Math.max(3, Math.round(size * 0.11)),
					marginTop: Math.max(2, Math.round(size * 0.08)),
					width: "100%",
				}}
			/>
		</span>
	);
}

export function PrensaWordmark({
	className,
}: {
	className?: string;
}): React.ReactElement {
	return (
		<span
			className={cn("inline-flex items-baseline whitespace-nowrap", className)}
			data-slot="prensa-wordmark"
			style={{
				color: "var(--ink)",
				fontFamily: "var(--font-display)",
				fontWeight: 800,
				letterSpacing: "-0.01em",
				lineHeight: 1.1,
			}}
		>
			Pointly
			<span aria-hidden="true" style={{ color: "var(--accent)" }}>
				.
			</span>
		</span>
	);
}

/** Lockup horizontal: bloco de tipo + wordmark (usado no shell em F0.5). */
export function PrensaBrand({
	className,
	markSize = 28,
}: {
	className?: string;
	markSize?: number;
}): React.ReactElement {
	return (
		<span
			className={cn("inline-flex items-center", className)}
			data-slot="prensa-brand"
			style={{ gap: 10 }}
		>
			<PrensaMark size={markSize} />
			<PrensaWordmark />
		</span>
	);
}
