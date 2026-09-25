/**
 * Copy da arena (`/s/:code`), pt + EN — dados puros (sem React/CSS), no padrão
 * de `home-content`. O idioma vem do App (preferência/navegador nas rotas
 * internas, que não têm URL de idioma).
 */

import type { Lang } from "@/lib/i18n";
import type { Phase } from "@/lib/protocol";
import { ARENA_CONTENT_EN } from "./arena-content.en";
import { ARENA_CONTENT_PT } from "./arena-content.pt";

export type ArenaContent = {
	lang: Lang;
	phase: Record<Phase, string>;
	loading: {
		reconnectTitle: string;
		retry: string;
		backToJoin: string;
		reconnectingAria: string;
		loadingAria: string;
		reconnecting: string;
		loading: string;
	};
	toolbar: {
		room: string;
		round: (round: number, phase: string) => string;
		presenceSpectators: (
			voters: number,
			spectators: number,
			voted: number,
		) => string;
		presence: (connected: number, voted: number) => string;
		leave: string;
		leaveConfirmTitle: string;
		leaveConfirmDescription: string;
		cancelLeave: string;
		confirmLeave: string;
	};
	reconnecting: {
		title: string;
		hint: (attempt: number) => string;
		retryNow: string;
	};
	connectionLost: {
		title: string;
		hint: string;
		retry: string;
	};
	playArea: {
		aria: string;
		caption: string;
		seatsLeft: (taken: number, total: number) => string;
	};
	reveal: {
		titleRevealed: string;
		titleReady: string;
		titleVoting: string;
		descRevealed: string;
		descReady: string;
		descCanReveal: string;
		descWaiting: string;
		reveal: string;
		revealAria: string;
		revealAriaWaiting: string;
		revealHint: string;
		revealHintReady: string;
		revealHintWaiting: string;
		newRound: string;
		newRoundConfirm: string;
		newRoundAria: string;
		newRoundAriaConfirm: string;
		newRoundHint: string;
		newRoundHintConfirm: string;
		errorTitle: string;
		newRoundErrorTitle: string;
	};
	projectile: {
		hint: string;
		errorTitle: string;
		cooldown: (secs: number) => string;
		unavailable: string;
		nudgeCooldown: (secs: number) => string;
		nudgeUnavailable: string;
	};
	deck: {
		spectatorTitle: string;
		title: string;
		spectatorDesc: string;
		pickAdjustable: string;
		spectatorVoteError: string;
		errorTitle: string;
	};
	tableNote: {
		estimate: string;
		revealShortcut: string;
		newRoundShortcut: string;
	};
	sidebar: {
		aria: string;
		youAre: string;
		watching: string;
		selfHost: string;
		hostLead: string;
		avatarErrorTitle: string;
		avatarError: string;
		spectators: (count: number) => string;
		privacySettings: string;
	};
	invite: {
		title: string;
		description: string;
		linkAria: string;
		copy: string;
		copied: string;
		copyFeedback: string;
		copyError: string;
		hide: string;
		show: string;
	};
	results: {
		title: string;
		description: string;
		unanimous: string;
		noNumerics: string;
		single: string;
		median: string;
		mean: string;
		range: string;
		pipTitle: (count: number, value: string) => string;
		noNumericsNote: string;
		justifyLead: string;
		copy: string;
		copied: string;
		copyFeedback: string;
		copyError: string;
		votesLabel: string;
		noVote: string;
	};
	waiting: {
		spectatorTitle: string;
		title: string;
		spectatorBody: string;
		body: string;
		solo: string;
		soloSpectator: string;
	};
	errors: {
		genericAction: string;
		vote: string;
		interact: string;
		reveal: string;
		newRound: string;
	};
};

export const ARENA_CONTENT: Record<Lang, ArenaContent> = {
	"pt-BR": ARENA_CONTENT_PT,
	en: ARENA_CONTENT_EN,
};
