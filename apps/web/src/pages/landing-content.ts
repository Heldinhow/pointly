/**
 * Copy das landings de aquisição (15.T5), pt + EN (15.T6).
 *
 * Dados puros (sem React/CSS) porque `src/seo/routes.ts` importa daqui o FAQ
 * que vira `FAQPage` no head — o schema precisa espelhar o FAQ visível.
 * Title/description seguem o registro canônico em `src/seo/routes.ts` (G2).
 */

import type { Lang } from "./guide-content";
import { LANDING_CONTENT_EN } from "./landing-content.en";
import { LANDING_CONTENT_PT } from "./landing-content.pt";

export type LandingStep = {
	title: string;
	body: string;
};

export type LandingFaqItem = {
	question: string;
	answer: string;
};

export type LandingContent = {
	kicker: string;
	h1: string;
	lede: string;
	deckNote: string;
	/** Rótulo do CTA principal ("Criar sala" / "Create room"). */
	ctaLabel: string;
	/** Rótulo do link-âncora para a seção "como funciona". */
	howAnchorLabel: string;
	how: {
		title: string;
		intro: string;
		steps: readonly LandingStep[];
	};
	why: {
		title: string;
		intro: string;
		points: readonly LandingStep[];
	};
	/** Blocos de prosa informativa (contexto, sem virar guia). */
	sections: readonly {
		title: string;
		paragraphs: readonly string[];
	}[];
	faq: {
		title: string;
		items: readonly LandingFaqItem[];
	};
	closing: {
		title: string;
		body: string;
	};
	crossLink: {
		text: string;
		label: string;
		to: string;
	};
	/** Ponte para o hub de guias do idioma. */
	guidesLink: {
		text: string;
		label: string;
		to: string;
	};
};

export const LANDING_CONTENT: Record<Lang, Record<string, LandingContent>> = {
	"pt-BR": LANDING_CONTENT_PT,
	en: LANDING_CONTENT_EN,
};

export type LandingId = keyof typeof LANDING_CONTENT_PT;

export const DECK_FACES = ["0", "½", "1", "2", "3", "5", "8", "13", "☕"] as const;

export type { Lang };
