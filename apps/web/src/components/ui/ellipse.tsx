/**
 * Ellipse — primitive dashed ellipse para a mesa da Arena.
 *
 * Phase 5 (T26). Container com border dashed + radial gradient paper-dark.
 * Children renderizam absolutamente posicionados (assentos da mesa).
 *
 * Implementação: SVG com 1 ellipse (`stroke-dasharray`) + radial gradient
 * definido em `<defs>`. Mantém responsividade via `viewBox`.
 *
 * Default: 960×560 (proporção áurea light, fits 1440 desktop).
 *
 * @see docs/adr/0010-ui-primitives-and-testing.md (primitive library)
 */
import type * as React from "react";
import { cn } from "./utils";

export interface EllipseProps {
	/** Largura em px. Default: 960. */
	width?: number;
	/** Altura em px. Default: 560. */
	height?: number;
	/** Stroke color. Default: ink-faint (--fg-faint). */
	stroke?: string;
	/** Stroke width. Default: 1. */
	strokeWidth?: number;
	/** Dashed pattern. Default: "8 6". */
	dashArray?: string;
	/** Cor do radial gradient. Default: paper-dark. */
	fillColor?: string;
	/** Children renderizam absolutely positioned sobre o SVG. */
	children?: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
	ref?: React.Ref<SVGSVGElement>;
}

/**
 * Ellipse mesa. Use `<Seat primitive>` posicionado via trigonometria
 * (`(cos θ, sin θ)` × raio).
 */
export function Ellipse({
	width = 960,
	height = 560,
	stroke = "var(--fg-faint)",
	strokeWidth = 1,
	dashArray = "8 6",
	fillColor = "var(--paper-dark)",
	children,
	className,
	style,
	ref,
}: EllipseProps) {
	const cx = width / 2;
	const cy = height / 2;
	// Raio com folga para os assentos não colidirem com a borda.
	const rx = (width - 80) / 2;
	const ry = (height - 80) / 2;
	const gradId = "ellipse-radial-gradient";

	return (
		<svg
			ref={ref}
			xmlns="http://www.w3.org/2000/svg"
			viewBox={`0 0 ${width} ${height}`}
			width={width}
			height={height}
			role="img"
			aria-label="Mesa da rodada"
			className={cn("block", className)}
			style={style}
		>
			<defs>
				<radialGradient id={gradId} cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor={fillColor} stopOpacity="0.55" />
					<stop offset="100%" stopColor={fillColor} stopOpacity="0" />
				</radialGradient>
			</defs>
			<ellipse
				cx={cx}
				cy={cy}
				rx={rx}
				ry={ry}
				fill={`url(#${gradId})`}
				stroke={stroke}
				strokeWidth={strokeWidth}
				strokeDasharray={dashArray}
				opacity={0.7}
			/>
			{children}
		</svg>
	);
}
