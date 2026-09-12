import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { TiltCard } from "./tilt-card";

afterEach(() => cleanup());

describe("TiltCard", () => {
  test("renders children with tilt base classes", () => {
    const { container } = render(
      <TiltCard>
        <span>vote-5</span>
      </TiltCard>,
    );
    expect(screen.getByText("vote-5")).toBeDefined();
    const card = container.firstElementChild;
    expect(card?.className).toContain("will-change-transform");
    expect(card?.className).toContain("relative");
  });

  test("renders spotlight overlay by default", () => {
    const { container } = render(<TiltCard>hi</TiltCard>);
    expect(
      container.querySelector(".pointer-events-none.absolute"),
    ).not.toBeNull();
  });

  test("spotlight={false} removes overlay", () => {
    const { container } = render(<TiltCard spotlight={false}>hi</TiltCard>);
    expect(
      container.querySelector(".pointer-events-none.absolute"),
    ).toBeNull();
  });
});
