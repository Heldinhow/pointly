import type { CSSProperties } from "react";
import "./unanimous-celebration.css";

/**
 * Confete determinístico da celebração de Unânime (14.3): 14 peças com
 * vetores fixos — sem aleatoriedade, então todos os clientes veem o mesmo
 * desenho e o teste é estável. Só `transform`/`opacity`.
 */
const PIECES = [
	{ dx: -140, dy: -72, rot: -170, color: "#a9d6ad" },
	{ dx: -96, dy: -98, rot: 140, color: "#f2c94c" },
	{ dx: -52, dy: -112, rot: -90, color: "#e8f5e9" },
	{ dx: -14, dy: -122, rot: 210, color: "#7ec8a3" },
	{ dx: 26, dy: -116, rot: -150, color: "#a9d6ad" },
	{ dx: 64, dy: -100, rot: 70, color: "#f2c94c" },
	{ dx: 104, dy: -78, rot: -210, color: "#e8f5e9" },
	{ dx: 146, dy: -40, rot: 90, color: "#7ec8a3" },
	{ dx: -158, dy: -24, rot: 60, color: "#f2c94c" },
	{ dx: 158, dy: -16, rot: -80, color: "#a9d6ad" },
	{ dx: -118, dy: -46, rot: 250, color: "#7ec8a3" },
	{ dx: 112, dy: -52, rot: 160, color: "#f2c94c" },
	{ dx: -30, dy: -84, rot: -300, color: "#e8f5e9" },
	{ dx: 40, dy: -90, rot: 300, color: "#a9d6ad" },
] as const;

/**
 * Camada decorativa que celebra uma revelação unânime. O pai controla o
 * gatilho com `key` (remonta = replaya); `aria-hidden` porque o anúncio
 * segue no `resultsAriaLabel` do stats pill.
 */
export function UnanimousCelebration(): React.ReactElement {
	return (
		<span
			className="unanimous-celebration"
			data-testid="unanimous-celebration"
			aria-hidden="true"
		>
			{PIECES.map((piece, index) => (
				<span
					key={index}
					className="unanimous-confetti"
					style={
						{
							"--dx": `${piece.dx}px`,
							"--dy": `${piece.dy}px`,
							"--rot": `${piece.rot}deg`,
							"--piece-color": piece.color,
							"--piece-delay": `${Math.abs(piece.dx) % 70}ms`,
						} as CSSProperties
					}
				/>
			))}
		</span>
	);
}
