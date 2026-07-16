import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
	/**
	 * Tema efetivo aplicado.
	 * `null` = sem escolha manual; o CSS respeita `prefers-color-scheme`.
	 * `"light" | "dark"` = user togglou via ThemeToggle; escolha fixada.
	 */
	theme: Theme | null;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<Theme | null>(() => {
		try {
			const saved = localStorage.getItem("theme");
			if (saved === "light" || saved === "dark") return saved;
		} catch {}
		// Sem escolha manual: respeita prefers-color-scheme via media query
		// do CSS. Não setamos `theme` aqui pra deixar o auto-detect livre.
		return null;
	});

	useEffect(() => {
		const root = window.document.documentElement;

		if (theme === null) {
			// Auto-detect: remove data-theme pra que
			// `@media (prefers-color-scheme: dark)` do CSS tome a decisão.
			root.removeAttribute("data-theme");
			try {
				localStorage.removeItem("theme");
			} catch {}
			return;
		}

		// Escolha manual: fixa tema independente do SO.
		// `html[data-theme="dark"|"light"]` tem precedência sobre a media
		// query no CSS — bug antigo (`.dark` class) ignorava isso e o auto-
		// detect virava a página dark de novo ao escolher light em SO dark.
		root.setAttribute("data-theme", theme);
		try {
			localStorage.setItem("theme", theme);
		} catch {}
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prev) => {
			// Toggle a partir do estado atual. Se `null` (auto-detect),
			// decide com base no prefers-color-scheme atual: se o SO é dark,
			// o estado efetivo é dark, então toggla pra light (e fixa).
			// Se SO é light, toggla pra dark.
			const effective: Theme =
				prev ??
				(typeof window !== "undefined" &&
				window.matchMedia &&
				window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light");
			return effective === "dark" ? "light" : "dark";
		});
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
