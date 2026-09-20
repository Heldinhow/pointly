# Roadmap — Pointly (SEO e descoberta orgânica)

> Canônico: [15 — SEO e descoberta orgânica](https://github.com/Heldinhow/pointly/issues/176) (wayfinder) — este arquivo é espelho fino, não duplica decisões.
> Pilares seguem valendo: sem cadastro, sala efêmera, sem plano pago. Linguagem: `CONTEXT.md`; visual: `DESIGN.md` + `apps/web/src/index.css`; regras executáveis: `packages/shared`.

## Now (ordem de execução)

- [x] **R1–R3 — pesquisas** (prerender; GSC/Bing/IndexNow; SERP pt-BR) — fechadas; findings no mapa e nas branches `research/15-r*`.
- [x] **G1 — Mecanismo de renderização + SEO on-site** — home pré-renderizada, robots/sitemap/canonical/JSON-LD, noindex em `/s/*` e `/join`, 404 real; SSOT em `apps/web/src/seo/routes.ts`.
- [x] **T1 — GSC + Bing:** domínio verificado no GSC (TXT no DNS; verificação automática) e site importado no Bing pelo GSC. **T3 — 301 www→apex** no Dokploy/Traefik — **única pendência** (infra, passo a passo do mantenedor).
- [x] **G2 — IA/URLs/metadados** — home = marca; landings = keywords transacionais; guias informacionais; EN em `/en/guides/…` com hreflang recíproco; schema FAQPage/Article; footer com "Guias". Metadados da home já aplicados em `apps/web/src/seo/routes.ts`.
- [x] **G3 — briefs dos 3 guias + `/guias`** (fechados no ticket). **P1 — protótipo do layout** (aprovado; protótipo em `/prototype/guia` e `/prototype/guias`).
- [x] **T5 — landings `/planning-poker` e `/scrum-poker`** (pré-renderizadas, FAQPage espelhado, ~1k palavras). **T6 — `/guias` + 3 guias pt/EN** (no ar: hub + 3 guias pt/EN + landings EN, hreflang recíproco; revisão EN do diff antes do T4). **T7 — home EN (`/en/`)** (no ar: `/en` pré-renderizada, hreflang recíproco, JSON-LD EN, header Home→`/en`; copy EN revisável no diff antes do T4). **T8 — seleção de idioma** (no ar: switcher EN/PT no header/footer + redirect da raiz para `/en` em navegador inglês, preferência no clique).
- [x] **T4 — Deploy + validação** (no ar; checklist de prod verde). **T2 — pós-deploy fechado**: GSC com sitemap Processado (14 páginas) + indexação solicitada para `/`, landings e `/en`; Bing com site importado e sitemap submetido; IndexNow com key na raiz e POST 202 (14 URLs).

## Later (fog do mapa)

- Cadência de novos artigos, métricas no GSC e loop de otimização (pós-lançamento). EN dos guias entrou no T6 (revisão do diff antes do T4).

## Explicitamente fora

- Backlinks/divulgação contínua; metadados do GitHub; migração Next.js/SSR; SEO das rotas internas do app; fôlego do lote 14 (sons, clima, copiar resultado).

## Histórico

- **Lote diversão (mapa 14, #167):** MVP executado e validado; roadmap substituído por este em 2026-09-19.
