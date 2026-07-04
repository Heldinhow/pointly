/**
 * Button — shadcn-style Button com variantes Atelier Zero.
 *
 * Phase 5 (T26). Primitivo base para CTAs (coral) e ações secundárias (ghost).
 *
 * Variants:
 *  - coral: CTA primário (bg coral, label white, shadow coral)
 *  - default: ghost com border 1px ink-at-20%
 *  - ghost: sem border, transparente
 *  - link: underline ink
 *
 * Sizes:
 *  - sm: 12px pad y / 18px x
 *  - md: 14px pad y / 22px x
 *  - lg: 16px pad y / 28px x
 */
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "./utils";

const buttonVariants = cva(
	// base
	"inline-flex items-center justify-center gap-2 font-sans font-medium " +
		"rounded-full whitespace-nowrap transition-all duration-150 " +
		"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
		"disabled:pointer-events-none disabled:opacity-40 " +
		"select-none",
	{
		variants: {
			variant: {
				coral:
					"bg-coral text-white shadow-coral hover:bg-coral-soft active:translate-y-px",
				default:
					"border border-ink/20 bg-transparent text-ink hover:border-ink/40 active:translate-y-px",
				ghost:
					"bg-transparent text-ink-soft hover:text-ink hover:bg-ink/5 active:translate-y-px",
				link: "bg-transparent text-ink underline underline-offset-4 hover:text-coral",
			},
			size: {
				sm: "h-8 px-4 text-sm",
				md: "h-10 px-5 text-base",
				lg: "h-12 px-7 text-lg",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	/** Ref forwarded (React 18 idiomático). */
	ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Button primitivo. Para CTAs use `variant="coral"` (regra crítica: ≤1 por viewport).
 */
export function Button({
	className,
	variant,
	size,
	ref,
	...props
}: ButtonProps) {
	return (
		<button
			ref={ref}
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { buttonVariants };
