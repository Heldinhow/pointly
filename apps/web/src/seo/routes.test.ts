import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { GUIDE_CONTENT, GUIDE_HUB } from "../pages/guide-content";
import { LANDING_CONTENT } from "../pages/landing-content";
import { PUBLIC_PATHS } from "./paths";
import {
	buildSitemap,
	GUIDES_MODIFIED,
	headForRoute,
	SEO_ROUTES,
	SITE_URL,
} from "./routes";

const INDEXABLE = SEO_ROUTES.filter((route) => route.indexable);

describe("Registro SEO (15.T6 — hreflang, sitemap e schema)", () => {
  test("toda alternativa hreflang existe no registro e é recíproca", () => {
    for (const route of INDEXABLE) {
      const alternates = route.alternates ?? [];
      if (alternates.length === 0) continue;

      // Auto-referência exigida pelo Google: a página lista a si mesma.
      expect(alternates.find((alt) => alt.lang === route.lang)?.path).toBe(
        route.path,
      );

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
      if ((route.alternates?.length ?? 0) === 0) continue;
      expect(sitemap).toContain(
        `<xhtml:link rel="alternate" hreflang="${route.lang}" href="${SITE_URL}${route.path}" />`,
      );
    }
    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="en"');
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="pt-BR"');
    expect(sitemap).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default"',
    );
  });

  test("sitemap é apex-only: nenhum www.pointly.space e todo loc sob SITE_URL", () => {
    const sitemap = buildSitemap();

    expect(SITE_URL).toBe("https://pointly.space");
    // `www.` solto aparece no namespace do sitemaps.org; o host é o que importa.
    expect(sitemap).not.toContain("www.pointly.space");
    expect(sitemap).not.toContain("http://pointly.space");

    const locs = sitemap.match(/<loc>[^<]+<\/loc>/g) ?? [];
    expect(locs.length).toBe(INDEXABLE.length);
    for (const loc of locs) {
      expect(loc).toMatch(/^<loc>https:\/\/pointly\.space\//);
    }

    const hrefs = sitemap.match(/href="[^"]+"/g) ?? [];
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(/^href="https:\/\/pointly\.space\//);
    }
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
        path: "/guias/planning-poker-remoto",
        items: GUIDE_CONTENT["pt-BR"]["planning-poker-remoto"].faq.items,
      },
      {
        path: "/guias/story-points-vs-horas",
        items: GUIDE_CONTENT["pt-BR"]["story-points-vs-horas"].faq.items,
      },
      {
        path: "/guias/fibonacci-estimativa-agil",
        items: GUIDE_CONTENT["pt-BR"]["fibonacci-estimativa-agil"].faq.items,
      },
      {
        path: "/guias/t-shirt-sizing",
        items: GUIDE_CONTENT["pt-BR"]["t-shirt-sizing"].faq.items,
      },
      {
        path: "/planning-poker-online-gratis-comparativo",
        items: GUIDE_CONTENT["pt-BR"]["comparativo-ferramentas"].faq.items,
      },
      {
        path: "/guias/estimativa-agil",
        items: GUIDE_CONTENT["pt-BR"]["estimativa-agil"].faq.items,
      },
      {
        path: "/guias/votos-divergentes-planning-poker",
        items: GUIDE_CONTENT["pt-BR"]["votos-divergentes-planning-poker"].faq
          .items,
      },
      {
        path: "/guias/planning-poker-para-devs",
        items: GUIDE_CONTENT["pt-BR"]["planning-poker-para-devs"].faq.items,
      },
      {
        path: "/guias/agenda-sessao-planning-poker",
        items: GUIDE_CONTENT["pt-BR"]["agenda-sessao-planning-poker"].faq.items,
      },
      {
        path: "/guias/scrum-poker-vs-planning-poker",
        items: GUIDE_CONTENT["pt-BR"]["scrum-poker-vs-planning-poker"].faq.items,
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

  test("guias levam lastmod real; demais rotas não inventam data", () => {
    const sitemap = buildSitemap();
    const guides = SEO_ROUTES.filter((route) => route.ogType === "article");
    expect(guides.length).toBeGreaterThan(0);
    for (const route of guides) {
      expect(route.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(sitemap).toContain(
        `<loc>${SITE_URL}${route.path}</loc>\n    <lastmod>${route.lastmod}</lastmod>`,
      );
    }
    const withoutDate = SEO_ROUTES.filter(
      (route) => route.indexable && route.ogType !== "article",
    );
    expect(withoutDate.length).toBeGreaterThan(0);
    for (const route of withoutDate) {
      expect(route.lastmod).toBeUndefined();
    }
    expect(sitemap.match(/<lastmod>[^<]+<\/lastmod>/g)?.length).toBe(
      guides.length,
    );
  });

  test("head tem OG completo, locale e datas de artigo", () => {
    const home = SEO_ROUTES.find((route) => route.path === "/");
    const guide = SEO_ROUTES.find(
      (route) => route.path === "/guias/como-jogar-planning-poker",
    );
    if (!home || !guide) throw new Error("rotas SEO ausentes");

    const homeHead = headForRoute(home);
    const byProp = (elements: typeof homeHead.elements, property: string) =>
      elements.find((element) => element.props.property === property)?.props
        .content;
    const byName = (elements: typeof homeHead.elements, name: string) =>
      elements.find((element) => element.props.name === name)?.props.content;

    expect(byProp(homeHead.elements, "og:type")).toBe("website");
    expect(byProp(homeHead.elements, "og:site_name")).toBe("Pointly");
    expect(byProp(homeHead.elements, "og:locale")).toBe("pt_BR");
    expect(byProp(homeHead.elements, "og:locale:alternate")).toBe("en_US");
    expect(byProp(homeHead.elements, "og:image")).toBe(
      `${SITE_URL}/images/pointly-og.jpg`,
    );
    expect(byProp(homeHead.elements, "og:image:width")).toBe("1200");
    expect(byProp(homeHead.elements, "og:image:height")).toBe("630");
    expect(byProp(homeHead.elements, "og:image:alt")).toBeTruthy();
    expect(byName(homeHead.elements, "twitter:image:alt")).toBeTruthy();
    const website = home.jsonLd?.find((entry) => entry["@type"] === "WebSite");
    expect(website).toBeTruthy();

    const guideHead = headForRoute(guide);
    expect(byProp(guideHead.elements, "og:type")).toBe("article");
    expect(byProp(guideHead.elements, "og:locale")).toBe("pt_BR");
    expect(
      byProp(guideHead.elements, "article:published_time"),
    ).toBeTruthy();
    expect(byProp(guideHead.elements, "article:modified_time")).toBe(
      GUIDES_MODIFIED,
    );
    const article = guide.jsonLd?.find(
      (entry) => entry["@type"] === "Article",
    ) as { image?: { url?: string; width?: number; height?: number } };
    expect(article?.image?.url).toBe(`${SITE_URL}/images/pointly-og.jpg`);
    expect(article?.image?.width).toBe(1200);
    expect(article?.image?.height).toBe(630);
  });

  test("guias publicam BreadcrumbList até a raiz", () => {
    const guides = SEO_ROUTES.filter((route) => route.ogType === "article");
    for (const route of guides) {
      const breadcrumb = route.jsonLd?.find(
        (entry) => entry["@type"] === "BreadcrumbList",
      ) as
        | {
            itemListElement: ReadonlyArray<{
              position: number;
              name: string;
              item: string;
            }>;
          }
        | undefined;
      expect(breadcrumb).toBeTruthy();
      const trail = breadcrumb?.itemListElement ?? [];
      expect(trail.length).toBeGreaterThanOrEqual(2);
      expect(trail[0]?.item).toBe(
        `${SITE_URL}${route.lang === "en" ? "/en" : "/"}`,
      );
      expect(trail.at(-1)?.item).toBe(`${SITE_URL}${route.path}`);
      for (const [index, crumb] of trail.entries()) {
        expect(crumb.position).toBe(index + 1);
        expect(crumb.item.startsWith(SITE_URL)).toBe(true);
      }
    }
  });

  test("/guias publica CollectionPage com ItemList espelhando os cards", () => {
    const route = SEO_ROUTES.find((r) => r.path === "/guias");
    const collection = route?.jsonLd?.find(
      (entry) => entry["@type"] === "CollectionPage",
    ) as
      | {
          inLanguage: string;
          url: string;
          mainEntity: {
            "@type": string;
            itemListElement: ReadonlyArray<{
              position: number;
              name: string;
              url: string;
            }>;
          };
        }
      | undefined;
    expect(collection?.url).toBe(`${SITE_URL}/guias`);
    expect(collection?.inLanguage).toBe("pt-BR");
    const cards = GUIDE_HUB["pt-BR"].cards;
    expect(collection?.mainEntity["@type"]).toBe("ItemList");
    expect(
      collection?.mainEntity.itemListElement.map((item) => item.url),
    ).toEqual(cards.map((card) => `${SITE_URL}${card.to}`));
    expect(
      collection?.mainEntity.itemListElement.map((item) => item.position),
    ).toEqual(cards.map((_, index) => index + 1));
  });

  test("titles e descriptions ficam em faixas de SERP", () => {
    for (const route of INDEXABLE) {
      expect(route.title.length).toBeGreaterThanOrEqual(20);
      expect(route.title.length).toBeLessThanOrEqual(60);
      expect(route.description.length).toBeGreaterThanOrEqual(100);
      expect(route.description.length).toBeLessThanOrEqual(160);
    }
  });

  test("toda rota indexável aparece no llms.txt", () => {
    const llms = readFileSync(
      new URL("../../public/llms.txt", import.meta.url),
      "utf8",
    );
    for (const route of INDEXABLE) {
      expect(llms).toContain(`${SITE_URL}${route.path}`);
    }
  });

  test("PUBLIC_PATHS reflete o registro indexável (mesmo path, lang e alternates)", () => {
    for (const entry of PUBLIC_PATHS) {
      const route = SEO_ROUTES.find((candidate) => candidate.path === entry.path);
      expect(route).toBeTruthy();
      expect(route?.indexable).toBe(true);
      expect(route?.lang).toBe(entry.lang);
      expect(route?.alternates ?? []).toEqual(entry.alternates);
    }
    // Toda rota indexável está no índice leve, exceto comparações triviais.
    for (const route of INDEXABLE) {
      expect(PUBLIC_PATHS.some((entry) => entry.path === route.path)).toBe(true);
    }
  });
});
