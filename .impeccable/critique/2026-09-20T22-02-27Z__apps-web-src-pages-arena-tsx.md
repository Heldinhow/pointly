---
target: "/s/:code PT+EN (fase atual)"
total_score: 29
p0_count: 1
p1_count: 2
timestamp: 2026-09-20T22-02-27Z
slug: apps-web-src-pages-arena-tsx
---
# Critique — apps/web/src/pages/arena.tsx (/s/:code PT+EN)
Method: dual-agent (A: design-review-subagent · B: detector-static-subagent)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | presence aria-live, fases legíveis, reconnecting com retry |
| 2 | Match System / Real World | 3 | Mesa/deck/assentos sustentam; projéteis são jogo, não ruído |
| 3 | User Control and Freedom | 2 | Duplo-N 5s fácil de perder; sem des-votar explícito |
| 4 | Consistency and Standards | 3 | Reveal Card dentro do feltro cria segundo dialeto de Card |
| 5 | Error Prevention | 3 | Guard canReveal, cooldown local+server SSOT, alvo precisa estar conectado |
| 6 | Recognition Rather Than Recall | 2 | kbd R/N oculto <700px; affordance de projétil só em frase de hint |
| 7 | Flexibility and Efficiency | 3 | R/N + retryNow; rejoin F5 via sessão persistida |
| 8 | Aesthetic and Minimalist Design | 3 | Toolbar hairline + 1fr/288px calmos, mas 7 sistemas concorrem |
| 9 | Error Recovery | 3 | 5 alertas roteados por regex — bons, mas 5 sites competem |
| 10 | Help and Documentation | 2 | tableNote + hint longos; sem onboarding p/ cadeira 8s vs 1s |
| **Total** | | **29/40** | **Good** |

## Anti-Patterns Verdict
**LLM:** PASS com aviso de densidade. SVGs de projéteis próprios, confete determinístico 14 peças só transform/opacity + reduced-motion off, stats honestas. Sidebar ghost (transparent, border-top) não é card-grid.
**Deterministic scan:** `detect.mjs --json arena.tsx` → exit 0, []. TSX+CSS: exit 2, 14 advisories (font-size×11 micro/caption, radius 3/6px hairlines, color #163c2d44 = sombra alfa FP).
**Visual overlays:** sem browser no subagente; nenhum overlay reivindicado.

## Overall Impression
Máquina de fases exemplar, aria-live exemplar, celebração one-shot correta. Oportunidade: alvos touch mobile + countdown do confirmar + solo acima do convite.

## What's Working
- Fases mutuamente exclusivas + títulos/descs distintos por fase.
- Rejoin reusa UUID, reidrata voto/assento/fase.
- Erros de interação isolados — projétil nunca quebra voto.

## Priority Issues
- **[P0] Toolbar mobile colapsa sair p/ ícone (`font-size:0`) + esconde room-symbol + esconde kbd** — ação crítica vira ícone-mistério <44px (~34px efetivo). Why: saída e contexto somem onde o polegar mais precisa. Fix: manter texto Sair ≥700px; abaixo, ícone + aria-label com alvo 44px + tooltip; invite copy 37→44px. Sug: $impeccable adapt
- **[P1] Duplo-confirmar nova rodada sem countdown visível** (hint diz 5s, sem progresso). Fix: barra/label "Confirmar (4s)" com aria-live. Sug: $impeccable clarify
- **[P1] Solo (`Você está sozinho`) é parágrafo sob waiting; mesa 12 assentos parece quebrada.** Fix: variante solo centraliza invite URL + Copiar acima da mesa. Sug: $impeccable layout
- **[P2] Alvos-espectador via nomes sublinhados — descobribilidade ~0.** Fix: ring no hover + coachmark único. Sug: $impeccable onboard
- **[P3] Regra 1s/8s enterrada em frase 14px.** Fix: cooldown na opção do menu ("Cadeira · 8s"). Sug: $impeccable clarify

## Persona Red Flags
- **Alex (facilita 8 pessoas):** presence + fase competem no glance ao vivo.
- **Casey (mobile 390):** kbd some, reveal/nudge <44px corrigidos em lote anterior, presence oculta — ainda o mais penalizado.
- **Sam (late joiner):** entra mid-voto e vê "Aguardando primeiro voto" sem contexto de rodada.

## Minor Observations
- SEAT_COUNT=12 sem aviso até seatsLeft; justifyPlayer (dado) sem explicação; toggle showInvite convoluto.

## Questions to Consider
- Espectador deve arremessar cadeira em votante no meio da estimativa, ou o jogo mina o ritual calmo?
- Se qualquer um pode revelar/nova-rodada, o que Host significa — e por que exibir?
