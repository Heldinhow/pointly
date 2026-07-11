/**
 * BrandLockup tests — DESIGN-15 / #66.
 *
 * Cobre:
 *  - Render padrão: Ø + "Pointly"
 *  - Sizes (sm/md/lg/xl) — mark scale, wordmark scale
 *  - showWordmark=false — só o glyph
 *  - as prop — tag customizada (semântica)
 *  - a11y: Ø é aria-hidden (decorativo); wordmark é texto real
 */
import { describe, expect, test } from "bun:test";
import { render, screen } from "./test-helpers";
import { BrandLockup } from "./brand-lockup";

describe("BrandLockup — render", () => {
	test("renderiza Ø + 'Pointly' por padrão", () => {
		render(<BrandLockup />);
		// O glyph Ø está presente (aria-hidden mas no DOM)
		expect(screen.getByText("Ø")).toBeInTheDocument();
		// O wordmark é texto acessível
		expect(screen.getByText("Pointly")).toBeInTheDocument();
	});

	test("Ø glyph é aria-hidden (decorativo, não lido por screen reader)", () => {
		render(<BrandLockup />);
		const glyph = screen.getByText("Ø");
		expect(glyph.getAttribute("aria-hidden")).toBe("true");
	});

	test("não usa <Link> por padrão — Tag neutro", () => {
		render(<BrandLockup data-testid="lockup" />);
		const el = screen.getByTestId("lockup");
		expect(el.tagName).not.toBe("A");
	});
});

describe("BrandLockup — sizes", () => {
	test("size sm aplica text-[13px] ao wordmark", () => {
		render(<BrandLockup size="sm" />);
		const wm = screen.getByTestId("brand-wordmark");
		expect(wm.className).toContain("text-[13px]");
	});

	test("size md aplica text-[18px] ao wordmark (default)", () => {
		render(<BrandLockup size="md" />);
		const wm = screen.getByTestId("brand-wordmark");
		expect(wm.className).toContain("text-[18px]");
	});

	test("size lg aplica text-[22px] ao wordmark", () => {
		render(<BrandLockup size="lg" />);
		const wm = screen.getByTestId("brand-wordmark");
		expect(wm.className).toContain("text-[22px]");
	});

	test("size xl aplica text-[32px] ao wordmark", () => {
		render(<BrandLockup size="xl" />);
		const wm = screen.getByTestId("brand-wordmark");
		expect(wm.className).toContain("text-[32px]");
	});

	test("glyph Ø tem font-italic italic e text-coral", () => {
		render(<BrandLockup data-testid="lockup" />);
		const glyph = screen.getByText("Ø");
		expect(glyph.className).toContain("font-italic");
		expect(glyph.className).toContain("italic");
		expect(glyph.className).toContain("text-coral");
	});
});

describe("BrandLockup — showWordmark", () => {
	test("showWordmark=false esconde 'Pointly'", () => {
		render(<BrandLockup showWordmark={false} />);
		expect(screen.getByText("Ø")).toBeInTheDocument();
		expect(screen.queryByText("Pointly")).not.toBeInTheDocument();
	});

	test("showWordmark=true (default) mostra 'Pointly'", () => {
		render(<BrandLockup showWordmark />);
		expect(screen.getByText("Pointly")).toBeInTheDocument();
	});
});

describe("BrandLockup — as prop", () => {
	test("as='span' (default) renderiza <span>", () => {
		render(<BrandLockup data-testid="lockup" />);
		expect(screen.getByTestId("lockup").tagName).toBe("SPAN");
	});

	test("as='h1' renderiza <h1> com semântica de heading", () => {
		render(<BrandLockup as="h1" data-testid="lockup" />);
		expect(screen.getByTestId("lockup").tagName).toBe("H1");
	});

	test("as='div' renderiza <div>", () => {
		render(<BrandLockup as="div" data-testid="lockup" />);
		expect(screen.getByTestId("lockup").tagName).toBe("DIV");
	});
});