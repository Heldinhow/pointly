/**
 * Ellipse primitive tests — T26 verify (bonus test).
 */
import { describe, expect, test } from "bun:test";
import { render } from "./test-helpers";
import { Ellipse } from "./ellipse";

describe("Ellipse", () => {
	test("renderiza SVG com dimensões padrão e aria-label", () => {
		const { container } = render(
			<Ellipse>
				<text x="100" y="100">
					center
				</text>
			</Ellipse>,
		);
		const svg = container.querySelector("svg");
		expect(svg).toBeTruthy();
		expect(svg?.getAttribute("aria-label")).toBe("Mesa da rodada");
		expect(svg?.getAttribute("width")).toBe("960");
		expect(svg?.getAttribute("height")).toBe("560");
	});

	test("width/height customizados", () => {
		const { container } = render(<Ellipse width={800} height={400} />);
		const svg = container.querySelector("svg");
		expect(svg?.getAttribute("width")).toBe("800");
		expect(svg?.getAttribute("height")).toBe("400");
	});

	test("contém ellipse com stroke-dasharray", () => {
		const { container } = render(<Ellipse />);
		const ellipse = container.querySelector("ellipse");
		expect(ellipse).toBeTruthy();
		expect(ellipse?.getAttribute("stroke-dasharray")).toBe("8 6");
		expect(ellipse?.getAttribute("fill")).toBe("url(#ellipse-radial-gradient)");
	});

	test("children renderizam dentro do SVG", () => {
		const { container } = render(
			<Ellipse>
				<circle id="my-seat" cx="480" cy="280" r="20" />
			</Ellipse>,
		);
		const circle = container.querySelector("#my-seat");
		expect(circle).toBeTruthy();
	});

	// T7 — pulseWhenEmpty
	test("pulseWhenEmpty=true adiciona classe ellipse-pulse e muda aria-label", () => {
		const { container } = render(<Ellipse pulseWhenEmpty />);
		const ellipse = container.querySelector("ellipse");
		const svg = container.querySelector("svg");
		expect(ellipse?.classList.contains("ellipse-pulse")).toBe(true);
		expect(svg?.getAttribute("aria-label")).toBe(
			"Mesa da rodada — aguardando jogadores",
		);
	});

	test("pulseWhenEmpty=false (default) NÃO adiciona classe", () => {
		const { container } = render(<Ellipse />);
		const ellipse = container.querySelector("ellipse");
		expect(ellipse?.classList.contains("ellipse-pulse")).toBe(false);
	});
});
