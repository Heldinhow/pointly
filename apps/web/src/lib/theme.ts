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
function preferredTheme(): Theme {
	const stored = safeGet(STORAGE_KEY);
	if (stored === "light" || stored === "dark") return stored;
	return window.matchMedia("(prefers-color-scheme: light)").matches
		? "light"
		: "dark";
}

export function useTheme(): { theme: Theme; toggle: () => void } {
	const [theme, setTheme] = useState<Theme>("dark");

	useEffect(() => {
		setTheme(preferredTheme());
	}, []);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
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
