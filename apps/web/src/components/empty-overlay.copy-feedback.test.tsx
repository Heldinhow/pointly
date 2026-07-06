/**
 * T12 — Copiar link: feedback pós-clique (Bun test, JSDOM).
 *
 * Validates the critério de aceite from Heldinhow/pointly#48 at the
 * component level (real React mount, no Playwright needed):
 *  - Initial text: "Copiar link".
 *  - After click + clipboard success: text changes to "Copiado ✓".
 *  - Auto-reset to "Copiar link" within ~2s.
 *  - During copied state, classes include "border-olive".
 *  - aria-live="polite" on the button.
 *
 * Complementa T12-after.spec.ts (axe-core em /arena + compiled source check).
 */
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { EmptyOverlay } from "./empty-overlay";

// Mock navigator.clipboard.writeText to resolve (no actual clipboard in JSDOM).
const writeTextMock = mock(async (_url: string) => undefined);

beforeEach(() => {
	window.localStorage.clear();
	window.sessionStorage.clear();
	Object.defineProperty(navigator, "clipboard", {
		configurable: true,
		value: { writeText: writeTextMock },
	});
	writeTextMock.mockClear();
});

afterEach(() => {
	cleanup();
});

describe("EmptyOverlay (T12)", () => {
	it("renderiza com texto inicial 'Copiar link'", () => {
		render(<EmptyOverlay code="B891" />);
		const btn = screen.getByTestId("empty-overlay-copy");
		expect(btn.textContent).toBe("Copiar link");
	});

	it("botão tem aria-live=polite", () => {
		render(<EmptyOverlay code="B891" />);
		const btn = screen.getByTestId("empty-overlay-copy");
		expect(btn.getAttribute("aria-live")).toBe("polite");
	});

	it("após click, texto vira 'Copiado ✓'", async () => {
		render(<EmptyOverlay code="B891" />);
		const btn = screen.getByTestId("empty-overlay-copy");
		await act(async () => {
			fireEvent.click(btn);
		});
		await waitFor(() => {
			expect(btn.textContent).toBe("Copiado ✓");
		});
		expect(writeTextMock).toHaveBeenCalledTimes(1);
		const calledUrl = writeTextMock.mock.calls[0]?.[0] as string;
		expect(calledUrl).toContain("/join?code=B891");
	});

	it("estado copied aplica classe border-olive", async () => {
		render(<EmptyOverlay code="B891" />);
		const btn = screen.getByTestId("empty-overlay-copy");
		await act(async () => {
			fireEvent.click(btn);
		});
		await waitFor(() => {
			expect(btn.className).toContain("border-olive");
		});
	});

	it("auto-reset volta para 'Copiar link' após ~2s", async () => {
		render(<EmptyOverlay code="B891" />);
		const btn = screen.getByTestId("empty-overlay-copy");
		await act(async () => {
			fireEvent.click(btn);
		});
		await waitFor(() => expect(btn.textContent).toBe("Copiado ✓"));

		// Wait > 2s (2000ms timeout + buffer) and assert revert.
		await waitFor(
			() => {
				expect(btn.textContent).toBe("Copiar link");
			},
			{ timeout: 2500 },
		);
	});
});
