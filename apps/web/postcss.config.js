/**
 * PostCSS config — Pointly web app
 *
 * Phase 5 (T25): tailwindcss + autoprefixer para processar @tailwind directives
 * em `src/index.css`. Mantém Vite usando PostCSS automaticamente.
 *
 * @see ADR-0010 (Tailwind + shadcn/ui)
 */
export default {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
	},
};
