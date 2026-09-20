import type { GuideCopy, GuideHubCopy } from "./guide-content";

const META_EN = "Pointly · updated September 2026";

export const GUIDE_HUB_EN: GuideHubCopy = {
	lang: "en",
	kicker: "Learn the ritual",
	h1: "Planning poker guides",
	lede: "Practical guides for better estimates: start with the step-by-step, understand why it works and get comfortable with story points.",
	startHere: "Start here",
	cards: [
		{
			to: "/en/guides/how-to-play-planning-poker",
			readingTime: "6 min read",
			title: "How to play planning poker, step by step",
			description:
				"A walkthrough of a real session: roles, round by round, time per story and what to do when the votes disagree.",
		},
		{
			to: "/en/guides/what-is-planning-poker",
			readingTime: "5 min read",
			title: "What is planning poker?",
			description:
				"Where it came from, why simultaneous voting works and when to use the ritual — with a practical round example.",
		},
		{
			to: "/en/guides/story-points",
			readingTime: "7 min read",
			title: "Story points: what they are and how to estimate",
			description:
				"The scale, the Fibonacci sequence, story points vs hours and how to calibrate with a reference story.",
		},
	],
	closing: {
		title: "Ready to estimate together?",
		body: "Create the room, send the code to your team and start the first round.",
		cta: "Create room",
	},
};

