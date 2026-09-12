import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { GradientWaveText } from "./gradient-wave-text";

// jsdom/bun may lack rAF; the component drives its wave from one.
if (typeof globalThis.requestAnimationFrame === "undefined") {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback): number =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number): void => {
    clearTimeout(id);
  }) as typeof cancelAnimationFrame;
}

afterEach(() => cleanup());

describe("GradientWaveText", () => {
  test("renders text content", () => {
    render(<GradientWaveText>Pointly</GradientWaveText>);
    expect(screen.getByText("Pointly")).toBeDefined();
  });

  test("paused render keeps text and base layout class", () => {
    const { container } = render(
      <GradientWaveText paused>Pausado</GradientWaveText>,
    );
    expect(screen.getByText("Pausado")).toBeDefined();
    expect(container.firstElementChild?.className).toContain("flex");
  });
});
