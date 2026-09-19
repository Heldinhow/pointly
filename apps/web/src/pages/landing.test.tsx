import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { LandingId, Lang } from "./landing-content";
import { LANDING_CONTENT } from "./landing-content";
import {
  PlanningPokerEnPage,
  PlanningPokerLandingPage,
  ScrumPokerEnPage,
  ScrumPokerLandingPage,
} from "./landing";

afterEach(() => {
  cleanup();
});

const LANDINGS: ReadonlyArray<{
  id: LandingId;
  lang: Lang;
  path: string;
  Page: () => React.ReactElement;
  sibling: string;
  guides: string;
  keyword: RegExp;
}> = [
  {
    id: "planning-poker",
    lang: "pt-BR",
    path: "/planning-poker",
    Page: PlanningPokerLandingPage,
    sibling: "/scrum-poker",
    guides: "/guias",
    keyword: /grátis/i,
  },
  {
    id: "scrum-poker",
    lang: "pt-BR",
    path: "/scrum-poker",
    Page: ScrumPokerLandingPage,
    sibling: "/planning-poker",
    guides: "/guias",
    keyword: /grátis/i,
  },
  {
    id: "planning-poker",
    lang: "en",
    path: "/en/planning-poker",
    Page: PlanningPokerEnPage,
    sibling: "/en/scrum-poker",
    guides: "/en/guides",
    keyword: /free/i,
  },
  {
    id: "scrum-poker",
    lang: "en",
    path: "/en/scrum-poker",
    Page: ScrumPokerEnPage,
    sibling: "/en/planning-poker",
    guides: "/en/guides",
    keyword: /free/i,
  },
];

describe("Landings de aquisição (15.T5/T6 — pt + EN)", () => {
  for (const { id, lang, path, Page, sibling, guides, keyword } of LANDINGS) {
    test(`${path}: H1 com keyword, passos, FAQ visível e CTAs`, () => {
      const content = LANDING_CONTENT[lang][id];
      render(
        <MemoryRouter initialEntries={[path]}>
          <Page />
        </MemoryRouter>,
      );

      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
        content.h1,
      );
      expect(screen.getByTestId("landing-hero").textContent).toMatch(keyword);

      // Como funciona em 3–6 passos (estrutura vencedora de R3).
      const steps = within(screen.getByTestId("landing-steps")).getAllByRole(
        "listitem",
      );
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps.length).toBeLessThanOrEqual(6);

      // FAQ visível com respostas.
      const faq = within(screen.getByTestId("landing-faq")).getAllByRole(
        "term",
      );
      expect(faq.length).toBe(content.faq.items.length);
      expect(faq.length).toBeGreaterThanOrEqual(6);

      // CTA para criar sala no topo, no meio e no fechamento.
      const createLinks = screen
        .getAllByRole("link", { name: new RegExp(content.ctaLabel, "i") })
        .map((link) => link.getAttribute("href"));
      expect(createLinks.length).toBeGreaterThanOrEqual(3);
      expect(new Set(createLinks)).toEqual(new Set(["/join"]));

      // Link interno para a landing irmã e para o hub de guias.
      expect(
        screen
          .getByRole("link", {
            name: new RegExp(content.crossLink.label, "i"),
          })
          .getAttribute("href"),
      ).toBe(sibling);
      expect(
        screen
          .getByRole("link", {
            name: new RegExp(content.guidesLink.label, "i"),
          })
          .getAttribute("href"),
      ).toBe(guides);
    });
  }
});
