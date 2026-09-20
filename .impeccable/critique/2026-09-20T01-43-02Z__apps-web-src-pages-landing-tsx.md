---
target: landings PT+EN
total_score: 32
p0_count: 0
p1_count: 2
timestamp: 2026-09-20T01-43-02Z
slug: apps-web-src-pages-landing-tsx
---
# Critique — apps/web/src/pages/landing.tsx
Method: dual-agent (A: design-review · B: detector-static)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Sem progresso de leitura |
| 2 | Match System / Real World | 4 | Votem em segredo, pausa, exemplo real |
| 3 | User Control and Freedom | 2 | Só 1 âncora; sem voltar ao topo |
| 4 | Consistency and Standards | 3 | h1/h2 fora da spec; âncora PT no EN |
| 5 | Error Prevention | 4 | Estática, nada a errar |
| 6 | Recognition Rather Than Recall | 2 | 6 steps + 10 parágrafos sem resumo |
| 7 | Flexibility and Efficiency | 3 | Caminho /join único; falta âncora profunda |
| 8 | Aesthetic and Minimalist Design | 3 | Prosa×3 + FAQ×7 estica |
| 9 | Error Recovery | 4 | N/A |
| 10 | Help and Documentation | 4 | FAQ + guias por idioma |
| **Total** | | **32/40** | **Good** |

## Anti-Patterns Verdict
**LLM:** Sem slop. Split assimétrico, hairlines, steps com divisória, FAQ visível = JSON-LD, tom produto sem filler.
**Deterministic scan:** exit 0, [] (modo regex non-HTML).

## Overall Impression
SEO honesto e hierarquia anti-slop intacta. Oportunidade: diferenciar planning vs scrum visualmente + âncora neutra no EN.

## What's Working
- Sem 3-cards, H1 com keyword, hreflang recíproco, links irmã/guias.
- FAQ 7 itens dl válido, max 780px.
- 1 CTA por viewport, /join único.

## Priority Issues
- **[P1] Âncora PT no EN** — landing.tsx:53,66,123 (#como-funciona/#perguntas). Fix: slug neutro #how-it-works. Sug: $impeccable clarify
- **[P1] Planning vs scrum idênticos** — mesmo DeckStrip. Fix: hero-visual distinto (sprint/backlog vs reveal). Sug: $impeccable bolder
- **[P2] Steps 6/5 quebram padrão 3** — 2 linhas desktop, muro mobile. Fix: reduzir p/ 4 ou colapsar 5+6. Sug: $impeccable distill
- **[P2] Closing diluído** — 2 cross-links mesmo peso do CTA. Fix: CTA → 1 linha guias → irmã discreta. Sug: $impeccable layout
- **[P3] deck-note 13px viola DESIGN** — landing.css:122-127 (mínimo 14px); h2 550→600. Sug: $impeccable polish

## Persona Red Flags
- **Jordan:** perde CTA até steps-action após scroll.
- **Casey:** visual idêntico gera dúvida scrum vs planning.
- **Riley:** deck ilustrativo 32px pode parecer tocável; deck-note não diz ilustrativo.

## Minor Observations
- role=list redundante; key por slice(0,32) frágil; steps-action 100% mobile vs closing inconsistente; role=presentation redundante.

## Questions to Consider
- Steps 6/5 intencional p/ SEO ou pode voltar a 4?
- Deck claro no dark intencional?
- Prioridade no closing: guias ou irmã?
