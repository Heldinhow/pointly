import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { Spinner } from "./spinner";

afterEach(() => cleanup());

const sizeClass: Record<string, string> = {
  sm: "h-4 w-4",
  default: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

describe("Spinner", () => {
  for (const [size, cls] of Object.entries(sizeClass)) {
    test(`size ${size} applies ${cls}`, () => {
      const { container } = render(
        <Spinner size={size as "sm" | "default" | "md" | "lg"} />,
      );
      const wrap = container.querySelector("[data-spinner]");
      expect(wrap).not.toBeNull();
      expect(wrap?.className).toContain(cls);
      expect(wrap?.className).toContain("animate-spin");
      expect(container.querySelector("svg")).not.toBeNull();
    });
  }
});
