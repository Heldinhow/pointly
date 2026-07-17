import { useTheme } from "./theme-provider";

/**
 * ThemeToggle — cicla entre 3 modos: Sistema → Claro → Escuro → Sistema.
 *
 *  - Sistema (theme=null): o app espelha `prefers-color-scheme` do SO ao vivo.
 *    Ícone = monitor.
 *  - Claro / Escuro: escolha fixa, ignora o SO. Ícone = sol / lua.
 *
 * O ícone reflete o MODO selecionado (não o tema efetivo): em Sistema mostramos
 * o monitor mesmo com o SO em dark, sinalizando "seguindo o sistema". Isso
 * dispensa `matchMedia` — o CSS já troca as cores sozinho quando o SO muda.
 */
export function ThemeToggle() {
	const { theme, cycleTheme } = useTheme();

	const label =
		theme === null
			? "Tema: Sistema. Alternar para claro"
			: theme === "light"
				? "Tema: Claro. Alternar para escuro"
				: "Tema: Escuro. Alternar para sistema";

	return (
		<button
			type="button"
			onClick={cycleTheme}
			// WCAG 2.5.5 (Level AAA, recomendado pela Apple HIG e Material Design):
			// tap target mínimo 44×44 CSS px. Theme toggle é 32×32 visual mas o
			// `min-h-[44px] min-w-[44px]` cria uma hit-area invisível estendida pra
			// 44 sem alterar a aparência do ícone (continua 14×14 dentro do botão).
			className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/5 transition-all text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-deep focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			aria-label={label}
			title={label}
			data-testid="theme-toggle"
			data-theme-mode={theme ?? "system"}
		>
			{theme === null ? (
				// Monitor Icon (Sistema)
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
					<rect x="2" y="3" width="20" height="14" rx="2" aria-hidden="true" />
					<path d="M8 21h8M12 17v4" aria-hidden="true" />
				</svg>
			) : theme === "light" ? (
				// Sun Icon (Claro)
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
				// Moon Icon (Escuro)
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
