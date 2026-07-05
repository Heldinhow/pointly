/**
 * Pill — tag/label com variants semânticos.
 *
 * Phase 5 (T26). Primitivo para o coral-pill (CTA), ghost-pill (secondary),
 * critical (timer ≤30s), gold (stats mediana).
 *
 * Variants:
 *  - default: bone-fill, ink-faint label
 *  - critical: bg coral-soft, label coral
 *  - gold: bg mustard/15 (transparência via opacity utility), label ink
 *  - ghost: border 1px ink-at-20%, label ink
 *
 * Sizes: sm (h-6, text-xs), md (h-8, text-sm).
 */
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "./utils";

const pillVariants = cva(
	"inline-flex items-center gap-1.5 rounded-full font-mono tracking-wide whitespace-nowrap select-none transition-colors",
	{
		variants: {
			variant: {
				default: "bg-surface text-ink-faint border border-ink/5",
				critical: "bg-coral-soft text-ink border border-coral/20",
				gold: "bg-mustard/15 text-ink border border-mustard/40",
				ghost: "bg-transparent text-ink border border-ink/20",
			},
			size: {
				sm: "h-6 px-2.5 text-[10px]",
				md: "h-8 px-3 text-xs",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	},
);

export interface PillProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof pillVariants> {
	ref?: React.Ref<HTMLSpanElement>;
}

/**
 * Pill — tag visual usado em timer, stats, host badge.
 */
export function Pill({ className, variant, size, ref, ...props }: PillProps) {
	return (
		<span
			ref={ref}
			className={cn(pillVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { pillVariants };
