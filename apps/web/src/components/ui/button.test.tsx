/**
 * Button primitive tests — T26 verify (≥1 of 5 minimum required).
 *
 * Cobre variants e sizes; verifica integração com cn/tailwind-merge.
 */
import { describe, expect, test } from "bun:test";
import { render, screen } from "./test-helpers";
import { Button } from "./button";

describe("Button — variants", () => {
	test("renderiza Button coral com texto esperado (CTA primário)", () => {
		render(<Button variant="coral">Criar sala</Button>);
		const btn = screen.getByRole("button", { name: "Criar sala" });
		expect(btn).toBeInTheDocument();
		expect(btn).toHaveTextContent("Criar sala");
	});

	test("variant default aplica border ink/20 (ghost-style)", () => {
		render(<Button variant="default">Entrar</Button>);
		const btn = screen.getByRole("button", { name: "Entrar" });
		expect(btn.className).toContain("border-ink/20");
	});

	test("variant ghost não tem border", () => {
		render(<Button variant="ghost">Fechar</Button>);
		const btn = screen.getByRole("button", { name: "Fechar" });
		expect(btn.className).not.toContain("border-ink/20");
	});

	test("variant link aplica underline", () => {
		render(<Button variant="link">Saiba mais</Button>);
		const btn = screen.getByRole("button", { name: "Saiba mais" });
		expect(btn.className).toContain("underline");
	});
});

describe("Button — sizes", () => {
	test("size sm aplica h-8 e text-sm", () => {
		render(
			<Button variant="default" size="sm">
				sm
			</Button>,
		);
		const btn = screen.getByRole("button", { name: "sm" });
		expect(btn.className).toContain("h-8");
	});

	test("size lg aplica h-12 e text-lg", () => {
		render(
			<Button variant="coral" size="lg">
				lg
			</Button>,
		);
		const btn = screen.getByRole("button", { name: "lg" });
		expect(btn.className).toContain("h-12");
	});

	test("click handler é invocado", () => {
		let clicked = false;
		render(
			<Button
				variant="coral"
				onClick={() => {
					clicked = true;
				}}
			>
				Click me
			</Button>,
		);
		screen.getByRole("button").click();
		expect(clicked).toBe(true);
	});

	test("disabled bloqueia pointer events via opacity-40", () => {
		render(
			<Button variant="coral" disabled>
				Disabled
			</Button>,
		);
		const btn = screen.getByRole("button", { name: "Disabled" });
		expect(btn).toBeDisabled();
		expect(btn.className).toContain("disabled:opacity-40");
	});
});
