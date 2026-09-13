import "@/test-jsdom";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { LandingTablePreview } from "./landing-table-preview";

afterEach(cleanup);

describe("LandingTablePreview", () => {
	test("identifica a mesa como exemplo de uma rodada de Planning Poker", () => {
		render(<LandingTablePreview />);

		expect(
			screen.getByRole("group", {
				name: "Exemplo de rodada de Planning Poker",
			}),
		).toBeTruthy();
	});

	test("mostra os quatro participantes e uma carta revelada para cada um", () => {
		render(<LandingTablePreview />);

		for (const participant of ["Marina", "Rafa", "Você", "Bia"]) {
			expect(screen.getByText(participant)).toBeTruthy();
		}
		expect(screen.getAllByLabelText("Carta revelada")).toHaveLength(4);
	});

	test("mostra o código, a rodada e todos os votos revelados", () => {
		render(<LandingTablePreview />);

		expect(screen.getByText(/4K7M/)).toBeTruthy();
		expect(screen.getByText("Rodada 03")).toBeTruthy();
		expect(screen.getByText("4/4 votos revelados")).toBeTruthy();
	});
});
