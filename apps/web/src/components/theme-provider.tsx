import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
	/**
	 * Modo de tema selecionado.
	 * `null` = modo **Sistema**: o CSS respeita `prefers-color-scheme` e o app
	 * espelha o SO ao vivo (dark↔light). `"light" | "dark"` = escolha fixa,
	 * ignora o SO.
	 */
	theme: Theme | null;
	/**
	 * Cicla o modo: Sistema (null) → Claro → Escuro → Sistema.
	 * Voltar a `null` reativa o auto-detect do SO (remove data-theme e limpa
	 * a persistência) — é o caminho de volta pro "seguir o sistema".
	 */
	cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<Theme | null>(() => {
		try {
			const saved = localStorage.getItem("theme");
			if (saved === "light" || saved === "dark") return saved;
		} catch {}
		// Sem escolha manual: modo Sistema. Não fixamos `theme` aqui pra deixar
		// o auto-detect (`@media (prefers-color-scheme: dark)`) livre.
		return null;
	});

	useEffect(() => {
		const root = window.document.documentElement;

		if (theme === null) {
			// Modo Sistema: remove data-theme pra que o
			// `@media (prefers-color-scheme: dark)` do CSS decida, e limpa o
			// localStorage pra não re-fixar uma escolha antiga no próximo load.
			root.removeAttribute("data-theme");
			try {
				localStorage.removeItem("theme");
			} catch {}
			return;
		}

		// Escolha manual: fixa tema independente do SO.
		// `html[data-theme="dark"|"light"]` tem precedência sobre a media query
		// no CSS, então a escolha vale mesmo contra o `prefers-color-scheme`.
		root.setAttribute("data-theme", theme);
		try {
			localStorage.setItem("theme", theme);
		} catch {}
	}, [theme]);

	const cycleTheme = () => {
		// Sistema (null) → Claro → Escuro → Sistema. O 3º clique devolve o
		// controle pro SO — sem esse retorno, o toggle antigo travava numa
		// escolha manual pra sempre e o app parava de seguir o sistema.
		setTheme((prev) => {
			if (prev === null) return "light";
			if (prev === "light") return "dark";
			return null;
		});
	};

	return (
		<ThemeContext.Provider value={{ theme, cycleTheme }}>
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
