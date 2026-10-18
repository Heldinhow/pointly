/**
 * Índice leve de caminhos públicos (SSOT de paths, sem copy).
 *
 * `src/seo/routes.ts` (pesado: importa todo o copy de landing/guias)
 * constrói o registro completo a partir daqui; `src/lib/language.ts` usa só
 * este índice para não arrastar o copy para o chunk inicial do cliente.
 */

export type SeoAlternate = {
	/** Código do idioma no padrão hreflang (`pt-BR`, `en`…). */
	lang: string;
	/** Caminho absoluto dentro do site (`/en/…`). */
	path: string;
};

export const PATHS = {
	homePt: "/",
	homeEn: "/en",
	planningPokerPt: "/planning-poker",
	planningPokerEn: "/en/planning-poker",
	scrumPokerPt: "/scrum-poker",
	scrumPokerEn: "/en/scrum-poker",
	guidesPt: "/guias",
	guidesEn: "/en/guides",
	howToPlayPt: "/guias/como-jogar-planning-poker",
	howToPlayEn: "/en/guides/how-to-play-planning-poker",
	whatIsPt: "/guias/o-que-e-planning-poker",
	whatIsEn: "/en/guides/what-is-planning-poker",
	storyPointsPt: "/guias/story-points",
	storyPointsEn: "/en/guides/story-points",
	planningPokerRemotoPt: "/guias/planning-poker-remoto",
	storyPointsVsHorasPt: "/guias/story-points-vs-horas",
	fibonacciEstimativaPt: "/guias/fibonacci-estimativa-agil",
	tShirtSizingPt: "/guias/t-shirt-sizing",
	comparativoPt: "/planning-poker-online-gratis-comparativo",
	estimativaAgilPt: "/guias/estimativa-agil",
	votosDivergentesPt: "/guias/votos-divergentes-planning-poker",
	planningPokerParaDevsPt: "/guias/planning-poker-para-devs",
	agendaSessaoPt: "/guias/agenda-sessao-planning-poker",
	scrumPokerVsPlanningPokerPt: "/guias/scrum-poker-vs-planning-poker",
} as const;

/**
 * hreflang recíproco pt-BR ↔ en + `x-default` → pt, com auto-referência
 * (cada página lista a si mesma, como o Google exige).
 */
export function alternateVersions(
	ptPath: string,
	enPath: string,
	lang: string,
): readonly SeoAlternate[] {
	const xDefault: SeoAlternate = { lang: "x-default", path: ptPath };
	return lang === "en"
		? [
				{ lang: "en", path: enPath },
				{ lang: "pt-BR", path: ptPath },
				xDefault,
			]
		: [
				{ lang: "pt-BR", path: ptPath },
				{ lang: "en", path: enPath },
				xDefault,
			];
}

export type SeoPathEntry = {
	path: string;
	lang: string;
	indexable: boolean;
	alternates: readonly SeoAlternate[];
};

function entry(
	ptPath: string,
	enPath: string,
	lang: string,
): SeoPathEntry {
	return {
		path: lang === "en" ? enPath : ptPath,
		lang,
		indexable: true,
		alternates: alternateVersions(ptPath, enPath, lang),
	};
}

function ptOnly(path: string): SeoPathEntry {
	return { path, lang: "pt-BR", indexable: true, alternates: [] };
}

/** Todas as rotas públicas indexáveis, nos dois idiomas (sem o 404). */
export const PUBLIC_PATHS: readonly SeoPathEntry[] = [
	entry(PATHS.homePt, PATHS.homeEn, "pt-BR"),
	entry(PATHS.homePt, PATHS.homeEn, "en"),
	entry(PATHS.planningPokerPt, PATHS.planningPokerEn, "pt-BR"),
	entry(PATHS.scrumPokerPt, PATHS.scrumPokerEn, "pt-BR"),
	entry(PATHS.guidesPt, PATHS.guidesEn, "pt-BR"),
	entry(PATHS.howToPlayPt, PATHS.howToPlayEn, "pt-BR"),
	entry(PATHS.whatIsPt, PATHS.whatIsEn, "pt-BR"),
	entry(PATHS.storyPointsPt, PATHS.storyPointsEn, "pt-BR"),
	ptOnly(PATHS.planningPokerRemotoPt),
	ptOnly(PATHS.storyPointsVsHorasPt),
	ptOnly(PATHS.fibonacciEstimativaPt),
	ptOnly(PATHS.tShirtSizingPt),
	ptOnly(PATHS.comparativoPt),
	ptOnly(PATHS.estimativaAgilPt),
	ptOnly(PATHS.votosDivergentesPt),
	ptOnly(PATHS.planningPokerParaDevsPt),
	ptOnly(PATHS.agendaSessaoPt),
	ptOnly(PATHS.scrumPokerVsPlanningPokerPt),
	entry(PATHS.planningPokerPt, PATHS.planningPokerEn, "en"),
	entry(PATHS.scrumPokerPt, PATHS.scrumPokerEn, "en"),
	entry(PATHS.guidesPt, PATHS.guidesEn, "en"),
	entry(PATHS.howToPlayPt, PATHS.howToPlayEn, "en"),
	entry(PATHS.whatIsPt, PATHS.whatIsEn, "en"),
	entry(PATHS.storyPointsPt, PATHS.storyPointsEn, "en"),
];
