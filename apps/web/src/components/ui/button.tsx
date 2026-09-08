import { type VariantProps, cva } from "class-variance-authority";

import { forwardRef } from "react";
import type * as React from "react";
import { cn } from "./utils";

const buttonVariants = cva(
	"pointly-button inline-flex items-center justify-center gap-2 " +
		"whitespace-nowrap transition-colors duration-150 " +
		"focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] " +
		"disabled:pointer-events-none disabled:opacity-40 " +
		"select-none",
	{
		variants: {
			variant: {
				coral:
					"pointly-button-primary bg-accent text-on-accent font-mono uppercase tracking-caps text-[13px] font-semibold leading-none",
				"coral-outline":
					"pointly-button-outline font-mono uppercase tracking-caps text-[13px] font-semibold leading-none",
				default:
					"border border-ink/20 bg-transparent text-ink hover:border-ink/40 font-mono uppercase tracking-caps text-[13px] font-semibold leading-none",
				ghost:
					"bg-transparent font-sans text-ink-soft hover:text-ink hover:bg-ink/5",
				link: "bg-transparent font-sans text-ink underline underline-offset-4 hover:text-ink-soft",
			},
			size: {
				sm: "h-11 px-4",
				md: "h-11 px-5",
				lg: "h-12 px-7",
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
