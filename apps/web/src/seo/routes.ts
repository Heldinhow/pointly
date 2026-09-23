/**
 * Registro canônico de rotas públicas (SSOT de SEO on-site).
 *
 * Consumido por:
 * - `src/prerender.tsx` (head por rota no build);
 * - `vite.config.ts` (prerender + geração do sitemap.xml no build).
 *
 * Rota nova entra aqui (path, title, description) e passa a ser
 * pré-renderizada/listada sem tocar no resto do pipeline.
 */

import { GUIDE_CONTENT } from "../pages/guide-content";
import { LANDING_CONTENT } from "../pages/landing-content";

/**
 * Apex canônico e único host de SEO: `www.` e `http` fazem 301 para cá
 * (Traefik) e nunca podem aparecer em sitemap/canonical/hreflang — só URLs
 * apex https. Teste em `routes.test.ts` garante o sitemap apex-only.
 */
export const SITE_URL = "https://pointly.space";

/** Data de publicação dos guias (15.T6); revisões atualizam `dateModified`. */
export const GUIDES_PUBLISHED = "2026-09-19";

export type SeoAlternate = {
	/** Código do idioma no padrão hreflang (`pt-BR`, `en`…). */
	lang: string;
	/** Caminho absoluto dentro do site (`/en/…`). */
	path: string;
};

export type SeoRoute = {
	path: string;
	lang: string;
	/** Só rotas indexáveis entram no sitemap e ganham canonical. */
	indexable: boolean;
	title: string;
	description: string;
	/** Versões em outros idiomas (hreflang recíproco). */
	alternates?: readonly SeoAlternate[];
	/** JSON-LD injetado no `<head>` (um `<script>` por entrada). */
	jsonLd?: readonly Readonly<Record<string, unknown>>[];
};

export type HeadElement = {
	type: string;
	props: Record<string, string>;
	children?: string;
};

export const JSON_LD_SOFTWARE_APPLICATION = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "Pointly",
	url: `${SITE_URL}/`,
	applicationCategory: "BusinessApplication",
	operatingSystem: "Web",
	description:
		"Planning poker online grátis para times ágeis, sem cadastro. Crie uma sala, convide o time e estime story points em tempo real.",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "BRL",
	},
} as const;

/** Mesmo app, descrição EN — usado só na home em inglês (15.T7). */
export const JSON_LD_SOFTWARE_APPLICATION_EN = {
	...JSON_LD_SOFTWARE_APPLICATION,
	description:
		"Free online planning poker for agile teams, no signup. Create a room, invite your team and estimate story points in real time.",
} as const;

export type FaqItem = { question: string; answer: string };

/** FAQPage espelhando o FAQ visível da página (exigência do Google). */
export function faqPageJsonLd(items: readonly FaqItem[]): Readonly<
	Record<string, unknown>
> {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: items.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: { "@type": "Answer", text: item.answer },
		})),
	};
}

/** Article dos guias (15.G3): autor institucional, sem byline pessoal. */
export function articleJsonLd(article: {
	headline: string;
	description: string;
	lang: string;
	path: string;
}): Readonly<Record<string, unknown>> {
	const url = `${SITE_URL}${article.path}`;
	const organization = {
		"@type": "Organization",
		name: "Pointly",
		url: `${SITE_URL}/`,
	};
	return {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: article.headline,
		description: article.description,
		inLanguage: article.lang,
		url,
		mainEntityOfPage: url,
		author: organization,
		publisher: organization,
		datePublished: GUIDES_PUBLISHED,
		dateModified: GUIDES_PUBLISHED,
	};
}

/**
 * hreflang recíproco pt-BR ↔ en + `x-default` → pt (G2), sempre apontando
 * para o caminho pt da mesma página.
 */
function alternateVersions(
	ptPath: string,
	enPath: string,
	lang: string,
): readonly SeoAlternate[] {
	const xDefault: SeoAlternate = { lang: "x-default", path: ptPath };
	return lang === "en"
		? [{ lang: "pt-BR", path: ptPath }, xDefault]
		: [{ lang: "en", path: enPath }, xDefault];
}

const PT_PLANNING_POKER = LANDING_CONTENT["pt-BR"]["planning-poker"];
const PT_SCRUM_POKER = LANDING_CONTENT["pt-BR"]["scrum-poker"];
const EN_PLANNING_POKER = LANDING_CONTENT.en["planning-poker"];
const EN_SCRUM_POKER = LANDING_CONTENT.en["scrum-poker"];

