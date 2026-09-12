/**
 * RevealButton tests — T33 verify (≥3 of 5 minimum required).
 */
import { describe, expect, mock, test } from "bun:test";
import { RevealButton, deriveButtonState } from "./reveal-button";
import { fireEvent, render, screen } from "./ui/test-helpers";

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
	test("estado awaiting: 'Aguardando votos…' (sem contador) + disabled", () => {
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
		expect(screen.queryByTestId("reveal-button-hint")).not.toBeInTheDocument();
		expect(btn).not.toHaveAttribute("aria-describedby");
		expect(screen.getAllByText("Aguardando votos…")).toHaveLength(1);
	});

	test("estado awaiting: label de estado, não de ação (anti-botão-morto)", () => {
		render(
			<RevealButton
				phase="idle"
				votedCount={0}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		expect(screen.getByTestId("reveal-button")).toHaveTextContent(/Aguardando votos/i);
	});

	test("estado ready: 'Revelar votos.' enabled + bg-coral, sem hint duplicado", () => {
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
		expect(btn).toHaveTextContent(/Revelar votos/);
		// O andamento vive no centro da mesa — o botão não repete o dado.
		expect(screen.queryByTestId("reveal-button-hint")).not.toBeInTheDocument();
	});

	test("estado post-reveal: 'Nova rodada' ghost (bg-surface, sem coral)", () => {
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
		expect(btn.className).toContain("bg-surface");
		expect(btn.className).not.toContain("bg-coral");
		expect(btn).toHaveTextContent(/Nova rodada/i);
	});

	test("singular: estado de espera aparece somente no botão", () => {		render(
			<RevealButton
				phase="idle"
				votedCount={0}
				totalPlayers={1}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		expect(screen.queryByTestId("reveal-button-hint")).not.toBeInTheDocument();
		expect(screen.getAllByText("Aguardando votos…")).toHaveLength(1);
	});

	test("showShortcutHint + ready → kbd 'R' visível (desktop)", () => {
		render(
			<RevealButton
				phase="voting"
				votedCount={3}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
				showShortcutHint
			/>,
		);
		const btn = screen.getByTestId("reveal-button");
		expect(btn.textContent).toContain("R");
		expect(btn.querySelector("kbd")).toHaveTextContent("R");
	});

	test("showShortcutHint + post-reveal → kbd 'N' visível", () => {
		render(
			<RevealButton
				phase="revealed"
				votedCount={12}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
				showShortcutHint
			/>,
		);
		expect(
			screen.getByTestId("reveal-button").querySelector("kbd"),
		).toHaveTextContent("N");
	});

	test("sem showShortcutHint → nenhum kbd (mobile default)", () => {
		render(
			<RevealButton
				phase="voting"
				votedCount={3}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		expect(
			screen.getByTestId("reveal-button").querySelector("kbd"),
		).not.toBeInTheDocument();
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

	test("click em 'Nova rodada' (post-reveal) pede confirmação em 2 toques", () => {
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
		const btn = screen.getByTestId("reveal-button");
		// 1º toque arma, não executa
		fireEvent.click(btn);
		expect(onNewRound).not.toHaveBeenCalled();
		expect(btn.getAttribute("data-reveal-confirm")).toBe("true");
		expect(btn).toHaveTextContent(/Confirmar nova rodada/i);
		// 2º toque confirma
		fireEvent.click(btn);
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
		expect(
			screen.getByTestId("reveal-button").getAttribute("aria-label"),
		).toMatch(/aguardando/i);

		rerender(
			<RevealButton
				phase="voting"
				votedCount={3}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		expect(
			screen.getByTestId("reveal-button").getAttribute("aria-label"),
		).toMatch(/revelar votos agora/i);

		rerender(
			<RevealButton
				phase="revealed"
				votedCount={12}
				totalPlayers={12}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		expect(
			screen.getByTestId("reveal-button").getAttribute("aria-label"),
		).toMatch(/nova rodada/i);
	});
});
