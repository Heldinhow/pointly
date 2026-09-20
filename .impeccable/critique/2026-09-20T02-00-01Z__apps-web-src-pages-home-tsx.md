---
target: / + /en lote2
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-09-20T02-00-01Z
slug: apps-web-src-pages-home-tsx
---
# Polish lote 2 — home.tsx (iniciais VO→YO)
- **P2 corrigido**: avatar hero `<i>{lang === "en" ? "YO" : "VO"}</i>` — `/en` não mostra mais iniciais PT. `lang` já era prop da página; sem teste quebrado.
- Evidência: home.test pass; typecheck 0.
- Score mantido **29/40 Good** (demo-link, dupla mesa mobile e drift de CTA seguem no backlog).
