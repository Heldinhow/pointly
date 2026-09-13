/**
 * full.test — sala cheia (spell-rebuild).
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
import { Full } from "./full";

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

function renderFull(entry = "/full") {
	return render(
		<MemoryRouter
			future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
			initialEntries={[entry]}
		>
			<Routes>
				<Route path="/full" element={<Full />} />
				<Route path="/" element={<LocationProbe />} />
				<Route path="/join" element={<LocationProbe />} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("Full", () => {
	test("renderiza headline + contagem 12/12", () => {
		renderFull();
		expect(screen.getByTestId("page-full")).toBeTruthy();
		const h1 = screen.getByRole("heading", { level: 1 });
		expect(h1.textContent ?? "").toMatch(/sala cheia/i);
		expect(screen.getByTestId("full-count").textContent).toBe("12/12");
	});

	test("h1 recebe autofocus", () => {
		renderFull();
		expect(document.activeElement).toBe(
			screen.getByRole("heading", { level: 1 }),
		);
	});

	test("Criar sala nova → /join?host=1", async () => {
		renderFull();
		expect(
			screen.getByTestId("full-create-new").textContent ?? "",
		).toMatch(/criar sala nova/i);
		fireEvent.click(screen.getByTestId("full-create-new"));
		await waitFor(() => {
			expect(screen.getByTestId("location").textContent).toBe(
				"/join?host=1",
			);
		});
	});

	test("Voltar ao início → /", async () => {
		renderFull();
		expect(screen.getByTestId("full-retry").textContent ?? "").toMatch(
			/voltar ao início/i,
		);
		fireEvent.click(screen.getByTestId("full-retry"));
		await waitFor(() => {
			expect(screen.getByTestId("location").textContent).toBe("/");
		});
	});

	test("?code= mostra qual sala está cheia + Tentar outro código → /join", async () => {
		renderFull("/full?code=ab12");
		expect(screen.getByRole("heading", { level: 1 }).textContent ?? "").toMatch(
			/sala ab12 está cheia/i,
		);
		// contagem 12/12 mantida
		expect(screen.getByTestId("full-count").textContent).toBe("12/12");
		expect(
			screen.getByTestId("full-try-other").textContent ?? "",
		).toMatch(/tentar outro código/i);
		fireEvent.click(screen.getByTestId("full-try-other"));
		await waitFor(() => {
			expect(screen.getByTestId("location").textContent).toBe("/join");
		});
	});

	test("sem ?code= não há terceiro CTA", () => {
		renderFull();
		expect(screen.queryByTestId("full-try-other")).toBeNull();
	});
});
