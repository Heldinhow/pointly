# Páginas públicas

## Sub-features

- Home PT (`/`) and EN (`/en`): "Create room" is the single primary hero CTA, "Enter with code" is the secondary link (`/join?mode=join`), and "Try a round" is a discreet link to the `#demo` section.
- Hero paragraph (home/landing) renders at 18px with `--secondary-foreground`; join form hints use the same token, all ≥4.5:1 in light and dark.
- Landing pages: `/planning-poker`, `/scrum-poker` (+ `/en/...`), with FAQ.
- Home PT (`/`) has a **Guias** section (`[data-testid="home-learn"]`) linking every PT guide in `apps/web/src/pages/guide-registry.pt.ts`, including `/planning-poker-online-gratis-comparativo`. Anchor text is the guide title and contains its keyword; `/guias/story-points` and `/guias/o-que-e-planning-poker` are priority entries.
- Guides hub `/guias` derives its cards from the same registry (including the `estimativa-agil` pillar; EN mirror `/en/guides` is also indexable). Every PT guide page renders Article + FAQPage + BreadcrumbList; the pillar also carries an ItemList mapa derived from the registry.
- Every PT guide page (including the comparison page) ends with **Leia também** (`[data-testid="guide-related"]`) with 3–4 related guides and the CTA **Criar sala grátis** → `/join`. Related anchors are descriptive registry titles, contain the target keyword, and never say “clique aqui”. EN guide pages keep their `Continue` / `Create room` copy.
- Language toggle and theme toggle in the header; footer nav to landing/guides.
- SEO surface: canonical, hreflang alternates, JSON-LD, and robots `noindex` on app routes. `sitemap.xml` (build artifact) lists exactly one canonical apex `https://pointly.space` URL per indexable route — no `www`, no `http`, no query/hash, matching each page's canonical. Every indexable route also appears in `public/llms.txt`.

## How to get to it (user POV)

Land on `/` from the SERP or type it. Header nav goes to "Entrar com código"; footer nav to Planning poker / Scrum poker / Guias. The language control swaps PT↔EN, the theme control light↔dark.

## Driving it

```
browser.open { url: "http://localhost:5173/", viewport: "mobile" }   // then mobile/tablet/desktop
browser.snapshot   // heading "Guias"; every guide + comparison link present
browser.open { url: "http://localhost:5173/guias/story-points", viewport: "desktop" }
browser.snapshot   // "Leia também" + related guides + "Criar sala grátis" → /join
browser.open { url: "http://localhost:5173/guias/o-que-e-planning-poker", viewport: "desktop" }
browser.snapshot   // same closing block, anchors with "planning poker"
browser.click { selector: "button[data-testid=\"language-switch\"]" }  // or the theme toggle
```

Check head-level SEO and the sitemap from the build, not the dev screen:

```
bun run build:web
rg -o '<loc>[^<]+</loc>' apps/web/dist/sitemap.xml
rg -n 'www\.pointly\.space|http://pointly\.space' apps/web/dist/sitemap.xml   // expect no output
rg -c 'Leia também' apps/web/dist/guias/story-points/index.html apps/web/dist/guias/o-que-e-planning-poker/index.html
rg -c 'Criar sala grátis' apps/web/dist/guias/story-points/index.html apps/web/dist/guias/o-que-e-planning-poker/index.html
```

In dev, SEO head tags are only fully materialized by the prerender in `bun run build:web`; do not claim prerendered metadata from the dev server.

After `bun run build:web`, the deterministic check runs over `apps/web/dist`: each prerendered `…/index.html` must carry the expected `<title>`/meta description lengths, one canonical, exactly one `<h1>`, parseable `application/ld+json`, and links to the hub; `sitemap.xml` and `llms.txt` must contain every indexable route once.

## Gotchas

- Dev serves SPA HTML; canonical/hreflang/sitemap are build artifacts (`apps/web/src/seo/routes.ts` is the SSOT). Prove them with a build, not the dev server.
- Guide links are PT-only for now. `apps/web/src/pages/guide-registry.pt.ts` is the guide-list SSOT; adding a guide means adding its registry entry, content and SEO route together — tests catch drift.
- Root `/` may client-redirect a first-time English-locale visitor to `/en` — assert the language you actually expect.
- This is the lowest-risk, purely visual surface; `bun run verify` covers its unit tests and typecheck without a browser.
