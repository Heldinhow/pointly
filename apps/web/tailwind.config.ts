import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				bg: "var(--bg)",
  primary:"var(--accent)","on-primary":"var(--on-accent)","on-accent":"var(--on-accent)",danger:"var(--danger)","danger-soft":"var(--danger-soft)",success:"var(--success)","success-soft":"var(--success-soft)",warning:"var(--warning)","warning-soft":"var(--warning-soft)",table:"var(--table)",
				"paper-warm": "var(--paper-warm)",
				"paper-dark": "var(--paper-dark)",
				paper: "var(--surface)",
				accent: "var(--accent)",
				"accent-soft": "var(--accent-soft)",
				"accent-deep": "var(--accent-deep)",
				"accent-ink": "var(--accent-ink)",
				surface: "var(--surface)",
				ink: "var(--fg)",
				"ink-soft": "var(--fg-soft)",
				"ink-mute": "var(--fg-mute)",
				"ink-faint": "var(--fg-faint)",
				coral: "var(--accent)",
				"coral-soft": "var(--coral-soft)",
				"coral-deep": "var(--coral-deep)",
				mustard: "var(--mustard)",
				olive: "var(--olive)",
			},
			fontFamily: {
				display: ["Geist", "Inter", "system-ui", "sans-serif"],
				italic: ["Geist", "Inter", "system-ui", "sans-serif"],
				sans: ["Geist", "Inter", "system-ui", "sans-serif"],
				mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
			},
			fontSize: {
				"display-xl": [
					"clamp(70px, 13vw, 96px)",
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
				"vote-mark": ["20px", { lineHeight: "1", fontWeight: "500" }],
				"vote-numeral": ["18px", { lineHeight: "1", fontWeight: "500" }],
				caption: ["14px", { lineHeight: "1.55" }],
				body: ["16px", { lineHeight: "1.5" }],
			label: [
				"12px",
				{
					lineHeight: "1.4",
					letterSpacing: "0.08em",
					fontWeight: "800",
				},
			],
				"micro-label": ["10px", { lineHeight: "1.4", letterSpacing: "0.04em" }],
			},
			borderRadius: {
				sm: "3px",
				md: "6px",
				lg: "8px",
				card: "8px",
			},
			letterSpacing: {
				caps: "0.06em",
				eyebrow: "0.18em",
				tight: "-0.02em",
				tighter: "-0.03em",
				display: "-0.04em",
			},
			boxShadow: {
				bone: "var(--shadow-bone)",
				card: "var(--shadow-card)",
				coral: "var(--shadow-coral)",
			},
		},
	},
	plugins: [],
};

export default config;
