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
				"coral-deep": "var(--coral-deep)",
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
			// ---------------------------------------------------------
			// Font sizes — ramp Atelier Zero (12 steps)
			//
			// Os tokens abaixo correspondem 1:1 ao DESIGN.md §3 Hierarchy.
			// Use-os no lugar de `text-[Npx]` solto — qualquer px fora
			// desses tokens está fora da ramp e vira tell de IA.
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
				"card-title": [
					"34px",
					{
						lineHeight: "1.05",
						letterSpacing: "-0.03em",
						fontWeight: "800",
					},
				],
				"card-mark": ["36px", { lineHeight: "1" }],
				"brand-mark": ["28px", { lineHeight: "1", fontWeight: "500" }],
				"nav-mark": ["22px", { lineHeight: "1" }],
				"nav-wordmark": [
					"18px",
					{
						lineHeight: "1",
						letterSpacing: "-0.02em",
						fontWeight: "800",
					},
				],
				// 20px Fibonacci glyph dentro de vote card (Seat face-up)
				"vote-mark": ["20px", { lineHeight: "1", fontWeight: "500" }],
				// 18px Fibonacci glyph em cards menores (Seat projectile trigger)
				"vote-numeral": ["18px", { lineHeight: "1", fontWeight: "500" }],
				caption: ["14px", { lineHeight: "1.55" }],
				body: ["16px", { lineHeight: "1.5" }],
				label: [
					"11px",
					{
						lineHeight: "1.4",
						letterSpacing: "0.04em",
						fontWeight: "500",
					},
				],
				"micro-label": ["10px", { lineHeight: "1.4", letterSpacing: "0.04em" }],
			},

			// ---------------------------------------------------------
			// Border radius — bone-card 18px
			// ---------------------------------------------------------
			borderRadius: {
				card: "18px",
			},

			// ---------------------------------------------------------
			// Letter spacing — extended ramp (DESIGN.md §3)
			//
			// `tracking-caps` 0.06em: extended ramp step para mono caps
			// pequenos (label/micro-label uppercase). O default da ramp
			// (`text-label`/`text-micro-label`) define 0.04em; 0.06em
			// é o step adicional aprovado para legibilidade de mono
			// caps em share pills, stats pills, mobile headers. Foi
			// promovido de arbitrary value para token intencional em
			// impeccable polish (2026-07-16) — vide DESIGN.md §3.
			//
			// `tracking-tight` -0.02em: extendido para uso em headings
			// de modal/overlay (≤brand-mark). Coincide com
			// `text-nav-wordmark` default; aprovado como step explícito
			// para h2/h3 fora da nav.
			// ---------------------------------------------------------
			letterSpacing: {
				caps: "0.06em",
				tight: "-0.02em",
			},

			// ---------------------------------------------------------
			// Box shadows — bone-card noise shadow
			// ---------------------------------------------------------
			boxShadow: {
				// bone: float surface (modais/popovers, sem border)
				bone: "var(--shadow-bone)",
				// card: container com border (≤8px, respeita Border+Shadow)
				card: "var(--shadow-card)",
				// coral: CTA activo (sem border, sombra coral)
				coral: "var(--shadow-coral)",
			},
		},
	},
	plugins: [],
};

export default config;
