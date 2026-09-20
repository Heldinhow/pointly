---
target: 404 PT+EN
total_score: 28
p0_count: 0
p1_count: 2
timestamp: 2026-09-20T01-39-30Z
slug: apps-web-src-pages-not-found-tsx
---
# Critique — apps/web/src/pages/not-found.tsx
Method: dual-agent (A: design-review · B: detector-static)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Aba não atualiza título |
| 2 | Match System / Real World | 3 | "endereço/Erro 404" técnico |
| 3 | User Control and Freedom | 4 | Saída 1 clique + rotas de fuga |
| 4 | Consistency and Standards | 2 | CTA outline viola 1 ação = primary |
| 5 | Error Prevention | 2 | Não trata typo /s/CODIGO |
| 6 | Recognition Rather Than Recall | 4 | Nada a recordar |
| 7 | Flexibility and Efficiency | 2 | Sem ponte p/ entrar com código |
| 8 | Aesthetic and Minimalist Design | 4 | 4 elementos, sem ruído |
| 9 | Error Recovery | 2 | Saída genérica, sem recuperação contextual |
| 10 | Help and Documentation | 2 | Sem pista verificar link/código |
| **Total** | | **28/40** | **Good** |

## Anti-Patterns Verdict
**LLM:** Sem slop. Geist 32px, kicker mono, tokens var(--*), dark-first. Desvio: outline onde DS pede primary.
**Deterministic scan:** exit 0, [] (0 findings).

## Overall Impression
Hierarquia mínima sem culpa, reuso SSOT. Maior oportunidade: CTA primary + ponte ao ritual (entrar com código).

## What's Working
- Hierarquia kicker→H1→1 linha→1 CTA, copy PT+EN paralela sem culpar.
- Card/Button + tokens + radius do sistema; dark grátis.
- Shell: lang interno, skip-link + focus #conteudo + scroll topo.

## Priority Issues
- **[P1] CTA outline p/ ação única** — not-found.tsx:46. Fix: variant primary. Sug: $impeccable polish
- **[P1] Recuperação genérica fora do ritual** — volta à home, exige redescobrir entrar com código. Fix: link secundário Entrar com código/Criar sala. Sug: $impeccable onboard
- **[P2] Sem document.title + foco no main** — SR anuncia main antes do H1; aba desatualizada. Fix: título por rota + foco no H1. Sug: $impeccable harden
- **[P2] Kicker/descrição vagos** — "não existe por aqui" sem pista. Fix: "Confira o link ou código". Sug: $impeccable clarify

## Persona Red Flags
- **Facilitadora mobile com /s/ typo:** sem oferta de colar código; recomeça na home.
- **Usuário EN com SR:** título da aba desatualizado + foco no main atrasam anúncio.

## Minor Observations
- Kicker 14px sem uppercase/tracking vs label-caps.
- .not-found-* em join.css (acoplamento, sem prejuízo).
- Touch do CTA depende do primitivo; sem min-height local.
- :focus-visible do 404 depende do primitivo (join.css só cobre .join-*).

## Questions to Consider
- CTA vira primary? Cabe ação secundária Entrar com código?
- Título da aba troca no 404?
- Manter "Erro 404" literal ou suavizar com pista?
