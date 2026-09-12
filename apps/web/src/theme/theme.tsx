import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

export type Theme = "dark" | "light";

interface ThemeContextValue {
	theme: Theme;
	toggle: () => void;
}

const STORAGE_KEY = "pointly-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): Theme {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === "light" || saved === "dark") return saved;
	} catch {
		/* storage indisponível — cai no default dark */
	}
	return "dark";
}

/**
 * ThemeProvider — class strategy, DEFAULT dark.
 * Persiste em `pointly-theme` e reflete `dark`/`light` no documentElement.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(readStoredTheme);

	useEffect(() => {
		const root = window.document.documentElement;
		root.classList.remove("dark", "light");
		root.classList.add(theme);
		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			/* storage indisponível — tema vale só p/ a sessão */
		}
	}, [theme]);

	const toggle = () => {
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));
	};

	return (
		<ThemeContext.Provider value={{ theme, toggle }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return ctx;
}
