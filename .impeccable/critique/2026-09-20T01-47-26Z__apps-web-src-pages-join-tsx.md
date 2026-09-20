---
target: /join PT+EN recheck
total_score: 28
p0_count: 0
p1_count: 3
timestamp: 2026-09-20T01-47-26Z
slug: apps-web-src-pages-join-tsx
---
# Re-verificação — apps/web/src/pages/join.tsx (pós-fix OTP)
Method: targeted re-check (static + tests)

## Delta desde 27/40 (P0 0)
- **P2-3 corrigido e verificado**: primeiro slot do OTP agora recebe `aria-label={content.card.codeCharAria(index)}` (join.tsx), igual aos outros 3 — "Caractere 1 de 4" PT / "Character 1 of 4" EN. SR/teclado consistente no campo mais propenso a erro.
- **Evidência**: `bun test join.test.tsx` 13 pass 0 fail; typecheck exit 0.

## Rescore heurística 6 (Recognition Rather Than Recall): 3 → 4 parcial → total
| **Total projetado** | | **28/40 Good** |

Pendente (não bloqueante): segmented refeito, submit fora do form, busy apaga verbo, ritual some no mobile, espectador no create.
