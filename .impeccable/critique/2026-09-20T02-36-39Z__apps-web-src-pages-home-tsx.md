---
target: / + /en lote7
total_score: 30
p0_count: 0
p1_count: 1
timestamp: 2026-09-20T02-36-39Z
slug: apps-web-src-pages-home-tsx
---
# Polish lote 7 — home demo details + hero mobile
- **P2 stats corrigido e verificado ao vivo (mobile 390px)**: média/intervalo/pips atrás de `<details><summary>Detalhes/Details</summary>` (chave nova PT+EN); pós-reveal mostra lista + Mediana 5 + "Detalhes". Fluxo votar→revelar executado no browser, zero console errors.
- **P1 dupla-mesa parcial**: feltro mobile 300→240px, padding e story reduzidos. Snapshot mobile: hero compacto, CTAs/deck 44px+, sem overflow.
- Evidência: home.test pass (jsdom não colapsa details); typecheck 0.
- Rescore heurística 8 (Minimalismo): 3 → 4 → total **30/40 Good**.
