import { expect, type ConsoleMessage, type Page, type WebSocket } from "@playwright/test";
import { isDeepStrictEqual } from "node:util";
import {
	parseServerEvent,
	type ServerToClientEvent,
} from "@planning-poker/shared";

type WelcomeEvent = Extract<ServerToClientEvent, { type: "welcome" }>;
type RoomStateEvent = Extract<ServerToClientEvent, { type: "room_state" }>;
type VotesRevealedEvt = Extract<ServerToClientEvent, { type: "votes_revealed" }>;
type ServerErrorEvt = Extract<ServerToClientEvent, { type: "error" }>;

/** Typed S2C capture over `page.on("websocket")`. Passive: no mocks, no socket replacement. */
export interface WsCapture {
	frames: string[];
	welcomes: WelcomeEvent[];
	roomStates: RoomStateEvent[];
	votesRevealed: VotesRevealedEvt[];
	errors: ServerErrorEvt[];
	parseErrors: string[];
	readonly lastWelcome: WelcomeEvent | null;
	readonly lastRoomState: RoomStateEvent | null;
	detach: () => void;
}

/** Assert no server frame leaked a client `uuid` ( reconnect handle, never on the S2C wire). */
export function rawFramesContainUuid(frames: string[]): string | null {
	const uuidRe = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
	for (const frame of frames) {
		if (frame.includes('"uuid"')) return frame.slice(0, 300);
		const match = uuidRe.exec(frame);
		if (match) return frame.slice(0, 300);
	}
	return null;
}

/** Attach passive WS capture. Every raw frame is preserved; known events parse via the shared contract. */
export function attachWsCapture(page: Page): WsCapture {
	const cap: WsCapture = {
		frames: [],
		welcomes: [],
		roomStates: [],
		votesRevealed: [],
		errors: [],
		parseErrors: [],
		get lastWelcome(): WelcomeEvent | null {
			return this.welcomes.at(-1) ?? null;
		},
		get lastRoomState(): RoomStateEvent | null {
			return this.roomStates.at(-1) ?? null;
		},
		detach: () => {},
	};
	const onSocket = (ws: WebSocket) => {
		if (new URL(ws.url()).pathname !== "/ws") return;
		ws.on("framereceived", (event) => {
			const raw = typeof event.payload === "string" ? event.payload : "";
			if (!raw) return;
			cap.frames.push(raw);
			const evt = parseServerEvent(raw);
			if (evt) {
				if (!isDeepStrictEqual(JSON.parse(raw), evt)) {
					cap.parseErrors.push(`unexpected fields in ${evt.type} frame`);
				}
				switch (evt.type) {
					case "welcome":
						cap.welcomes.push(evt);
						break;
					case "room_state":
						cap.roomStates.push(evt);
						break;
					case "votes_revealed":
						cap.votesRevealed.push(evt);
						break;
					case "error":
						cap.errors.push(evt);
						break;
					default:
						break;
				}
				return;
			}
			cap.parseErrors.push(`schema-rejected app frame: ${raw.slice(0, 300)}`);
		});
	};
	page.on("websocket", onSocket);
	cap.detach = () => {
		page.off("websocket", onSocket);
	};
	return cap;
}

export interface ErrorGuard {
	pageErrors: string[];
	consoleErrors: string[];
	assertClean: () => void;
	detach: () => void;
}

/** Fail on every pageerror and console.error. */
export function attachErrorGuard(page: Page): ErrorGuard {
	const guard: ErrorGuard = {
		pageErrors: [],
		consoleErrors: [],
		assertClean: () => {},
		detach: () => {},
	};
	const onPageError = (error: Error) => {
		guard.pageErrors.push(String(error?.stack ?? error?.message ?? error));
	};
	const onConsole = (message: ConsoleMessage) => {
		if (message.type() !== "error") return;
		const text = message.text();
		guard.consoleErrors.push(text);
	};
	page.on("pageerror", onPageError);
	page.on("console", onConsole);
	guard.assertClean = () => {
		expect(guard.pageErrors.length, `pageerror: ${guard.pageErrors[0]?.slice(0, 500) ?? ""}`).toBe(0);
		expect(guard.consoleErrors.length, `console.error: ${guard.consoleErrors[0]?.slice(0, 500) ?? ""}`).toBe(0);
	};
	guard.detach = () => {
		page.off("pageerror", onPageError);
		page.off("console", onConsole);
	};
	return guard;
}
