# Páginas públicas

## Sub-features

- Home PT (`/`) and EN (`/en`) with a create-room call to action.
- Landing pages: `/planning-poker`, `/scrum-poker` (+ `/en/...`), with FAQ.
- Guides hub `/guias` (PT, links every guide card, including the `estimativa-agil` pillar; EN mirror `/en/guides` is also indexable) and three PT articles (`como-jogar-planning-poker`, `o-que-e-planning-poker`, `story-points`) plus EN mirrors under `/en/guides/*`.
- pt-BR guide batch, all with Article + FAQPage + BreadcrumbList (the pillar also carries an ItemList mapa): `/guias/planning-poker-remoto`, `/guias/story-points-vs-horas`, `/guias/fibonacci-estimativa-agil`, `/guias/t-shirt-sizing`, `/planning-poker-online-gratis-comparativo`, `/guias/estimativa-agil`, `/guias/votos-divergentes-planning-poker`, `/guias/planning-poker-para-devs`, `/guias/agenda-sessao-planning-poker`, `/guias/scrum-poker-vs-planning-poker`.
- Language toggle and theme toggle in the header; footer nav to landing/guides.
- SEO surface: canonical, hreflang alternates, JSON-LD, and robots `noindex` on app routes. Every indexable route appears once in `sitemap.xml` (build artifact) and in `public/llms.txt`.

## How to get to it (user POV)

Land on `/` from the SERP or type it. Header nav goes to "Entrar com código"; footer nav to Planning poker / Scrum poker / Guias. The language control swaps PT↔EN, the theme control light↔dark.

## Driving it

```
browser.open { url: "http://localhost:5173/", viewport: "mobile" }   // then mobile/tablet/desktop
browser.snapshot   // read the copy and nav labels
browser.click { selector: "button[data-testid=\"language-switch\"]" }  // or the theme toggle
```

Check head-level SEO via fetch, not the screen:

```
curl -s http://localhost:3001/...   // public pages are served by Vite in dev; verify prerender in `bun run build:web`
```

In dev, SEO head tags are only fully materialized by the prerender in `bun run build:web`; do not claim prerendered metadata from the dev server.

After `bun run build:web`, the deterministic check runs over `apps/web/dist`: each prerendered `…/index.html` must carry the expected `<title>`/meta description lengths, one canonical, exactly one `<h1>`, parseable `application/ld+json`, and links to the hub; `sitemap.xml` and `llms.txt` must contain every indexable route once.

## Gotchas

- Dev serves SPA HTML; canonical/hreflang/sitemap are build artifacts (`apps/web/src/seo/routes.ts` is the SSOT). Prove them with a build, not the dev server.
- Root `/` may client-redirect a first-time English-locale visitor to `/en` — assert the language you actually expect.
- This is the lowest-risk, purely visual surface; `bun run verify` covers its unit tests and typecheck without a browser.
