/**
 * StatsPill tests — T35 verify (≥2 of 5 minimum required).
 */
import { describe, expect, test } from "bun:test";
import {
	StatsPill,
	formatMean,
	formatMedian,
	formatRange,
	groupVotes,
} from "./stats-pill";
import { render, screen } from "./ui/test-helpers";

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

	test("unanimous=true mostra badge '★ Unânime' em vez da mediana gold (F-049)", () => {
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
		expect(badge).toHaveTextContent(/unânime/i);
		// Median NÃO é renderizado (em vez disso, badge)
		expect(screen.queryByTestId("stats-median-value")).not.toBeInTheDocument();
		expect(
			screen.getByTestId("stats-pill").getAttribute("data-stats-unanimous"),
		).toBe("true");
	});

	test("unanimous=false: mediana é o numeral herói do plate", () => {
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
		expect(pill.getAttribute("data-stats-mode")).toBe("normal");
		expect(screen.getByTestId("stats-median-value")).toHaveTextContent("5");
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
		expect(screen.getByRole("status")).toBe(pill);
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

describe("groupVotes — distribuição", () => {
	test("agrupa e ordena na ordem do deck, ☕ por último", () => {
		expect(groupVotes(["8", "5", "5", "☕", "0"])).toEqual([
			{ value: "0", count: 1 },
			{ value: "5", count: 2 },
			{ value: "8", count: 1 },
			{ value: "☕", count: 1 },
		]);
	});
});

describe("Result plate — estados da rodada", () => {
	test("voto único: 'Voto único' no lugar de 'Unânime'", () => {
		render(
			<StatsPill
				consensus={{ median: 5, mean: 5, range: [5, 5], unanimous: true }}
				votes={["5"]}
			/>,
		);
		const pill = screen.getByTestId("stats-pill");
		expect(pill.getAttribute("data-stats-mode")).toBe("solo");
		expect(screen.getByTestId("stats-eyebrow")).toHaveTextContent(/voto único/i);
		expect(screen.getByTestId("stats-result-value")).toHaveTextContent("5");
		expect(screen.queryByTestId("stats-unanimous-badge")).not.toBeInTheDocument();
	});

	test("pausa: todos ☕ mostra modo pause sem números", () => {
		render(
			<StatsPill
				consensus={{ median: null, mean: null, range: null, unanimous: false }}
				votes={["☕", "☕"]}
			/>,
		);
		const pill = screen.getByTestId("stats-pill");
		expect(pill.getAttribute("data-stats-mode")).toBe("pause");
		expect(screen.getByTestId("stats-result-value")).toHaveTextContent("☕");
		expect(screen.queryByTestId("stats-mean-value")).not.toBeInTheDocument();
		expect(screen.queryByTestId("stats-distribution")).not.toBeInTheDocument();
	});

	test("distribuição: pips por valor, mediana com aro, contagem ×N", () => {
		render(
			<StatsPill
				consensus={{ median: 5, mean: 5.25, range: [3, 8], unanimous: false }}
				votes={["3", "5", "5", "8"]}
			/>,
		);
		expect(screen.getByTestId("stats-distribution")).toBeInTheDocument();
		expect(screen.getByTestId("stats-pip-5")).toHaveTextContent("×2");
		expect(
			screen.getByTestId("stats-pip-5").getAttribute("data-pip-median"),
		).toBe("true");
		expect(
			screen.getByTestId("stats-pip-3").getAttribute("data-pip-median"),
		).toBe("false");
	});

	test("unânime com 2+ votos: badge + valor, sem mediana com testid antigo", () => {
		render(
			<StatsPill
				consensus={{ median: 5, mean: 5, range: [5, 5], unanimous: true }}
				votes={["5", "5"]}
			/>,
		);
		expect(screen.getByTestId("stats-unanimous-badge")).toHaveTextContent(
			/unânime/i,
		);
		expect(screen.queryByTestId("stats-median-value")).not.toBeInTheDocument();
		expect(screen.queryByTestId("stats-distribution")).not.toBeInTheDocument();
	});
});
