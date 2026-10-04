"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Prensa — F0.4: campo de texto sobre papel.
 *
 * API estável (`size`, `unstyled`, `nativeInput`, `data-slot`). Visual sob os
 * tokens Prensa: fundo `--surface`, tinta `--ink`, borda de controle
 * `--ink-muted`, raio `--radius-sm`; foco 2px `--focus` offset 2px; erro
 * (`aria-invalid`) em `--accent` (o sinal); toque ≥44px via
 * `pointer-coarse:min-h-11`. Sem blur/sombra/glow.
 */
export type InputProps = Omit<
	InputPrimitive.Props & React.RefAttributes<HTMLInputElement>,
	"size"
> & {
	size?: "sm" | "default" | "lg" | number;
	unstyled?: boolean;
	nativeInput?: boolean;
};

export function Input({
	className,
	size = "default",
	unstyled = false,
	nativeInput = false,
	style,
	...props
}: InputProps): React.ReactElement {
	const inputClassName = cn(
		"h-8.5 w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] text-[var(--ink)] leading-8.5 outline-none pointer-coarse:min-h-11 placeholder:text-[var(--ink-muted)] autofill:[-webkit-text-fill-color:var(--ink)]",
		size === "sm" &&
			"h-7.5 px-[calc(--spacing(2.5)-1px)] leading-7.5 sm:h-6.5 sm:leading-6.5",
		size === "lg" && "h-9.5 leading-9.5 sm:h-8.5 sm:leading-8.5",
		props.type === "search" &&
			"[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
		props.type === "file" &&
			"text-[var(--ink-muted)] file:me-3 file:bg-transparent file:font-medium file:text-[var(--ink)] file:text-sm",
	);

	return (
		<span
			className={
				cn(
					!unstyled &&
						"relative inline-flex w-full rounded-[var(--radius-sm)] border border-[var(--ink-muted)] bg-[var(--surface)] text-base pointer-coarse:min-h-11 has-focus-visible:border-[var(--focus)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--focus)] has-aria-invalid:border-[var(--accent)] has-focus-visible:has-aria-invalid:border-[var(--accent)] has-focus-visible:has-aria-invalid:outline-[var(--accent)] has-disabled:opacity-60 sm:text-sm",
					className,
				) || undefined
			}
			data-size={size}
			data-slot="input-control"
		>
			{nativeInput ? (
				<input
					className={inputClassName}
					data-slot="input"
					size={typeof size === "number" ? size : undefined}
					style={typeof style === "function" ? undefined : style}
					{...props}
				/>
			) : (
				<InputPrimitive
					className={inputClassName}
					data-slot="input"
					size={typeof size === "number" ? size : undefined}
					style={style}
					{...props}
				/>
			)}
		</span>
	);
}

export { InputPrimitive };
