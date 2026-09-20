---
target: / + /en (fase atual)
total_score: 31
p0_count: 0
p1_count: 1
timestamp: 2026-09-20T22-02-27Z
slug: apps-web-src-pages-home-tsx
---
# Critique — apps/web/src/pages/home.tsx (/ + /en)
Method: dual-agent (A: design-review-subagent · B: detector-static-subagent)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Hero 100svh esconde a demo; valor interativo abaixo da dobra |
| 2 | Match System / Real World | 4 | Metáfora feltro/mesa/cartas mapeia o ritual |
| 3 | User Control and Freedom | 3 | Retry barato; tilt só pointer-fine + reduced-motion ok |
| 4 | Consistency and Standards | 4 | 1 primário + text-link; vocab deck/poker-table reutilizado |
| 5 | Error Prevention | 3 | Reveal bloqueado até votar + revealAriaEmpty |
| 6 | Recognition Rather Than Recall | 3 | Âncora "Experimente uma rodada" evita recall; story da demo exige lembrar |
| 7 | Flexibility and Efficiency | 2 | Um caminho de demo, sem deep-link de estado, sem atalho |
| 8 | Aesthetic and Minimalist Design | 3 | Calmo; dois pulses (dot + you-ring) competem |
| 9 | Error Recovery | 3 | Sem erro duro possível; retry barato |
| 10 | Help and Documentation | 2 | Sem ajuda p/ stats em details |
| **Total** | | **31/40** | **Good** |

## Anti-Patterns Verdict
**LLM:** PASS. Sem side-stripe, gradient-text (em é pine sólido), glass, hero-metric (stats são output funcional da demo), card-grid idêntico (steps com divisórias), eyebrow-por-seção ou overflow. 01/02/03 são steps sancionados pelo DESIGN. Sem clichês AI.
**Deterministic scan:** `detect.mjs --json home.tsx` → exit 0, [] (0 findings). Prova complementar TSX+CSS: exit 2, 16 advisories (`design-system-font-size`×11, `design-system-radius`×5) — todos em micro-labels mono (kickers 10-12px, cantoneiras 1-4px), FP-leaning frente ao DESIGN (label-caps 11px mono).
**Visual overlays:** sem browser no subagente; nenhum overlay reivindicado. Checagens vivas (contraste feltro, H1 375px) diferidas ao polish via Playwright.

## Overall Impression
Hierarquia disciplinada, demo honesta, tokens/motion corretos. Maior oportunidade: limitar altura do hero para a demo espiar acima da dobra.

## What's Working
- Hero split assimétrico, nunca centrado; feltro como assinatura, não stock.
- Demo honesta (votos simulados, voto ajustável, nomes Você/Bia/Caio/Dani).
- Steps com divisórias hairline; mobile número-à-esquerda.

## Priority Issues
- **[P1] Hero `min-height: calc(100dvh-80px-32px)` garante demo invisível no desktop** — primeiro valor exige scroll. Why: first-time value escondido atrasa ativação. Fix: `min-height: min(560px, calc(...))`, demo espiando ~120px. Sug: $impeccable layout
- **[P2] Três caminhos competindo no hero** (primário + Entrar com código + Experimente). Fix: rebaixar demo-link (margin-top 16px, 13px). Sug: $impeccable layout
- **[P2] Stats prova escondida em details** (média/intervalo/pips). Fix: mediana+média inline, details só p/ pips. Sug: $impeccable distill
- **[P3] Dupla animação dot-pulse + you-ring.** Fix: manter ring, remover dot p/ is-you. Sug: $impeccable polish

## Persona Red Flags
- **Riley (lead cético):** H1 SEO-first ("Planning poker online grátis") atrasa prova do ritual.
- **Casey (teclado):** tilt pointer-only ok, mas sem skip-to-demo descobrível.
- **Alex (host estreante):** CTA Criar sala clicado às cegas sem ver a demo.

## Minor Observations
- Iniciais YO/VO por lang fofas mas inconsistentes; seletor `strong` morto; scroll smooth escopado ok.

## Questions to Consider
- Se o feltro é a marca, por que a única prova interativa exige scroll?
- O que se perde removendo o tilt do hero que a demo já não prove?
