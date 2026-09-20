---
target: guias PT+EN lote7
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-09-20T02-36-39Z
slug: apps-web-src-pages-guide-tsx
---
# Polish lote 7 — guide FAQ accordion nativo
- **P1 corrigido e verificado no browser**: `dl>div>dt/dd` → `div>details>summary+p` (nativo, sem JS, conteúdo no DOM = SEO/JSON-LD intactos); 1º item aberto; marcador `+` mono com rotação, `focus-visible` em ring. Snapshot /guias/como-jogar confirma 1ª resposta expandida e demais colapsadas.
- **Teste atualizado**: `term` roles → asserts por texto de pergunta/resposta.
- Evidência: guide.test pass; typecheck 0.
- Rescore heurística 8 (Minimalismo): 3 → 4 → total **32/40 Good**.
