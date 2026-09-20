---
target: landings PT+EN (fase atual)
total_score: 33
p0_count: 0
p1_count: 1
timestamp: 2026-09-20T22-02-27Z
slug: apps-web-src-pages-landing-tsx
---
# Critique — apps/web/src/pages/landing.tsx (template /planning-poker, /scrum-poker, /en/*)
Method: dual-agent (A: design-review-subagent · B: detector-static-subagent)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Scroll longo, sem progresso/TOC, só âncoras |
| 2 | Match System / Real World | 4 | "Votem em segredo", pausa, exemplo real 3/5/5/8→5 |
| 3 | User Control and Freedom | 3 | Âncoras #how-it-works/#faq + cross-links |
| 4 | Consistency and Standards | 4 | Mesma gramática de steps da home, mesmo CTA |
| 5 | Error Prevention | 4 | Estática, nada a errar |
| 6 | Recognition Rather Than Recall | 3 | Deck visual ensina Fibonacci sem recall |
| 7 | Flexibility and Efficiency | 2 | 3 CTAs idênticos, sem atalho além da prosa |
| 8 | Aesthetic and Minimalist Design | 3 | Assimétrico competente, não distintivo |
| 9 | Error Recovery | 4 | Cross-link scrum↔planning + guias resgatam intenção errada |
| 10 | Help and Documentation | 4 | FAQ 7Q espelha schema FAQPage (sync seo/routes.ts) |
| **Total** | | **33/40** | **Good** |

## Anti-Patterns Verdict
**LLM:** PASS — melhor do conjunto. Kicker único, hairlines, steps com divisória, lista why 2-col, FAQ dl, closing + cross-link quiet. DeckStrip estático aria-hidden; string "☕" em DECK_FACES com branch p/ CoffeeIcon — limpar. Sem gradient/glass/metric.
**Deterministic scan:** `detect.mjs --json landing.tsx` → exit 0, []. TSX+CSS: exit 2, 8 advisories (font-size×6 prosa ≥14 + micro, radius 2/9px hairlines).
**Visual overlays:** sem browser no subagente; nenhum overlay reivindicado.

## Overall Impression
SEO honesto, hierarquia anti-slop intacta. Oportunidade: diferenciar planning vs scrum + H1s vs home.

## What's Working
- Prosa ensina de verdade (anchoring, mediana-vs-média, pausa fora do cálculo).
- FAQ concreta (3–12 pessoas, efêmera, sem histórico).
- Cross-link + guias ligam aquisição → ritual → aprendizado.

## Priority Issues
- **[P1] H1 quase-duplicado com a home + overlap planning/scrum → canibalização SERP.** Why: três H1s "…grátis: direto à conversa" competem. Fix: home mantém promessa de marca; planning "Planning poker: a rodada em 6 passos"; scrum "Scrum poker no sprint planning". Sug: $impeccable clarify
- **[P2] 3 primários "Criar sala" idênticos.** Fix: hero + closing primários; steps-action vira text-link. Sug: $impeccable layout
- **[P2] ~2500 palavras sem TOC.** Fix: mini-TOC (Como funciona · Por que · Reveal · FAQ). Sug: $impeccable onboard
- **[P3] DeckStrip sem semântica de ½/pausa.** Fix: title por carta / caption. Sug: $impeccable polish

## Persona Red Flags
- **Riley:** competente mas bege — "Sem cadastro de verdade" 3× sem prova (um "~30s" medido ajudaria; DESIGN veta fake numbers, exige real).
- **Sam (remoto):** "Funciona no celular? Sim." sem prova de viewport.
- **Alex:** how em 6 passos longo p/ skim pré-reunião.

## Minor Observations
- GA4 sanitizePagePath remove query — campanhas com UTM invisíveis; verificar.
- role=list redundante; key por slice(0,32) frágil.

## Questions to Consider
- Se os 3 CTAs dizem o mesmo, qual você deletaria primeiro?
- E se a rodada-exemplo (3/5/5/8→5) fosse o hero, não o deck?
