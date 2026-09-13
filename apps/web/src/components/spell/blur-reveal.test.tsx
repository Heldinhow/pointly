import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { BlurReveal } from "./blur-reveal";

if (typeof globalThis.requestAnimationFrame === "undefined") {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback): number =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number): void => {
    clearTimeout(id);
  }) as typeof cancelAnimationFrame;
}

afterEach(() => cleanup());

describe("BlurReveal", () => {
  test("renders sr-only text for screen readers", () => {
    const { container } = render(<BlurReveal>Votar</BlurReveal>);
    const sr = container.querySelector(".sr-only");
    expect(sr).not.toBeNull();
    expect(sr?.textContent).toBe("Votar");
  });

  test("renders nothing when trigger is false", () => {
    const { container } = render(
      <BlurReveal trigger={false}>Oculto</BlurReveal>,
    );
    expect(container.querySelector(".sr-only")).toBeNull();
  });
});
