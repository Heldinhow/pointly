import { describe, expect, test } from "bun:test";
import { GUIDE_CONTENT } from "../pages/guide-content";
import { LANDING_CONTENT } from "../pages/landing-content";
import { buildSitemap, SEO_ROUTES, SITE_URL } from "./routes";

const INDEXABLE = SEO_ROUTES.filter((route) => route.indexable);

describe("Registro SEO (15.T6 — hreflang, sitemap e schema)", () => {
  test("toda alternativa hreflang existe no registro e é recíproca", () => {
    for (const route of INDEXABLE) {
      const alternates = route.alternates ?? [];
      if (alternates.length === 0) continue;

      const xDefault = alternates.find((alt) => alt.lang === "x-default");
      expect(xDefault).toBeTruthy();
      // x-default sempre aponta para a versão pt.
      expect(xDefault?.path).toBe(
        route.lang === "pt-BR"
          ? route.path
          : alternates.find((alt) => alt.lang === "pt-BR")?.path,
      );

      for (const alternate of alternates) {
        if (alternate.lang === "x-default") continue;
        const target = SEO_ROUTES.find((r) => r.path === alternate.path);
        expect(target).toBeTruthy();
        expect(target?.lang).toBe(alternate.lang);
        expect(target?.indexable).toBe(true);

        const back = (target?.alternates ?? []).find(
          (alt) => alt.lang === route.lang,
        );
        expect(back?.path).toBe(route.path);
      }
    }
  });

  test("sitemap lista as rotas indexáveis com alternates", () => {
    const sitemap = buildSitemap();
    for (const route of INDEXABLE) {
      expect(sitemap).toContain(`<loc>${SITE_URL}${route.path}</loc>`);
    }
    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="en"');
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="pt-BR"');
    expect(sitemap).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default"',
    );
  });

  test("FAQPage espelha o FAQ visível de landings e guias", () => {
    const cases: ReadonlyArray<{
      path: string;
      items: ReadonlyArray<{ question: string; answer: string }>;
    }> = [
      {
        path: "/planning-poker",
        items: LANDING_CONTENT["pt-BR"]["planning-poker"].faq.items,
      },
      {
        path: "/scrum-poker",
        items: LANDING_CONTENT["pt-BR"]["scrum-poker"].faq.items,
      },
      {
        path: "/en/planning-poker",
        items: LANDING_CONTENT.en["planning-poker"].faq.items,
      },
      {
        path: "/en/scrum-poker",
        items: LANDING_CONTENT.en["scrum-poker"].faq.items,
      },
      {
        path: "/guias/como-jogar-planning-poker",
        items: GUIDE_CONTENT["pt-BR"]["como-jogar"].faq.items,
      },
      {
        path: "/guias/o-que-e-planning-poker",
        items: GUIDE_CONTENT["pt-BR"]["o-que-e"].faq.items,
      },
      {
        path: "/guias/story-points",
        items: GUIDE_CONTENT["pt-BR"]["story-points"].faq.items,
      },
      {
        path: "/en/guides/how-to-play-planning-poker",
        items: GUIDE_CONTENT.en["how-to-play"].faq.items,
      },
      {
        path: "/en/guides/what-is-planning-poker",
        items: GUIDE_CONTENT.en["what-is"].faq.items,
      },
      {
        path: "/en/guides/story-points",
        items: GUIDE_CONTENT.en["story-points"].faq.items,
      },
    ];

    for (const { path, items } of cases) {
      const route = SEO_ROUTES.find((r) => r.path === path);
      expect(route).toBeTruthy();
      const faq = route?.jsonLd?.find(
        (entry) => entry["@type"] === "FAQPage",
      ) as
        | {
            mainEntity: ReadonlyArray<{
              name: string;
              acceptedAnswer: { text: string };
            }>;
          }
        | undefined;
      expect(faq).toBeTruthy();
      expect(faq?.mainEntity.map((question) => question.name)).toEqual(
        items.map((item) => item.question),
      );
      expect(
        faq?.mainEntity.map((question) => question.acceptedAnswer.text),
      ).toEqual(items.map((item) => item.answer));
    }
  });

  test("guias publicam Article com headline, idioma e datas", () => {
    const cases: ReadonlyArray<{ path: string; headline: string; lang: string }> = [
      {
        path: "/guias/como-jogar-planning-poker",
        headline: GUIDE_CONTENT["pt-BR"]["como-jogar"].h1,
        lang: "pt-BR",
      },
      {
        path: "/en/guides/story-points",
        headline: GUIDE_CONTENT.en["story-points"].h1,
        lang: "en",
      },
    ];

    for (const { path, headline, lang } of cases) {
      const route = SEO_ROUTES.find((r) => r.path === path);
      const article = route?.jsonLd?.find(
        (entry) => entry["@type"] === "Article",
      ) as
        | {
            headline: string;
            inLanguage: string;
            datePublished: string;
            dateModified: string;
            author: { name: string };
          }
        | undefined;
      expect(article?.headline).toBe(headline);
      expect(article?.inLanguage).toBe(lang);
      expect(article?.author.name).toBe("Pointly");
      expect(article?.datePublished).toBeTruthy();
      expect(article?.dateModified).toBeTruthy();
    }
  });
});
