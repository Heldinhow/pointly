---
target: "/s/:code PT+EN lote3"
total_score: 28
p0_count: 0
p1_count: 1
timestamp: 2026-09-20T02-02-57Z
slug: apps-web-src-pages-arena-tsx
---
# Polish lote 3 — arena.css + projectile-menu.css (touch 44px)
- **P1 touch corrigido (CSS-only)**: `.arena-reveal [data-slot=button]` 40→44px; `.projectile-menu-item--nudge` 36→44px (igual aos demais itens do menu).
- Evidência: typecheck 0; arena.test 76 pass. Verificação visual do reveal/nudge em sala viva pendente (sem sala aberta neste turno).
- Score mantido **28/40 Good**. Pendente: invite vs resultados (reorder no DOM, maior risco — próximo lote).
