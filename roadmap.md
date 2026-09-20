# Roadmap — Pointly (SEO e descoberta orgânica)

> Canônico: [15 — SEO e descoberta orgânica](https://github.com/Heldinhow/pointly/issues/176) (wayfinder, **concluído em 2026-09-20**) — este arquivo é espelho fino, não duplica decisões.
> Pilares seguem valendo: sem cadastro, sala efêmera, sem plano pago. Linguagem: `CONTEXT.md`; visual: `DESIGN.md` + `apps/web/src/index.css`; regras executáveis: `packages/shared`.

## Now (ordem de execução)

- [x] **R1–R3 — pesquisas** (prerender; GSC/Bing/IndexNow; SERP pt-BR) — fechadas; findings no mapa e nas branches `research/15-r*`.
- [x] **G1 — Mecanismo de renderização + SEO on-site** — home pré-renderizada, robots/sitemap/canonical/JSON-LD, noindex em `/s/*` e `/join`, 404 real; SSOT em `apps/web/src/seo/routes.ts`.
- [x] **T1 — GSC + Bing:** domínio verificado no GSC (TXT no DNS; verificação automática) e site importado no Bing pelo GSC. **T3 — 301 www→apex** no Traefik File System do Dokploy (`redirectRegex`, priority 100): www → apex preservando path/query; apex e `/api`/`/ws` intactos.
- [x] **G2 — IA/URLs/metadados** — home = marca; landings = keywords transacionais; guias informacionais; EN em `/en/guides/…` com hreflang recíproco; schema FAQPage/Article; footer com "Guias". Metadados da home já aplicados em `apps/web/src/seo/routes.ts`.
- [x] **G3 — briefs dos 3 guias + `/guias`** (fechados no ticket). **P1 — protótipo do layout** (aprovado; protótipo em `/prototype/guia` e `/prototype/guias`).
- [x] **T5 — landings `/planning-poker` e `/scrum-poker`** (pré-renderizadas, FAQPage espelhado, ~1k palavras). **T6 — `/guias` + 3 guias pt/EN** (no ar: hub + 3 guias pt/EN + landings EN, hreflang recíproco; revisão EN do diff antes do T4). **T7 — home EN (`/en/`)** (no ar: `/en` pré-renderizada, hreflang recíproco, JSON-LD EN, header Home→`/en`; copy EN revisável no diff antes do T4). **T8 — seleção de idioma** (no ar: switcher EN/PT no header/footer + redirect da raiz para `/en` em navegador inglês, preferência no clique).
- [x] **T4 — Deploy + validação** (no ar; checklist de prod verde). **T2 — pós-deploy fechado**: GSC com sitemap Processado (14 páginas) + indexação solicitada para `/`, landings e `/en`; Bing com site importado e sitemap submetido; IndexNow com key na raiz e POST 202 (14 URLs).

## Later (fog do mapa 15 — só vira trabalho num novo esforço)

- Cadência de novos artigos e loop de métricas no GSC (pós-lançamento). Checkpoints assíncronos: dados do GSC (~1 dia), aba IndexNow do BWT e `site:pointly.space`.

## Explicitamente fora

- Backlinks/divulgação contínua; metadados do GitHub; migração Next.js/SSR; SEO das rotas internas do app; fôlego do lote 14 (sons, clima, copiar resultado).

## Histórico

- **SEO e descoberta orgânica (mapa 15, #176):** concluído em 2026-09-20 — 14 rotas pré-renderizadas pt/EN, robots/sitemap/canonical/hreflang/JSON-LD, GSC/Bing verificados, sitemap processado e indexação solicitada, IndexNow ativo, www→apex 301. Fog pós-lançamento (cadência de artigos, loop de métricas) fica para um novo mapa, se e quando virar trabalho.
- **Lote diversão (mapa 14, #167):** MVP executado e validado; roadmap substituído por este em 2026-09-19.
