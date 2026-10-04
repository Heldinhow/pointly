"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type React from "react";
import { cn } from "@/lib/utils";

/**
 * Prensa — F0.4: Field (rótulo + descrição + erro).
 *
 * API estável (mesmos exports e `data-slot`). Tinta `--ink`, secundário
 * `--ink-muted`, erro no sinal `--accent`; erro exposto via `aria-invalid`
 * no controle (estilizado em `input.tsx`).
 */
export function Field({
	className,
	...props
}: FieldPrimitive.Root.Props): React.ReactElement {
	return (
		<FieldPrimitive.Root
			className={cn("flex flex-col items-start gap-2", className)}
			data-slot="field"
			{...props}
		/>
	);
}

export function FieldLabel({
	className,
	...props
}: FieldPrimitive.Label.Props): React.ReactElement {
	return (
		<FieldPrimitive.Label
			className={cn(
				"inline-flex items-center gap-2 font-medium text-base/4.5 text-[var(--ink)] data-disabled:opacity-60 sm:text-sm/4",
				className,
			)}
			data-slot="field-label"
			{...props}
		/>
	);
}

export function FieldItem({
	className,
	...props
}: FieldPrimitive.Item.Props): React.ReactElement {
	return (
		<FieldPrimitive.Item
			className={cn("flex", className)}
			data-slot="field-item"
			{...props}
		/>
	);
}

export function FieldDescription({
	className,
	...props
}: FieldPrimitive.Description.Props): React.ReactElement {
	return (
		<FieldPrimitive.Description
			className={cn("text-[var(--ink-muted)] text-xs", className)}
			data-slot="field-description"
			{...props}
		/>
	);
}

export function FieldError({
	className,
	...props
}: FieldPrimitive.Error.Props): React.ReactElement {
	return (
		<FieldPrimitive.Error
			className={cn("text-[var(--accent)] text-xs", className)}
			data-slot="field-error"
			{...props}
		/>
	);
}

export const FieldControl: typeof FieldPrimitive.Control =
	FieldPrimitive.Control;
export const FieldValidity: typeof FieldPrimitive.Validity =
	FieldPrimitive.Validity;

export { FieldPrimitive };
