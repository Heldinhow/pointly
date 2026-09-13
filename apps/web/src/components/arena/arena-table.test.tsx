/**
 * arena-table.test — geometria + contrato de testids da mesa.
 */
import "../../test-jsdom";
import { describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach } from "bun:test";
import type { Player } from "@planning-poker/shared";
import { ArenaTable, seatPosition } from "./arena-table";

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

const players: Player[] = [
	makePlayer(),
	makePlayer({
		id: "p_2",
		uuid: "00000000-0000-4000-8000-000000000001",
		nick: "Maya",
		role: "player",
		seatIndex: 1,
		joinedAt: 1_000_001,
	}),
	makePlayer({
		id: "p_3",
		uuid: "00000000-0000-4000-8000-000000000002",
		nick: "Luna",
		role: "player",
		seatIndex: 2,
		joinedAt: 1_000_002,
	}),
];

afterEach(cleanup);

describe("seatPosition", () => {
	test("índice 0 cai embaixo (top ~90%, left 50%)", () => {
		const pos = seatPosition(0, 4);
		expect(pos.left).toBe("50.00%");
		expect(pos.top).toBe("90.00%");
	});

	test("distribui uniformemente na elipse", () => {
		expect(seatPosition(2, 4).top).toBe("10.00%");
		expect(seatPosition(1, 4).left).toBe("10.00%");
	});
});

describe("ArenaTable", () => {
	test("renderiza um assento por player + centro, testids únicos", () => {
		render(
			<ArenaTable
				players={players}
				currentPlayerId="p_1"
				faceUp={false}
				onThrow={() => {}}
				center={<p>Centro da mesa</p>}
			/>,
		);
		expect(screen.getByTestId("arena-table")).not.toBeNull();
		expect(screen.getByTestId("seat-p_1")).not.toBeNull();
		expect(screen.getByTestId("seat-p_2")).not.toBeNull();
		expect(screen.getByTestId("seat-p_3")).not.toBeNull();
		expect(screen.getAllByTestId("seat-nick")).toHaveLength(3);
		expect(screen.getByText("Centro da mesa")).not.toBeNull();
	});

	test("self senta embaixo", () => {
		const { getByTestId } = render(
			<ArenaTable
				players={players}
				currentPlayerId="p_2"
				faceUp={false}
				onThrow={() => {}}
				center={null}
			/>,
		);
		const seat = getByTestId("seat-p_2").parentElement as HTMLElement;
		// CSSOM normaliza "90.00%" → "90%"
		expect(seat.style.top).toBe("90%");
		expect(seat.style.left).toBe("50%");
	});

	test("face-up mostra o valor no assento", () => {
		render(
			<ArenaTable
				players={[makePlayer({ hasVoted: true, value: "5" })]}
				currentPlayerId="p_1"
				faceUp
				onThrow={() => {}}
				center={null}
			/>,
		);
		expect(screen.getByTestId("seat-face-num").textContent).toBe("5");
	});
});
