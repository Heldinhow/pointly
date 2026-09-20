---
target: guias PT+EN lote9
total_score: 33
p0_count: 0
p1_count: 0
timestamp: 2026-09-20T02-44-34Z
slug: apps-web-src-pages-guide-tsx
---
# Polish lote 9 — tipografia + TOC scroll-spy
- **Varredura tipográfica (6 telas)**: sem tracking abaixo de -0.04em; fontes <14px só em metadata mono (permitido); `tabular-nums` nos votos/stats/deck; `balance` nos headings. Fixes: `pretty` em `.pt-landing__prose p` + FAQ `dd` (70ch), callout 15→16px (volta à escala 14/16/17).
- **P2 TOC scroll-spy corrigido e verificado no browser**: `IntersectionObserver` (faixa 20% topo) + `aria-current` + estilo primary/600. Âncora `#a-rodada-em-7-passos` marca o item certo; sticky mantém o índice visível no scroll.
- Evidência: typecheck 0; guide/home/landing 22 pass; inspect confirma `aria-current=true`.
- Rescore guide heurística 7 (Flexibility): 2 → 3 → total **33/40 Good**. Landing mantida 33.
