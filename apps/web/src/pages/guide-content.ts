/**
 * Conteúdo dos guias (15.T6), pt + EN — dados puros (sem React/CSS).
 * `src/seo/routes.ts` importa daqui o FAQ (FAQPage) e o headline (Article).
 * Briefs: G3 (#182); layout: P1 (#183).
 */

import type { Lang } from "../lib/i18n";
import { GUIDE_CONTENT_EN, GUIDE_HUB_EN } from "./guide-content.en";
import { GUIDE_CONTENT_PT, GUIDE_HUB_PT } from "./guide-content.pt";

export type { Lang };

export type GuideStep = { title: string; body: string };

export type GuideFaqItem = { question: string; answer: string };

export type GuideBlock =
	| { type: "p"; text: string }
	| { type: "steps"; items: readonly GuideStep[] }
	| { type: "list"; items: readonly GuideStep[] }
	| {
			type: "table";
			headers: readonly string[];
			rows: readonly (readonly string[])[];
	  }
	| { type: "callout"; label: string; text: string };

export type GuideSection = {
	id: string;
	title: string;
	blocks: readonly GuideBlock[];
};

export type GuideCopy = {
	lang: Lang;
	path: string;
	h1: string;
	lede: string;
	/** Linha de meta visível (autor, leitura, atualização). */
	meta: string;
	tocLabel: string;
	back: { to: string; label: string };
	sections: readonly GuideSection[];
	faq: { title: string; items: readonly GuideFaqItem[] };
	closing: {
		title: string;
		body: string;
		cta: string;
		relatedLabel: string;
		related: readonly { to: string; label: string }[];
	};
};

export type GuideHubCard = {
	to: string;
	readingTime: string;
	title: string;
	description: string;
};

export type GuideHubCopy = {
	lang: Lang;
	kicker: string;
	h1: string;
	lede: string;
	cards: readonly GuideHubCard[];
	closing: { title: string; body: string; cta: string };
};

export const GUIDE_CONTENT = {
	"pt-BR": GUIDE_CONTENT_PT,
	en: GUIDE_CONTENT_EN,
} as const;

export const GUIDE_HUB = {
	"pt-BR": GUIDE_HUB_PT,
	en: GUIDE_HUB_EN,
} as const;
