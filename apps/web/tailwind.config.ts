import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				bg: "var(--bg)",
  primary:"var(--primary)","on-primary":"var(--on-primary)","on-accent":"var(--on-accent)",danger:"var(--danger)","danger-soft":"var(--danger-soft)",success:"var(--success)","success-soft":"var(--success-soft)",warning:"var(--warning)","warning-soft":"var(--warning-soft)",table:"var(--table)",
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
				sans: ["Geist", "Inter", "system-ui", "sans-serif"],
				mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
			},
			fontSize: {
				"brand-mark": ["28px", { lineHeight: "1", fontWeight: "500" }],
				"nav-mark": ["22px", { lineHeight: "1" }],
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
				xs: "2px",
				sm: "3px",
				md: "4px",
				lg: "6px",
				xl: "8px",
				"2xl": "10px",
				"3xl": "12px",
				card: "10px",
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
