/**
 * Pill primitive tests — T26 verify (1 of 5 minimum).
 */
import { describe, expect, test } from "bun:test";
import { render, screen } from "./test-helpers";
import { Pill } from "./pill";

describe("Pill — variants", () => {
	test("variant critical aplica bg-coral-soft", () => {
		render(<Pill variant="critical">00:42 · ROUND 03</Pill>);
		const pill = screen.getByText("00:42 · ROUND 03");
		expect(pill.className).toContain("bg-coral-soft");
		expect(pill.className).toContain("text-coral");
	});

	test("variant gold aplica bg mustard/15", () => {
		render(<Pill variant="gold">MEDIANA 5</Pill>);
		const pill = screen.getByText("MEDIANA 5");
		expect(pill.className).toContain("bg-mustard/15");
	});

	test("variant default aplica bg-surface", () => {
		render(<Pill variant="default">IDLE</Pill>);
		const pill = screen.getByText("IDLE");
		expect(pill.className).toContain("bg-surface");
	});

	test("variant ghost aplica border ink/20 sem bg", () => {
		render(<Pill variant="ghost">Aguardando…</Pill>);
		const pill = screen.getByText("Aguardando…");
		expect(pill.className).toContain("border-ink/20");
		expect(pill.className).toContain("bg-transparent");
	});
});

describe("Pill — sizes", () => {
	test("size sm aplica h-6", () => {
		render(<Pill size="sm">P</Pill>);
		const pill = screen.getByText("P");
		expect(pill.className).toContain("h-6");
	});

	test("size md aplica h-8 (default)", () => {
		render(<Pill>P</Pill>);
		const pill = screen.getByText("P");
		expect(pill.className).toContain("h-8");
	});
});
