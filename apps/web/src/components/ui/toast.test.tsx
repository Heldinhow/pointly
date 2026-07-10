/**
 * Toast primitive tests — T26 verify (1 of 5 minimum).
 *
 * Cobre: push via hook renderiza toast com role="status";
 *        aria-live="polite" no viewport;
 *        useToast fora do provider throw error;
 *        multiple toasts empilhados.
 */
import { describe, expect, mock, test } from "bun:test";
import { act, render as rtlRender, screen } from "@testing-library/react";
import { render } from "./test-helpers";
import { ToastProvider, useToast } from "./toast";

function Harness({
	text = "Maya escolheu uma carta.",
	kind = "info",
}: {
	text?: string;
	kind?: "info" | "success" | "error";
}) {
	const toast = useToast();
	return (
		<button
			type="button"
			onClick={() => toast.push(text, kind)}
			aria-label="trigger"
		>
			trigger
		</button>
	);
}

describe("Toast", () => {
	test("push via hook renderiza toast com role='status'", () => {
		render(
			<ToastProvider>
				<Harness text="Maya escolheu uma carta." />
			</ToastProvider>,
		);
		act(() => {
			screen.getByRole("button", { name: "trigger" }).click();
		});
		const toast = screen.getByRole("status");
		expect(toast).toHaveTextContent("Maya escolheu uma carta.");
	});

	test("viewport tem aria-live='polite' e aria-atomic='true'", () => {
		render(
			<ToastProvider>
				<div />
			</ToastProvider>,
		);
		const viewport = document.querySelector("[aria-live='polite']");
		expect(viewport).toBeTruthy();
		expect(viewport?.getAttribute("aria-atomic")).toBe("true");
	});

	test("toast success usa kind success (surface bg + olive text)", () => {
		render(
			<ToastProvider>
				<Harness text="Operação ok" kind="success" />
			</ToastProvider>,
		);
		act(() => {
			screen.getByRole("button", { name: "trigger" }).click();
		});
		const toast = screen.getByRole("status");
		expect(toast.className).toContain("bg-surface");
		expect(toast.className).toContain("text-olive");
	});

	test("useToast fora do provider throw error", () => {
		// rtlRender cru (sem ToastProvider): throw acontece síncrono.
		// React 18 reporta via console.error como "Uncaught" — suprimimos
		// durante este teste pra manter a saída limpa (issue #54 critério).
		const errSpy = mock();
		const origError = console.error;
		console.error = errSpy;
		try {
			expect(() => rtlRender(<Harness />)).toThrow(/ToastProvider/);
		} finally {
			console.error = origError;
		}
	});

	test("múltiplos toasts empilham", () => {
		function Multi() {
			const t = useToast();
			return (
				<button
					type="button"
					onClick={() => {
						t.push("first", "info");
						t.push("second", "info");
						t.push("third", "info");
					}}
					aria-label="trigger"
				>
					trigger
				</button>
			);
		}
		render(
			<ToastProvider>
				<Multi />
			</ToastProvider>,
		);
		act(() => {
			screen.getByRole("button", { name: "trigger" }).click();
		});
		const toasts = screen.getAllByRole("status");
		expect(toasts).toHaveLength(3);
	});
});
