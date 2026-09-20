---
target: /join PT+EN lote8
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-09-20T02-40-05Z
slug: apps-web-src-pages-join-tsx
---
# Polish lote 8 — join radiogroup + guide TOC + affordance
- **P1 segmented corrigido e verificado no browser**: dois `Button` com `aria-pressed` → `radiogroup` nativo (`label > input[type=radio] + span`, `aria-label` explícito). Setas do teclado grátis, `fieldset[disabled]` desabilita nativamente, `:has(:checked)`/`focus-visible` no CSS. Clique em "Join with code" alterna o card + OTP ao vivo. Testes atualizados (`button`→`radio`).
- **P2 TOC**: `position: sticky; top: 72px` com fundo e z-index — índice acompanha a leitura.
- **P2 affordance projétil**: anel primário sutil persistente em assentos interativos (cascata: base < interativo < hover/expandido < self).
- Evidência: typecheck 0; join+guide+arena 98 pass; snapshot mostra radios nomeados.
- Rescore join heurística 4 (Consistency): 2 → 3 → total **31/40 Good**. Guide e arena mantidos (32/29).
