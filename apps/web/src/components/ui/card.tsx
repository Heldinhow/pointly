/**
 * Card — bone-fill card com surface-noise.
 *
 * Phase 5 (T26). Primitivo de superfície elevada.
 *
 * Base: `bg-surface rounded-card shadow-bone border border-ink/5 surface-noise relative`.
 * O `relative` + `z-10` no conteúdo garante que a noise ::before não
 * escureça o children.
 *
 * Padding variants: `sm` (p-4), `md` (p-7, default), `lg` (p-10).
 */
import type * as React from "react";
import { cn } from "./utils";

type PaddingSize = "sm" | "md" | "lg";

const PAD_CLASSES: Record<PaddingSize, string> = {
	sm: "p-4",
	md: "p-7",
	lg: "p-10",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Padding size. Default: "md". */
	padding?: PaddingSize;
	/** Opcionalmente desabilita o surface-noise (caso a página já aplique). */
	noNoise?: boolean;
	ref?: React.Ref<HTMLDivElement>;
}

/**
 * Bone-fill card. Use como container de formulários, stats, modais (overlay).
 */
export function Card({
	className,
	padding = "md",
	noNoise = false,
	children,
	ref,
	...props
}: CardProps) {
	return (
		<div
			ref={ref}
			data-testid="card-root"
			className={cn(
				"bg-surface rounded-card shadow-bone border border-ink/5 relative",
				!noNoise && "surface-noise",
				PAD_CLASSES[padding],
				className,
			)}
			{...props}
		>
			{/* z-10 mantém children acima do surface-noise ::before */}
			<div className="relative z-10">{children}</div>
		</div>
	);
}

/**
 * CardHeader — slot semântico para título/subtítulo.
 */
export function CardHeader({
	className,
	ref,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<div
			ref={ref}
			className={cn("flex flex-col gap-2 mb-5", className)}
			{...props}
		/>
	);
}

/**
 * CardBody — slot para conteúdo principal (default slot implícito).
 */
export function CardBody({
	className,
	ref,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<div
			ref={ref}
			className={cn("flex flex-col gap-4", className)}
			{...props}
		/>
	);
}

/**
 * CardFooter — slot para ações/CTA no rodapé do card.
 */
export function CardFooter({
	className,
	ref,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<div
			ref={ref}
			className={cn("flex items-center gap-3 mt-6", className)}
			{...props}
		/>
	);
}
