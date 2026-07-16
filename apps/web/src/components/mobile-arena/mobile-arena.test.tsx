/**
 * MobileArena components — smoke tests.
 *
 * Cobre o branch mobile do Arena:
 *  - MobileSeatRow renderiza avatar, nick e state badge por estado do player
 *  - MobilePlayerList renderiza header + lista de rows
 *  - MobileRevealDock renderiza Deck + RevealButton inline, ancorado
 *    sticky-bottom (a classe CSS é só conferida por testid)
 */
import { describe, expect, test } from "bun:test";
import { render, screen } from "../ui/test-helpers";
import { MobilePlayerList } from "./MobilePlayerList";
import { MobileRevealDock } from "./MobileRevealDock";
import { MobileSeatRow } from "./MobileSeatRow";
import type { Player } from "@planning-poker/shared";

function makePlayer(id: string, nick: string, overrides: Partial<Player> = {}): Player {
	return {
		id,
		uuid: `00000000-0000-4000-8000-${id.padStart(12, "0")}`,
		nick,
		role: "player",
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: Date.now(),
		...overrides,
	};
}

describe("MobileSeatRow", () => {
	test("render avatar initials + nick + idle state", () => {
		render(
			<ul>
				<MobileSeatRow
					player={makePlayer("p1", "Helder")}
					isYou={false}
					faceUp={false}
					votedMedian={false}
					unanimous={false}
				/>
			</ul>,
		);
		expect(screen.getByTestId("mobile-seat-p1")).toBeInTheDocument();
		expect(screen.getByText("Helder")).toBeInTheDocument();
		// Avatar das 2 primeiras letras do nick (apenas "H" pra "Helder")
		expect(screen.getByTestId("mobile-seat-avatar")).toHaveTextContent("H");
		expect(screen.getByTestId("mobile-seat-state")).toHaveTextContent("AGUARDANDO");
	});

	test("VOCÊ → border-left coral + voted badge (votedMedian=false)", () => {
		render(
			<ul>
				<MobileSeatRow
					player={makePlayer("p1", "Me")}
					isYou={true}
					faceUp={false}
					votedMedian={false}
					unanimous={false}
				/>
			</ul>,
		);
		const row = screen.getByTestId("mobile-seat-p1");
		expect(row).toHaveAttribute("data-seat-is-you", "true");
		expect(row.className).toContain("border-l-coral");
	});

	test("votedMedian → border-left mustard + box-shadow gold inset (unanimous=false)", () => {
		render(
			<ul>
				<MobileSeatRow
					player={makePlayer("p1", "Voter", {
						hasVoted: true,
					})}
					isYou={false}
					faceUp={false}
					votedMedian={true}
					unanimous={false}
				/>
			</ul>,
		);
		const row = screen.getByTestId("mobile-seat-p1");
		expect(row.className).toContain("border-l-mustard");
	});

	test("face-up + value → face-num italic, não state pill", () => {
		render(
			<ul>
				<MobileSeatRow
					player={makePlayer("p1", "Voter", {
						hasVoted: true,
						value: "5",
					})}
					isYou={false}
					faceUp={true}
					votedMedian={false}
					unanimous={false}
				/>
			</ul>,
		);
		expect(screen.getByTestId("mobile-seat-face-num")).toHaveTextContent("5");
		expect(screen.queryByTestId("mobile-seat-state")).not.toBeInTheDocument();
	});

	test("disconnected → opacity reduzido + label DESCONECTADO", () => {
		render(
			<ul>
				<MobileSeatRow
					player={makePlayer("p1", "Ghost", { status: "disconnected" })}
					isYou={false}
					faceUp={false}
					votedMedian={false}
					unanimous={false}
				/>
			</ul>,
		);
		expect(screen.getByTestId("mobile-seat-state")).toHaveTextContent(
			/DESCONECTADO/i,
		);
		expect(screen.getByTestId("mobile-seat-p1").className).toContain("opacity-50");
	});

	test("host star ★ presente quando role=host", () => {
		render(
			<ul>
				<MobileSeatRow
					player={makePlayer("p1", "Host", { role: "host" })}
					isYou={false}
					faceUp={false}
					votedMedian={false}
					unanimous={false}
				/>
			</ul>,
		);
		expect(screen.getByLabelText("Host")).toHaveTextContent("★");
	});
});

