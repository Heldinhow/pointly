import type * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "@/prensa/icons";

/**
 * Prensa — F0.4: spinner de tinta.
 *
 * Mesma API/comportamento (exports, `role="status"`, `aria-label`); o giro
 * usa o `Loader2` do set Prensa (8 marcas de registro, traço 1.75, cantos
 * retos, `currentColor`) em vez do lucide. Sem blur/glow.
 */
export type SpinnerProps = React.SVGProps<SVGSVGElement> & {
	size?: number;
};

export function Spinner({
	className,
	size,
	...props
}: SpinnerProps): React.ReactElement {
	return (
		<Loader2Icon
			aria-label={props["aria-label"] ?? "Loading"}
			className={cn("animate-spin motion-reduce:animate-none", className)}
			data-slot="spinner"
			role="status"
			size={size}
			{...props}
		/>
	);
}
