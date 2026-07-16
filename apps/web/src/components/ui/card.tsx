/**
 * Card — bone-fill card com surface-noise.
 *
 * Phase 5 (T26). Primitivo de superfície elevada.
 *
 * Base: `bg-surface rounded-card shadow-card border border-ink/5 surface-noise relative`.
 *
 * Arquitetura de dois tokens (vide DESIGN.md §4 "Decision: why two tokens"):
 *  - Card = container in-flow COM border → `shadow-card` (≤8px blur).
 *  - Floating overlay SEM border → `shadow-bone` (~60px blur).
 *
 * Esta escolha arquitetural (dois tokens, regra rígida de não-combine)
 * é o que mantém o sistema sem cair no codex "ghost-card" tell. Bone
 * não pode ser apertada pra ≤8px (overlays perdem o lift) e a Border+
 * Shadow Rule não pode ser afrouxada (Cards viram fantasma).
 *
 * Para overlays sem border (popovers, menus suspensos, toasts), prefira
 * uma `<div>` comum com `shadow-bone` — Card é só pra containers com
 * hairline. O `relative` + `z-10` no conteúdo garante que a noise
 * ::before não escureça o children.
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
 * Bone-fill card. Use como container de formulários, stats, banners.
 *
 * Tokens aplicados:
 *  - `bg-surface`           → bleached ivory (var --surface)
 *  - `rounded-card`         → 18px radius (Atelier Zero — cards nunca >18px)
 *  - `shadow-card`          → 0 4px 8px -1px (≤8px blur, borda carrega o lift)
 *  - `border border-ink/5`  → hairline 1px
 *
 * NÃO usar `shadow-bone` aqui — é codex "ghost-card" tell com 1px border.
 * Bone shadow (60px blur) é reservado pra superfícies SEM border
 * (modais flutuantes, popovers, toasts). Vide DESIGN.md §4 Border-Plus-Shadow Rule.
 *
 * Para overlays sem border (popovers, menus suspensos), prefira uma
 * `<div>` comum com `shadow-bone` — Card é só pra containers com hairline.
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
				"bg-surface rounded-card shadow-card border border-ink/5 relative",
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
