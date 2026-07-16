/**
 * cn — class name merger (shadcn pattern).
 *
 * Combina `clsx` (truthy filtering, conditional objects, arrays) com
 * `tailwind-merge` (resolve conflitos de utilitários Tailwind: última vence).
 *
 * @example
 *   cn("p-2", isActive && "bg-coral", "p-4")  // → "bg-coral p-4"
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
