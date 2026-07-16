/**
 * EmptyOverlay tests — T36 verify (≥2 of 5 minimum required).
 */
import { describe, expect, mock, test } from "bun:test";
import { EmptyOverlay, buildShareUrl } from "./empty-overlay";
import { fireEvent, render, screen } from "./ui/test-helpers";

describe("buildShareUrl — T36 pure", () => {
	test("buildShareUrl('http://localhost:5173', '9B9F') → '.../join?code=9B9F'", () => {
		expect(buildShareUrl("http://localhost:5173", "9B9F")).toBe(
			"http://localhost:5173/join?code=9B9F",
		);
	});
});

describe("EmptyOverlay — render", () => {
	test("renderiza headline 'Convide outros' + share URL readonly", () => {
		render(<EmptyOverlay code="9B9F" onDismiss={() => {}} />);
		expect(
			screen.getByRole("heading", { level: 2, name: /convide outros/i }),
		).toBeInTheDocument();
		const input = screen.getByTestId("empty-overlay-share-url");
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute("readonly");
		expect((input as HTMLInputElement).value).toMatch(/code=9B9F/);
	});

	test("role='dialog' + aria-modal='true' (a11y)", () => {
		render(<EmptyOverlay code="9B9F" onDismiss={() => {}} />);
		const dialog = screen.getByTestId("empty-overlay");
		expect(dialog.getAttribute("role")).toBe("dialog");
		expect(dialog.getAttribute("aria-modal")).toBe("true");
	});

	test("click em 'Copiar link' chama navigator.clipboard.writeText", async () => {
		// Mock clipboard
		const writeText = mock(async (_s: string) => {});
		const origClipboard = navigator.clipboard;
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});

		try {
			render(<EmptyOverlay code="ABCD" onDismiss={() => {}} />);
			fireEvent.click(screen.getByTestId("empty-overlay-copy"));
			// writeText é async; aguardamos microtask
			await new Promise((r) => setTimeout(r, 0));
			expect(writeText).toHaveBeenCalledTimes(1);
			const lastArg =
				writeText.mock.calls[writeText.mock.calls.length - 1]?.[0];
			expect(lastArg).toMatch(/code=ABCD/);
		} finally {
			Object.defineProperty(navigator, "clipboard", {
				configurable: true,
				value: origClipboard,
			});
		}
	});

	test("click em 'Entrar na mesa mesmo assim' chama onDismiss", () => {
		const onDismiss = mock(() => {});
		render(<EmptyOverlay code="9B9F" onDismiss={onDismiss} />);
		fireEvent.click(screen.getByTestId("empty-overlay-dismiss"));
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	test("Esc fecha o overlay (chama onDismiss)", () => {
		try {
			sessionStorage.clear();
		} catch {
			return;
		}
		const onDismiss = mock(() => {});
		render(<EmptyOverlay code="9B9F" onDismiss={onDismiss} />);
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	test("sessionStorage dismissed → NÃO renderiza overlay", () => {
		// Verifica que o lazy initializer do useState lê sessionStorage
		// antes do primeiro render (evita flicker do overlay).
		// Limpamos o storage e setamos o valor antes do render.
		try {
			sessionStorage.clear();
			sessionStorage.setItem("pointly.dismissedEmpty", "1");
		} catch {
			// ignore — se storage não existe, este teste é skip
			return;
		}
		const { container } = render(
			<EmptyOverlay code="9B9F" onDismiss={() => {}} />,
		);
		expect(container.firstChild).toBeNull();
		// Cleanup
		try {
			sessionStorage.clear();
		} catch {
			// ignore
		}
	});

	test("shareUrl override é usado quando fornecido", () => {
		render(
			<EmptyOverlay
				code="9B9F"
				onDismiss={() => {}}
				shareUrl="https://example.com/custom?code=9B9F"
			/>,
		);
		expect(screen.getByTestId("empty-overlay-share-url")).toHaveValue(
			"https://example.com/custom?code=9B9F",
		);
	});

	// T06 — BUG-305: clicar "Copiar link" NÃO fecha o overlay.
	test("BUG-305: clicar 'Copiar link' NÃO fecha overlay (sem auto-dismiss)", async () => {
		const writeText = mock(async (_s: string) => {});
		const origClipboard = navigator.clipboard;
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});

		try {
			render(<EmptyOverlay code="9B9F" />);
			fireEvent.click(screen.getByTestId("empty-overlay-copy"));
			// Espera >1200ms (era o timeout antigo).
			await new Promise((r) => setTimeout(r, 1500));
			// Overlay continua montado porque removemos o auto-dismiss.
			expect(screen.getByTestId("empty-overlay")).toBeInTheDocument();
			// Botão mostra feedback "Copiado ✓".
			expect(screen.getByTestId("empty-overlay-copy").textContent?.trim()).toBe(
				"Copiado ✓",
			);
		} finally {
			Object.defineProperty(navigator, "clipboard", {
				configurable: true,
				value: origClipboard,
			});
		}
	});

	// T06 — BUG-304: onDismiss é opcional; sem handler, dismiss funciona via storage.
	test("BUG-304: onDismiss é opcional — overlay dismissa mesmo sem handler", () => {
		try {
			sessionStorage.clear();
		} catch {
			// ambiente sem sessionStorage (Bun node puro) — skip
			return;
		}
		render(<EmptyOverlay code="9B9F" />);
		fireEvent.click(screen.getByTestId("empty-overlay-dismiss"));
		const stored = sessionStorage.getItem("pointly.dismissedEmpty");
		expect(stored).toBe("1");
		sessionStorage.removeItem("pointly.dismissedEmpty");
	});
});
