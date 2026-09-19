import type { LandingContent } from "./landing-content";

export const LANDING_CONTENT_EN: Record<string, LandingContent> = {
	"planning-poker": {
		kicker: "Planning poker · live",
		h1: "Free online planning poker, straight to the conversation",
		lede: "Create the room, share the code and get your team voting. No signup, no install and no paid plan — the browser is enough.",
		deckNote: "The whole deck, from 0 to the break card.",
		ctaLabel: "Create room",
		howAnchorLabel: "See how it works",
		how: {
			title: "How a round works",
			intro:
				"From an empty room to an agreed number, without leaving the meeting your team would have anyway.",
			steps: [
				{
					title: "Create the room",
					body: "Pick a nickname and that's it: no account, no email. You get a 4-character code to invite the team.",
				},
				{
					title: "Share the code",
					body: "Send the code or the link to the channel where your team already talks. Everyone joins from the browser, on desktop or phone.",
				},
				{
					title: "Vote in secret",
					body: "Each person picks a card from the Fibonacci deck — 0, ½, 1, 2, 3, 5, 8, 13 — or the break card, without seeing anyone else's vote.",
				},
				{
					title: "Reveal together",
					body: "With every vote on the table, anyone can reveal. Median, mean, range and the full distribution appear at once.",
				},
				{
					title: "Talk about the difference",
					body: "The votes that stand out show where the story is still unclear. That's where the conversation pays off more than the number.",
				},
				{
					title: "Move to the next one",
					body: "Once the value is agreed, start a new round. The room stays the same while your team is in it.",
				},
			],
		},
		why: {
			title: "Built for the ritual, not for the tool",
			intro: "What the team needs to estimate together, with nothing in the way.",
			points: [
				{
					title: "No signup, for real",
					body: "Nobody creates an account or shares an email. The whole team is voting in under a minute.",
				},
				{
					title: "Ephemeral room",
					body: "The room exists while the team is in it and disappears when everyone leaves. No history left behind to clean up.",
				},
				{
					title: "Round results right away",
					body: "Median, mean and range calculated at the reveal, with numbers in tabular figures. If there are only break or missing votes, the table says that too.",
				},
				{
					title: "The conversation at the center",
					body: "Pointly doesn't estimate for the team: it shows where the votes disagree so the discussion starts in the right place.",
				},
			],
		},
		sections: [
			{
				title: "The ritual in one sentence",
				paragraphs: [
					"Planning poker is a group estimation technique: each person votes in secret on how much effort a story takes, all cards turn at the same time and the team talks through the differences until it reaches a number everyone stands behind.",
					"Simultaneous voting prevents anchoring: nobody adjusts their vote to match whoever spoke first. That's why the reveal — the moment the cards turn — is the heart of the round.",
					"An example: the story “password reset by email” gets 3, 5, 5 and 8. At the reveal, the person who voted 8 explains the link expiration case they considered, the one who voted 3 realizes they missed it and the team closes on 5 with a shared understanding of the story.",
					"Why Fibonacci? The sequence grows fast because uncertainty grows with it: the gap between 2 and 3 is small, but between 8 and 13 nobody can safely claim one story is exactly one point bigger than the other. The break card completes the deck for cases where context is missing — it counts as presence, but stays out of the math.",
				],
			},
			{
				title: "The reveal: what the table shows",
				paragraphs: [
					"When the team reveals, Pointly calculates the median, the mean and the range of the numeric votes. The median is usually the agreed number, because it doesn't let an extreme vote pull the result.",
					"The table also groups votes by card — 2×5, 1×8 — and flags unanimous or divergent rounds. If there are only break or missing votes, it says so instead of inventing an average.",
					"The goal isn't the number itself, but what the distribution reveals: a 13 among three 5s almost always means a detail of the story that one person sees and the rest of the team doesn't yet.",
				],
			},
			{
				title: "No signup, no history",
				paragraphs: [
					"There is no account to create, no email to confirm, no password to store. The nickname is the only identification, and the room lives only while the team is in it: when the last person leaves, it ceases to exist along with the votes in it.",
					"That removes the friction to start — anyone joins from the link in seconds — and also the weight of managing a history nobody will ever read. There is no paid tier hiding features: the whole ritual is the product.",
				],
			},
		],
		faq: {
			title: "Frequently asked questions",
			items: [
				{
					question: "Do I need an account to play?",
					answer:
						"No. Pick a nickname and you're in the room. Pointly never asks for an email or password, and there is no signup step at any point.",
				},
				{
					question: "How many people fit in a room?",
					answer:
						"Pointly is designed for teams of 3 to 12 people. You can play with more, but the conversation works best in that range.",
				},
				{
					question: "Does it work on a phone?",
					answer:
						"Yes. The room opens in any browser, desktop or phone, with nothing to install. Everyone uses the same link.",
				},
				{
					question: "What happens to the data after the session?",
					answer:
						"The room is ephemeral: it ceases to exist when the last participant leaves, and there is no estimate history to manage.",
				},
				{
					question: "Which deck does Pointly use?",
					answer:
						"The Fibonacci deck: 0, ½, 1, 2, 3, 5, 8 and 13, plus a break card for when the story needs context before it can be estimated.",
				},
				{
					question: "Can we estimate with a remote team?",
					answer:
						"That's exactly what it's for. Each person joins from their own browser, wherever they are, and the reveal happens at the same time for everyone.",
				},
				{
					question: "How much does Pointly cost?",
					answer:
						"Nothing. Pointly is free with no paid plan: creating a room, voting and revealing are the whole product, with no limit hidden behind a subscription.",
				},
			],
		},
		closing: {
			title: "Ready to estimate without friction?",
			body: "Create the room, send the code to your team and start the first round in seconds.",
		},
		crossLink: {
			text: "Does your team call this ritual scrum poker? It's the same table:",
			label: "see the scrum poker page",
			to: "/en/scrum-poker",
		},
		guidesLink: {
			text: "Prefer to understand the ritual first?",
			label: "start with the planning poker guides",
			to: "/en/guides",
		},
	},
	"scrum-poker": {
		kicker: "Scrum poker · no signup",
		h1: "Free scrum poker online, no signup required",
		lede: "Bring scrum poker into sprint planning: the room is ready in seconds, the 4-character code invites the team and story points come out of a conversation.",
		deckNote: "Story points as cards, not hours.",
		ctaLabel: "Create room",
		howAnchorLabel: "See how it works",
		how: {
			title: "How it works in sprint planning",
			intro: "One backlog item per round, from the invite to the agreed number.",
			steps: [
				{
					title: "Open the room before planning",
					body: "Pick a nickname and create the room with no signup. The 4-character code is ready to be shared in your team channel.",
				},
				{
					title: "Bring the backlog item",
					body: "Pick the story of the moment and describe the context to the team. Every item estimated is a new round, in the same room.",
				},
				{
					title: "Vote the story points",
					body: "Each person picks a card from the Fibonacci deck. Votes stay hidden until the reveal — nobody aligns just because someone spoke first.",
				},
				{
					title: "Reveal and compare",
					body: "Median, mean and range appear together. The outlying votes show where the item is still uncertain for someone on the team.",
				},
				{
					title: "Close the round and move on",
					body: "Reach a number everyone stands behind, record it in the backlog and start the next story without leaving the room.",
				},
			],
		},
		why: {
			title: "Why estimate with scrum poker",
			intro:
				"Group estimation trades the individual guess for a decision the whole team understands.",
			points: [
				{
					title: "No anchoring",
					body: "Simultaneous voting keeps the first opinion of the meeting from pulling the others. The team decides after seeing every card.",
				},
				{
					title: "Story points, not hours",
					body: "The Fibonacci scale measures relative effort and uncertainty. Comparing stories with each other gives steadier numbers than guessing days.",
				},
				{
					title: "Discussion where it matters",
					body: "When votes disagree, the table points at the exact gap. The team discusses the item, not the estimate in the abstract.",
				},
				{
					title: "Zero setup",
					body: "No registering the team, configuring a board or installing an app: one room, one link and the ritual happens alongside planning.",
				},
			],
		},
		sections: [
			{
				title: "Where scrum poker fits",
				paragraphs: [
					"Scrum poker is what Scrum teams call planning poker: the same card-based estimation, done during sprint planning. Each person picks a card from the Fibonacci sequence — 0, ½, 1, 2, 3, 5, 8, 13 — or a break, and the cards turn together.",
					"The most common fit is estimating item by item during planning, before pulling work into the sprint. It also works in backlog refinement, while stories are still maturing, and in one-off alignment sessions.",
					"Because the room keeps no history, every session starts clean: the team decides where the numbers get recorded — spreadsheet, board or project tool.",
				],
			},
			{
				title: "From disagreement to an agreed number",
				paragraphs: [
					"Scrum poker earns its keep when votes disagree. Instead of accepting the first number, the table shows the distribution — four votes on 5 and one on 8 — and the conversation goes straight to the point: what is the 8 seeing?",
					"The median is the natural reference to close the round, with the mean and the range beside it. If the item ends up unanimous, even better: the team is already aligned and can move on without discussion.",
					"The break card exists for the item that can't be estimated yet: it counts as presence in the round, stays out of the mean and median, and becomes an explicit signal that the story needs more context before it gets a number.",
					"After the session, the numbers live on with the team: they feed the sprint, inform velocity and help forecast the next cycles. Pointly doesn't interfere with that step — the room is only the place for the conversation, and the record stays in the tool your team already uses.",
				],
			},
			{
				title: "Remote, hybrid or a full room",
				paragraphs: [
					"Scrum poker works the same for in-person, remote or hybrid teams: each person joins from the browser and votes at the same time, with nothing to install. On distributed teams, the simultaneous reveal replaces “who thinks what?” and gives everyone the same information before the discussion.",
					"With no signup, whoever joins late isn't stuck waiting for approval: just share the 4-character code and they vote on the next story.",
				],
			},
		],
		faq: {
			title: "Frequently asked questions",
			items: [
				{
					question: "Is scrum poker the same as planning poker?",
					answer:
						"Yes: they are two names for the same card-based estimation ritual. What changes is the context where the name shows up, not the mechanics of the round.",
				},
				{
					question: "When should we run scrum poker?",
					answer:
						"Usually in sprint planning or backlog refinement, whenever the team needs to estimate new items. It also works as an alignment step before pulling a story into the sprint.",
				},
				{
					question: "What are story points?",
					answer:
						"Relative units of effort: a 5-point story takes more work than a 3-point one, without equaling hours. The Fibonacci scale keeps the comparison consistent.",
				},
				{
					question: "Do we need an account or signup?",
					answer:
						"No. A nickname is enough. The room is ephemeral and keeps no history: when the team leaves, it ceases to exist.",
				},
				{
					question: "Does it work for remote or hybrid teams?",
					answer:
						"Yes. Each person joins from their browser wherever they are, and the reveal happens at the same time for everyone.",
				},
				{
					question: "Can we estimate more than one item in the same session?",
					answer:
						"Yes: every item is a round. Estimate the story, close the number and start the next one without leaving the room.",
				},
				{
					question: "Is Pointly actually free?",
					answer:
						"Yes, free with no paid plan. No signup, no email and no feature locked behind a subscription.",
				},
			],
		},
		closing: {
			title: "Start the next planning with the table ready",
			body: "Create the room, invite the team and estimate the first story today.",
		},
		crossLink: {
			text: "Or does your team call the ritual planning poker? The details are here:",
			label: "see the planning poker page",
			to: "/en/planning-poker",
		},
		guidesLink: {
			text: "Want to go deeper on estimation?",
			label: "start with the guides",
			to: "/en/guides",
		},
	},
};
