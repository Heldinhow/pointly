import { useCallback, useEffect, useState } from "react";
import { safeGet, safeSet } from "./storage";

export type Theme = "light" | "dark";

const STORAGE_KEY = "pointly-theme";

function initialTheme(): Theme {
	const stored = safeGet(STORAGE_KEY);
	if (stored === "light" || stored === "dark") return stored;
	return window.matchMedia("(prefers-color-scheme: light)").matches
		? "light"
		: "dark";
}

export function useTheme(): { theme: Theme; toggle: () => void } {
	const [theme, setTheme] = useState<Theme>(initialTheme);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		safeSet(STORAGE_KEY, theme);
	}, [theme ]);

	const toggle = useCallback(() => {
		setTheme((current) => (current === "dark" ? "light" : "dark"));
	}, []);

	return { theme, toggle };
}
