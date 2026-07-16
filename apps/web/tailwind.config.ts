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
			//
			// `display-hero` foi adicionado em impeccable landing
			// (2026-07-16) — clamp editorial pra hero headline da landing,
			// estende a ramp com step intencional sem introduzir px solto.
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
				"display-hero": [
					"clamp(36px, 5vw, 72px)",
					{
						lineHeight: "1.02",
						letterSpacing: "-0.04em",
						fontWeight: "800",
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
			// Tokens promovidos de arbitrary values pra ramp intencional:
			//
			// - `tracking-caps` 0.06em: mono caps pequenos (label/micro-
			//   label uppercase) em pills/stats/mobile headers.
			// - `tracking-tight` -0.02em: headings de modal/overlay ≤
			//   brand-mark, fora da nav.
			// - `tracking-tighter` -0.03em: h2/h3 medium-large (cards,
			//   seção Como Funciona). Coincide com `text-card-title`
			//   default; promove como step explícito.
			// - `tracking-display` -0.04em: hero h1 / display headings
			//   ≥36px. Coincide com `text-display-xl` default; step
			//   explícito pra h1 fora da ramp clamped (e.g. landing hero).
			// - `tracking-eyebrow` 0.18em: micro-caps editorial nas
			//   eyebrows de landing ("● Pointly Agility", "● Comece agora").
			//   Mais largo que `tracking-caps` (0.06em); step intencional
			//   para hierarquia de seção acima de label/micro-label.
			// ---------------------------------------------------------
			letterSpacing: {
				caps: "0.06em",
				eyebrow: "0.18em",
				tight: "-0.02em",
				tighter: "-0.03em",
				display: "-0.04em",
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
