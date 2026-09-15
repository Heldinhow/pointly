import type * as React from "react";

/** 8 pás em swirl — simétrico a cada 45°, o giro contínuo nunca "quebra". */
const BLADES = [0, 45, 90, 135, 180, 225, 270, 315];

export function BrandMark({
	size = 26,
	className,
}: {
	size?: number;
	className?: string;
}): React.ReactElement {
	return (
		<svg
			className={className}
			width={size}
			height={size}
			viewBox="0 0 64 64"
			aria-hidden="true"
			focusable="false"
		>
			<g className="brand-mark__pop">
				<g className="brand-mark__spin" fill="currentColor">
					{BLADES.map((angle) => (
						<rect
							key={angle}
							x="30.5"
							y="8"
							width="7"
							height="18"
							rx="3.5"
							transform={`rotate(${angle} 32 32)`}
						/>
					))}
				</g>
			</g>
		</svg>
	);
}

const LETTERS = "Pointly".split("");

/** Wordmark com entrada em cascata (estilo Factory). Sem espaços entre spans: lê-se "Pointly". */
export function BrandWordmark({
	className,
}: {
	className?: string;
}): React.ReactElement {
	return (
		<span className={className} aria-hidden="false">
			{LETTERS.map((letter, i) => (
				<span
					key={`${letter}-${i}`}
					className="brand-word__letter"
					style={{ "--i": i } as React.CSSProperties}
				>
					{letter}
				</span>
			))}
		</span>
	);
}
