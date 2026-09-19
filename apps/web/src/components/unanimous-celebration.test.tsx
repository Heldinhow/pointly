import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { PokerTable, type TablePlayer } from "./poker-table";

const seated: TablePlayer = {
	id: "p_ana",
	nick: "Ana",
	seatIndex: 0,
	hasVoted: true,
	value: "5",
	status: "connected",
};

afterEach(() => {
	cleanup();
});

describe("UnanimousCelebration (14.3)", () => {
	test("celebrateKey > 0 monta a camada decorativa com 14 peças", () => {
		render(<PokerTable seats={[seated]} revealed celebrateKey={1} />);

		const layer = screen.getByTestId("unanimous-celebration");
		expect(layer.getAttribute("aria-hidden")).toBe("true");
		expect(layer.querySelectorAll(".unanimous-confetti")).toHaveLength(14);
	});

	test("sem celebrateKey a camada não existe", () => {
		render(<PokerTable seats={[seated]} revealed />);
		expect(screen.queryByTestId("unanimous-celebration")).toBeNull();
	});

	test("incrementar o celebrateKey remonta a camada (replay)", () => {
		const { rerender } = render(
			<PokerTable seats={[seated]} revealed celebrateKey={1} />,
		);
		const first = screen.getByTestId("unanimous-celebration");

		rerender(<PokerTable seats={[seated]} revealed celebrateKey={2} />);
		expect(screen.getByTestId("unanimous-celebration")).not.toBe(first);
	});
});
