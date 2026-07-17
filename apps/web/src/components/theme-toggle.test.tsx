/**
 * ThemeToggle tests — ciclo Sistema → Claro → Escuro → Sistema.
 *
 * Cobre a regressão do toggle antigo (2 estados) que travava numa escolha
 * manual pra sempre e o app parava de seguir o `prefers-color-scheme` do SO.
 * Agora o 3º clique devolve o controle pro sistema.
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { ThemeToggle } from "./theme-toggle";
import { fireEvent, render, screen } from "./ui/test-helpers";

function btn() {
	return screen.getByTestId("theme-toggle");
}
function mode() {
	return btn().getAttribute("data-theme-mode");
}
function domTheme() {
	return document.documentElement.getAttribute("data-theme");
}
function lsTheme() {
	try {
		return localStorage.getItem("theme");
	} catch {
		return "ERR";
	}
}

describe("ThemeToggle — ciclo de 3 estados", () => {
	beforeEach(() => {
		try {
			localStorage.removeItem("theme");
		} catch {}
		document.documentElement.removeAttribute("data-theme");
	});

	test("default é Sistema: sem data-theme, sem localStorage", () => {
		render(<ThemeToggle />);
		expect(mode()).toBe("system");
		expect(domTheme()).toBeNull();
		expect(lsTheme()).toBeNull();
	});

	test("1º clique: Sistema → Claro (fixa light no DOM e no storage)", () => {
		render(<ThemeToggle />);
		fireEvent.click(btn());
		expect(mode()).toBe("light");
		expect(domTheme()).toBe("light");
		expect(lsTheme()).toBe("light");
	});

	test("2º clique: Claro → Escuro (fixa dark)", () => {
		render(<ThemeToggle />);
		fireEvent.click(btn());
		fireEvent.click(btn());
		expect(mode()).toBe("dark");
		expect(domTheme()).toBe("dark");
		expect(lsTheme()).toBe("dark");
	});

	test("3º clique: Escuro → Sistema (volta a seguir o SO)", () => {
		render(<ThemeToggle />);
		fireEvent.click(btn());
		fireEvent.click(btn());
		fireEvent.click(btn());
		expect(mode()).toBe("system");
		// Modo Sistema reativa o auto-detect: sem data-theme e sem persistência.
		expect(domTheme()).toBeNull();
		expect(lsTheme()).toBeNull();
	});

	test("ciclo completo volta ao ponto de partida (Sistema)", () => {
		render(<ThemeToggle />);
		const modes: (string | null)[] = [mode()];
		for (let i = 0; i < 3; i++) {
			fireEvent.click(btn());
			modes.push(mode());
		}
		expect(modes).toEqual(["system", "light", "dark", "system"]);
	});

	test("escolha manual persiste entre reloads (localStorage lido no mount)", () => {
		localStorage.setItem("theme", "dark");
		render(<ThemeToggle />);
		expect(mode()).toBe("dark");
		expect(domTheme()).toBe("dark");
	});

	test("aria-label anuncia o modo atual e o próximo", () => {
		render(<ThemeToggle />);
		expect(btn().getAttribute("aria-label")).toContain("Sistema");
		fireEvent.click(btn());
		expect(btn().getAttribute("aria-label")).toContain("Claro");
		fireEvent.click(btn());
		expect(btn().getAttribute("aria-label")).toContain("Escuro");
	});
});
