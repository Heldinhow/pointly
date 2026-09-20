---
target: 404 PT+EN lote2
total_score: 30
p0_count: 0
p1_count: 1
timestamp: 2026-09-20T02-00-00Z
slug: apps-web-src-pages-not-found-tsx
---
# Polish lote 2 — not-found.tsx (ponte ao ritual)
- **P1 ponte ao ritual corrigido**: footer agora tem secundário `Entrar com código`/`Join with code` → `/join?mode=join` (outline ao lado do primário). Copy nova nas duas línguas, sem teste quebrado (sem teste de 404).
- **CSS**: `.not-found-footer` com `flex-wrap + gap 12px`. Verificado no browser mobile 390px: dois botões 44px lado a lado, sem overflow.
- Evidência: typecheck 0; snapshot 404 mobile confirma.
- Rescore heurística 9 (Error Recovery): 3 → total **30/40 Good**.
