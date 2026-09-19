/**
 * Copy da home (15.T7), pt + EN — dados puros (sem React/CSS), no padrão de
 * `landing-content`/`guide-content`. A home EN reaproveita o mesmo hero/demo;
 * só o idioma muda.
 */

import type { Lang } from "@/lib/i18n";
import { HOME_CONTENT_EN } from "./home-content.en";
import { HOME_CONTENT_PT } from "./home-content.pt";

export type HomeStep = { title: string; body: string };

export type HomeContent = {
	lang: Lang;
	hero: {
		h1Lead: string;
		h1Em: string;
		lede: string;
		createRoom: string;
		enterWithCode: string;
		tryRound: string;
	};
	/** Rótulos do visual decorativo do hero (aria-hidden). */
	visual: {
		kicker: string;
		story: string;
		waiting: string;
		you: string;
	};
	demo: {
		titleLead: string;
		titleEnd: string;
		intro: string;
		kicker: string;
		story: string;
		statusWaiting: string;
		statusAllVoted: string;
		statusRevealed: string;
		reveal: string;
		revealAriaEmpty: string;
		hintEmpty: string;
		hintReady: string;
		revealed: string;
		votesAria: string;
		you: string;
		statsUnanimous: string;
		statsNoNumerics: string;
		statsSingle: string;
		statsMedian: string;
		captionMean: string;
		captionRange: string;
		pipTitle: (count: number, value: string) => string;
		noNumerics: string;
		createWithTeam: string;
		retry: string;
	};
	how: {
		title: string;
		steps: readonly HomeStep[];
		cta: string;
	};
};

export const HOME_CONTENT: Record<Lang, HomeContent> = {
	"pt-BR": HOME_CONTENT_PT,
	en: HOME_CONTENT_EN,
};
