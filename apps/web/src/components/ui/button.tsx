"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

/**
 * Prensa — F0.4: botão-carimbo.
 *
 * Restilizado sob os tokens Prensa (papel/tinta + UMA cor de sinal).
 * API e comportamento estáveis: mesmos exports, variants, sizes, `data-slot`,
 * `loading`, `render`. Sem blur/gradiente/pílula/glow; recorte duro
 * `--shadow-cut`; raio `--radius-sm`; foco 2px offset 2px (sobre accent, anel
 * em `--ink`); toque ≥44px via `pointer-coarse:after` (técnica já presente).
 */
export const buttonVariants = cva(
	"relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border font-medium text-base outline-none transition-[background-color,box-shadow,transform] duration-150 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] disabled:pointer-events-none disabled:shadow-none disabled:opacity-60 data-loading:select-none data-loading:text-transparent sm:text-sm [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0",
	{
		defaultVariants: {
			size: "default",
			variant: "default",
		},
		variants: {
			size: {
				default: "h-9 px-[calc(--spacing(3)-1px)] sm:h-8",
				icon: "size-9 sm:size-8",
				"icon-lg": "size-10 sm:size-9",
				"icon-sm": "size-8 sm:size-7",
				"icon-xl":
					"size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
				"icon-xs":
					"size-7 sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9",
				sm: "h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7",
				xl: "h-11 px-[calc(--spacing(4)-1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
				xs: "h-7 gap-1 px-[calc(--spacing(2)-1px)] text-sm sm:h-6 sm:text-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
			},
			variant: {
				default:
					"border-[var(--ink)] bg-[var(--accent)] text-[var(--on-accent)] shadow-[var(--shadow-cut)] hover:brightness-95 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:brightness-95 focus-visible:outline-[var(--ink)] *:data-[slot=button-loading-indicator]:text-[var(--on-accent)]",
				destructive:
					"border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)] shadow-[var(--shadow-cut)] hover:bg-[var(--accent)] hover:text-[var(--on-accent)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none *:data-[slot=button-loading-indicator]:text-[var(--bg)]",
				"destructive-outline":
					"border-[var(--accent)] bg-transparent text-[var(--accent)] shadow-none hover:bg-[var(--accent-soft)] active:bg-[var(--accent-soft)] *:data-[slot=button-loading-indicator]:text-[var(--accent)]",
				ghost:
					"border-transparent bg-transparent text-[var(--ink)] shadow-none hover:bg-[var(--accent-soft)] active:bg-[var(--accent-soft)] *:data-[slot=button-loading-indicator]:text-[var(--ink)]",
				link: "border-transparent bg-transparent text-[var(--accent)] shadow-none underline-offset-4 hover:underline active:underline *:data-[slot=button-loading-indicator]:text-[var(--accent)]",
				outline:
					"border-[var(--ink-muted)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-cut)] hover:bg-[var(--accent-soft)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none *:data-[slot=button-loading-indicator]:text-[var(--ink)]",
				secondary:
					"border-[var(--line)] bg-[var(--accent-soft)] text-[var(--ink)] shadow-[var(--shadow-cut)] hover:brightness-95 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none *:data-[slot=button-loading-indicator]:text-[var(--ink)]",
			},
		},
	},
);

export interface ButtonProps extends useRender.ComponentProps<"button"> {
	variant?: VariantProps<typeof buttonVariants>["variant"];
	size?: VariantProps<typeof buttonVariants>["size"];
	loading?: boolean;
}

export function Button({
	className,
	variant,
	size,
	render,
	children,
	loading = false,
	disabled: disabledProp,
	...props
}: ButtonProps): React.ReactElement {
	const isDisabled: boolean = Boolean(loading || disabledProp);
	const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
		render ? undefined : "button";

	const defaultProps = {
		children: (
			<>
				{children}
				{loading && (
					<Spinner
						aria-hidden="true"
						className="pointer-events-none absolute"
						data-slot="button-loading-indicator"
					/>
				)}
			</>
		),
		className: cn(buttonVariants({ className, size, variant })),
		"aria-disabled": loading || undefined,
		"aria-busy": loading || undefined,
		"data-loading": loading ? "" : undefined,
		"data-slot": "button",
		disabled: isDisabled,
		type: typeValue,
	};

	return useRender({
		defaultTagName: "button",
		props: mergeProps<"button">(defaultProps, props),
		render,
	});
}
