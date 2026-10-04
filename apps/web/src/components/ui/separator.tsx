import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import type React from "react";
import { cn } from "@/lib/utils";

/**
 * Prensa — F0.4: régua de 1px.
 *
 * "Régua, não caixa": separação por hairline `--line` + espaço. API estável.
 */
export function Separator({
	className,
	orientation = "horizontal",
	...props
}: SeparatorPrimitive.Props): React.ReactElement {
	return (
		<SeparatorPrimitive
			className={cn(
				"shrink-0 bg-[var(--line)] data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
				className,
			)}
			data-slot="separator"
			orientation={orientation}
			{...props}
		/>
	);
}

export { SeparatorPrimitive };
