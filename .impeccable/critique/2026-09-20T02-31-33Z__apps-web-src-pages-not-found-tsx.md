---
target: 404 PT+EN lote5
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-09-20T02-31-33Z
slug: apps-web-src-pages-not-found-tsx
---
# Polish lote 5 — not-found.tsx (title + kicker)
- **P2 title corrigido e verificado no browser**: `useEffect` define `document.title` ("Página não encontrada · Pointly" / "Page not found · Pointly") com restore no cleanup. Snapshot confirma "Page not found · Pointly" na aba.
- **P2 kicker/descrição**: descrição ganhou pista acionável ("Confira o link ou o código do convite." / EN equivalente), sem culpar.
- Evidência: snapshot 404 desktop; typecheck 0.
- Rescore heurísticas 1 (3→4 parcial) e 10 (2→3): total **31/40 Good**.
