/**
 * Card primitive tests — T26 verify (1 of 5 minimum).
 */
import { describe, expect, test } from "bun:test";
import { Card, CardBody, CardFooter, CardHeader } from "./card";
import { render, screen } from "./test-helpers";

function getCardRoot(): HTMLElement {
	return screen.getByTestId("card-root");
}

describe("Card", () => {
	test("renderiza Card com children e classe surface-noise", () => {
		render(<Card>Conteúdo do card</Card>);
		const card = getCardRoot();
		expect(card).toBeInTheDocument();
		expect(card?.className).toContain("surface-noise");
		expect(card?.className).toContain("bg-surface");
		expect(card?.className).toContain("rounded-card");
	});

	test("padding sm aplica p-4", () => {
		render(<Card padding="sm">sm</Card>);
		expect(getCardRoot().className).toContain("p-4");
	});

	test("padding lg aplica p-10", () => {
		render(<Card padding="lg">lg</Card>);
		expect(getCardRoot().className).toContain("p-10");
	});

	test("CardHeader + CardBody + CardFooter compoem estrutura semântica", () => {
		render(
			<Card>
				<CardHeader>
					<h2>Título</h2>
				</CardHeader>
				<CardBody>Body</CardBody>
				<CardFooter>Footer</CardFooter>
			</Card>,
		);
		expect(screen.getByRole("heading", { name: "Título" })).toBeInTheDocument();
		expect(screen.getByText("Body")).toBeInTheDocument();
		expect(screen.getByText("Footer")).toBeInTheDocument();
	});

	test("noNoise desabilita surface-noise", () => {
		render(<Card noNoise>X</Card>);
		expect(getCardRoot().className).not.toContain("surface-noise");
	});
});
