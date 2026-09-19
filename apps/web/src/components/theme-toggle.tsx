import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";

const LABELS: Record<
	Lang,
	{ toLight: string; toDark: string; light: string; dark: string }
> = {
	"pt-BR": {
		toLight: "Mudar para tema claro",
		toDark: "Mudar para tema escuro",
		light: "Tema claro",
		dark: "Tema escuro",
	},
	en: {
		toLight: "Switch to light theme",
		toDark: "Switch to dark theme",
		light: "Light theme",
		dark: "Dark theme",
	},
};

export function ThemeToggle({
	theme,
	onToggle,
	lang = "pt-BR",
}: {
	theme: Theme;
	onToggle: () => void;
	lang?: Lang;
}): React.ReactElement {
	const dark = theme === "dark";
	const labels = LABELS[lang];
	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={onToggle}
			aria-label={dark ? labels.toLight : labels.toDark}
			title={dark ? labels.light : labels.dark}
		>
			<span
				key={dark ? "sun" : "moon"}
				className="theme-toggle__icon"
				aria-hidden="true"
			>
				{dark ? (
					<SunIcon aria-hidden="true" />
				) : (
					<MoonIcon aria-hidden="true" />
				)}
			</span>
		</Button>
	);
}
