/**
 * landing.test — CTAs + navegação (spell-rebuild).
 */
import "../test-jsdom";

// jsdom sem pretendToBeVisual não tem rAF — @testing-library/react exige.
if (typeof globalThis.requestAnimationFrame === "undefined") {
	globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number =>
		setTimeout(() => cb(performance.now()), 16) as unknown as number;
	globalThis.cancelAnimationFrame = (id: number): void => {
		clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
	};
}
import { afterEach, describe, expect, test } from "bun:test";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/theme/theme";
import { Landing } from "./landing";

afterEach(() => {
	cleanup();
});

function LocationProbe() {
	const loc = useLocation();
	return (
		<div data-testid="location">
			{loc.pathname}
			{loc.search}
		</div>
	);
}

function renderLanding() {
	return render(
		<ThemeProvider>
			<MemoryRouter
				future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
				initialEntries={["/"]}
			>
				<Routes>
					<Route path="/" element={<Landing />} />
					<Route path="/join" element={<LocationProbe />} />
				</Routes>
			</MemoryRouter>
		</ThemeProvider>,
	);
}

describe("Landing", () => {
	test("renderiza página + headline", () => {
		renderLanding();
		expect(screen.getByTestId("page-landing")).toBeTruthy();
		const h1 = screen.getByRole("heading", { level: 1 });
		expect(h1.textContent ?? "").toMatch(/planning poker sem fricção/i);
	});

	test("renderiza os dois CTAs", () => {
		renderLanding();
		expect(screen.getByTestId("landing-create").textContent ?? "").toMatch(
			/criar uma sala/i,
		);
		expect(screen.getByTestId("landing-join").textContent ?? "").toMatch(
			/entrar com código/i,
		);
	});

	test("Criar uma sala → /join?host=1", async () => {
		renderLanding();
		fireEvent.click(screen.getByTestId("landing-create"));
		await waitFor(() => {
			expect(screen.getByTestId("location").textContent).toBe(
				"/join?host=1",
			);
		});
	});

	test("Entrar com código → /join", async () => {
		renderLanding();
		fireEvent.click(screen.getByTestId("landing-join"));
		await waitFor(() => {
			expect(screen.getByTestId("location").textContent).toBe("/join");
		});
	});

	test("explica a sequência sem badges de benefícios", () => {
		renderLanding();
		expect(screen.getByRole("list", { name: "Como funciona" }).textContent).toMatch(/Crie.*Vote.*Revele/);
		expect(screen.queryByRole("list", { name: "Destaques" })).toBeNull();
	});

	test("seleciona, troca o voto, revela quatro participantes e reinicia", () => {
		renderLanding();
		expect(screen.getByText(/mesa de exemplo.*escolha sua carta/i)).toBeTruthy();
		const reveal = screen.getByRole("button", { name: "Revelar votos" }) as HTMLButtonElement;
		expect(reveal.disabled).toBe(true);
		expect(screen.getAllByTestId("seat-state").map((seat) => seat.textContent)).toEqual(["Votou", "Votou", "Votou", "Aguardando"]);
		expect(screen.queryByTestId("stats-pill")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Votar 5" }));
		fireEvent.click(screen.getByRole("button", { name: "Votar 13" }));
		expect(screen.getByRole("button", { name: "Votar 5" }).getAttribute("aria-pressed")).toBe("false");
		expect(screen.getByRole("button", { name: "Votar 13" }).getAttribute("aria-pressed")).toBe("true");
		expect(screen.queryByTestId("seat-face-num")).toBeNull();
		expect(reveal.disabled).toBe(false);
		fireEvent.click(reveal);
		expect(screen.getAllByTestId("seat-face-num").map((seat) => seat.textContent)).toEqual(["3", "8", "5", "13"]);
		expect(screen.getByTestId("stats-result-value").textContent).toBe("6.5");
		expect(screen.getByTestId("stats-range-value").textContent).toBe("3–13");
		fireEvent.click(screen.getByRole("button", { name: "Experimentar novamente" }));
		expect(screen.queryByTestId("stats-pill")).toBeNull();
		expect((screen.getByRole("button", { name: "Revelar votos" }) as HTMLButtonElement).disabled).toBe(true);
		fireEvent.click(screen.getByRole("button", { name: "Votar 1" }));
		fireEvent.click(screen.getByRole("button", { name: "Revelar votos" }));
		expect(screen.getByTestId("stats-result-value").textContent).toBe("4");
		expect(screen.getByTestId("stats-range-value").textContent).toBe("1–8");
	});

	test("header com toggle de tema + Entrar", () => {
		renderLanding();
		expect(
			screen.getByRole("button", { name: /modo (claro|escuro)/i }),
		).toBeTruthy();
		expect(screen.getByRole("link", { name: /^entrar$/i })).toBeTruthy();
	});
});
