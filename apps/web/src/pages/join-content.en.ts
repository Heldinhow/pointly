import type { JoinContent } from "./join-content";

export const JOIN_CONTENT_EN: JoinContent = {
	lang: "en",
	intro: {
		h1Line1: "Your team.",
		h1Line2: "At the same table.",
		copy: "Open a room to start a round or use the code from an invite. No signup, no waiting.",
		stepsAria: "How it works",
		steps: [
			{ title: "Create the room", body: "Pick a nickname, no account." },
			{ title: "Share the code", body: "Invite the team where you already talk." },
			{
				title: "Estimate together",
				body: "Reveal and talk through the differences.",
			},
		],
	},
	card: {
		titleCreate: "Set up your room",
		titleJoin: "Join the room",
		description: "No signup, just a nickname for the table.",
		modesAria: "Create a room or join with a code",
		createRoom: "Create room",
		joinWithCode: "Join with code",
		nickLabel: "Nickname",
		nickPlaceholder: "What does the team call you?",
		nickHint: "2 to 20 characters, no double spaces.",
		codeLabel: "Room code",
		codeHint: "4 letters or digits. Paste the code from the invite.",
		codeCharAria: (index) => `Character ${index + 1} of 4`,
		spectatorTitle: "Join as a spectator",
		spectatorHint: "Watch and react, but don't vote or take a seat.",
		errorTitle: "Couldn't join",
		submitCreate: "Create room",
		submitJoin: "Join the room",
		statusCreating: "Creating room…",
		statusJoining: "Joining the room…",
	},
};