describe("MobilePlayerList", () => {
	test("renderiza lista vazia com hint (players=[])", () => {
		render(
			<MobilePlayerList
				players={[]}
				currentPlayerId={null}
				faceUp={false}
				median={null}
			/>,
		);
		expect(screen.getByTestId("mobile-player-list")).toBeInTheDocument();
		expect(screen.getByTestId("mobile-player-count")).toHaveTextContent("0/0");
		expect(screen.getByText(/aguardando jogadores/i)).toBeInTheDocument();
	});

	test("renderiza rows + contador voted/total", () => {
		render(
			<MobilePlayerList
				players={[
					makePlayer("p1", "Helder", { hasVoted: true }),
					makePlayer("p2", "Luna", { hasVoted: false }),
				]}
				currentPlayerId="p1"
				faceUp={false}
				median={null}
			/>,
		);
		expect(screen.getByTestId("mobile-seat-p1")).toBeInTheDocument();
		expect(screen.getByTestId("mobile-seat-p2")).toBeInTheDocument();
		expect(screen.getByTestId("mobile-player-count")).toHaveTextContent("1/2");
	});

	test("faceUp + median → header mostra mediana em gold", () => {
		render(
			<MobilePlayerList
				players={[makePlayer("p1", "Helder", { hasVoted: true, value: "5" })]}
				currentPlayerId="p1"
				faceUp={true}
				median={5}
			/>,
		);
		expect(screen.getByTestId("mobile-player-median")).toHaveTextContent(/5/);
	});

	test("header inclui TimerPill + não mostra Round duplicado", () => {
		render(
			<MobilePlayerList
				players={[
					makePlayer("p1", "Helder", { hasVoted: true }),
				]}
				currentPlayerId="p1"
				faceUp={false}
				median={null}
			/>,
		);
		// TimerPill renderiza com testid "timer-pill" + "timer-round"
		expect(screen.getByTestId("timer-pill")).toBeInTheDocument();
		expect(screen.getByTestId("timer-round")).toHaveTextContent(/ROUND/);
		// Sem span "round" solto no header (era duplicação antes do fix).
		// Garantimos via ausência do contador "Round NN" inline no header.
		const header = screen.getByTestId("mobile-player-list").querySelector(
			"header",
		);
		expect(header).toBeTruthy();
		expect(header?.textContent).not.toMatch(/\bRound\b\s+\d/);
	});

	test("header sem bg-paper-warm (regressão listra clara em dark)", () => {
		render(
			<MobilePlayerList
				players={[
					makePlayer("p1", "Helder", { hasVoted: true }),
				]}
				currentPlayerId="p1"
				faceUp={false}
				median={null}
			/>,
		);
		// FIX 2026-07-16: bg-paper-warm no header criava listra mais clara
		// no dark mode (sanduíche #13120d → #1a1914). Header agora é bg-bg
		// (= page bg), herdando a surface unificada.
		const header = screen.getByTestId("mobile-player-header");
		expect(header.className).not.toContain("bg-paper-warm");
		expect(header.className).not.toContain("bg-paper-dark");
		expect(header.className).not.toContain("bg-surface");
		// border-b preservado pra definir o limite sem peso cromático.
		expect(header.className).toContain("border-b");
	});

	test("voted > 0 → dot do contador fica olive", () => {
		render(
			<MobilePlayerList
				players={[
					makePlayer("p1", "Helder", { hasVoted: true }),
					makePlayer("p2", "Luna", { hasVoted: true }),
					makePlayer("p3", "Rui", { hasVoted: false }),
				]}
				currentPlayerId="p1"
				faceUp={false}
				median={null}
			/>,
		);
		// Localiza o status dot — primeiro span com rounded-full no header
		const header = screen.getByTestId("mobile-player-header");
		const dot = header.querySelector("span.rounded-full");
		expect(dot?.className).toContain("bg-olive");
	});

	test("voted = 0 → dot do contador fica ink-faint (sala vazia)", () => {
		render(
			<MobilePlayerList
				players={[]}
				currentPlayerId={null}
				faceUp={false}
				median={null}
			/>,
		);
		const header = screen.getByTestId("mobile-player-header");
		const dot = header.querySelector("span.rounded-full");
		expect(dot?.className).toContain("bg-ink-faint");
	});

	test("row sem bg-surface (regressão listas brancas empilhadas no dark)", () => {
		render(
			<ul>
				<MobileSeatRow
					player={makePlayer("p1", "Helder", { hasVoted: true })}
					isYou={false}
					faceUp={false}
					votedMedian={false}
					unanimous={false}
				/>
			</ul>,
		);
		// FIX 2026-07-16: MobileSeatRow tinha `bg-surface` em cada linha,
		// criando 8-12 "listas brancas" no dark mode. Agora a row herda
		// o page bg (bg-bg) — só avatars (bg-paper-dark) + state badge
		// (bg-paper) têm surface própria, ambos pequenos.
		const row = screen.getByTestId("mobile-seat-p1");
		expect(row.className).not.toContain("bg-surface");
		expect(row.className).not.toContain("bg-paper-warm");
		// Mantém min-h-44 para tap target WCAG.
		expect(row.className).toContain("min-h-[56px]");
	});
});

describe("MobileRevealDock", () => {
	test("renderiza Deck + RevealButton modo=inline", () => {
		render(
			<MobileRevealDock
				phase="voting"
				myVote={null}
				disabled={false}
				votedCount={1}
				totalPlayers={2}
				onSelect={() => {}}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		expect(screen.getByTestId("mobile-reveal-dock")).toBeInTheDocument();
		expect(screen.getByTestId("deck")).toBeInTheDocument();
		// RevealButton modo=inline (não usa translate centering)
		const btn = screen.getByTestId("reveal-button");
		expect(btn.getAttribute("data-reveal-mode")).toBe("inline");
		expect(btn.className).toContain("w-full");
		expect(btn.className).not.toContain("translate-x-1/2");
	});

	test("sticky bottom + safe-area-inset-bottom no padding", () => {
		render(
			<MobileRevealDock
				phase="voting"
				myVote={null}
				disabled={false}
				votedCount={0}
				totalPlayers={1}
				onSelect={() => {}}
				onReveal={() => {}}
				onNewRound={() => {}}
			/>,
		);
		const dock = screen.getByTestId("mobile-reveal-dock");
		expect(dock.className).toContain("sticky");
		expect(dock.className).toContain("bottom-0");
		expect(dock.className).toContain("env(safe-area-inset-bottom)");
	});
});
