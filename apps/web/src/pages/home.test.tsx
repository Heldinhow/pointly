import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./home";

afterEach(() => {
	cleanup();
});

function renderHome(): void {
	render(
		<MemoryRouter>
			<HomePage />
		</MemoryRouter>,
	);
}

describe("HomePage (ticket 10 — Inicial com demonstração)", () => {
	test("proposta de valor e CTAs visíveis no topo sem rolagem", () => {
		renderHome();

		expect(screen.getByTestId("home-hero")).toBeTruthy();
		expect(screen.getByTestId("home-hero").textContent).toMatch(
			/Planning poker sem cadastro/,
		);
		const create = screen.getByTestId("home-cta-create");
		const join = screen.getByTestId("home-cta-join");
		expect(create.closest("a")?.getAttribute("href")).toBe("/join");
		expect(join.closest("a")?.getAttribute("href")).toBe("/join?mode=join");
		// Hero vem antes da demo na ordem do documento (acima da dobra).
		const hero = screen.getByTestId("home-hero");
		const demo = screen.getByTestId("demo");
		expect(
			hero.compareDocumentPosition(demo) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	test("hero é só copy, sem visual nem rodada de exemplo", () => {
		renderHome();

		expect(screen.getByTestId("home-hero")).toBeTruthy();
		expect(screen.queryByTestId("hero-round")).toBeNull();
		expect(screen.queryByTestId("home-hero-visual")).toBeNull();
	});

	test("estado inicial: deck presente, reveal bloqueado, sem stats", () => {
		renderHome();

		expect(screen.getByTestId("deck")).toBeTruthy();
		expect(screen.getByTestId("demo-selection").textContent).toMatch(
			/Escolha uma carta/,
		);
		const reveal = screen.getByTestId(
			"demo-reveal",
		) as HTMLButtonElement;
		expect(reveal.disabled).toBe(true);
		expect(screen.queryByTestId("stats-pill")).toBeNull();
		expect(screen.queryByTestId("demo-votes")).toBeNull();
		expect(screen.queryByTestId("demo-retry")).toBeNull();
	});

	test("demo completa sem socket: escolher, revelar e ver stats", () => {
		const RealWebSocket = globalThis.WebSocket;
		// Sem conexão de socket: a demo não pode nem tocar em WebSocket.
		// @ts-expect-error — remove de propósito para provar independência.
		globalThis.WebSocket = undefined;
		try {
			renderHome();

			fireEvent.click(screen.getByTestId("deck-card-5"));
			expect(screen.getByTestId("demo-selection").textContent).toMatch(
				/Seu voto: 5/,
			);

			const reveal = screen.getByTestId(
				"demo-reveal",
			) as HTMLButtonElement;
			expect(reveal.disabled).toBe(false);
			fireEvent.click(reveal);

			// Votos simulados revelados junto com o do visitante.
			expect(screen.getByTestId("demo-votes")).toBeTruthy();
			expect(screen.getByTestId("demo-vote-voce").textContent).toMatch(
				/Você 5/,
			);
			expect(screen.getByTestId("demo-vote-bia").textContent).toMatch(
				/Bia 5/,
			);
			expect(screen.getByTestId("demo-vote-caio").textContent).toMatch(
				/Caio 8/,
			);
			expect(screen.getByTestId("demo-vote-dani").textContent).toMatch(
				/Dani 5/,
			);

			// [5, 5, 8, 5]: média 5,75 → "5.8", mediana 5, intervalo 5–8.
			expect(screen.getByTestId("stats-pill")).toBeTruthy();
			expect(screen.getByTestId("stats-result-value").textContent).toBe(
				"5",
			);
			expect(screen.getByTestId("stats-mean-value").textContent).toBe(
				"5.8",
			);
			expect(screen.getByTestId("stats-range-value").textContent).toBe(
				"5–8",
			);
			expect(screen.getByTestId("stats-pip-5").textContent).toBe("3×5");
			expect(screen.getByTestId("stats-pip-8").textContent).toBe("1×8");
			expect(screen.getByTestId("demo-create").closest("a")?.getAttribute("href")).toBe("/join");
		} finally {
			globalThis.WebSocket = RealWebSocket;
		}
	});

	test("duplo clique na mesma carta mantém o voto", () => {
		renderHome();

		fireEvent.click(screen.getByTestId("deck-card-8"));
		fireEvent.click(screen.getByTestId("deck-card-8"));
		expect(screen.getByTestId("demo-selection").textContent).toMatch(
			/Seu voto: 8/,
		);
		expect(
			screen.getByTestId("deck-card-8").getAttribute("aria-pressed"),
		).toBe("true");

		fireEvent.click(screen.getByTestId("demo-reveal"));
		expect(screen.getByTestId("demo-vote-voce").textContent).toMatch(
			/Você 8/,
		);
	});

	test("pausa conta presença mas fica fora dos cálculos", () => {
		renderHome();

		fireEvent.click(screen.getByTestId("deck-card-☕"));
		expect(screen.getByTestId("demo-selection").textContent).toMatch(
			/pausa para café/i,
		);
		fireEvent.click(screen.getByTestId("demo-reveal"));

		// Só os simulados [5, 8, 5] contam: média 6,0, mediana 5, 5–8.
		expect(screen.getByTestId("stats-result-value").textContent).toBe(
			"5",
		);
		expect(screen.getByTestId("stats-mean-value").textContent).toBe(
			"6.0",
		);
		expect(screen.getByTestId("stats-range-value").textContent).toBe(
			"5–8",
		);
		expect(screen.getByTestId("stats-pip-☕").textContent).toBe("1×☕");
	});

	test("trocar a carta após o reveal recalcula ao vivo", () => {
		renderHome();

		fireEvent.click(screen.getByTestId("deck-card-5"));
		fireEvent.click(screen.getByTestId("demo-reveal"));
		expect(screen.getByTestId("stats-mean-value").textContent).toBe(
			"5.8",
		);

		fireEvent.click(screen.getByTestId("deck-card-13"));
		// [13, 5, 8, 5]: média 7,75 → "7.8", mediana 6,5, intervalo 5–13.
		expect(screen.getByTestId("demo-vote-voce").textContent).toMatch(
			/Você 13/,
		);
		expect(screen.getByTestId("stats-mean-value").textContent).toBe(
			"7.8",
		);
		expect(screen.getByTestId("stats-result-value").textContent).toBe(
			"6.5",
		);
		expect(screen.getByTestId("stats-range-value").textContent).toBe(
			"5–13",
		);
	});

	test("tentar de novo reseta estimativa, simulados e stats", () => {
		renderHome();

		fireEvent.click(screen.getByTestId("deck-card-3"));
		fireEvent.click(screen.getByTestId("demo-reveal"));
		expect(screen.getByTestId("stats-pill")).toBeTruthy();

		fireEvent.click(screen.getByTestId("demo-retry"));

		expect(screen.queryByTestId("stats-pill")).toBeNull();
		expect(screen.queryByTestId("demo-votes")).toBeNull();
		expect(screen.queryByTestId("demo-retry")).toBeNull();
		expect(screen.getByTestId("demo-selection").textContent).toMatch(
			/Escolha uma carta/,
		);
		expect(
			screen.getByTestId("deck-card-3").getAttribute("aria-pressed"),
		).toBe("false");
		const reveal = screen.getByTestId(
			"demo-reveal",
		) as HTMLButtonElement;
		expect(reveal.disabled).toBe(true);
		expect(screen.getByTestId("demo-reveal-hint").textContent).toMatch(
			/Escolha sua estimativa/,
		);
	});
});
