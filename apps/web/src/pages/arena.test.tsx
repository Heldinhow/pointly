/**
 * Arena render smoke — colocated (bun:test).
 *
 * MemoryRouter + store pré-carregado: deck renderiza 9 cartas, reveal
 * desabilitado com 0 votos. Self-contained (sem test-helpers — scaffold).
 */
import { afterEach, describe, expect, test } from "bun:test";
import "../test-jsdom";
import { cleanup, render, screen } from "@testing-library/react";
import type { Player, SalaState } from "@planning-poker/shared";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { useSalaStore } from "@/store/sala";
import { ThemeProvider } from "@/theme/theme";
import { Arena } from "./arena";

afterEach(() => {
	cleanup();
	useSalaStore.getState().reset();
	try {
		sessionStorage.clear();
	} catch {
		// ignore
	}
});

function makePlayer(overrides: Partial<Player> = {}): Player {
	return {
		id: "p_1",
		uuid: "00000000-0000-4000-8000-000000000000",
		nick: "Helder",
		role: "host",
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: 1_000_000,
		...overrides,
	};
}

function makeSala(overrides: Partial<SalaState> = {}): SalaState {
	return {
		code: "AB12",
		hostId: "p_1",
		players: [
			makePlayer(),
			makePlayer({
				id: "p_2",
				uuid: "00000000-0000-4000-8000-000000000001",
				nick: "Maya",
				role: "player",
				seatIndex: 1,
				joinedAt: 1_000_001,
			}),
		],
		phase: "idle",
		round: 1,
		timer: 60,
		votes: {},
		createdAt: 1_000_000,
		...overrides,
	};
}

function renderArena(entry = "/arena?code=AB12") {
	try {
		sessionStorage.setItem("pointly.nick", "Helder");
		sessionStorage.setItem("pointly.uuid", "00000000-0000-4000-8000-000000000000");
	} catch {
		// ignore
	}
	const router = createMemoryRouter(
		[
			{ path: "/arena", element: <Arena /> },
			{ path: "/join", element: <div data-testid="page-join" /> },
		],
		{ initialEntries: [entry] },
	);
	return render(
		<ThemeProvider>
			<RouterProvider router={router} />
		</ThemeProvider>,
	);
}

describe("Arena smoke", () => {
	test("renderiza shell com code + timer + assentos", () => {
		useSalaStore.getState().setSala(makeSala());
		useSalaStore.getState().setCurrentPlayerId("p_1");
		renderArena();
		expect(screen.getByTestId("page-arena")).not.toBeNull();
		expect(screen.getByTestId("arena-code").textContent).toContain("AB12");
		expect(screen.getByTestId("share-pill").textContent).toContain("AB12");
		expect(screen.getByTestId("timer-pill")).not.toBeNull();
		expect(screen.getByTestId("timer-value").textContent).toBe("60");
		expect(screen.getByTestId("seat-p_1")).not.toBeNull();
		expect(screen.getByTestId("seat-p_2")).not.toBeNull();
		expect(screen.getByTestId("theme-toggle")).not.toBeNull();
	});

	test("deck renderiza 9 cartas; reveal desabilitado com 0 votos", () => {
		useSalaStore.getState().setSala(makeSala());
		useSalaStore.getState().setCurrentPlayerId("p_1");
		const { container } = renderArena();
		const cards = container.querySelectorAll('[data-testid^="deck-card-"]');
		expect(cards.length).toBe(9);
		const reveal = screen.getByTestId("reveal-button") as HTMLButtonElement;
		expect(reveal.getAttribute("data-reveal-state")).toBe("awaiting");
		expect(reveal.disabled).toBe(true);
	});

	test("solo mostra empty-overlay; reveal libera após voto", () => {
		useSalaStore.getState().setSala(
			makeSala({
				players: [makePlayer()],
				phase: "voting",
			}),
		);
		useSalaStore.getState().setCurrentPlayerId("p_1");
		useSalaStore.getState().markVoted("p_1", true);
		renderArena();
		expect(screen.getByTestId("empty-overlay")).not.toBeNull();
		const reveal = screen.getByTestId("reveal-button") as HTMLButtonElement;
		expect(reveal.getAttribute("data-reveal-state")).toBe("ready");
		expect(reveal.disabled).toBe(false);
	});
});
