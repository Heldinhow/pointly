import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RoundDemo } from "./round-demo";

afterEach(() => {
	cleanup();
});

function renderDemo(lang?: "pt-BR" | "en"): void {
	render(
		<MemoryRouter>
			<RoundDemo lang={lang ?? "pt-BR"} />
		</MemoryRouter>,
	);
}

describe("RoundDemo (rodada local reutilizável, sem backend)", () => {
	test("seleção, voto oculto, reveal, stats e reset sem WebSocket", () => {
		const RealWebSocket = globalThis.WebSocket;
		// @ts-expect-error — remove de propósito para provar independência.
		globalThis.WebSocket = undefined;
		try {
			renderDemo();

			// Estado inicial: reveal bloqueado, sem stats.
			const reveal = screen.getByTestId("demo-reveal") as HTMLButtonElement;
			expect(reveal.disabled).toBe(true);
			expect(screen.queryByTestId("stats-pill")).toBeNull();

			// Voto oculto antes do reveal; reveal libera com o voto na mesa.
			fireEvent.click(screen.getByTestId("deck-card-5"));
			expect(screen.getByTestId("demo-selection").textContent).toMatch(
				/Seu voto: 5/,
			);
			expect(
				screen.getByTestId("deck-card-5").getAttribute("aria-pressed"),
			).toBe("true");
			expect(reveal.disabled).toBe(false);

			// Reveal local: votos simulados + estatísticas reais.
			fireEvent.click(reveal);
			expect(screen.getByTestId("demo-votes")).toBeTruthy();
			expect(screen.getByTestId("demo-vote-voce").textContent).toMatch(
				/Você 5/,
			);
			expect(screen.getByTestId("stats-result-value").textContent).toBe("5");
			expect(screen.getByTestId("stats-mean-value").textContent).toBe("5.8");
			expect(screen.getByTestId("stats-range-value").textContent).toBe("5–8");

			// Reset volta ao ponto de partida.
			fireEvent.click(screen.getByTestId("demo-retry"));
			expect(screen.queryByTestId("stats-pill")).toBeNull();
			expect(screen.queryByTestId("demo-votes")).toBeNull();
			expect(screen.getByTestId("demo-selection").textContent).toMatch(
				/Escolha uma carta/,
			);

			// O CTA pós-reveal aponta para a criação de sala real.
			fireEvent.click(screen.getByTestId("deck-card-5"));
			fireEvent.click(screen.getByTestId("demo-reveal"));
			expect(
				screen.getByTestId("demo-create").closest("a")?.getAttribute("href"),
			).toBe("/join");
		} finally {
			globalThis.WebSocket = RealWebSocket;
		}
	});

	test("texto localizado pt/en com estado acessível anunciado", () => {
		renderDemo("en");

		expect(screen.getByTestId("demo-selection").textContent).toMatch(
			/Choose a card to vote/,
		);
		expect(
			screen.getByTestId("demo-reveal").getAttribute("aria-label"),
		).toBe("Choose a card to reveal");
		expect(
			screen.getByTestId("demo-selection").getAttribute("aria-live"),
		).toBe("polite");
		expect(
			screen.getByTestId("demo-reveal-hint").getAttribute("aria-live"),
		).toBe("polite");

		fireEvent.click(screen.getByTestId("deck-card-8"));
		expect(screen.getByTestId("deck-hint").textContent).toMatch(
			/stays out of the average/,
		);
		expect(
			screen.getByTestId("demo-reveal").getAttribute("aria-label"),
		).toBe("Reveal simulated votes");

		fireEvent.click(screen.getByTestId("demo-reveal"));
		expect(screen.getByTestId("demo-votes").getAttribute("aria-label")).toBe(
			"Simulated votes",
		);
		const stats = screen.getByTestId("stats-pill");
		expect(stats.getAttribute("aria-live")).toBe("polite");
		expect(stats.getAttribute("aria-label")).toMatch(/median/i);
	});

	test("nenhuma ação da rodada envia dados ao backend", () => {
		const sent: string[] = [];
		const RealWebSocket = globalThis.WebSocket;
		class SpySocket {
			constructor() {
				throw new Error("RoundDemo não pode abrir socket");
			}
			send(payload: string): void {
				sent.push(payload);
			}
		}
		// @ts-expect-error — socket espião prova que nada é enviado.
		globalThis.WebSocket = SpySocket;
		try {
			renderDemo();
			fireEvent.click(screen.getByTestId("deck-card-3"));
			fireEvent.click(screen.getByTestId("demo-reveal"));
			fireEvent.click(screen.getByTestId("demo-retry"));
			expect(sent).toEqual([]);
		} finally {
			globalThis.WebSocket = RealWebSocket;
		}
	});
});
