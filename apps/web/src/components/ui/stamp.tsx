"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Prensa — F0.4: carimbo.
 *
 * Componente novo (não existia): etiqueta batida em Archivo, caixa alta,
 * borda de 2px no sinal (ou na tinta), leve giro de prensa (-2deg).
 * Usado em unanimidade, tiragem e CTAs especiais (F3/F4 consomem).
 */
export const stampVariants = cva(
	"inline-flex rotate-[-2deg] items-center justify-center gap-2 rounded-[var(--radius-sm)] border-2 font-[var(--font-display)] font-extrabold tracking-[0.08em] uppercase select-none",
	{
		defaultVariants: {
			size: "default",
			variant: "default",
		},
		variants: {
			size: {
				sm: "px-2 py-0.5 text-xs leading-none",
				default: "px-3 py-1 text-sm leading-none",
				lg: "px-4 py-1.5 text-base leading-none",
			},
			variant: {
				default:
					"border-[var(--accent)] bg-transparent text-[var(--accent)]",
				ink: "border-[var(--ink)] bg-transparent text-[var(--ink)]",
				soft: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]",
			},
		},
	},
);

export interface StampProps
	extends useRender.ComponentProps<"span">,
		VariantProps<typeof stampVariants> {}

export function Stamp({
	className,
	variant,
	size,
	render,
	...props
}: StampProps): React.ReactElement {
	const defaultProps = {
		className: cn(stampVariants({ className, size, variant })),
		"data-slot": "stamp",
	};

	return useRender({
		defaultTagName: "span",
		props: mergeProps<"span">(defaultProps, props),
		render,
	});
}
