/**
 * Tailwind config — Pointly web app
 *
 * Phase 5 (T25). Mapeia tokens Atelier Zero (paper, ink, coral, mustard, olive)
 * + fontes (Inter Tight, Playfair Display, Inter, JetBrains Mono) pra utilitários Tailwind.
 *
 * Tokens: vide `plan.md` seção 4 (Sistema visual — Atelier Zero).
 * Regras críticas:
 *  - coral ≤1 CTA por viewport
 *  - mostarda NUNCA é CTA (só joia ≤1% superfície)
 *  - surface noise ::before presente em todas as 4 telas
 *
 * @see ADR-0010 (Tailwind + shadcn/ui)
 */
import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			// ---------------------------------------------------------
			// Colors — Atelier Zero tokens (NÃO Linear)
			// ---------------------------------------------------------
			colors: {
				// Paper / background
				bg: "var(--bg)",
				"paper-warm": "var(--paper-warm)",
				"paper-dark": "var(--paper-dark)",
				// Bone surface (cards elevados)
				surface: "var(--surface)",
				// Ink (texto)
				ink: "var(--fg)",
				"ink-soft": "var(--fg-soft)",
				"ink-mute": "var(--fg-mute)",
				"ink-faint": "var(--fg-faint)",
				// Coral (ÚNICO acento quente)
				coral: "var(--accent)",
				"coral-soft": "var(--coral-soft)",
				// Joias (NUNCA CTA)
				mustard: "var(--mustard)",
				olive: "var(--olive)",
			},

			// ---------------------------------------------------------
			// Font families — Inter Tight, Playfair, Inter, JetBrains Mono
			// ---------------------------------------------------------
			fontFamily: {
				// Display / sans: headlines
				display: ['"Inter Tight"', "system-ui", "sans-serif"],
				// Italic emphasis / serif (numerais Fibonacci, brand Ø)
				italic: ['"Playfair Display"', "Georgia", "serif"],
				// Body
				sans: ['"Inter"', "system-ui", "sans-serif"],
				// Mono (coords, timer, SHAs, plate numbers)
				mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
			},

			// ---------------------------------------------------------
			// Font sizes — display-xl (mega footer `Pointly.`)
			// ---------------------------------------------------------
			fontSize: {
				"display-xl": [
					"clamp(70px, 13vw, 200px)",
					{
						lineHeight: "0.95",
						letterSpacing: "-0.04em",
						fontWeight: "500",
					},
				],
			},

			// ---------------------------------------------------------
			// Border radius — bone-card 18px
			// ---------------------------------------------------------
			borderRadius: {
				card: "18px",
			},

			// ---------------------------------------------------------
			// Box shadows — bone-card noise shadow
			// ---------------------------------------------------------
			boxShadow: {
				bone: "0 30px 60px -30px rgba(21, 20, 15, 0.15)",
				// CTA terracota — shadow atualizado para novo hue (UX-014)
				coral: "0 14px 26px -16px rgba(210, 74, 42, 0.6)",
			},
		},
	},
	plugins: [],
};

export default config;
