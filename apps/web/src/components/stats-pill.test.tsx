/**
 * StatsPill tests — T35 verify (≥2 of 5 minimum required).
 */
import { describe, expect, test } from "bun:test";
import { render, screen } from "./ui/test-helpers";
import { StatsPill, formatMean, formatMedian, formatRange } from "./stats-pill";

describe("formatMean / formatMedian / formatRange — T35 pure", () => {
	test("formatMean(null) → '—'", () => {
		expect(formatMean(null)).toBe("—");
	});

	test("formatMean(5.4) → '5.4'", () => {
		expect(formatMean(5.4)).toBe("5.4");
	});

	test("formatMean(8) → '8.0'", () => {
		expect(formatMean(8)).toBe("8.0");
	});

	test("formatMedian(null) → '—'", () => {
		expect(formatMedian(null)).toBe("—");
	});

	test("formatMedian(5) → '5' (inteiro sem decimal)", () => {
		expect(formatMedian(5)).toBe("5");
	});

	test("formatMedian(4.5) → '4.5'", () => {
		expect(formatMedian(4.5)).toBe("4.5");
	});

	test("formatRange(null) → '—'", () => {
		expect(formatRange(null)).toBe("—");
	});

	test("formatRange([3, 13]) → '3–13' (en-dash U+2013)", () => {
		expect(formatRange([3, 13])).toBe("3\u201313");
	});
});

describe("StatsPill — render", () => {
	test("consensus=null não renderiza nada", () => {
		const { container } = render(<StatsPill consensus={null} />);
		expect(container.firstChild).toBeNull();
	});

	test("consensus normal: 'MÉDIA 5.4 · MEDIANA 5 · INTERVALO 3–13'", () => {
		render(
			<StatsPill
				consensus={{
					median: 5,
					mean: 5.4,
					range: [3, 13],
					unanimous: false,
				}}
			/>,
		);
		expect(screen.getByTestId("stats-mean-value")).toHaveTextContent("5.4");
		expect(screen.getByTestId("stats-median-value")).toHaveTextContent("5");
		expect(screen.getByTestId("stats-range-value")).toHaveTextContent(
			"3\u201313",
		);
	});

	test("unanimous=true mostra badge '★ Unanimous' em vez da mediana gold (F-049)", () => {
		render(
			<StatsPill
				consensus={{
					median: 5,
					mean: 5,
					range: [5, 5],
					unanimous: true,
				}}
			/>,
		);
		const badge = screen.getByTestId("stats-unanimous-badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveTextContent(/unanimous/i);
		// Median NÃO é renderizado (em vez disso, badge)
		expect(screen.queryByTestId("stats-median-value")).not.toBeInTheDocument();
		expect(
			screen.getByTestId("stats-pill").getAttribute("data-stats-unanimous"),
		).toBe("true");
	});

	test("unanimous=false: mediana em gold (border-mustard)", () => {
		const { container } = render(
			<StatsPill
				consensus={{
					median: 5,
					mean: 5.4,
					range: [3, 13],
					unanimous: false,
				}}
			/>,
		);
		const medianLabel = container.querySelector('[data-testid="stats-median"]');
		// O span do valor da mediana deve ter border-mustard
		expect(medianLabel?.querySelector(".border-mustard")).toBeInTheDocument();
	});

	test("role='status' + aria-live='polite' (a11y)", () => {
		render(
			<StatsPill
				consensus={{
					median: 5,
					mean: 5.4,
					range: [3, 13],
					unanimous: false,
				}}
			/>,
		);
		const pill = screen.getByTestId("stats-pill");
		expect(pill.getAttribute("role")).toBe("status");
		expect(pill.getAttribute("aria-live")).toBe("polite");
	});

	test("aria-label descritivo para unanimity", () => {
		render(
			<StatsPill
				consensus={{
					median: 5,
					mean: 5,
					range: [5, 5],
					unanimous: true,
				}}
			/>,
		);
		const pill = screen.getByTestId("stats-pill");
		expect(pill.getAttribute("aria-label")).toMatch(/unânime/i);
	});
});
