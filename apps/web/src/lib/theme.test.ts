import { afterEach, describe, expect, test } from "bun:test";
import { applyTheme, resolveTheme } from "./theme";

// F0.2: o toggle manual persiste (hook existente) e espelha nos dois
// contratos — `.dark` (telas antigas) e `data-theme` (tokens Prensa).
describe("tema (F0.2)", () => {
	test("resolveTheme: manual vence; sem manual, padrão é o sistema", () => {
		expect(resolveTheme("light", false)).toBe("light");
		expect(resolveTheme("dark", true)).toBe("dark");
		expect(resolveTheme(null, true)).toBe("light");
		expect(resolveTheme(null, false)).toBe("dark");
		expect(resolveTheme("system", true)).toBe("light");
	});

	test("applyTheme escreve .dark e data-theme juntos", () => {
		applyTheme("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(document.documentElement.dataset.theme).toBe("dark");
		applyTheme("light");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		expect(document.documentElement.dataset.theme).toBe("light");
	});

	afterEach(() => {
		document.documentElement.classList.add("dark");
		document.documentElement.removeAttribute("data-theme");
	});
});
