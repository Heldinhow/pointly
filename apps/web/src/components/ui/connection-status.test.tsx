/**
 * ConnectionStatus primitive tests — T26 verify (1 of 5 minimum).
 */
import { describe, expect, test } from "bun:test";
import { ConnectionStatus } from "./connection-status";
import { render, screen } from "./test-helpers";

describe("ConnectionStatus", () => {
	test("variant loading mostra 'Conectando…' com estado neutro", () => {
		render(<ConnectionStatus variant="loading" />);
		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Conectando…");
		expect(status.className).toContain("feedback-connection-loading");
		const dot = status.querySelector("span[aria-hidden='true']");
		expect(dot?.className).toContain("feedback-dot-loading");
		expect(dot?.className).toContain("animate-pulse");
	});

	test("variant error mostra 'Conexão perdida' com estado de perigo", () => {
		render(<ConnectionStatus variant="error" />);
		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Conexão perdida");
		expect(status.className).toContain("feedback-danger");
	});

	test("variant connected mostra 'Conectado' com estado de sucesso", () => {
		render(<ConnectionStatus variant="connected" />);
		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Conectado");
		expect(status.className).toContain("feedback-success");
		const dot = status.querySelector("span[aria-hidden='true']");
		expect(dot?.className).toContain("feedback-dot-success");
		expect(dot?.className).not.toContain("animate-pulse");
	});

	test("tem aria-live='polite'", () => {
		render(<ConnectionStatus variant="connected" />);
		const status = screen.getByRole("status");
		expect(status.getAttribute("aria-live")).toBe("polite");
	});
});
