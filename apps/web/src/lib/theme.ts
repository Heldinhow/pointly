import { useCallback, useEffect, useState } from "react";
import { safeGet, safeSet } from "./storage";

export type Theme = "light" | "dark";

const STORAGE_KEY = "pointly-theme";

/**
 * Preferência real do navegador. Só pode rodar no cliente:
 * o primeiro render (pré-render/hidratação) é sempre "dark", determinístico;
 * a preferência entra no efeito de mount. O script inline do index.html já
 * aplica a classe antes do paint, então não há flash de tema.
 */
export function resolveTheme(
	stored: string | null,
	prefersLight: boolean,
): Theme {
	if (stored === "light" || stored === "dark") return stored;
	return prefersLight ? "light" : "dark";
}

function preferredTheme(): Theme {
	return resolveTheme(
		safeGet(STORAGE_KEY),
		window.matchMedia("(prefers-color-scheme: light)").matches,
	);
}

/**
 * Espelha o tema resolvido nos dois contratos: `.dark` (telas antigas +
 * Tailwind) e `data-theme` (camada Prensa, F0.2 — fonte única dos tokens).
 */
export function applyTheme(theme: Theme): void {
	document.documentElement.classList.toggle("dark", theme === "dark");
	document.documentElement.dataset.theme = theme;
}

export function useTheme(): { theme: Theme; toggle: () => void } {
	const [theme, setTheme] = useState<Theme>("dark");

	useEffect(() => {
		setTheme(preferredTheme());
	}, []);

	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	const toggle = useCallback(() => {
		setTheme((current) => {
			const next = current === "dark" ? "light" : "dark";
			safeSet(STORAGE_KEY, next);
			return next;
		});
	}, []);

	return { theme, toggle };
}
