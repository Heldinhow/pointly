---
target: guias PT+EN
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-09-20T01-43-02Z
slug: apps-web-src-pages-guide-tsx
---
# Critique — apps/web/src/pages/guide.tsx
Method: dual-agent (A: design-review · B: detector-static)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Sem progresso/TOC ativo |
| 2 | Match System / Real World | 4 | Checkout mobile, papéis, mesa |
| 3 | User Control and Freedom | 3 | Sem voltar ao topo/colapsar FAQ |
| 4 | Consistency and Standards | 3 | Paridade copy e radius callout destoam |
| 5 | Error Prevention | 3 | nowrap força scroll mobile |
| 6 | Recognition Rather Than Recall | 3 | FAQ expandida exige lembrar posição |
| 7 | Flexibility and Efficiency | 2 | Só âncora; sem sticky/copy-link/busca |
| 8 | Aesthetic and Minimalist Design | 3 | Trechos só-prosa + FAQ pesam |
| 9 | Error Recovery | 4 | Nada a desfazer; overflow contido |
| 10 | Help and Documentation | 4 | Conteúdo é a ajuda; cross-links ok |
| **Total** | | **31/40** | **Good** |

## Anti-Patterns Verdict
**LLM:** Sem slop. Steps mono + tabelas + callout quebram parede nos pontos de decisão; H balance, kickers mono; copy pedagógica bilíngue.
**Deterministic scan:** exit 0, [] no tsx isolado; com css (prova complementar): 8 findings — side-tab em guide.css:167 (FP, callout intencional) + 7 advisories font-size/radius (labels mono, lede 18px, callout 15px, tabela 13px, radius 2px — intencionais).

## Overall Impression
Ritmo editorial onde importa, tipografia disciplinada. Oportunidade: FAQ accordion + medida 65-75ch + nowrap mobile.

## What's Working
- Steps decimal-leading-zero + tabelas spread/Fibonacci + callout Dica.
- H balance, meta mono, lede contida.
- Exemplos nomeados persistentes, jargão definido no fluxo.

## Priority Issues
- **[P1] FAQ expandida na fadiga** — guide.tsx:140-148, 5-6 pares abertos; dt sem botão/âncora. Fix: accordion coss com SSR/SEO ou âncora por item. Sug: $impeccable onboard
- **[P1] Prosa sem medida/pretty** — ~80ch a 17px (alvo 65-75ch). Fix: max-width ch em p/li/dd + pretty. Sug: $impeccable typeset
- **[P2] nowrap quebra mobile 375px** — guide.css:213-218 tabela calibração. Fix: permitir quebra na 1ª coluna. Sug: $impeccable adapt
- **[P2] Hub sem porta de entrada** — 3 cards idênticos, readingTime antes do título. Fix: 01-03/badge + mover tempo p/ baixo. Sug: $impeccable onboard
- **[P2/P3] TOC sem ativo, alvos pequenos** — links 14px sem padding/focus próprio. Fix: padding + ring + sticky/ativo. Sug: $impeccable adapt

## Persona Red Flags
- **Jordan (390px, 2min antes da planning):** TOC erra toque; scroll-x corta tabela; FAQ empurra CTA.
- **Sam (EN):** velocity/spike sem definição + 2 parágrafos extras sem par PT geram desconfiança.
- **Casey (teclado/SR):** TOC sem focus/ativo; FAQ obriga varredura; relacionados verbosos.

## Minor Observations
- Callout radius esq. sem borda; closing h2 sem balance; td primary parece link; richText só link interno; keys frágeis; back sem underline.

## Questions to Consider
- Parágrafos extras EN: evolução ou drift? Qual manda?
- FAQ pode virar accordion ou precisa expandida p/ SEO?
- Ordem do hub normativa? Posso numerar/Comece aqui?
- nowrap requisito ou pode quebrar?
