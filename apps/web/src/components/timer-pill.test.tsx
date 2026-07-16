/**
 * TimerPill tests — T34 verify (≥2 of 5 minimum required).
 */
import { describe, expect, test } from "bun:test";
import { TimerPill, formatRound, formatTimer } from "./timer-pill";
import { render, screen } from "./ui/test-helpers";

describe("formatTimer / formatRound — T34 pure helpers", () => {
	test("formatTimer(60) → '60' (BUG-201: nunca '00:60')", () => {
		expect(formatTimer(60)).toBe("60");
	});

	test("formatTimer(42) → '42'", () => {
		expect(formatTimer(42)).toBe("42");
	});

	test("formatTimer(30) → '30' (limite crítico)", () => {
		expect(formatTimer(30)).toBe("30");
	});

	test("formatTimer(1) → '1'", () => {
		expect(formatTimer(1)).toBe("1");
	});

	test("formatTimer(0) → '0' (auto-reveal imminent)", () => {
		expect(formatTimer(0)).toBe("0");
	});

	test("formatTimer(-5) clampa para '0'", () => {
		expect(formatTimer(-5)).toBe("0");
	});

	test("formatTimer(99) → '01:39' (clamp a 99 — formato MM:SS legado)", () => {
		// Clamp interno em 99. 99/60 = 1min 39s.
		expect(formatTimer(99)).toBe("01:39");
	});

	test("formatTimer(125) → '01:39' (clamp a 99 antes do MM:SS)", () => {
		// 125 é clamped a 99 → mesmo resultado de formatTimer(99).
		expect(formatTimer(125)).toBe("01:39");
	});

	test("formatTimer nunca retorna '00:60' (BUG-201 regression)", () => {
		[0, 1, 15, 30, 45, 60, 75, 99].forEach((s) => {
			expect(formatTimer(s)).not.toBe("00:60");
		});
	});

	test("formatRound(1) → 'ROUND 01'", () => {
		expect(formatRound(1)).toBe("ROUND 01");
	});

	test("formatRound(12) → 'ROUND 12'", () => {
		expect(formatRound(12)).toBe("ROUND 12");
	});
});

describe("TimerPill — render (com props diretas, sem store)", () => {
	test("renderiza '42 · ROUND 03' para timer=42 round=3 (BUG-201)", () => {
		render(<TimerPill timer={42} round={3} />);
		expect(screen.getByTestId("timer-value")).toHaveTextContent("42");
		expect(screen.getByTestId("timer-round")).toHaveTextContent("ROUND 03");
	});

	test("renderiza '60' para timer=60 (nunca '00:60')", () => {
		render(<TimerPill timer={60} round={1} />);
		expect(screen.getByTestId("timer-value")).toHaveTextContent("60");
		expect(screen.getByTestId("timer-value").textContent).not.toContain(
			"00:60",
		);
	});

	test("critical=true (timer ≤30) aplica bg-coral-soft + border coral", () => {
		render(<TimerPill timer={25} round={1} critical={true} />);
		const pill = screen.getByTestId("timer-pill");
		expect(pill.className).toContain("bg-coral-soft");
		expect(pill.className).toContain("border-coral/40");
		expect(pill.getAttribute("data-timer-critical")).toBe("true");
	});

	test("timer=60 (não critical) usa bg-surface", () => {
		render(<TimerPill timer={60} round={1} critical={false} />);
		const pill = screen.getByTestId("timer-pill");
		expect(pill.className).toContain("bg-surface");
		expect(pill.getAttribute("data-timer-critical")).toBe("false");
	});

	test("timer=30 (limite crítico) — aplica critical via regra interna", () => {
		// timer=30 é o limite; a regra interna critical || timer <= 30 → true
		render(<TimerPill timer={30} round={1} />);
		expect(
			screen.getByTestId("timer-pill").getAttribute("data-timer-critical"),
		).toBe("true");
	});

	test("role='timer' + aria-label com segundos restantes", () => {
		render(<TimerPill timer={42} round={3} />);
		const pill = screen.getByTestId("timer-pill");
		expect(pill.getAttribute("role")).toBe("timer");
		expect(pill.getAttribute("aria-label")).toMatch(/42 segundos/i);
	});

	test("aria-live='off' (não anuncia cada segundo — evita ruído)", () => {
		render(<TimerPill timer={42} round={3} />);
		expect(screen.getByTestId("timer-pill").getAttribute("aria-live")).toBe(
			"off",
		);
	});
});