const PT_HOW_TO_PLAY = GUIDE_CONTENT["pt-BR"]["como-jogar"];
const PT_WHAT_IS = GUIDE_CONTENT["pt-BR"]["o-que-e"];
const PT_STORY_POINTS = GUIDE_CONTENT["pt-BR"]["story-points"];
const EN_HOW_TO_PLAY = GUIDE_CONTENT.en["how-to-play"];
const EN_WHAT_IS = GUIDE_CONTENT.en["what-is"];
const EN_STORY_POINTS = GUIDE_CONTENT.en["story-points"];

const PATHS = {
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
} as const;

const HOW_TO_PLAY_DESCRIPTION_PT =
	"O roteiro completo de uma sessão de planning poker: papéis, rodadas, como lidar com divergência e o que fazer depois do reveal.";
const WHAT_IS_DESCRIPTION_PT =
	"O que é planning poker, de onde veio, por que funciona e quando usar — com exemplos práticos para o seu time estimar melhor.";
const STORY_POINTS_DESCRIPTION_PT =
	"Story points sem mistério: escala, sequência de Fibonacci, story points vs horas e como calibrar a estimativa do seu time.";
const HOW_TO_PLAY_DESCRIPTION_EN =
	"The complete walkthrough of a planning poker session: roles, rounds, how to handle disagreement and what to do after the reveal.";
const WHAT_IS_DESCRIPTION_EN =
	"What planning poker is, where it came from, why it works and when to use it — with practical examples for your team.";
const STORY_POINTS_DESCRIPTION_EN =
	"Story points made simple: the scale, the Fibonacci sequence, story points vs hours and how to calibrate your team's estimates.";

