---
target: "/s/:code PT+EN lote6"
total_score: 29
p0_count: 0
p1_count: 0
timestamp: 2026-09-20T02-33-52Z
slug: apps-web-src-pages-arena-tsx
---
# Polish lote 6 — arena presence ≤1050px + prova viva
- **P3 corrigido**: `.arena-live-status > span:first-child` não mais `display:none` ≤1050px; container com wrap + spans com quebra. Contagem "X na sala · Y votaram" preservada no tablet/mobile.
- **Prova viva (sala RB7S, browser)**: reveal 146×44 (fix do lote 3 ao vivo), presence "1 in the room · 0 voted" visível, deck 58×80, solo hint + invite + avatar íntegros, zero erros de console.
- Evidência: arena.test 77 pass (lote 4); typecheck 0.
- Score mantido **29/40 Good**. Pendente: affordance do projétil.
