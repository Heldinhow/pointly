---
target: landings PT+EN lote2
total_score: 33
p0_count: 0
p1_count: 1
timestamp: 2026-09-20T02-00-01Z
slug: apps-web-src-pages-landing-tsx
---
# Polish lote 2 — landing.tsx + landing.css
- **P1 âncora EN corrigido e verificado no browser**: `#como-funciona`/`#perguntas` → `#how-it-works`/`#faq` nas 4 rotas (componente compartilhado). Clique em "See how it works" em `/en/planning-poker` navega e dá scroll à seção. CSS não referenciava os ids.
- **P3 CSS**: `deck-note` 13→14px, `h2` 550→600 (spec).
- Evidência: landing.test 25 pass (com guide/join); snapshot EN confirma âncora funcional.
- Rescore heurística 4 (Consistency): 3 → 4 → total **33/40 Good**.
