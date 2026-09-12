import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { RichButton } from "./rich-button";

afterEach(() => cleanup());

describe("RichButton", () => {
  test("renders string label", () => {
    render(<RichButton>Criar sala</RichButton>);
    expect(
      screen.getByRole("button", { name: "Criar sala" }),
    ).toBeDefined();
  });

  test("disabled state keeps disabled attr and class", () => {
    render(<RichButton disabled>Revelar</RichButton>);
    const btn = screen.getByRole("button", { name: "Revelar" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    expect(btn.className).toContain("disabled:opacity-50");
  });

  test("color + size classes applied", () => {
    render(
      <RichButton color="emerald" size="lg">
        OK
      </RichButton>,
    );
    const btn = screen.getByRole("button", { name: "OK" });
    expect(btn.className).toContain("from-emerald-600/85");
    expect(btn.className).toContain("h-10");
  });
});
