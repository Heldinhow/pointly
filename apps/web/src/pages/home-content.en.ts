import type { HomeContent } from "./home-content";

export const HOME_CONTENT_EN: HomeContent = {
	lang: "en",
	hero: {
		h1Lead: "Free online planning poker",
		h1Em: "for your team.",
		lede: "Planning poker with no signup. Bring the team together, pick your cards and turn different estimates into a conversation that moves the project forward.",
		createRoom: "Create room",
		enterWithCode: "Enter with code",
		tryRound: "Try a round",
	},
	visual: {
		kicker: "Story being estimated",
		story: "Mobile checkout",
		waiting: "3 of 4 voted · waiting for you",
		you: "You",
	},
	demo: {
		titleLead: "Your turn to vote.",
		titleEnd: "The room reveals.",
		intro:
			"Pick your card. Bia, Caio and Dani already voted — the reveal shows how the conversation starts.",
		kicker: "Story being estimated",
		story: "Mobile checkout",
		statusWaiting: "3 of 4 voted · waiting for you",
		statusAllVoted: "Everyone voted · time to reveal",
		statusRevealed: "Votes revealed",
		reveal: "Reveal simulated votes",
		revealAriaEmpty: "Choose a card to reveal",
		hintEmpty: "Choose your estimate to reveal. Teammate votes are simulated.",
		hintReady: "With your card on the table, reveal the simulated votes.",
		revealed: "Votes revealed. The conversation can move on.",
		votesAria: "Simulated votes",
		you: "You",
		statsUnanimous: "Unanimous",
		statsNoNumerics: "No numeric votes",
		statsSingle: "Single vote",
		statsMedian: "Median",
		captionMean: "average",
		captionRange: "range",
		statsDetails: "Details",
		pipTitle: (count, value) =>
			`${count} ${count > 1 ? "votes" : "vote"} on ${value}`,
		noNumerics: "Only pause or nobody voted. No average, median or range.",
		createWithTeam: "Create room",
		retry: "Try again",
	},
	how: {
		title: "Now, gather your team.",
		steps: [
			{
				title: "Create the room",
				body: "Pick your nickname and start with no signup.",
			},
			{
				title: "Share the code",
				body: "Invite the team where you already talk.",
			},
			{
				title: "Estimate together",
				body: "Reveal the cards and talk through the differences.",
			},
		],
		cta: "Create room",
	},
};
