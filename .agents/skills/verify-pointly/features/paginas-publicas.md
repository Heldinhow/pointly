# Páginas públicas

## Sub-features

- Home PT (`/`) and EN (`/en`) with a create-room call to action.
- Landing pages: `/planning-poker`, `/scrum-poker` (+ `/en/...`), with FAQ.
- Guides hub `/guias` and three PT articles (`como-jogar-planning-poker`, `o-que-e-planning-poker`, `story-points`) plus EN mirrors under `/en/guides/*`.
- Language toggle and theme toggle in the header; footer nav to landing/guides.
- SEO surface: canonical, hreflang alternates, JSON-LD, and robots `noindex` on app routes.

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

## Gotchas

- Dev serves SPA HTML; canonical/hreflang/sitemap are build artifacts (`apps/web/src/seo/routes.ts` is the SSOT). Prove them with a build, not the dev server.
- Root `/` may client-redirect a first-time English-locale visitor to `/en` — assert the language you actually expect.
- This is the lowest-risk, purely visual surface; `bun run verify` covers its unit tests and typecheck without a browser.
