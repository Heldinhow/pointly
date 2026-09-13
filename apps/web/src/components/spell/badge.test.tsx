import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { Badge } from "./badge";

afterEach(() => cleanup());

describe("Badge", () => {
  test("renders children with base classes", () => {
    render(<Badge>VOTED</Badge>);
    const el = screen.getByText("VOTED");
    expect(el.className).toContain("rounded-sm");
    expect(el.className).toContain("font-medium");
  });

  test("default variant applies neutral background", () => {
    render(<Badge>NEUTRO</Badge>);
    expect(screen.getByText("NEUTRO").className).toContain("bg-neutral-700");
  });

  test("color variants render (red/green)", () => {
    render(
      <>
        <Badge variant="red">R</Badge>
        <Badge variant="green">G</Badge>
      </>,
    );
    expect(screen.getByText("R").className).toContain("bg-red-100");
    expect(screen.getByText("G").className).toContain("bg-green-100");
  });

  test("size sm applies compact padding", () => {
    render(<Badge size="sm">S</Badge>);
    expect(screen.getByText("S").className).toContain("p-1");
  });
});
