import type { Lang } from "@/lib/i18n";
import { otherLang, rememberLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

/**
 * Seletor in-place das rotas internas (`/join`, `/s/:code`): não há URL
 * alternativa de idioma, então o clique grava a preferência e o App
 * re-renderiza pelo store (`subscribeLanguage`).
 */
export function LanguageToggle({
	lang,
	className,
}: {
	lang: Lang;
	className?: string;
}): React.ReactElement {
	const target = otherLang(lang);
	return (
		<button
			type="button"
			lang={target}
			onClick={() => rememberLanguage(target)}
			aria-label={
				lang === "pt-BR" ? "Mudar para inglês" : "Switch to Portuguese"
			}
			className={cn("lang-link cursor-pointer", className)}
			data-testid="language-switch"
		>
			{target === "en" ? "EN" : "PT"}
		</button>
	);
}
