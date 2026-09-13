import "../test-jsdom";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/theme/theme";
import { Landing } from "./landing";

afterEach(cleanup);

function LocationProbe() {
	const location = useLocation();
	return <div data-testid="location">{location.pathname}{location.search}</div>;
}

function renderLanding() {
	return render(
		<ThemeProvider>
			<MemoryRouter initialEntries={["/"]}>
				<Routes>
					<Route path="/" element={<Landing />} />
					<Route path="/join" element={<LocationProbe />} />
				</Routes>
			</MemoryRouter>
		</ThemeProvider>,
	);
}

describe("Landing", () => {
	test("mostra a headline da landing", () => {
		renderLanding();

		expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
			"Estimar é ouvir antes de concordar.",
		);
	});

	test("inclui a mesa demonstrativa", () => {
		renderLanding();

		expect(
			screen.getByRole("group", { name: "Exemplo de rodada de Planning Poker" }),
		).toBeTruthy();
		expect(screen.getByText("4/4 votos revelados")).toBeTruthy();
	});

	test("mostra os CTAs da sala", () => {
		renderLanding();

		expect(screen.getByTestId("landing-create").textContent).toBe("Criar uma sala");
		expect(screen.getByTestId("landing-join").textContent).toBe("Entrar com código");
	});

	test("leva a criação de sala para /join?host=1", async () => {
		renderLanding();
		fireEvent.click(screen.getByTestId("landing-create"));

		await waitFor(() =>
			expect(screen.getByTestId("location").textContent).toBe("/join?host=1"),
		);
	});

	test("leva a entrada com código para /join", async () => {
		renderLanding();
		fireEvent.click(screen.getByTestId("landing-join"));

		await waitFor(() =>
			expect(screen.getByTestId("location").textContent).toBe("/join"),
		);
	});

	test("mantém o link Entrar para /join", () => {
		renderLanding();

		expect(screen.getByRole("link", { name: "Entrar" }).getAttribute("href")).toBe(
			"/join",
		);
	});

	test("alterna o tema pelo controle do cabeçalho", () => {
		renderLanding();
		const toggle = screen.getByRole("button", { name: /Ativar modo (claro|escuro)/ });
		const initialLabel = toggle.getAttribute("aria-label");

		fireEvent.click(toggle);

		expect(
			screen.getByRole("button", { name: /Ativar modo (claro|escuro)/ }).getAttribute("aria-label"),
		).not.toBe(initialLabel);
	});
});
