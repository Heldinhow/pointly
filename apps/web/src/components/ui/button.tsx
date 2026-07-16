import { type VariantProps, cva } from "class-variance-authority";
/**
 * Button — shadcn-style Button com variantes Atelier Zero.
 *
 * Phase 5 (T26) + Phase 6 (landing-header refactor).
 * Primitivo base para CTAs (coral) e ações secundárias (ghost).
 *
 * Variants:
 *  - coral: CTA primário sólido (bg coral, label ink/Carbon Ink, shadow coral).
 *    Label usa Carbon Ink (#15140f) — 5.8:1 sobre coral #ed6f5c (WCAG AA+).
 *    Regra Atelier Zero: ≤1 coral sólido por fold de landing.
 *  - coral-outline: CTA secundário em Coral Deep (border-2, text-coral-deep,
 *    fundo transparente). Coral Deep (#b8412f) bate WCAG AA sobre Warm
 *    Parchment (#efe7d2). Reconhecível como CTA mas sem competir com o coral
 *    sólido. Usado no SiteHeader (issue 03 do landing-header).
 *  - default: ghost com border 1px ink-at-20%
 *  - ghost: sem border, transparente
 *  - link: underline ink
 *
 * Sizes:
 *  - sm: 12px pad y / 18px x (32px altura — abaixo do touch target 44px WCAG,
 *    use em contextos inline/header onde o padding do container compensa)
 *  - md: 14px pad y / 22px x (40px altura — ainda abaixo do 44px; preferir
 *    `lg` para CTAs em superfícies tocáveis standalone)
 *  - lg: 16px pad y / 28px x (48px altura — bate touch target 44px WCAG)
 */
import { forwardRef } from "react";
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
					"bg-coral text-ink shadow-coral hover:bg-coral-soft active:translate-y-px focus-visible:ring-coral-deep",
				"coral-outline":
					"border-2 border-coral-deep text-coral-deep bg-transparent hover:bg-coral-deep/10 active:translate-y-px",
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
		VariantProps<typeof buttonVariants> {}

/**
 * Button primitivo. Para CTAs use `variant="coral"` (regra crítica: ≤1 por viewport).
 * - `variant="coral"`: label Carbon Ink (#15140f) sobre coral — 5.8:1.
 * - `variant="coral-outline"`: Coral Deep (#b8412f) — WCAG AA sobre paper.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, ...props }, ref) => {
		return (
			<button
				ref={ref}
				className={cn(buttonVariants({ variant, size }), className)}
				{...props}
			/>
		);
	},
);

Button.displayName = "Button";

export { buttonVariants };
