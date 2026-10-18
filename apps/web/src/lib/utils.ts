import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Encurta um texto longo cortando o meio: o começo e o fim continuam
 * visíveis (num link de convite, o fim carrega o `?code=`). Conta
 * caracteres, não unidades UTF-16, para não partir emoji ao meio. O
 * limite cabe no campo do convite também no celular, onde a fonte sobe
 * para 16px.
 */
export function middleTruncate(text: string, max = 30): string {
	const chars = Array.from(text);
	const limit = Math.max(1, Math.floor(max));
	if (chars.length <= limit) return text;
	const tail = Math.ceil((limit - 1) / 2);
	const head = limit - 1 - tail;
	return `${chars.slice(0, head).join("")}…${chars.slice(chars.length - tail).join("")}`;
}