export const GUIDE_CONTENT_EN: Record<string, GuideCopy> = {
	"how-to-play": {
		lang: "en",
		path: "/en/guides/how-to-play-planning-poker",
		h1: "How to play planning poker, step by step",
		lede: "The complete walkthrough of a real session: who does what, how long each story takes and how to unblock the conversation when votes disagree.",
		meta: `6 min read · ${META_EN}`,
		tocLabel: "In this guide",
		back: { to: "/en/guides", label: "Planning poker guides" },
		sections: [
			{
				id: "before-you-start",
				title: "Before you start: what to prepare",
				blocks: [
					{
						type: "p",
						text: "Planning poker works when the story arrives described, not when the team finds out what it is at vote time. Before opening the room, make sure of three things: the backlog item with context and acceptance criteria, the people who build it in the room and a place to record the number at the end.",
					},
					{
						type: "p",
						text: "It also pays to allow a few minutes of silent reading before the vote: whoever votes needs time to think about the size, not an answer off the top of their head.",
					},
					{
						type: "p",
						text: "Have the room link ready before you start, too: whoever joins late doesn't have to wait for a new round — they simply join the next story without breaking the pace.",
					},
					{
						type: "p",
						text: "The Pointly room covers the voting part: pick a nickname, share the 4-character code in your team channel and start once everyone is in.",
					},
				],
			},
			{
				id: "who-votes",
				title: "Who votes (and who doesn't)",
				blocks: [
					{
						type: "p",
						text: "Whoever builds the story votes. Developers and the people who will do the work vote; product, design and the facilitator join the conversation but stay out of the vote.",
					},
					{
						type: "p",
						text: "That keeps the estimate from being shaped by people who won't feel the effort day to day — and keeps the number from turning into a delivery promise. The facilitator has another job: make sure everyone understands the story before voting and that the conversation doesn't become a defense of positions.",
					},
					{
						type: "p",
						text: "On small teams, roles overlap naturally. The agreement matters more than the rule: if the same person builds and facilitates, take turns running the round so everyone can vote.",
					},
					{
						type: "p",
						text: "A simple rule of thumb: if the person will put their hands on what gets delivered — code, design, data — they vote. If their part is context or decision, they join the conversation.",
					},
				],
			},
			{
				id: "the-round-in-7-steps",
				title: "The round in 7 steps",
				blocks: [
					{
						type: "p",
						text: "The order below works for any story. Practice changes how long each step takes, not the sequence.",
					},
					{
						type: "steps",
						items: [
							{
								title: "Describe the story.",
								body: "Whoever knows the item reads the context and acceptance criteria out loud. If there's a mock, screenshot or link, show it to the team.",
							},
							{
								title: "Answer questions before the vote.",
								body: "Understanding questions happen now, not after the reveal. If the answer doesn't exist yet, consider estimating with the break card.",
							},
							{
								title: "Vote in secret.",
								body: "Everyone picks a card without seeing anyone else's — simultaneous voting is what prevents anchoring on the first opinion.",
							},
							{
								title: "Reveal together.",
								body: "All cards turn at the same time. The median, the mean and the range show up on the table, along with the vote distribution.",
							},
							{
								title: "Lowest and highest explain.",
								body: "The lowest and the highest votes speak first; the rest of the team listens before responding.",
							},
							{
								title: "Talk about the difference.",
								body: "The goal is to understand what each vote saw — not to convince anyone. Often it's the story that changes, not the person.",
							},
							{
								title: "Close it or vote again.",
								body: "The team closes on the agreed number or runs a second round with what it learned. Extra rounds are cheap; rework isn't.",
							},
						],
					},
				],
			},
			{
				id: "how-long",
				title: "How long it takes",
				blocks: [
					{
						type: "p",
						text: "With practice, a small story takes 2 to 5 minutes — discussion included. Complex items can reach 10. If the conversation goes past that, the problem isn't the estimate: context is missing, and the item goes back to refinement.",
					},
					{
						type: "p",
						text: "In a two-hour planning session, teams usually estimate 15 to 30 items at that pace, depending on story size and how far the conversation spreads.",
					},
					{
						type: "callout",
						label: "Tip",
						text: "Notice the team discussing the solution instead of the size? Use the break card: the story needs more context before it becomes a number.",
					},
				],
			},
			{
				id: "when-votes-disagree",
				title: "When the votes disagree",
				blocks: [
					{
						type: "p",
						text: "Disagreement isn't an error — it's information. The size of the spread tells you how much conversation the story needs before the next round.",
					},
					{
						type: "table",
						headers: ["Spread", "What it usually means", "What to do"],
						rows: [
							[
								"1 point",
								"A small difference in understanding",
								"Close on the higher or lower value",
							],
							[
								"2–3 points",
								"An ambiguous acceptance criterion",
								"Short conversation and a new round",
							],
							[
								"5 or more",
								"The story is poorly described or needs splitting",
								"Refine before estimating",
							],
						],
					},
					{
						type: "p",
						text: "The median is the natural reference to close the round. The mean helps read the group, but it doesn't decide on its own: the final number belongs to the team, not the spreadsheet.",
					},
					{
						type: "p",
						text: "A second round is not a failure. When the spread shrinks, it means the conversation worked — even if the team hasn't closed yet.",
					},
				],
			},
			{
				id: "after-the-reveal",
				title: "After the reveal",
				blocks: [
					{
						type: "p",
						text: "The agreed number goes to the backlog with the story. When the item is done, compare the real effort with the estimate: that's how the team's reference story becomes more honest over time.",
					},
					{
						type: "p",
						text: "If the story changed scope mid-sprint, re-estimate — no drama. Story points describe what was known at vote time, not a contract.",
					},
					{
						type: "p",
						text: "Over time, the set of estimated numbers becomes the team's velocity — and it's velocity, not the estimate of a single item, that helps plan the next sprint.",
					},
				],
			},
			{
				id: "common-mistakes",
				title: "Common mistakes",
				blocks: [
					{
						type: "list",
						items: [
							{
								title: "Estimating in hours.",
								body: "Points measure relative effort; converting them to days breaks the scale on the first sprint.",
							},
							{
								title: "Letting the product owner vote.",
								body: "It turns the estimate into a delivery promise and skews the number.",
							},
							{
								title: "Treating the mean as the decision.",
								body: "The number is where the conversation starts, not where it ends.",
							},
							{
								title: "Skipping the talk when everyone agrees.",
								body: "Unanimity also deserves a confirmation question: did everyone consider the same thing?",
							},
							{
								title: "Estimating on autopilot.",
								body: "A ritual without discussion becomes time tracking by another name.",
							},
							{
								title: "Estimating without the whole team.",
								body: "Someone who wasn't in the conversation tends to disagree with the number later. If a key person was missing, re-estimate with them there.",
							},
						],
					},
				],
			},
			{
				id: "faq",
				title: "Frequently asked questions",
				blocks: [],
			},
		],
		faq: {
			title: "Frequently asked questions",
			items: [
				{
					question: "Do I need physical cards to play planning poker?",
					answer:
						"No. The Pointly room provides the full Fibonacci deck in the browser, including the break card, with nothing to install.",
				},
				{
					question: "Who should join the session?",
					answer:
						"Whoever builds the story votes; product, design and the facilitator join the conversation. Everyone sees the same table through the same link.",
				},
				{
					question: "How much time should I set aside for estimating?",
					answer:
						"It depends on the backlog: 2 to 5 minutes per story is the average with practice. A two-hour planning session usually gets through 15 to 30 items.",
				},
				{
					question: "What if the team can't close on a number?",
					answer:
						"End the round and take the item to refinement. What's missing is context, not consensus.",
				},
				{
					question: "Does someone need to facilitate?",
					answer:
						"It helps, but anyone can run the round. If the facilitator also builds, agree on a rotation so everyone can vote.",
				},
			],
		},
		closing: {
			title: "Put it into practice",
			body: "Create a free room, invite your team and run the first story today.",
			cta: "Create room",
			relatedLabel: "Continue",
			related: [
				{ to: "/en/guides/what-is-planning-poker", label: "What is planning poker" },
				{ to: "/en/guides/story-points", label: "Story points in practice" },
				{ to: "/en/planning-poker", label: "Free online planning poker" },
			],
		},
	},
	"what-is": {
		lang: "en",
		path: "/en/guides/what-is-planning-poker",
		h1: "What is planning poker?",
		lede: "Where it came from, why it works and when to use it — with a practical example so your team can estimate better.",
		meta: `5 min read · ${META_EN}`,
		tocLabel: "In this guide",
		back: { to: "/en/guides", label: "Planning poker guides" },
		sections: [
			{
				id: "what-it-is",
				title: "What planning poker is (and what it isn't)",
				blocks: [
					{
						type: "p",
						text: "Planning poker is a group estimation technique: everyone votes in secret on how much effort a story takes, all cards turn at the same time and the team talks through the differences until it reaches a number everyone stands behind.",
					},
					{
						type: "p",
						text: "It is not a vote of opinions. The vote is a technical read on effort, complexity and uncertainty — and what matters is the conversation the reveal triggers, not the score.",
					},
					{
						type: "p",
						text: "It is also not a tool: paper cards, a spreadsheet or a room in the browser are different ways to hold the same ritual.",
					},
					{
						type: "p",
						text: "The outcome of the ritual isn't just a number: it's shared understanding. Two people with the same number and different understandings is a problem that shows up in the sprint, not in the estimate.",
					},
				],
			},
			{
				id: "where-it-came-from",
				title: "Where it came from",
				blocks: [
					{
						type: "p",
						text: "The name appeared in 2002, with James Grenning, and was popularized by Mike Cohn in the following years as part of the agile estimation toolkit. Its roots are older: the Delphi method, from the 1960s, already combined anonymous judgment with collective review.",
					},
					{
						type: "p",
						text: "Replacing Delphi's anonymity with a simultaneous reveal solved a practical part: the team talks face to face, but no one sees another's vote before recording their own.",
					},
					{
						type: "p",
						text: "The name “poker” came from the card mechanics, not the game itself: the idea was to give estimates the informality of a card table, with the same seriousness of outcome.",
					},
				],
			},
			{
				id: "why-it-works",
				title: "Why it works",
				blocks: [
					{
						type: "p",
						text: "Simultaneous voting prevents anchoring: no one adjusts their number to match whoever spoke first. When the first opinion becomes the final number, the estimate belongs to the most confident — or the fastest — not to the team.",
					},
					{
						type: "p",
						text: "Relative comparison does the heavy lifting. Teams estimate better by comparing stories with each other — “is this bigger than that?” — than by trying to measure in hours.",
					},
					{
						type: "p",
						text: "And the round turns disagreement into an agenda: instead of debating the estimate in the abstract, the team discusses exactly the points that pulled the votes apart.",
					},
					{
						type: "p",
						text: "There's also a calibration effect: by seeing teammates' votes and hearing their reasoning, each person adjusts their own yardstick. Within a few weeks, the team becomes more consistent without anyone studying a formula.",
					},
					{
						type: "p",
						text: "Secret voting also protects the less experienced: without the pressure of stares, the minority opinion shows up — and it's often the one that reveals the forgotten case.",
					},
					{
						type: "p",
						text: "None of this requires software: the ritual works with paper cards, and a tool only removes the setup.",
					},
				],
			},
			{
				id: "when-to-use",
				title: "When to use it (and when not to)",
				blocks: [
					{
						type: "p",
						text: "Use it in sprint planning, in backlog refinement and whenever the team needs to estimate new items together. It works best with described stories, even if some loose ends remain.",
					},
					{
						type: "p",
						text: "Don't use it when the deadline is already imposed from the outside — the estimate becomes theater — or on huge items nobody understands: a break and a spike (a time-boxed investigation) solve that first. Teams with no domain knowledge also estimate better after a refinement session.",
					},
					{
						type: "p",
						text: "A sign the timing is right: the item has acceptance criteria and still raises questions about size. If it raises no questions at all, the vote is quick; if the questions are about understanding, the place for them is refinement.",
					},
					{
						type: "p",
						text: "Done consistently, it also becomes a planning habit: the team learns to size work before committing to it.",
					},
				],
			},
			{
				id: "the-names",
				title: "The names: planning poker, scrum poker, estimation poker",
				blocks: [
					{
						type: "p",
						text: "They are the same ritual. “Planning poker” is the older name; “scrum poker” shows up when the team adopts Scrum and the session happens in sprint planning.",
					},
					{
						type: "p",
						text: "The context changes, not the mechanics: secret vote, simultaneous reveal, conversation and, if needed, another round. If your team uses the name scrum poker, the [free scrum poker](/en/scrum-poker) page shows the same flow in a Scrum context.",
					},
					{
						type: "p",
						text: "Scrum teams often call the session scrum poker even when the deck is the same as planning poker — the difference is in the ceremony, not the cards.",
					},
				],
			},
			{
				id: "an-example",
				title: "A practical example",
				blocks: [
					{
						type: "p",
						text: "The story is “Mobile checkout”. Bia votes 3, Caio votes 8, Dani votes 5 and you vote 5. At the reveal, Caio explains: he considered paying with two cards and the new integration that requires.",
					},
					{
						type: "p",
						text: "Bia realizes she missed that case. Dani remembers the team solved something similar on desktop checkout. In a quick second round, the votes converge on 5 — and the story keeps that number, now with the same understanding across the team.",
					},
					{
						type: "p",
						text: "What got recorded wasn't just the 5: it was the list of cases the team started to consider — two cards, link expiration. That library is what makes the next estimate faster.",
					},
				],
			},
			{
				id: "how-to-apply",
				title: "How to apply it in 5 steps",
				blocks: [
					{
						type: "steps",
						items: [
							{
								title: "Pick the story.",
								body: "Describe the context and acceptance criteria before any vote.",
							},
							{
								title: "Open the room.",
								body: "Invite the people who build it: nickname, 4-character code and everyone is in within seconds, no signup.",
							},
							{
								title: "Vote in secret.",
								body: "Everyone picks a card from the Fibonacci deck without seeing anyone else's.",
							},
							{
								title: "Reveal and talk.",
								body: "Listen to the lowest and highest votes before defending your own number.",
							},
							{
								title: "Close or repeat.",
								body: "Reach a number everyone stands behind or run a second round with what you learned.",
							},
						],
					},
					{
						type: "p",
						text: "The detailed walkthrough of a full session, with time per story and a script for disagreement, is in [how to play planning poker](/en/guides/how-to-play-planning-poker).",
					},
					{
						type: "p",
						text: "If the team is new to the ritual, run the first session on stories already delivered: being wrong on known items is cheap and calibrates everyone's yardstick.",
					},
				],
			},
			{
				id: "faq",
				title: "Frequently asked questions",
				blocks: [],
			},
		],
		faq: {
			title: "Frequently asked questions",
			items: [
				{
					question: "What does planning poker mean?",
					answer:
						"It is a group estimation technique where everyone votes in secret and the votes are revealed at the same time, so the team can discuss differences before closing on a number.",
				},
				{
					question: "Do I need physical cards?",
					answer:
						"No. Paper decks exist, but any online planning poker room provides digital cards. Pointly has the full Fibonacci deck in the browser.",
				},
				{
					question: "What's the difference from regular poker?",
					answer:
						"Only the card metaphor. In planning poker there is no betting and no opponent: the goal is to estimate effort as a group, not to win the hand.",
				},
				{
					question: "Who can play?",
					answer:
						"Anyone who will build the story. People who won't do the work can join the conversation as listeners, without voting.",
				},
				{
					question: "Why is the deck Fibonacci?",
					answer:
						"Because uncertainty grows with item size: the sequence opens up space between large numbers and avoids false precision. More details in the story points guide.",
				},
			],
		},
		closing: {
			title: "Try it with your team",
			body: "Create a free room and turn the next planning session into a conversation that ends with a number.",
			cta: "Create room",
			relatedLabel: "Continue",
			related: [
				{ to: "/en/guides/how-to-play-planning-poker", label: "How to play, step by step" },
				{ to: "/en/guides/story-points", label: "Story points in practice" },
				{ to: "/en/planning-poker", label: "Free online planning poker" },
			],
		},
	},
	"story-points": {
		lang: "en",
		path: "/en/guides/story-points",
		h1: "Story points: what they are and how to estimate",
		lede: "The scale, the Fibonacci sequence, story points vs hours and how to calibrate with a reference story.",
		meta: `7 min read · ${META_EN}`,
		tocLabel: "In this guide",
		back: { to: "/en/guides", label: "Planning poker guides" },
		sections: [
			{
				id: "what-they-are",
				title: "What story points are",
				blocks: [
					{
						type: "p",
						text: "Story points are a relative unit of effort. They summarize three things at once: the work required, the complexity involved and the uncertainty about what isn't known yet.",
					},
					{
						type: "p",
						text: "Because they are relative, points have no absolute value. A 5-point story is not five hours or five days: it means “about this much” when compared with other stories from the same team.",
					},
					{
						type: "p",
						text: "They are also not a measure of individual productivity. Story points size the item, not the performance of whoever built it — using the scale for people reviews breaks its purpose.",
					},
					{
						type: "p",
						text: "The right question is never “how many hours?” but “how does this compare with what we've already done?”. The answer comes as a number, but its content is a comparison.",
					},
				],
			},
			{
				id: "points-vs-hours",
				title: "Story points vs hours",
				blocks: [
					{
						type: "p",
						text: "Hours look precise but age quickly: change the person, the tool or the understanding, and the estimate loses meaning. Points compare stories with each other and survive those changes.",
					},
					{
						type: "p",
						text: "Converting points to hours looks tempting but costs dearly: the team goes back to estimating in hours under another name and loses the relative scale. Once the number becomes a deadline commitment, nobody estimates honestly again.",
					},
					{
						type: "p",
						text: "The healthy use is collective. The average points completed per sprint (velocity) helps the team forecast how much it can pull — never to compare teams with each other or to demand productivity.",
					},
					{
						type: "p",
						text: "A practical test: if a number can be converted into a date without an argument, it probably isn't a story point.",
					},
				],
			},
			{
				id: "the-fibonacci-scale",
				title: "The Fibonacci scale and why it works",
				blocks: [
					{
						type: "p",
						text: "The sequence 1, 2, 3, 5, 8, 13 grows fast on purpose: the bigger the item, the greater the uncertainty, and the less sense it makes to tell 8 from 9. Planning poker decks usually add 0, ½ and a break card.",
					},
					{
						type: "table",
						headers: ["Value", "When it makes sense", "Example"],
						rows: [
							["0", "Nothing to do", "Copy tweak, configuration"],
							["½", "Almost nothing, but it counts", "Rename a label, fix a color"],
							["1", "Small and known", "Adjust form validation"],
							["2", "Small with one detail", "Add a masked field and its test"],
							["3", "Medium, clear path", "Simple screen backed by existing data"],
							["5", "Medium with integration", "Mobile checkout"],
							["8", "Large and uncertain", "Report with new aggregation"],
							["13", "Too large", "A sign it needs splitting"],
							["Break", "Context is missing", "Take it to refinement or a spike"],
						],
					},
					{
						type: "p",
						text: "The scale isn't sacred: teams use modified Fibonacci, powers of two or even T-shirt sizes. What matters is being relative, known by everyone and stable over time.",
					},
					{
						type: "p",
						text: "Half points and zero exist so no false precision is forced where there is none: a copy tweak isn't half a story, it's zero; a tweak that needs a deploy might be half a point. The whole scale accommodates those differences without fake steps.",
					},
				],
			},
			{
				id: "how-to-calibrate",
				title: "How to calibrate: the reference story",
				blocks: [
					{
						type: "p",
						text: "The fastest way to give the scale meaning is to pick a reference story: a small, very well understood item the team has already done. It becomes the “1 point” — and everything else is compared with it.",
					},
					{
						type: "p",
						text: "“1 point” is local. What is 1 for one team can be 3 for another, and that's not a mistake: the scale measures the effort perceived by the people who build. Comparing points across teams tells you nothing.",
					},
					{
						type: "p",
						text: "Revisit the reference from time to time: new people joined, the stack changed, the team switched products? Recalibrate with a quick comparison of a few known stories.",
					},
					{
						type: "p",
						text: "The reference doesn't need to be formal: a screenshot, a ticket number or a single sentence usually says enough.",
					},
				],
			},
			{
				id: "common-mistakes",
				title: "Common mistakes",
				blocks: [
					{
						type: "list",
						items: [
							{
								title: "Converting points to hours.",
								body: "The conversion destroys the relative scale and creates false precision.",
							},
							{
								title: "Comparing velocity across teams.",
								body: "Each team has its own reference; the comparison becomes meaningless competition.",
							},
							{
								title: "Using points in performance reviews.",
								body: "Estimates start inflating the moment they become a grade.",
							},
							{
								title: "Re-estimating under pressure.",
								body: "Changing the number to fit the sprint flips the logic: the backlog is what adjusts.",
							},
							{
								title: "Estimating everything in points.",
								body: "Urgent bugs, spikes and operational tasks don't always need an estimate — only the stories that will be planned.",
							},
						],
					},
				],
			},
			{
				id: "a-calibration-example",
				title: "A calibration example",
				blocks: [
					{
						type: "p",
						text: "With the reference defined (“adjust form validation” = 1), the team compares the backlog with it:",
					},
					{
						type: "table",
						headers: ["Backlog item", "Points", "Why"],
						rows: [
							["Social login", "2", "Known path, one extra flow"],
							["Password reset by email", "3", "New flow with link expiration"],
							["Mobile checkout", "5", "Integration and payment cases"],
							["PDF report", "8", "New aggregation and variable layout"],
						],
					},
					{
						type: "p",
						text: "Notice the numbers don't follow an exact mathematical proportion — and shouldn't. They record the team's read at that moment, comparing items with each other.",
					},
					{
						type: "p",
						text: "With the yardstick in hand, future items come in by comparison: “does this look bigger than checkout? then it's 8”. In minutes, the team estimates the whole backlog.",
					},
				],
			},
			{
				id: "how-to-estimate-in-practice",
				title: "How to estimate in practice",
				blocks: [
					{
						type: "p",
						text: "Story points and planning poker go together: the scale provides the language, the round provides the process. In an online room, the team compares, votes in secret, sees the distribution and talks through the differences.",
					},
					{
						type: "p",
						text: "If your team is starting out, it helps to run the ritual on a few finished stories first: comparing with the past calibrates the reference faster than any spreadsheet.",
					},
					{
						type: "p",
						text: "Two tips for the first session: estimate items the team has already delivered, so the yardstick starts calibrated, and record points completed after each sprint — the number is forecasting input, not a stick to beat people with.",
					},
				],
			},
			{
				id: "faq",
				title: "Frequently asked questions",
				blocks: [],
			},
		],
		faq: {
			title: "Frequently asked questions",
			items: [
				{
					question: "Are story points hours?",
					answer:
						"No. Story points measure relative effort, complexity and uncertainty. Converting points to hours creates false precision and breaks the team's scale.",
				},
				{
					question: "Why does the scale use Fibonacci?",
					answer:
						"Because uncertainty grows with item size. The sequence opens up space between large numbers and avoids debates over differences nobody can perceive.",
				},
				{
					question: "How much is 1 story point worth?",
					answer:
						"It depends on the team: 1 point is the size of the reference story chosen by the people who build. That's why points aren't comparable across teams.",
				},
				{
					question: "Does velocity predict delivery?",
					answer:
						"It helps the team forecast how much it can pull per sprint, based on its own history. It is not for comparing teams or becoming a productivity target.",
				},
				{
					question: "Can I use another scale, like T-shirt sizes?",
					answer:
						"Yes, as long as it is relative and known by everyone. Fibonacci is popular because the progression tracks the growth of uncertainty well.",
				},
				{
					question: "How do I know when an estimate is off?",
					answer:
						"Compare with what actually happened: if 5-point items always turn into 8-point work, the reference story needs adjusting. Calibration is continuous, not a one-off event.",
				},
			],
		},
		closing: {
			title: "Estimate the next story",
			body: "Create a free room and put the scale to work with your team.",
			cta: "Create room",
			relatedLabel: "Continue",
			related: [
				{ to: "/en/guides/how-to-play-planning-poker", label: "How to play, step by step" },
				{ to: "/en/guides/what-is-planning-poker", label: "What is planning poker" },
				{ to: "/en/scrum-poker", label: "Free scrum poker online" },
			],
		},
	},
};
