import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Theme } from "@/lib/theme";

export function ThemeToggle({
	theme,
	onToggle,
}: {
	theme: Theme;
	onToggle: () => void;
}): React.ReactElement {
	const dark = theme === "dark";
	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={onToggle}
			aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
			title={dark ? "Tema claro" : "Tema escuro"}
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
