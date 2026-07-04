/**
 * RevealButton tests — T33 verify (≥3 of 5 minimum required).
 */
import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "./ui/test-helpers";
import { RevealButton, deriveButtonState } from "./reveal-button";

describe("RevealButton — deriveButtonState (pure)", () => {
	test("phase=idle + 0 votos → awaiting", () => {
		expect(deriveButtonState("idle", 0)).toBe("awaiting");
	});

	test("phase=voting + 0 votos → awaiting", () => {
		expect(deriveButtonState("voting", 0)).toBe("awaiting");
	});

	test("phase=voting + 1 voto → ready", () => {
		expect(deriveButtonState("voting", 1)).toBe("ready");
	});

	test("phase=revealable + 12 votos → ready", () => {
		expect(deriveButtonState("revealable", 12)).toBe("ready");
	});

	test("phase=revealed → post-reveal (independente de votedCount)", () => {
		expect(deriveButtonState("revealed", 0)).toBe("post-reveal");
		expect(deriveButtonState("revealed", 12)).toBe("post-reveal");
	});
});

describe("RevealButton — render", () => {
	test("estado awaiting: 'Aguardando N jogadores…' + disabled", () => {
		render(
			<RevealButton
				phase="idle"
				votedCount={0}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		const btn = screen.getByTestId("reveal-button");
		expect(btn.getAttribute("data-reveal-state")).toBe("awaiting");
		expect(btn).toBeDisabled();
		expect(btn).toHaveTextContent(/Aguardando 12 jogadores/i);
	});

	test("estado ready: 'Revelar votos.' enabled + bg-coral", () => {
		render(
			<RevealButton
				phase="voting"
				votedCount={3}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		const btn = screen.getByTestId("reveal-button");
		expect(btn.getAttribute("data-reveal-state")).toBe("ready");
		expect(btn).toBeEnabled();
		expect(btn.className).toContain("bg-coral");
		expect(btn).toHaveTextContent(/Revelar votos\./);
	});

	test("estado post-reveal: 'Nova rodada' enabled + bg-paper", () => {
		render(
			<RevealButton
				phase="revealed"
				votedCount={12}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		const btn = screen.getByTestId("reveal-button");
		expect(btn.getAttribute("data-reveal-state")).toBe("post-reveal");
		expect(btn).toBeEnabled();
		expect(btn.className).toContain("bg-paper");
		expect(btn).toHaveTextContent(/Nova rodada/i);
	});

	test("singular vs plural no hint: 1 jogador", () => {
		render(
			<RevealButton
				phase="idle"
				votedCount={0}
				totalPlayers={1}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		expect(screen.getByTestId("reveal-button")).toHaveTextContent(
			/Aguardando 1 jogador…/i,
		);
	});
});

describe("RevealButton — interactions", () => {
	test("click em 'Revelar votos' (ready) chama onReveal", () => {
		const onReveal = mock(() => {});
		const onNewRound = mock(() => {});
		render(
			<RevealButton
				phase="voting"
				votedCount={3}
				totalPlayers={12}
				onReveal={onReveal}
				onNewRound={onNewRound}
			/>,
		);
		fireEvent.click(screen.getByTestId("reveal-button"));
		expect(onReveal).toHaveBeenCalledTimes(1);
		expect(onNewRound).not.toHaveBeenCalled();
	});

	test("click em 'Nova rodada' (post-reveal) chama onNewRound", () => {
		const onReveal = mock(() => {});
		const onNewRound = mock(() => {});
		render(
			<RevealButton
				phase="revealed"
				votedCount={12}
				totalPlayers={12}
				onReveal={onReveal}
				onNewRound={onNewRound}
			/>,
		);
		fireEvent.click(screen.getByTestId("reveal-button"));
		expect(onNewRound).toHaveBeenCalledTimes(1);
		expect(onReveal).not.toHaveBeenCalled();
	});

	test("aria-label contextual ao estado (a11y)", () => {
		const { rerender } = render(
			<RevealButton
				phase="idle"
				votedCount={0}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		expect(screen.getByTestId("reveal-button").getAttribute("aria-label")).toMatch(
			/aguardando/i,
		);

		rerender(
			<RevealButton
				phase="voting"
				votedCount={3}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		expect(screen.getByTestId("reveal-button").getAttribute("aria-label")).toMatch(
			/revelar votos agora/i,
		);

		rerender(
			<RevealButton
				phase="revealed"
				votedCount={12}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		expect(screen.getByTestId("reveal-button").getAttribute("aria-label")).toMatch(
			/nova rodada/i,
		);
	});
});