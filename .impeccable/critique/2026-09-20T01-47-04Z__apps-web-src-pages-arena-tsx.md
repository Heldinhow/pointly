---
target: "/s/:code PT+EN recheck"
total_score: 28
p0_count: 0
p1_count: 2
timestamp: 2026-09-20T01-47-04Z
slug: apps-web-src-pages-arena-tsx
---
# Re-verificação — apps/web/src/pages/arena.tsx (pós-fix P0)
Method: targeted re-check (regex + tests + static)

## Delta desde 27/40 (P0 1)
- **P0 corrigido e verificado**: `arena.tsx:327` agora `/reveal|revelar|revela/i` no texto; `_code` inalterado. Erro de reveal em PT ("Não foi possível revelar…", "revelação") cai em `setRevealError`, não mais em `setVoteError`. SSOT DESIGN "erro de reveal nunca cai no alerta de voto" restaurada no idioma default.
- **Minors corrigidos**: removidos `title="Atalho: R"` / `"Atalho: N (duas vezes)"` hardcoded PT (arena.tsx:989,1019); atalho já anunciado nos `aria-label` (`revealAria`/`newRoundAria` PT+EN). EN sem tooltip PT.
- **Evidência**: `bun test arena.test.tsx` 76 pass 0 fail; `bun --filter pointly-web typecheck` exit 0.

## Rescore heurística 9 (Error Recovery): 2 → 3
| # | Heurística | Score |
|---|-----------|-------|
| 9 | Error Recovery | 3 |
| **Total projetado** | | **28/40 Good** |

Pendente (não bloqueante): invite vs resultados, touch 44px reveal/nudge, affordance projétil, presence ≤1050px.
