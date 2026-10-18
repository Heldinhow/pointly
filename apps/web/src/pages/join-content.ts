/**
 * Copy da entrada (`/join`), pt + EN — dados puros (sem React/CSS), no padrão
 * de `home-content`. O idioma vem do App (preferência/navegador nas rotas
 * internas, que não têm URL de idioma).
 */

import type { Lang } from "@/lib/i18n";
import { JOIN_CONTENT_EN } from "./join-content.en";
import { JOIN_CONTENT_PT } from "./join-content.pt";

export type JoinStep = { title: string; body: string };

export type JoinContent = {
	lang: Lang;
	intro: {
		h1Line1: string;
		h1Line2: string;
		copy: string;
		stepsAria: string;
		steps: readonly JoinStep[];
	};
	card: {
		titleCreate: string;
		titleJoin: string;
		description: string;
		modesAria: string;
		createRoom: string;
		joinWithCode: string;
		nickLabel: string;
		nickPlaceholder: string;
		nickHint: string;
		codeLabel: string;
		codeHint: string;
		codeCharAria: (index: number) => string;
		spectatorTitle: string;
		spectatorHint: string;
		errorTitle: string;
		submitCreate: string;
		submitJoin: string;
		statusCreating: string;
		statusJoining: string;
	};
};

export const JOIN_CONTENT: Record<Lang, JoinContent> = {
	"pt-BR": JOIN_CONTENT_PT,
	en: JOIN_CONTENT_EN,
};
