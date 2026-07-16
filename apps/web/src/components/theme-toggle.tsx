import { useTheme } from "./theme-provider";

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			type="button"
			onClick={toggleTheme}
			// WCAG 2.5.5 (Level AAA, recomendado pela Apple HIG e Material Design):
	// tap target mínimo 44×44 CSS px. Theme toggle é 32×32 visual mas o
	// `min-h-[44px] min-w-[44px]` cria uma hit-area invisível estendida pra
	// 44 sem alterar a aparência do ícone (continua 14×14 dentro do botão).
	className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/5 transition-all text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-deep focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			aria-label={
				theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"
			}
			title={
				theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"
			}
			data-testid="theme-toggle"
		>
			{theme === "dark" ? (
				// Sun Icon
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="w-3.5 h-3.5"
				>
					<circle cx="12" cy="12" r="4" aria-hidden="true" />
					<path
						d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
						aria-hidden="true"
					/>
				</svg>
			) : (
				// Moon Icon
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="w-3.5 h-3.5"
				>
					<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" aria-hidden="true" />
				</svg>
			)}
		</button>
	);
}
