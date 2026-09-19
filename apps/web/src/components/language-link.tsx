import { Link } from "react-router-dom";
import type { Lang } from "@/lib/i18n";
import {
	languageSwitchTarget,
	otherLang,
	rememberLanguage,
} from "@/lib/language";
import { cn } from "@/lib/utils";

/**
 * Seletor de idioma (15.T8): link compacto para a mesma página no outro
 * idioma (ou home do idioma, sem alternate). O clique grava a preferência
 * para o redirect automático da raiz não desfazer a escolha.
 */
export function LanguageLink({
	pathname,
	lang,
	className,
}: {
	pathname: string;
	lang: Lang;
	className?: string;
}): React.ReactElement {
	const target = otherLang(lang);
	return (
		<Link
			to={languageSwitchTarget(pathname, lang)}
			hrefLang={target}
			lang={target}
			onClick={() => rememberLanguage(target)}
			aria-label={
				lang === "pt-BR"
					? "Ver esta página em inglês"
					: "View this page in Portuguese"
			}
			className={cn("lang-link", className)}
			data-testid="language-switch"
		>
			{target === "en" ? "EN" : "PT"}
		</Link>
	);
}
