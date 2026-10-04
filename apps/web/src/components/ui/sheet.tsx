"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { XIcon } from "@/prensa/icons";

/**
 * Prensa — F0.4: sheet (painel lateral/superior/inferior), criado do zero.
 *
 * Implementado sobre o primitivo Dialog do Base UI (padrão coss: sheet é um
 * diálogo ancorado na borda). Mesma linguagem do diálogo: folha `--surface`,
 * tinta `--ink`, borda `--ink`, raio `--radius-md` (só no lado solto),
 * recorte `--shadow-cut`; fechar usa o X do set de tinta.
 */

export type SheetSide = "top" | "right" | "bottom" | "left";

const SIDE_POSITION: Record<SheetSide, string> = {
	top: "top-0 left-0 w-full max-h-[85dvh] rounded-b-[var(--radius-md)] border-b data-starting-style:-translate-y-8",
	right:
		"top-0 right-0 h-full w-[min(24rem,90vw)] rounded-l-[var(--radius-md)] border-l data-starting-style:translate-x-8",
	bottom:
		"bottom-0 left-0 w-full max-h-[85dvh] rounded-t-[var(--radius-md)] border-t data-starting-style:translate-y-8",
	left: "top-0 left-0 h-full w-[min(24rem,90vw)] rounded-r-[var(--radius-md)] border-r data-starting-style:-translate-x-8",
};

export function Sheet(
	props: DialogPrimitive.Root.Props,
): React.ReactElement {
	return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

export function SheetTrigger({
	className,
	...props
}: DialogPrimitive.Trigger.Props): React.ReactElement {
	return (
		<DialogPrimitive.Trigger
			className={className}
			data-slot="sheet-trigger"
			{...props}
		/>
	);
}

export function SheetPopup({
	className,
	children,
	side = "right",
	showCloseButton = true,
	closeLabel = "Fechar",
	portalProps,
	...props
}: Omit<DialogPrimitive.Popup.Props, "className"> & {
	className?: string;
	side?: SheetSide;
	showCloseButton?: boolean;
	closeLabel?: string;
	portalProps?: DialogPrimitive.Portal.Props;
}): React.ReactElement {
	return (
		<DialogPrimitive.Portal {...portalProps}>
			<DialogPrimitive.Backdrop
				className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--ink)_50%,transparent)] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0"
				data-slot="sheet-backdrop"
			/>
			<DialogPrimitive.Popup
				className={cn(
					"fixed z-50 flex flex-col overflow-hidden border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-cut)] outline-none transition-[opacity,transform] duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
					SIDE_POSITION[side],
					className,
				)}
				data-side={side}
				data-slot="sheet-popup"
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close
						aria-label={closeLabel}
						className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink)] outline-none hover:bg-[var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] [&_svg]:size-5"
						data-slot="sheet-close"
					>
						<XIcon aria-hidden="true" />
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Popup>
		</DialogPrimitive.Portal>
	);
}

export function SheetHeader({
	className,
	...props
}: React.ComponentProps<"div">): React.ReactElement {
	return (
		<div
			className={cn(
				"flex flex-col gap-1 border-b border-[var(--line)] px-6 py-4 pe-14",
				className,
			)}
			data-slot="sheet-header"
			{...props}
		/>
	);
}

export function SheetTitle({
	className,
	...props
}: DialogPrimitive.Title.Props): React.ReactElement {
	return (
		<DialogPrimitive.Title
			className={cn(
				"font-[var(--font-display)] text-xl font-bold tracking-[-0.01em] text-[var(--ink)]",
				className,
			)}
			data-slot="sheet-title"
			{...props}
		/>
	);
}

export function SheetDescription({
	className,
	...props
}: DialogPrimitive.Description.Props): React.ReactElement {
	return (
		<DialogPrimitive.Description
			className={cn("text-sm text-[var(--ink-muted)]", className)}
			data-slot="sheet-description"
			{...props}
		/>
	);
}

export function SheetPanel({
	className,
	...props
}: React.ComponentProps<"div">): React.ReactElement {
	return (
		<div
			className={cn("flex-1 overflow-y-auto px-6 py-4", className)}
			data-slot="sheet-panel"
			{...props}
		/>
	);
}

export function SheetFooter({
	className,
	...props
}: React.ComponentProps<"div">): React.ReactElement {
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 border-t border-[var(--line)] px-6 py-4 sm:flex-row sm:justify-end",
				className,
			)}
			data-slot="sheet-footer"
			{...props}
		/>
	);
}

export function SheetClose({
	className,
	...props
}: DialogPrimitive.Close.Props): React.ReactElement {
	return (
		<DialogPrimitive.Close
			className={className}
			data-slot="sheet-close"
			{...props}
		/>
	);
}

export { DialogPrimitive as SheetPrimitive };
