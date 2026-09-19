import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Lang } from "./guide-content";
import { GUIDE_CONTENT, GUIDE_HUB } from "./guide-content";
import {
  GuidesHubEnPage,
  GuidesHubPtPage,
  HowToPlayEnPage,
  HowToPlayPtPage,
  StoryPointsEnPage,
  StoryPointsPtPage,
  WhatIsEnPage,
  WhatIsPtPage,
} from "./guide";

afterEach(() => {
  cleanup();
});

const GUIDES: ReadonlyArray<{
  lang: Lang;
  id: string;
  path: string;
  Page: () => React.ReactElement;
}> = [
  {
    lang: "pt-BR",
    id: "como-jogar",
    path: "/guias/como-jogar-planning-poker",
    Page: HowToPlayPtPage,
  },
  {
    lang: "pt-BR",
    id: "o-que-e",
    path: "/guias/o-que-e-planning-poker",
    Page: WhatIsPtPage,
  },
  {
    lang: "pt-BR",
    id: "story-points",
    path: "/guias/story-points",
    Page: StoryPointsPtPage,
  },
  {
    lang: "en",
    id: "how-to-play",
    path: "/en/guides/how-to-play-planning-poker",
    Page: HowToPlayEnPage,
  },
  {
    lang: "en",
    id: "what-is",
    path: "/en/guides/what-is-planning-poker",
    Page: WhatIsEnPage,
  },
  {
    lang: "en",
    id: "story-points",
    path: "/en/guides/story-points",
    Page: StoryPointsEnPage,
  },
];

describe("Guias (15.T6 — pt + EN)", () => {
  for (const { lang, id, path, Page } of GUIDES) {
    test(`${path}: H2s com âncora, TOC, FAQ visível e CTA`, () => {
      const content = GUIDE_CONTENT[lang][id];
      render(
        <MemoryRouter initialEntries={[path]}>
          <Page />
        </MemoryRouter>,
      );

      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
        content.h1,
      );

      // Volta para o hub do idioma.
      expect(
        screen.getByRole("link", { name: content.back.label }).getAttribute(
          "href",
        ),
      ).toBe(content.back.to);

      // TOC cobre todas as seções e cada âncora tem seu H2.
      const toc = within(screen.getByLabelText(content.tocLabel)).getAllByRole(
        "link",
      );
      expect(toc.length).toBe(content.sections.length);
      for (const section of content.sections) {
        expect(screen.getByRole("heading", { name: section.title })).toBeTruthy();
      }

      // FAQ visível espelha o conteúdo.
      const faq = within(screen.getByTestId("guide-faq")).getAllByRole("term");
      expect(faq.map((item) => item.textContent)).toEqual(
        content.faq.items.map((item) => item.question),
      );

      // CTA para criar sala.
      expect(
        screen
          .getAllByRole("link", { name: new RegExp(content.closing.cta, "i") })
          .map((link) => link.getAttribute("href"))
          .every((href) => href === "/join"),
      ).toBe(true);

      // Links relacionados presentes.
      for (const related of content.closing.related) {
        expect(
          screen.getByRole("link", { name: related.label }).getAttribute("href"),
        ).toBe(related.to);
      }
    });
  }

  const HUBS: ReadonlyArray<{
    lang: Lang;
    path: string;
    Page: () => React.ReactElement;
  }> = [
    { lang: "pt-BR", path: "/guias", Page: GuidesHubPtPage },
    { lang: "en", path: "/en/guides", Page: GuidesHubEnPage },
  ];

  for (const { lang, path, Page } of HUBS) {
    test(`${path}: intro + 3 cards na ordem de R3 + CTA`, () => {
      const content = GUIDE_HUB[lang];
      render(
        <MemoryRouter initialEntries={[path]}>
          <Page />
        </MemoryRouter>,
      );

      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
        content.h1,
      );
      const cards = screen
        .getAllByRole("link")
        .filter((link) => link.getAttribute("data-slot") === "card");
      expect(cards.map((card) => card.getAttribute("href"))).toEqual(
        content.cards.map((card) => card.to),
      );
      expect(
        screen
          .getByRole("link", { name: new RegExp(content.closing.cta, "i") })
          .getAttribute("href"),
      ).toBe("/join");
    });
  }
});
