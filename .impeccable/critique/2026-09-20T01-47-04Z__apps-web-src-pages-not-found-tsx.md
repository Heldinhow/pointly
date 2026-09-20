---
target: 404 PT+EN recheck
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-09-20T01-47-04Z
slug: apps-web-src-pages-not-found-tsx
---
# Re-verificação — apps/web/src/pages/not-found.tsx (pós-fix P1)
Method: targeted re-check (browser + static)

## Delta desde 28/40 (P1 2)
- **P1 corrigido e verificado no browser**: CTA `outline` → primário default (`not-found.tsx:46`). Inspecionado em `/rota-que-nao-existe-123` (desktop 1440, dark): bg `#A9D6AD` Mint Signal, ink `#183523`, radius 12px, sombra xs 1-2px (sem ghost-card). `a.relative` 115×32 com hit-slop 44px do primitivo em coarse pointers.
- **Evidência**: typecheck exit 0; join.test 13 pass (cwd correto); snapshot confirma H1/kicker/CTA íntegros PT+EN.

## Rescore heurística 4 (Consistency): 2 → 3
| # | Heurística | Score |
|---|-----------|-------|
| 4 | Consistency and Standards | 3 |
| **Total projetado** | | **29/40 Good** |

Pendente (não bloqueante): ponte ao ritual (link Entrar com código), document.title no 404, kicker com pista.
