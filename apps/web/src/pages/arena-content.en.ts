import type { ArenaContent } from "./arena-content";

export const ARENA_CONTENT_EN: ArenaContent = {
	lang: "en",
	phase: {
		idle: "Waiting for votes",
		voting: "Voting",
		revealable: "Ready to reveal",
		revealed: "Revealed",
	},
	loading: {
		reconnectTitle: "Couldn't reconnect",
		retry: "Try again",
		backToJoin: "Back to join",
		reconnectingAria: "Reconnecting",
		loadingAria: "Loading room",
		reconnecting: "Reconnecting…",
		loading: "Loading room…",
	},
	toolbar: {
		room: "Room",
		round: (round, phase) => `Round ${round} · ${phase}`,
		presenceSpectators: (voters, spectators, voted) =>
			`${voters} playing · ${spectators} watching · ${voted} voted`,
		presence: (connected, voted) => `${connected} in the room · ${voted} voted`,
		leave: "Leave room",
	},
	reconnecting: {
		title: "Reconnecting…",
		hint: (attempt) =>
			`Reconnect attempt ${attempt} — the score may be out of date.`,
		retryNow: "Retry now",
	},
	connectionLost: {
		title: "Connection lost",
		hint: "The score may be out of date. Try connecting again.",
		retry: "Try again",
	},
	playArea: {
		aria: "Planning poker table",
		caption: "Planning poker table",
		seatsLeft: (taken, total) => `${taken} of ${total} seats`,
	},
	reveal: {
		titleRevealed: "Cards on the table",
		titleReady: "Ready to reveal?",
		titleVoting: "What's your estimate?",
		descRevealed: "Votes revealed. Talk through the differences.",
		descReady: "Everyone voted.",
		descCanReveal: "We already have votes. Anyone can reveal.",
		descWaiting: "Waiting for the first vote. Pick a card to start.",
		reveal: "Reveal votes",
		revealAria: "Reveal votes (shortcut R)",
		revealAriaWaiting: "Waiting for votes to reveal",
		revealHint: "reveals",
		revealHintReady: " · moves on to the discussion.",
		revealHintWaiting: " · available after the first vote.",
		newRound: "New round",
		newRoundConfirm: "Confirm new round",
		newRoundAria: "New round (shortcut N, needs confirmation)",
		newRoundAriaConfirm: "Confirm new round (shortcut N)",
		newRoundHint:
			"Ready for the next estimate? Votes are cleared after your confirmation.",
		newRoundHintConfirm:
			"Activate again to confirm and clear the votes. Confirmation expires in 5 seconds.",
		errorTitle: "Couldn't reveal",
		newRoundErrorTitle: "Couldn't start a new round",
	},
	projectile: {
		hint: "Hover or tap someone to throw · 1s cooldown (chair: 8s).",
		errorTitle: "Couldn't interact",
		cooldown: (secs) => `Reloading · wait ${secs}s to throw again.`,
		unavailable: "Throw unavailable: pick another connected participant.",
		nudgeCooldown: (secs) => `Reloading · wait ${secs}s to nudge again.`,
		nudgeUnavailable: "Nudge unavailable: pick another connected participant.",
	},
	deck: {
		spectatorTitle: "You're watching",
		title: "Your estimate",
		spectatorDesc:
			"Spectators follow and react, but don't vote. To vote, leave and join as a player.",
		pickAdjustable: "Pick a card to vote. You can adjust it later.",
		spectatorVoteError:
			"Spectators can't vote. To vote, leave and join as a player.",
		errorTitle: "Couldn't vote",
	},
	tableNote: {
		estimate: "Independent estimates. One conversation.",
		revealShortcut: "reveal",
		newRoundShortcut: "new round",
	},
	sidebar: {
		aria: "Room information",
		youAre: "You are",
		watching: " · Watching",
		selfHost: " · Room host",
		hostLead: " · Host: ",
		avatarErrorTitle: "Couldn't change the photo",
		avatarError: "Couldn't change the photo. Try again.",
		spectators: (count) => `Watching (${count}):`,
	},
	invite: {
		title: "Invite the team",
		description: "Share the link and gather the team at the table.",
		linkAria: "Invite link",
		copy: "Copy",
		copied: "Copied!",
		copyFeedback: "Link copied! Just send it to the team.",
		copyError: "Couldn't copy. Select the link and copy it manually.",
		hide: "Hide invite",
		show: "Show invite",
	},
	results: {
		title: "Results",
		description:
			"Average, median, lowest and highest estimate · pause and absence stay out of the math.",
		unanimous: "Unanimous",
		noNumerics: "No numeric votes",
		single: "Single vote",
		median: "Median",
		mean: "average",
		range: "range",
		pipTitle: (count, value) =>
			`${count} ${count > 1 ? "votes" : "vote"} on ${value}`,
		noNumericsNote:
			"Only pause or nobody voted · no average, median or range.",
		justifyLead: "Justifies first:",
	},
	waiting: {
		spectatorTitle: "Follow the voting.",
		title: "Every opinion counts.",
		spectatorBody: "Cards stay hidden until the reveal. You watch without voting.",
		body: "Cards stay hidden until the reveal. Pick with no influence from the team.",
		solo: "You're alone. Copy the invite to bring the team in. You can vote alone to test the flow.",
		soloSpectator: "You're alone. Copy the invite to bring the team in.",
	},
	errors: {
		genericAction: "Couldn't complete the action.",
		vote: "Couldn't register your vote.",
		interact: "Couldn't interact.",
		reveal: "Couldn't reveal.",
		newRound: "Couldn't start a new round.",
	},
};
