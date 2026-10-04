import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import {
	PRENSA_ICON_NAMES,
	PRENSA_ICONS,
	PrensaIcon,
} from "./icons";

afterEach(() => {
	cleanup();
});

// F0.3: set de tinta — contrato estável (grid 24, traço único, cantos retos,
// currentColor; preenchimento só em pontos maciços).
describe("ícones Prensa (F0.3)", () => {
	test("inventário cobre todo o uso via lucide (30 nomes)", () => {
		expect(PRENSA_ICON_NAMES).toHaveLength(30);
		for (const name of [
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			"Check",
			"ChevronDown",
			"ChevronRight",
			"CircleAlert",
			"ClipboardList",
			"Coffee",
			"Copy",
			"Crown",
			"Dices",
			"Eye",
			"EyeOff",
			"ImagePlus",
			"ListChecks",
			"Loader2",
			"LogOut",
			"Minus",
			"Moon",
			"Pencil",
			"Plus",
			"RotateCcw",
			"Sun",
			"Trash2",
			"UserRound",
			"Users",
			"Vote",
			"X",
		] as const) {
			expect(PRENSA_ICON_NAMES).toContain(name);
			expect(typeof PRENSA_ICONS[name]).toBe("function");
		}
	});

	test("cada ícone renderiza svg 24 com traço 1.75, cantos retos e currentColor", () => {
		for (const name of PRENSA_ICON_NAMES) {
			const { container } = render(<PrensaIcon name={name} />);
			const svg = container.querySelector("svg");
			expect(svg).toBeTruthy();
			expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
			expect(svg?.getAttribute("stroke")).toBe("currentColor");
			expect(svg?.getAttribute("stroke-width")).toBe("1.75");
			expect(svg?.getAttribute("stroke-linecap")).toBe("square");
			expect(svg?.getAttribute("stroke-linejoin")).toBe("miter");
			expect(svg?.getAttribute("fill")).toBe("none");
			// Decorativo por padrão.
			expect(svg?.getAttribute("aria-hidden")).toBe("true");
			cleanup();
		}
	});

	test("sem lucide: nenhum path copia round caps e size/className passam", () => {
		const { container } = render(
			<PrensaIcon className="tinta" name="Check" size={32} />,
		);
		const svg = container.querySelector("svg");
		expect(svg?.getAttribute("width")).toBe("32");
		expect(svg?.getAttribute("height")).toBe("32");
		expect(svg?.getAttribute("class")).toMatch(/tinta/);
		expect(container.innerHTML).not.toMatch(/round/);
		expect(container.innerHTML).not.toMatch(/lucide/i);
	});

	test("aria-label desliga aria-hidden (ícone com sentido único)", () => {
		const { container } = render(
			<PrensaIcon aria-label="Fechar" name="X" />,
		);
		const svg = container.querySelector("svg");
		expect(svg?.hasAttribute("aria-hidden")).toBe(false);
		expect(svg?.getAttribute("aria-label")).toBe("Fechar");
	});
});
