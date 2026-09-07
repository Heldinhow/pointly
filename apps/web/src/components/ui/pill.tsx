
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";
import { cn } from "./utils";

const pillVariants = cva(
	"pointly-pill inline-flex items-center gap-1.5 rounded-full font-mono tracking-wide whitespace-nowrap select-none transition-colors",
	{
		variants: {
			variant: {
				default: "bg-surface text-ink-faint border border-ink/5",
				critical: "pointly-pill-critical bg-coral-soft text-ink border border-coral/20",
				gold: "pointly-pill-gold bg-mustard/15 text-ink border border-mustard/40",
				ghost: "bg-transparent text-ink border border-ink/20",
			},
			size: {
				sm: "h-6 px-2.5 text-micro-label",
				md: "h-8 px-3 text-caption",
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
