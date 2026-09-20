---
target: guias PT+EN (fase atual)
total_score: 33
p0_count: 0
p1_count: 1
timestamp: 2026-09-20T22-02-27Z
slug: apps-web-src-pages-guide-tsx
---
# Critique — apps/web/src/pages/guide.tsx (template /guias, /guias/*, /en/guides/*)
Method: dual-agent (A: design-review-subagent · B: detector-static-subagent)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | TOC sticky + activeId, scroll-margin 96px |
| 2 | Match System / Real World | 4 | "A rodada em 7 passos", "Quem vota (e quem não vota)" falam a língua do facilitador |
| 3 | User Control and Freedom | 3 | Back + âncoras + details no ritmo do usuário |
| 4 | Consistency and Standards | 3 | TOC 2-col→1-col ok; affordance `+` rotate-45 custom (não chevron padrão) |
| 5 | Error Prevention | 3 | Links internos richText; externos não verificados |
| 6 | Recognition Rather Than Recall | 4 | TOC + "Neste guia" removem recall; tabelas p/ escala |
| 7 | Flexibility and Efficiency | 3 | Relacionados + closing CTA + ordem startHere |
| 8 | Aesthetic and Minimalist Design | 3 | Editorial quieto, pretty wrapping, 17px/1.7 legível |
| 9 | Error Recovery | 3 | Back ao hub; sem fallback de link quebrado |
| 10 | Help and Documentation | 4 | Closing "Pronto para estimar junto?" + relacionados ligam ao ritual |
| **Total** | | **33/40** | **Good** |

## Anti-Patterns Verdict
**LLM:** PASS (1 borderline). Artigo 720px, back-link, H1 + lede 18px + meta mono, TOC sticky, blocos tipados, FAQ details (primeiro aberto), closing + relacionados. Hub 3 cards = índice, não feature-grid — escusado. Callout border-left 2px + tint = semântico, não decorativo.
**Deterministic scan:** `detect.mjs --json guide.tsx` → exit 0, []. TSX+CSS: exit 2, 8 findings — side-tab warning em guide.css:177 (FP-leaning, callout intencional) + 7 advisories (micro mono, lede 18px, radius 2/4px hairlines).
**Visual overlays:** sem browser no subagente; nenhum overlay reivindicado.

## Overall Impression
Ritmo editorial onde importa, tipografia disciplinada, melhor timing de CTA do conjunto (após competência). Oportunidade: TOC resiliente + FAQ sempre visível.

## What's Working
- Arquitetura de conteúdo (steps/list/table/callout tipados) mantém guias longos escaneáveis.
- Ordem do hub + badge "Comece aqui" + reading times respeitam o novato.
- Smooth escopado + reduced-motion + foco em summary/links.

## Priority Issues
- **[P1] TOC sticky `top:72px` assume header h-20; em wrap/zoom cobre H2.** Why: overlap em zoom quebra leitura. Fix: `top: calc(var(--header-h,80px) - 8px)` + `max-height:40vh; overflow:auto`. Sug: $impeccable adapt
- **[P2] FAQ details só quando section.blocks vazio — padrão oculto.** Fix: renderizar FAQ após blocos sempre que faq.items existir. Sug: $impeccable onboard
- **[P2] Hub 3 cards idênticos (só 1º badged) — scent fraco.** Fix: readingTime proeminente + "Para quem" por card. Sug: $impeccable onboard
- **[P3] richText sem distinção externo/interno.** Fix: ícone + rel p/ externos. Sug: $impeccable harden

## Persona Red Flags
- **Sam (aprende async):** reads 6–7min sem progresso salvo; ids por seção bons, mas sem copy-link.
- **Riley:** "atualizado set/2026" fresco mas sem autoria — cético sobre calibragem.
- **Casey:** table overflow-x precisa tabindex=0 + label p/ scroll por teclado.

## Minor Observations
- META_PT hardcoded vai staleness; key por row.join frágil; H1s bem diferenciados (sem canibalização aqui).

## Questions to Consider
- Se o guia ensina o ritual melhor que a landing, a landing devia ser o capítulo 1 do guia?
- E se o TOC — não o CTA — fosse a ação primária do guia?