export const SEO_ROUTES: readonly SeoRoute[] = [
	{
		path: PATHS.homePt,
		lang: "pt-BR",
		indexable: true,
		title: "Pointly — Planning Poker para Times Ágeis",
		description:
			"Planning poker sem cadastro para times ágeis: crie a sala em segundos, compartilhe o link e estime story points em tempo real.",
		alternates: alternateVersions(PATHS.homePt, PATHS.homeEn, "pt-BR"),
		jsonLd: [JSON_LD_SOFTWARE_APPLICATION],
	},
	{
		path: PATHS.homeEn,
		lang: "en",
		indexable: true,
		title: "Pointly — Planning Poker for Agile Teams",
		description:
			"Planning poker with no signup for agile teams: create a room in seconds, share the link and estimate story points in real time.",
		alternates: alternateVersions(PATHS.homePt, PATHS.homeEn, "en"),
		jsonLd: [JSON_LD_SOFTWARE_APPLICATION_EN],
	},
	{
		path: PATHS.planningPokerPt,
		lang: "pt-BR",
		indexable: true,
		title: "Planning Poker Online Grátis | Pointly",
		description:
			"Crie uma sala de planning poker online grátis em segundos — sem cadastro, sem instalação. Estime com o time em tempo real e chegue a um consenso.",
		alternates: alternateVersions(
			PATHS.planningPokerPt,
			PATHS.planningPokerEn,
			"pt-BR",
		),
		jsonLd: [
			JSON_LD_SOFTWARE_APPLICATION,
			faqPageJsonLd(PT_PLANNING_POKER.faq.items),
		],
	},
	{
		path: PATHS.scrumPokerPt,
		lang: "pt-BR",
		indexable: true,
		title: "Scrum Poker Online Grátis | Pointly",
		description:
			"Scrum poker online grátis e sem cadastro: crie a sala, compartilhe o código e estime story points em tempo real com o time.",
		alternates: alternateVersions(PATHS.scrumPokerPt, PATHS.scrumPokerEn, "pt-BR"),
		jsonLd: [
			JSON_LD_SOFTWARE_APPLICATION,
			faqPageJsonLd(PT_SCRUM_POKER.faq.items),
		],
	},
	{
		path: PATHS.guidesPt,
		lang: "pt-BR",
		indexable: true,
		title: "Guias de Planning Poker e Estimativas Ágeis | Pointly",
		description:
			"Guias práticos de planning poker e estimativas ágeis: como jogar, o que é e como estimar story points — para aplicar na próxima planning.",
		alternates: alternateVersions(PATHS.guidesPt, PATHS.guidesEn, "pt-BR"),
	},
	{
		path: PATHS.howToPlayPt,
		lang: "pt-BR",
		indexable: true,
		title: "Como Jogar Planning Poker: Guia Passo a Passo | Pointly",
		description: HOW_TO_PLAY_DESCRIPTION_PT,
		alternates: alternateVersions(PATHS.howToPlayPt, PATHS.howToPlayEn, "pt-BR"),
		jsonLd: [
			articleJsonLd({
				headline: PT_HOW_TO_PLAY.h1,
				description: HOW_TO_PLAY_DESCRIPTION_PT,
				lang: "pt-BR",
				path: PATHS.howToPlayPt,
			}),
			faqPageJsonLd(PT_HOW_TO_PLAY.faq.items),
		],
	},
	{
		path: PATHS.whatIsPt,
		lang: "pt-BR",
		indexable: true,
		title: "O que é Planning Poker? Guia Completo | Pointly",
		description: WHAT_IS_DESCRIPTION_PT,
		alternates: alternateVersions(PATHS.whatIsPt, PATHS.whatIsEn, "pt-BR"),
		jsonLd: [
			articleJsonLd({
				headline: PT_WHAT_IS.h1,
				description: WHAT_IS_DESCRIPTION_PT,
				lang: "pt-BR",
				path: PATHS.whatIsPt,
			}),
			faqPageJsonLd(PT_WHAT_IS.faq.items),
		],
	},
	{
		path: PATHS.storyPointsPt,
		lang: "pt-BR",
		indexable: true,
		title: "Story Points: o que são e como estimar | Pointly",
		description: STORY_POINTS_DESCRIPTION_PT,
		alternates: alternateVersions(PATHS.storyPointsPt, PATHS.storyPointsEn, "pt-BR"),
		jsonLd: [
			articleJsonLd({
				headline: PT_STORY_POINTS.h1,
				description: STORY_POINTS_DESCRIPTION_PT,
				lang: "pt-BR",
				path: PATHS.storyPointsPt,
			}),
			faqPageJsonLd(PT_STORY_POINTS.faq.items),
		],
	},
	{
		path: PATHS.planningPokerEn,
		lang: "en",
		indexable: true,
		title: "Free Online Planning Poker — No Signup | Pointly",
		description:
			"Create a free online planning poker room in seconds — no signup, no install. Estimate with your team in real time and reach consensus.",
		alternates: alternateVersions(
			PATHS.planningPokerPt,
			PATHS.planningPokerEn,
			"en",
		),
		jsonLd: [
			JSON_LD_SOFTWARE_APPLICATION,
			faqPageJsonLd(EN_PLANNING_POKER.faq.items),
		],
	},
	{
		path: PATHS.scrumPokerEn,
		lang: "en",
		indexable: true,
		title: "Free Scrum Poker Online — No Signup | Pointly",
		description:
			"Free scrum poker with no signup: create the room, share the code and estimate story points with your team in real time.",
		alternates: alternateVersions(PATHS.scrumPokerPt, PATHS.scrumPokerEn, "en"),
		jsonLd: [
			JSON_LD_SOFTWARE_APPLICATION,
			faqPageJsonLd(EN_SCRUM_POKER.faq.items),
		],
	},
	{
		path: PATHS.guidesEn,
		lang: "en",
		indexable: true,
		title: "Planning Poker & Agile Estimation Guides | Pointly",
		description:
			"Practical guides to planning poker and agile estimation: how to play, what it is and how to estimate story points before your next planning session.",
		alternates: alternateVersions(PATHS.guidesPt, PATHS.guidesEn, "en"),
	},
	{
		path: PATHS.howToPlayEn,
		lang: "en",
		indexable: true,
		title: "How to Play Planning Poker: Step-by-Step Guide | Pointly",
		description: HOW_TO_PLAY_DESCRIPTION_EN,
		alternates: alternateVersions(PATHS.howToPlayPt, PATHS.howToPlayEn, "en"),
		jsonLd: [
			articleJsonLd({
				headline: EN_HOW_TO_PLAY.h1,
				description: HOW_TO_PLAY_DESCRIPTION_EN,
				lang: "en",
				path: PATHS.howToPlayEn,
			}),
			faqPageJsonLd(EN_HOW_TO_PLAY.faq.items),
		],
	},
	{
		path: PATHS.whatIsEn,
		lang: "en",
		indexable: true,
		title: "What Is Planning Poker? A Complete Guide | Pointly",
		description: WHAT_IS_DESCRIPTION_EN,
		alternates: alternateVersions(PATHS.whatIsPt, PATHS.whatIsEn, "en"),
		jsonLd: [
			articleJsonLd({
				headline: EN_WHAT_IS.h1,
				description: WHAT_IS_DESCRIPTION_EN,
				lang: "en",
				path: PATHS.whatIsEn,
			}),
			faqPageJsonLd(EN_WHAT_IS.faq.items),
		],
	},
	{
		path: PATHS.storyPointsEn,
		lang: "en",
		indexable: true,
		title: "Story Points: What They Are and How to Estimate | Pointly",
		description: STORY_POINTS_DESCRIPTION_EN,
		alternates: alternateVersions(PATHS.storyPointsPt, PATHS.storyPointsEn, "en"),
		jsonLd: [
			articleJsonLd({
				headline: EN_STORY_POINTS.h1,
				description: STORY_POINTS_DESCRIPTION_EN,
				lang: "en",
				path: PATHS.storyPointsEn,
			}),
			faqPageJsonLd(EN_STORY_POINTS.faq.items),
		],
	},
	{
		path: "/404",
		lang: "pt-BR",
		indexable: false,
		title: "Página não encontrada | Pointly",
		description: "Este endereço não existe por aqui.",
	},
];

