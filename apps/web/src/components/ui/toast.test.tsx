/**
 * Toast primitive tests — T26 verify (1 of 5 minimum).
 *
 * Cobre: push via hook renderiza toast com role="status";
 *        aria-live="polite" no viewport;
 *        useToast fora do provider throw error;
 *        multiple toasts empilhados.
 */
import { describe, expect, test } from "bun:test";
import { act, render, screen } from "./test-helpers";
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

	test("toast success usa tokens semânticos de sucesso", () => {
		render(
			<ToastProvider>
				<Harness text="Operação ok" kind="success" />
			</ToastProvider>,
		);
		act(() => {
			screen.getByRole("button", { name: "trigger" }).click();
		});
		const toast = screen.getByRole("status");
		expect(toast.className).toContain("feedback-success");
		expect(screen.getByRole("button", { name: /fechar notificação/i })).toBeInTheDocument();
	});

	test("toast error usa tokens semânticos de perigo e pode ser fechado", () => {
		render(
			<ToastProvider>
				<Harness text="Servidor indisponível" kind="error" />
			</ToastProvider>,
		);
		act(() => {
			screen.getByRole("button", { name: "trigger" }).click();
		});
		const toast = screen.getByRole("status");
		expect(toast.className).toContain("feedback-danger");
		act(() => {
			screen.getByRole("button", { name: /fechar notificação/i }).click();
		});
		expect(screen.queryByRole("status")).toBeNull();
	});

	test("useToast fora do provider throw error", () => {
		// Probe captura a mensagem sem deixar o erro vazar como
		// "Uncaught" no React 19 (render assíncrono).
		let message = "";
		function Probe() {
			try {
				useToast();
			} catch (e) {
				message = e instanceof Error ? e.message : String(e);
			}
			return null;
		}
		render(<Probe />);
		expect(message).toMatch(/ToastProvider/);
	});

	test("atualizações rotineiras substituem avisos antigos sem descartar erros", () => {
		function Multi() {
			const t = useToast();
			return (
				<button
					type="button"
					onClick={() => {
						t.push("first", "error");
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
		expect(toasts).toHaveLength(2);
		expect(screen.queryByText("second")).toBeNull();
		expect(screen.getByText("first")).toBeInTheDocument();
		expect(screen.getByText("third")).toBeInTheDocument();
	});
});
