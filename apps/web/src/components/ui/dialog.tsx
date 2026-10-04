"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { XIcon } from "@/prensa/icons";

/**
 * Prensa — F0.4: diálogo (modal centrado), criado do zero.
 *
 * Composição coss/Base UI (trigger/popup, seções header/panel/footer como
 * filhas diretas do popup). Folha `--surface`, tinta `--ink`, borda `--ink`,
 * raio `--radius-md`, recorte `--shadow-cut`, régua `--line`; fechar usa o
 * X do set de tinta; foco 2px offset 2px; toque ≥44px. Sem blur/glow.
 */

export function Dialog(
	props: DialogPrimitive.Root.Props,
): React.ReactElement {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

export function DialogTrigger({
	className,
	...props
}: DialogPrimitive.Trigger.Props): React.ReactElement {
	return (
		<DialogPrimitive.Trigger
			className={className}
			data-slot="dialog-trigger"
			{...props}
		/>
	);
}

export function DialogPopup({
	className,
	children,
	showCloseButton = true,
	closeLabel = "Fechar",
	portalProps,
	...props
}: DialogPrimitive.Popup.Props & {
	showCloseButton?: boolean;
	closeLabel?: string;
	portalProps?: DialogPrimitive.Portal.Props;
}): React.ReactElement {
	return (
		<DialogPrimitive.Portal {...portalProps}>
			<DialogPrimitive.Backdrop
				className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--ink)_50%,transparent)] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0"
				data-slot="dialog-backdrop"
			/>
			<DialogPrimitive.Popup
				className={cn(
					"fixed top-1/2 left-1/2 z-50 flex max-h-[min(32rem,90dvh)] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-cut)] outline-none transition-[opacity,transform] duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 data-starting-style:scale-95",
					className,
				)}
				data-slot="dialog-popup"
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close
						aria-label={closeLabel}
						className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink)] outline-none hover:bg-[var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] [&_svg]:size-5"
						data-slot="dialog-close"
					>
						<XIcon aria-hidden="true" />
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Popup>
		</DialogPrimitive.Portal>
	);
}

export function DialogHeader({
	className,
	...props
}: React.ComponentProps<"div">): React.ReactElement {
	return (
		<div
			className={cn(
				"flex flex-col gap-1 border-b border-[var(--line)] px-6 py-4 pe-14",
				className,
			)}
			data-slot="dialog-header"
			{...props}
		/>
	);
}

export function DialogTitle({
	className,
	...props
}: DialogPrimitive.Title.Props): React.ReactElement {
	return (
		<DialogPrimitive.Title
			className={cn(
				"font-[var(--font-display)] text-xl font-bold tracking-[-0.01em] text-[var(--ink)]",
				className,
			)}
			data-slot="dialog-title"
			{...props}
		/>
	);
}

export function DialogDescription({
	className,
	...props
}: DialogPrimitive.Description.Props): React.ReactElement {
	return (
		<DialogPrimitive.Description
			className={cn("text-sm text-[var(--ink-muted)]", className)}
			data-slot="dialog-description"
			{...props}
		/>
	);
}

export function DialogPanel({
	className,
	...props
}: React.ComponentProps<"div">): React.ReactElement {
	return (
		<div
			className={cn("flex-1 overflow-y-auto px-6 py-4", className)}
			data-slot="dialog-panel"
			{...props}
		/>
	);
}

export function DialogFooter({
	className,
	variant = "default",
	...props
}: React.ComponentProps<"div"> & {
	variant?: "default" | "bare";
}): React.ReactElement {
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end",
				variant === "default" && "border-t border-[var(--line)]",
				className,
			)}
			data-slot="dialog-footer"
			data-variant={variant}
			{...props}
		/>
	);
}

export function DialogClose({
	className,
	...props
}: DialogPrimitive.Close.Props): React.ReactElement {
	return (
		<DialogPrimitive.Close
			className={className}
			data-slot="dialog-close"
			{...props}
		/>
	);
}

export { DialogPrimitive };
