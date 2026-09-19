# Roadmap — Pointly (SEO e descoberta orgânica)

> Canônico: [15 — SEO e descoberta orgânica](https://github.com/Heldinhow/pointly/issues/176) (wayfinder) — este arquivo é espelho fino, não duplica decisões.
> Pilares seguem valendo: sem cadastro, sala efêmera, sem plano pago. Linguagem: `CONTEXT.md`; visual: `DESIGN.md` + `apps/web/src/index.css`; regras executáveis: `packages/shared`.

## Now (ordem de execução)

- [x] **R1–R3 — pesquisas** (prerender; GSC/Bing/IndexNow; SERP pt-BR) — fechadas; findings no mapa e nas branches `research/15-r*`.
- [x] **G1 — Mecanismo de renderização + SEO on-site** — home pré-renderizada, robots/sitemap/canonical/JSON-LD, noindex em `/s/*` e `/join`, 404 real; SSOT em `apps/web/src/seo/routes.ts`.
- [ ] **T1 — GSC + Bing:** verificar domínio (TXT). **T3 — 301 www→apex** no Dokploy/Traefik.
- [x] **G2 — IA/URLs/metadados** — home = marca; landings = keywords transacionais; guias informacionais; EN em `/en/guides/…` com hreflang recíproco; schema FAQPage/Article; footer com "Guias". Metadados da home já aplicados em `apps/web/src/seo/routes.ts`.
- [x] **G3 — briefs dos 3 guias + `/guias`** (fechados no ticket). **P1 — protótipo do layout** (aprovado; protótipo em `/prototype/guia` e `/prototype/guias`).
- [x] **T5 — landings `/planning-poker` e `/scrum-poker`** (pré-renderizadas, FAQPage espelhado, ~1k palavras). **T6 — `/guias` + 3 guias pt/EN** (no ar: hub + 3 guias pt/EN + landings EN, hreflang recíproco; revisão EN do diff antes do T4). **T7 — home EN (`/en/`)** (no ar: `/en` pré-renderizada, hreflang recíproco, JSON-LD EN, header Home→`/en`; copy EN revisável no diff antes do T4). **T8 — seleção de idioma** (no ar: switcher EN/PT no header/footer + redirect da raiz para `/en` em navegador inglês, preferência no clique).
- [x] **T4 — Deploy + validação** (no ar; checklist de prod verde). **T2 — IndexNow no ar** (key na raiz validada por curl + POST 202 com as 14 URLs); **sitemap e inspeção no GSC/Bing aguardam o T1** (dependência registrada no ticket). **T1 — TXT GSC/Bing** e **T3 — 301 www→apex** pendentes (usuário).

## Later (fog do mapa)

- Cadência de novos artigos, métricas no GSC e loop de otimização (pós-lançamento). EN dos guias entrou no T6 (revisão do diff antes do T4).

## Explicitamente fora

- Backlinks/divulgação contínua; metadados do GitHub; migração Next.js/SSR; SEO das rotas internas do app; fôlego do lote 14 (sons, clima, copiar resultado).

## Histórico

- **Lote diversão (mapa 14, #167):** MVP executado e validado; roadmap substituído por este em 2026-09-19.