export const FALLBACK_ROUTE = SEO_ROUTES.find(
	(route) => route.path === "/404",
) as SeoRoute;

export function canonicalFor(route: SeoRoute): string | undefined {
	return route.indexable ? `${SITE_URL}${route.path}` : undefined;
}

const OG_IMAGE = `${SITE_URL}/images/planning-cards.webp`;

export function headForRoute(route: SeoRoute): {
	lang: string;
	title: string;
	elements: HeadElement[];
} {
	const elements: HeadElement[] = [
		{ type: "meta", props: { name: "description", content: route.description } },
	];

	const canonical = canonicalFor(route);
	if (canonical) {
		elements.push({
			type: "link",
			props: { rel: "canonical", href: canonical },
		});
	}

	for (const alternate of route.alternates ?? []) {
		elements.push({
			type: "link",
			props: {
				rel: "alternate",
				hreflang: alternate.lang,
				href: `${SITE_URL}${alternate.path}`,
			},
		});
	}

	elements.push(
		{ type: "meta", props: { property: "og:type", content: "website" } },
		{ type: "meta", props: { property: "og:title", content: route.title } },
		{
			type: "meta",
			props: { property: "og:description", content: route.description },
		},
		{ type: "meta", props: { property: "og:image", content: OG_IMAGE } },
		{
			type: "meta",
			props: { name: "twitter:card", content: "summary_large_image" },
		},
		{ type: "meta", props: { name: "twitter:title", content: route.title } },
		{
			type: "meta",
			props: { name: "twitter:description", content: route.description },
		},
		{ type: "meta", props: { name: "twitter:image", content: OG_IMAGE } },
	);

	if (canonical) {
		elements.push({
			type: "meta",
			props: { property: "og:url", content: canonical },
		});
	}

	if (!route.indexable) {
		elements.push({
			type: "meta",
			props: { name: "robots", content: "noindex" },
		});
	}

	for (const entry of route.jsonLd ?? []) {
		elements.push({
			type: "script",
			props: { type: "application/ld+json" },
			children: JSON.stringify(entry),
		});
	}

	return { lang: route.lang, title: route.title, elements };
}

/** Sitemap gerado no build a partir do registro (sem lastmod falso). */
export function buildSitemap(): string {
	const routes = SEO_ROUTES.filter((route) => route.indexable);
	const hasAlternates = routes.some(
		(route) => (route.alternates?.length ?? 0) > 0,
	);
	const xmlns = hasAlternates
		? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"'
		: "";
	const urls = routes
		.map((route) => {
			const alternates = (route.alternates ?? [])
				.map(
					(alternate) =>
						`    <xhtml:link rel="alternate" hreflang="${alternate.lang}" href="${SITE_URL}${alternate.path}" />`,
				)
				.join("\n");
			return [
				"  <url>",
				`    <loc>${canonicalFor(route)}</loc>`,
				alternates,
				"  </url>",
			]
				.filter(Boolean)
				.join("\n");
		})
		.join("\n");
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xmlns}>`,
		urls,
		"</urlset>",
		"",
	].join("\n");
}
