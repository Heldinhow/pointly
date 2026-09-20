---
target: "/s/:code PT+EN"
total_score: 27
p0_count: 1
p1_count: 2
timestamp: 2026-09-20T01-39-30Z
slug: apps-web-src-pages-arena-tsx
---
# Critique — apps/web/src/pages/arena.tsx
Method: dual-agent (A: design-review · B: detector-static)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Presence some ≤1050px |
| 2 | Match System / Real World | 3 | "Recarregando" game-y |
| 3 | User Control and Freedom | 3 | OK, sem desfazer espectador contextual |
| 4 | Consistency and Standards | 2 | Justifica/Jusifica primeiro; doc diz sem Menu mas usa Menu |
| 5 | Error Prevention | 3 | Normaliza; cooldown memorizado |
| 6 | Recognition Rather Than Recall | 2 | Trigger projétil sem affordance; 1s/8s só no hint |
| 7 | Flexibility and Efficiency | 3 | R/N ok; sem countdown dos 5s |
| 8 | Aesthetic and Minimalist Design | 3 | Hint permanente + invite sobre resultados |
| 9 | Error Recovery | 2 | P0: erro reveal PT cai no alerta de voto |
| 10 | Help and Documentation | 3 | Trocar papel exige sair+entrar |
| **Total** | | **27/40** | **Acceptable** |

## Anti-Patterns Verdict
**LLM:** Sem slop. SVG próprio, motion funcional, reduced-motion em 4 camadas + early-return do voo, stats honestas do room_state. Exceção: drop-shadow azul no ícone épico (ban glow).
**Deterministic scan:** exit 2, 7 findings, 1 regra `design-system-color` (advisory), só em unanimous-celebration.tsx:11-21 (`#f2c94c`, `#7ec8a3` do confete; `#a9d6ad`/`#e8f5e9` não flagados). Candidatos a intencional (confete aria-hidden + paleta fixa comentada) — manter como advisory até dono do DESIGN.md confirmar.

## Overall Impression
Máquina de estados exemplar (reveal XOR nova-rodada, duplo-N, celebra 1x), a11y aria-live exemplar. Maior oportunidade: corrigir P0 PT + devolver Resultados acima do invite + touch 44px.

## What's Working
- Estados mutuamente exclusivos, celebração só na transição, dado determinístico.
- Stats em output vivo, mono tabular, pausa fora com mensagem explícita.
- Cooldown unificado local+servidor, voo anônimo, ticker só em recarga.

## Priority Issues
- **[P0] Erro de reveal PT cai no alerta de voto** — arena.tsx:327 casa /reveal/i mas "revelar" não contém "reveal". Fix: /revelar|reveal/i + match no _code. Sug: $impeccable harden
- **[P1] Invite empurra Resultados em multi** — showInvite sempre true; results abaixo da dobra com 12 pessoas. Fix: resultados acima do invite quando revealed ou colapsar invite. Sug: $impeccable layout
- **[P1] Touch <44px no mobile** — reveal 40px (arena.css:128-131), nudge 36px (projectile-menu.css:99-102). Fix: 44px. Sug: $impeccable adapt
- **[P2] Projétil sem affordance + menu denso** — trigger sem sinal; 6+N itens misturam piada e sinal. Fix: affordance persistente + eyebrow + cooldown no trigger. Sug: $impeccable onboard
- **[P3] Presence some ≤1050px** — arena.css:355-357. Fix: manter com wrap ou mover p/ caption. Sug: $impeccable adapt

## Persona Red Flags
- **Jordan (solo PT):** acolhido pelo copy, mas "Ocultar convite" some com o affordance.
- **Sam (teclado/SR):** trigger focável bom; reveal desabilitado unfocusável; nudge 36px pune switch/zoom.
- **Casey (mobile 390):** kbd some, reveal 40px, nudge 36px, presence oculta — mais penalizado.

## Minor Observations
- drop-shadow blue no ícone épico → remover.
- vote vs voteAdjustable PT idênticos → unificar.
- Ticker recria intervalo por tick → deps [projectileCooldownUntil].
- DESIGN.md diz sem coss Menu mas usa Menu → alinhar.
- title="Atalho: R/N" hardcoded PT (arena.tsx:989,1019) → i18n.
- Mediana text-4xl 36px vs spec 38-40px → registrar.

## Questions to Consider
- Dado "Justifica primeiro" protege ou institucionaliza spotlight? Vale "pular a vez"?
- Cutucada e arremesso merecem mesmo menu/gate?
- Com 12 pessoas, o que importa pós-reveal: convidar o 13º ou ler a mediana?
