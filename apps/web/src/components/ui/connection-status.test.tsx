/**
 * ConnectionStatus primitive tests — T26 verify (1 of 5 minimum).
 */
import { describe, expect, test } from "bun:test";
import { render, screen } from "./test-helpers";
import { ConnectionStatus } from "./connection-status";

describe("ConnectionStatus", () => {
	test("variant loading mostra 'Conectando…' com dot coral pulse", () => {
		render(<ConnectionStatus variant="loading" />);
		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Conectando…");
		expect(status.className).toContain("bg-surface");
		const dot = status.querySelector("span[aria-hidden='true']");
		expect(dot?.className).toContain("bg-coral");
		expect(dot?.className).toContain("animate-pulse");
	});

	test("variant error mostra 'Conexão perdida' com dot coral", () => {
		render(<ConnectionStatus variant="error" />);
		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Conexão perdida");
		expect(status.className).toContain("bg-coral-soft");
		expect(status.className).toContain("text-ink");
	});

	test("variant connected mostra 'Conectado' com dot olive", () => {
		render(<ConnectionStatus variant="connected" />);
		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Conectado");
		expect(status.className).toContain("text-olive");
		const dot = status.querySelector("span[aria-hidden='true']");
		expect(dot?.className).toContain("bg-olive");
		expect(dot?.className).not.toContain("animate-pulse");
	});

	test("tem aria-live='polite'", () => {
		render(<ConnectionStatus variant="connected" />);
		const status = screen.getByRole("status");
		expect(status.getAttribute("aria-live")).toBe("polite");
	});
});
