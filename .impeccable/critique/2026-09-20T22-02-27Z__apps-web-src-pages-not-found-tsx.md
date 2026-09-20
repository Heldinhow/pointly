---
target: 404 PT+EN (fase atual)
total_score: 31
p0_count: 0
p1_count: 1
timestamp: 2026-09-20T22-02-27Z
slug: apps-web-src-pages-not-found-tsx
---
# Critique — apps/web/src/pages/not-found.tsx (404 PT+EN)
Method: dual-agent (A: design-review-subagent · B: detector-static-subagent)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Estado estático instantâneo, sem pista de sitemap |
| 2 | Match System / Real World | 4 | "Confira o link ou o código" espelha typo de convite |
| 3 | User Control and Freedom | 4 | Duas saídas claras (início + entrar com código) |
| 4 | Consistency and Standards | 4 | Reusa join-card radius/sombra/tipo |
| 5 | Error Prevention | 2 | `*` captura /s/typo mas não parseia/prefill ?code= |
| 6 | Recognition Rather Than Recall | 4 | Nada a recordar |
| 7 | Flexibility and Efficiency | 2 | Sem busca, sem voltar-à-sala |
| 8 | Aesthetic and Minimalist Design | 4 | Quieto, AA-friendly |
| 9 | Error Recovery | 2 | "Entrar com código" vai ao join genérico, perde o código digitado |
| 10 | Help and Documentation | 2 | Sem contato, mas footer com guias persiste |
| **Total** | | **31/40** | **Good** |

## Anti-Patterns Verdict
**LLM:** PASS. Contenção exemplar: card 560px, kicker mono, H1 32px, 1 primário + 1 outline. Sem bans.
**Deterministic scan:** `detect.mjs --json not-found.tsx` → exit 0, [] (0 findings, sem CSS próprio — herda join.css).
**Visual overlays:** sem browser no subagente; página estática, screenshot trivial.

## Overall Impression
Hierarquia mínima sem culpa, reuso SSOT. Oportunidade: CTA primary + ponte ao ritual preservando o código.

## What's Working
- Um primário (Voltar ao início) + outline secundário — hierarquia correta.
- Copy bilíngue sem culpa; CardTitle render h1 preserva ordem de headings.

## Priority Issues
- **[P1] Perde intenção do convite: typo /s/ABXD → /join vazio.** Why: usuário com convite na mão precisa redigitar. Fix: parsear pathname ?code= e linkar /join?code=XXXX (+ mostrar código detectado). Sug: $impeccable onboard
- **[P2] `.not-found-*` mora em join.css (acoplamento).** Fix: extrair `.center-card-page` ou aceitar com comentário. Sug: $impeccable polish
- **[P3] Sem role=status; foco vai ao main, não ao H1.** Fix: H1 focável ou role=status na desc. Sug: $impeccable harden

## Persona Red Flags
- **Sam (clica convite com typo):** maior vítima — código 4-char sem correção oferecida.
- **Casey (SR):** foco no #conteudo antes do H1 atrasa anúncio.

## Minor Observations
- Kicker 14px sem uppercase/tracking vs label-caps; CTA touch depende do primitivo.

## Questions to Consider
- Por que um produto com códigos de 4 letras não reconhece um typo de 4 letras no 404?
- Voltar ao início é o primário certo p/ quem segura um convite?
