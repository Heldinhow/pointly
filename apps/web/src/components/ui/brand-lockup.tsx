/**
 * BrandLockup — DESIGN-15 / #66.
 *
 * Single source of truth para a marca "Ø Pointly".
 * Antes: 5+ variantes inline (14/16/18/20/22/26/32/36/42px) diluíam o sinal.
 * Depois: 1 componente, 4 sizes (sm/md/lg/xl), opt-in `showWordmark` para
 * suportar o glyph standalone (cards de empty-overlay, sala-cheia, 404).
 *
 * **Visual**:
 *  - Glyph Ø: Playfair Display Italic 500, cor coral, `leading-none`
 *  - Wordmark "Pointly": Inter Tight extra-bold, `tracking-[-0.025em]`
 *  - Layout: `inline-flex items-baseline gap-1.5` (baseline-aligned)
 *
 * **A11y**:
 *  - Glyph Ø é `aria-hidden="true"` (decorativo — o wordmark carrega o significado)
 *  - O wrapper herda semântica do `as` prop (default: span neutro)
 *
 * **Usage**:
 * ```tsx
 * <BrandLockup size="md" as="h1" />
 * <BrandLockup size="xl" />  // wordmark visível
 * <BrandLockup size="lg" showWordmark={false} />  // só o glyph
 * ```
 */
import { forwardRef } from "react";
import type * as React from "react";
import { cn } from "./utils";

export type BrandLockupSize = "sm" | "md" | "lg" | "xl";
export type BrandLockupTag = "span" | "h1" | "h2" | "h3" | "div";

export interface BrandLockupProps
	extends React.HTMLAttributes<HTMLElement> {
	/** Tamanho do lockup. Default: "md". */
	size?: BrandLockupSize;
	/** Tag do wrapper. Default: "span" (sem heading semântico — usar `as="h1"` se for o título principal da página). */
	as?: BrandLockupTag;
	/** Se true, mostra o wordmark "Pointly" ao lado do glyph Ø. Default: true. */
	showWordmark?: boolean;
	/** Se true, adiciona cursor pointer + hover:coral (uso em Links). */
	interactive?: boolean;
	ref?: React.Ref<HTMLElement>;
}

/** Mapeamento size → font-size do glyph Ø (px). */
const MARK_SIZE: Record<BrandLockupSize, number> = {
	sm: 16,
	md: 22,
	lg: 32,
	xl: 42,
};

/** Mapeamento size → classes Tailwind do wordmark. */
const WORDMARK_CLASS: Record<BrandLockupSize, string> = {
	sm: "text-[13px]",
	md: "text-[18px]",
	lg: "text-[22px]",
	xl: "text-[32px]",
};

/**
 * BrandLockup. Marque "Ø Pointly" em 4 tamanhos padronizados.
 */
export const BrandLockup = forwardRef<HTMLElement, BrandLockupProps>(
	function BrandLockup(
		{
			size = "md",
			as: Tag = "span",
			showWordmark = true,
			interactive = false,
			className,
			...props
		},
		ref,
	) {
		const markPx = MARK_SIZE[size];
		const wordClass = WORDMARK_CLASS[size];

		return (
			<Tag
				ref={ref as React.Ref<HTMLHeadingElement & HTMLDivElement & HTMLSpanElement>}
				data-testid="brand-lockup"
				className={cn(
					"inline-flex items-baseline gap-1.5",
					interactive && "hover:text-coral transition-colors cursor-pointer",
					className,
				)}
				{...props}
			>
				<span
					aria-hidden="true"
					data-testid="brand-glyph"
					style={{ fontSize: `${markPx}px` }}
					className="font-italic italic text-coral leading-none"
				>
					Ø
				</span>
				{showWordmark && (
					<span
						data-testid="brand-wordmark"
						className={cn(
							"font-display font-extrabold tracking-[-0.025em]",
							wordClass,
						)}
					>
						Pointly
					</span>
				)}
			</Tag>
		);
	},
);