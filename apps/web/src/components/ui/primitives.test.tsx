import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "./button";
import { Card, CardDescription, CardFooter, CardHeader, CardPanel, CardTitle } from "./card";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
	DialogTrigger,
} from "./dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { Input } from "./input";
import { Separator } from "./separator";
import {
	Sheet,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetPopup,
	SheetTitle,
} from "./sheet";
import { Spinner } from "./spinner";
import { Stamp, stampVariants } from "./stamp";

afterEach(() => {
	cleanup();
});

// F0.4: primitivos sob os tokens Prensa. API estável (exports, variants,
// data-slot); visual novo: sem blur/gradiente/pílula/glow, raios de papel
// cortado, recorte duro, foco 2px offset 2px, toque ≥44px.
describe("primitivos Prensa (F0.4)", () => {
	test("button: carimbo com variants/sizes/data-slot + foco/toque sem legado", () => {
		const { container } = render(<Button>Exemplo</Button>);
		const btn = container.querySelector('[data-slot="button"]');
		expect(btn).toBeTruthy();
		expect(btn?.getAttribute("type")).toBe("button");

		const base = buttonVariants({ variant: "default" });
		expect(base).toMatch(/var\(--accent\)/);
		expect(base).toMatch(/var\(--on-accent\)/);
		expect(base).toMatch(/var\(--radius-sm\)/);
		expect(base).toMatch(/var\(--shadow-cut\)/);
		expect(base).toMatch(/focus-visible:outline/);
		expect(base).toMatch(/outline-offset-2/);
		expect(base).toMatch(/pointer-coarse:after:min-h-11/);
		// Sobre accent, o anel é --ink.
		expect(base).toMatch(/outline-\[var\(--ink\)\]/);
		// Legado banido do botão.
		for (const banned of [
			"bg-primary",
			"rounded-lg",
			"shadow-xs",
			"ring-ring",
			"inset-shadow",
		]) {
			expect(base).not.toMatch(banned);
		}

		// Loading expõe spinner sem lucide e desabilita.
		const { container: loading } = render(<Button loading>Vai</Button>);
		expect(
			loading.querySelector('[data-slot="button-loading-indicator"]'),
		).toBeTruthy();
		expect(
			loading.querySelector("button")?.hasAttribute("disabled"),
		).toBe(true);
		cleanup();
	});

	test("input/field: papel com erro no sinal e slots estáveis", () => {
		const { container } = render(
			<Field>
				<FieldLabel>Nome</FieldLabel>
				<Input aria-label="Nome" type="text" />
				<FieldDescription>Dica</FieldDescription>
				<FieldError>Erro</FieldError>
			</Field>,
		);
		expect(container.querySelector('[data-slot="input-control"]')).toBeTruthy();
		expect(container.querySelector('[data-slot="input"]')).toBeTruthy();
		expect(container.innerHTML).toMatch(/var\(--surface\)/);
		expect(container.innerHTML).toMatch(/var\(--ink-muted\)/);
		expect(container.innerHTML).toMatch(/var\(--radius-sm\)/);
		expect(container.innerHTML).toMatch(/has-aria-invalid/);
		expect(container.innerHTML).toMatch(/var\(--accent\)/);
		expect(container.innerHTML).toMatch(/pointer-coarse:min-h-11/);
		expect(container.innerHTML).not.toMatch(/bg-background/);
		expect(container.innerHTML).not.toMatch(/border-input/);

		const { container: invalid } = render(
			<Input aria-invalid="true" aria-label="Com erro" type="text" />,
		);
		expect(
			invalid.querySelector("input")?.getAttribute("aria-invalid"),
		).toBe("true");
		cleanup();
	});

	test("card: folha com régua, raio-md e recorte; sem rounded-2xl", () => {
		const { container } = render(
			<Card>
				<CardHeader>
					<CardTitle>Título</CardTitle>
					<CardDescription>Descrição</CardDescription>
				</CardHeader>
				<CardPanel>Miolo</CardPanel>
				<CardFooter>Rodapé</CardFooter>
			</Card>,
		);
		expect(container.querySelector('[data-slot="card"]')).toBeTruthy();
		expect(container.querySelector('[data-slot="card-title"]')).toBeTruthy();
		expect(container.innerHTML).toMatch(/var\(--surface\)/);
		expect(container.innerHTML).toMatch(/var\(--line\)/);
		expect(container.innerHTML).toMatch(/var\(--radius-md\)/);
		expect(container.innerHTML).toMatch(/var\(--shadow-cut\)/);
		expect(container.innerHTML).toMatch(/--font-display/);
		expect(container.innerHTML).not.toMatch(/rounded-2xl/);
		expect(container.innerHTML).not.toMatch(/bg-card/);
		expect(container.innerHTML).not.toMatch(/shadow-xs/);
	});

	test("separator: régua de 1px no token --line", () => {
		const { container } = render(<Separator />);
		const sep = container.querySelector('[data-slot="separator"]');
		expect(sep).toBeTruthy();
		expect(sep?.className).toMatch(/var\(--line\)/);
		expect(sep?.className).not.toMatch(/bg-border/);
	});

	test("spinner: usa o Loader2 de tinta, sem lucide", () => {
		const { container } = render(<Spinner />);
		const svg = container.querySelector('svg[data-slot="spinner"]');
		expect(svg).toBeTruthy();
		expect(svg?.getAttribute("role")).toBe("status");
		expect(svg?.getAttribute("stroke-width")).toBe("1.75");
		expect(svg?.getAttribute("stroke-linecap")).toBe("square");
		expect(container.innerHTML).toMatch(/animate-spin/);
		expect(container.innerHTML).not.toMatch(/lucide/i);
	});

	test("dialog: abre com trigger, tem seções + fechar X de tinta", () => {
		render(
			<Dialog defaultOpen>
				<DialogTrigger>Abrir</DialogTrigger>
				<DialogPopup>
					<DialogHeader>
						<DialogTitle>Título</DialogTitle>
						<DialogDescription>Descrição</DialogDescription>
					</DialogHeader>
					<DialogPanel>Conteúdo</DialogPanel>
					<DialogFooter>
						<DialogClose>Ação</DialogClose>
					</DialogFooter>
				</DialogPopup>
			</Dialog>,
		);
		expect(screen.getByText("Título")).toBeTruthy();
		expect(screen.getByText("Conteúdo")).toBeTruthy();
		const popup = document.body.querySelector('[data-slot="dialog-popup"]');
		expect(popup).toBeTruthy();
		expect(popup?.className).toMatch(/var\(--surface\)/);
		expect(popup?.className).toMatch(/var\(--radius-md\)/);
		expect(popup?.className).toMatch(/var\(--shadow-cut\)/);
		const close = document.body.querySelector(
			'[data-slot="dialog-close"][aria-label="Fechar"]',
		);
		expect(close?.getAttribute("aria-label")).toBe("Fechar");
		fireEvent.click(screen.getByText("Ação"));
		cleanup();
	});

	test("sheet: lados + seções sob os mesmos tokens", () => {
		for (const side of ["right", "left", "top", "bottom"] as const) {
			render(
				<Sheet defaultOpen>
					<SheetPopup side={side}>
						<SheetHeader>
							<SheetTitle>Painel</SheetTitle>
							<SheetDescription>Detalhes</SheetDescription>
						</SheetHeader>
						<SheetPanel>Miolo</SheetPanel>
						<SheetFooter>Ações</SheetFooter>
					</SheetPopup>
				</Sheet>,
			);
			const popup = document.body.querySelector('[data-slot="sheet-popup"]');
			expect(popup?.getAttribute("data-side")).toBe(side);
			expect(popup?.className).toMatch(/var\(--surface\)/);
			expect(popup?.className).toMatch(/var\(--radius-md\)/);
			cleanup();
		}
	});

	test("stamp: carimbo em Archivo com variants", () => {
		const { container } = render(<Stamp>Unânime</Stamp>);
		const stamp = container.querySelector('[data-slot="stamp"]');
		expect(stamp?.textContent).toBe("Unânime");
		const base = stampVariants({ variant: "default" });
		expect(base).toMatch(/var\(--accent\)/);
		expect(base).toMatch(/--font-display/);
		expect(base).toMatch(/rotate/);
		expect(base).toMatch(/border-2/);
		expect(base).not.toMatch(/rounded-full/);
		expect(base).not.toMatch(/shadow/);
	});
});
