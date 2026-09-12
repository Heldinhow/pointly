import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CopyButton } from "./copy-button";

afterEach(() => cleanup());

describe("CopyButton", () => {
  test("initial icon state with copy aria-label", () => {
    const { container } = render(<CopyButton />);
    const btn = screen.getByRole("button", { name: "Copy to clipboard" });
    expect(btn).toBeDefined();
    // two stacked icons (check + copy)
    expect(container.querySelectorAll("svg").length).toBe(2);
  });

  test("click without value flips to Copied without clipboard access", () => {
    render(<CopyButton />);
    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    expect(screen.getByRole("button", { name: "Copied" })).toBeDefined();
  });

  test("size sm applies compact button class", () => {
    render(<CopyButton size="sm" />);
    expect(
      screen.getByRole("button", { name: "Copy to clipboard" }).className,
    ).toContain("h-8 w-8");
  });

  test("clipboard ausente → sem throw, chama onClick, sem feedback falso", () => {
    const nav = navigator as unknown as Record<string, unknown>;
    const original = nav.clipboard;
    let onClickCalls = 0;
    try {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });
      render(
        <CopyButton
          value="https://pointly.test/join?code=AB12"
          onClick={() => void (onClickCalls += 1)}
        />,
      );
      let threw: unknown = null;
      try {
        fireEvent.click(
          screen.getByRole("button", { name: "Copy to clipboard" }),
        );
      } catch (e) {
        threw = e;
      }
      expect(threw).toBeNull();
      expect(onClickCalls).toBe(1);
      // sem Clipboard API não há confirmação de cópia — segue "Copy…"
      expect(
        screen.getByRole("button", { name: "Copy to clipboard" }),
      ).toBeDefined();
    } finally {
      Object.defineProperty(navigator, "clipboard", {
        value: original,
        configurable: true,
      });
    }
  });
});
