---
target: "/s/:code PT+EN lote4"
total_score: 29
p0_count: 0
p1_count: 0
timestamp: 2026-09-20T02-24-22Z
slug: apps-web-src-pages-arena-tsx
---
# Polish lote 4 — arena.tsx (resultados acima do invite)
- **P1 corrigido com prova**: bloco do invite movido no DOM para depois de `.arena-results` (antes era invite→resultados). Ordem visual = ordem SR/tab = resultados primeiro no reveal; fora do reveal nada muda (resultados renderiza null).
- **Teste novo**: `reveal mostra resultados antes do convite na sidebar` (`compareDocumentPosition` FOLLOWING entre `stats-pill` e `Link de convite`).
- Evidência: arena.test 77 pass 0 fail; typecheck 0.
- Rescore heurística 8 (Minimalismo/carga): 3 → 4 parcial → total **29/40 Good**.
