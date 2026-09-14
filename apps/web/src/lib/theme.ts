import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "pointly-theme";

function initialTheme(): Theme {
	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		if (stored === "light" || stored === "dark") return stored;
	} catch {
		// Armazenamento indisponível — cai para a preferência do sistema.
	}
	return window.matchMedia("(prefers-color-scheme: light)").matches
		? "light"
		: "dark";
}

export function useTheme(): { theme: Theme; toggle: () => void } {
	const [theme, setTheme] = useState<Theme>(initialTheme);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		try {
			window.localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			// Armazenamento indisponível — tema vale só para a sessão.
		}
	}, [theme ]);

	const toggle = useCallback(() => {
		setTheme((current) => (current === "dark" ? "light" : "dark"));
	}, []);

	return { theme, toggle };
}
