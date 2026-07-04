/**
 * Seat tests — T31 verify (≥3 of 5 minimum required).
 */
import { describe, expect, test } from "bun:test";
import type { Player } from "@planning-poker/shared";
import { render, screen } from "./ui/test-helpers";
import { Seat } from "./seat";

function makePlayer(overrides: Partial<Player> = {}): Player {
	return {
		id: "p_abc",
		uuid: "00000000-0000-4000-8000-000000000000",
		nick: "Helder",
		role: "player",
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected",
		joinedAt: 1_000_000,
		...overrides,
	};
}

describe("Seat — T31", () => {
	test("renderiza nick + state IDLE por default", () => {
		const p = makePlayer({ nick: "Maya" });
		render(<Seat player={p} isYou={false} faceUp={false} votedMedian={false} unanimous={false} />);
		expect(screen.getByTestId("seat-nick")).toHaveTextContent("Maya");
		expect(screen.getByTestId("seat-state")).toHaveTextContent("IDLE");
	});

	test("VOCÊ renderiza badge 'Você' quando isYou=true", () => {
		const p = makePlayer();
		render(<Seat player={p} isYou={true} faceUp={false} votedMedian={false} unanimous={false} />);
		expect(screen.getByTestId("seat-voc-badge")).toBeInTheDocument();
		expect(screen.getByTestId("seat-voc-badge")).toHaveTextContent("Você");
	});

	test("NÃO renderiza badge VOCÊ quando isYou=false", () => {
		const p = makePlayer();
		render(<Seat player={p} isYou={false} faceUp={false} votedMedian={false} unanimous={false} />);
		expect(screen.queryByTestId("seat-voc-badge")).not.toBeInTheDocument();
	});

	test("state VOTED quando hasVoted=true", () => {
		const p = makePlayer({ hasVoted: true });
		render(<Seat player={p} isYou={false} faceUp={false} votedMedian={false} unanimous={false} />);
		expect(screen.getByTestId("seat-state")).toHaveTextContent("VOTED");
	});

	test("face-up mostra valor em numeral Playfair Italic + state vira 'revealed'", () => {
		const p = makePlayer({ hasVoted: true, value: "5" });
		render(<Seat player={p} isYou={false} faceUp={true} votedMedian={false} unanimous={false} />);
		expect(screen.getByTestId("seat-face-num")).toHaveTextContent("5");
		expect(screen.getByTestId("seat-face-num")).toHaveAttribute("aria-label", "Voto: 5");
		expect(screen.queryByTestId("seat-state")).not.toBeInTheDocument();
	});

	test("avatar mostra inicial do nick", () => {
		const p = makePlayer({ nick: "Maya" });
		render(<Seat player={p} isYou={false} faceUp={false} votedMedian={false} unanimous={false} />);
		const avatar = screen.getByTestId("seat-avatar");
		expect(avatar).toHaveTextContent("M");
	});

	test("avatar mostra 2 iniciais se nick tem espaço", () => {
		const p = makePlayer({ nick: "Li Anderson" });
		render(<Seat player={p} isYou={false} faceUp={false} votedMedian={false} unanimous={false} />);
		expect(screen.getByTestId("seat-avatar")).toHaveTextContent("LA");
	});

	test("seat com role='host' tem isHost=true (passa pro primitive)", () => {
		const p = makePlayer({ role: "host", nick: "Host Player" });
		render(<Seat player={p} isYou={false} faceUp={false} votedMedian={false} unanimous={false} />);
		// O primitive aplica aria-label='Host' quando isHost; verificamos
		// via data-seat-role que role=host foi propagado.
		const seat = screen.getByTestId(`seat-${p.id}`);
		expect(seat.getAttribute("data-seat-role")).toBe("host");
	});

	test("votedMedian=true && !unanimous aplica median (verifica data-seat-state)", () => {
		const p = makePlayer({ hasVoted: true, value: "5" });
		const { container } = render(
			<Seat player={p} isYou={false} faceUp={true} votedMedian={true} unanimous={false} />,
		);
		// SeatPrimitive aplica border-mustard border-2 nesse caso
		const primitive = container.querySelector('[data-seat-state="revealed"]');
		expect(primitive?.className).toContain("border-mustard");
	});

	test("votedMedian=true && unanimous=true NÃO aplica median (F-023 regra)", () => {
		const p = makePlayer({ hasVoted: true, value: "5" });
		const { container } = render(
			<Seat player={p} isYou={false} faceUp={true} votedMedian={true} unanimous={true} />,
		);
		const primitive = container.querySelector('[data-seat-state="revealed"]');
		expect(primitive?.className).not.toContain("border-mustard");
	});

	test("status=disconnected mostra state 'disconnected' (F-050)", () => {
		const p = makePlayer({ status: "disconnected" });
		const { container } = render(
			<Seat player={p} isYou={false} faceUp={false} votedMedian={false} unanimous={false} />,
		);
		expect(screen.getByTestId("seat-state")).toHaveTextContent("DISCONNECTED");
		const primitive = container.querySelector('[data-seat-state="disconnected"]');
		expect(primitive?.className).toContain("opacity-40");
	});
});