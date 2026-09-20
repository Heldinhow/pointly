---
target: / + /en
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-09-20T01-43-02Z
slug: apps-web-src-pages-home-tsx
---
# Critique — apps/web/src/pages/home.tsx (/ + /en)
Method: dual-agent (A: design-review · B: detector-static)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Tilt sem feedback (ok, decorativo) |
| 2 | Match System / Real World | 4 | Mesa/cartas/Checkout mobile |
| 3 | User Control and Freedom | 3 | Sem desfazer voto único |
| 4 | Consistency and Standards | 2 | 3 rótulos p/ Criar sala; /join vs /join?mode=join |
| 5 | Error Prevention | 3 | Reveal bloqueado + simulados explícito |
| 6 | Recognition Rather Than Recall | 3 | Story/nomes repetem |
| 7 | Flexibility and Efficiency | 2 | Sem atalho; retornante disputa atenção |
| 8 | Aesthetic and Minimalist Design | 3 | Dupla mesa (hero + demo) |
| 9 | Error Recovery | 4 | Sem form, nada a recuperar |
| 10 | Help and Documentation | 2 | Sem link ajuda; steps fazem papel |
| **Total** | | **29/40** | **Good** |

## Anti-Patterns Verdict
**LLM:** Sem slop. Split assimétrico, 1 primário + text-link + demo discreto, steps com divisória (não 3 cards), sem eyebrow por seção, nomes/design conformes, stats reais mono tabular.
**Deterministic scan:** exit 0, [] (home.tsx, shell.tsx, language-link.tsx, deck.tsx).

## Overall Impression
Hierarquia disciplinada, demo honesta e contínua, tokens/motion corretos. Oportunidade: sinal da demo acima da dobra + condensar dupla mesa no mobile.

## What's Working
- 1 primário + text-link + demo discreto, 44px, ring visível.
- Demo com mesmos nomes/story, simulados declarado, Unânime/sem-numéricos tratados.
- Dark-first, transform/opacity, reduced-motion, aria-live nos 3 estados.

## Priority Issues
- **[P1] Demo abaixo da dobra sem sinal forte** — home.css:25-26, home.tsx:158-160 link muted. Fix: subir contraste/peso do tryRound. Sug: $impeccable layout
- **[P1] Dupla mesa no mobile** — felt 300px + PokerTable compact. Fix: condensar hero-visual ≤760px. Sug: $impeccable adapt
- **[P2] Iniciais VO hardcoded quebram EN** — home.tsx:230-236. Fix: inicial por lang. Sug: $impeccable clarify
- **[P2] Drift de CTA + destino join** — 3 rótulos + 2 destinos. Fix: unificar Criar sala. Sug: $impeccable clarify
- **[P2] Stats pós-reveal redundantes** — lista + mediana + média + pips. Fix: colapsar média/intervalo em details na demo. Sug: $impeccable distill

## Persona Red Flags
- **Jordan (EN):** tryRound pouco contraste atrasa chegada à demo.
- **Casey (375px):** primário não full-width; deck exige scroll até Revelar.
- **Riley (retornante):** entrar com código compete com primário; stats com 4 números quando precisa da mediana.

## Minor Observations
- ol role=list redundante; h1 br fixo testar 320px PT; wordmark AA sobre feltro; lede plural vs demo singular; tilt fallback limpar.

## Questions to Consider
- Tilt fica com aria-hidden atual?
- Unificar CTA em Criar sala ou há motivo conversão?
- Demo espelha arena completa ou versão só-mediana?
