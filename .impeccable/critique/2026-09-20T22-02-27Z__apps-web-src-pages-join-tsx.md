---
target: /join PT+EN (fase atual)
total_score: 31
p0_count: 0
p1_count: 1
timestamp: 2026-09-20T22-02-27Z
slug: apps-web-src-pages-join-tsx
---
# Critique — apps/web/src/pages/join.tsx (/join PT+EN)
Method: dual-agent (A: design-review-subagent · B: detector-static-subagent)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | aria-busy + role=status ok; sala só validada no submit (WS handshake) |
| 2 | Match System / Real World | 3 | "Como o time te chama?" + lista ritual espelha o convite |
| 3 | User Control and Freedom | 3 | Mode switch preserva nick/draft; cleanup de socket no unmount |
| 4 | Consistency and Standards | 4 | Vocab Field/Label/Error + Button do sistema |
| 5 | Error Prevention | 4 | zod nick/code, normalizeCode uppercase, maxLength 20 |
| 6 | Recognition Rather Than Recall | 3 | Hints inline; nada a memorizar |
| 7 | Flexibility and Efficiency | 2 | enterKeyHint + paste OTP, mas sem autofocus de ?code= |
| 8 | Aesthetic and Minimalist Design | 3 | Duas colunas calmas; mode-switch muted funciona |
| 9 | Error Recovery | 3 | sala_nao_encontrada/invalid_code/connection_failed roteados a campo vs form |
| 10 | Help and Documentation | 3 | Hint de espectador explícito |
| **Total** | | **31/40** | **Good** |

## Anti-Patterns Verdict
**LLM:** PASS. Sem bans; lista ritual 01/02/03 em texto (DESIGN proíbe foto stock — conforme). Card radius 18px = token xl; OTP 50px mono tabular; copy pt-BR direta.
**Deterministic scan:** `detect.mjs --json join.tsx` → exit 0, [] (0 findings). TSX+CSS: exit 2, 11 findings (`overused-font`×5 FP — DESIGN manda Geist/Inter banido; `font-size`×4; `radius`×2 em 13/9px — 9px é o próprio deck-selected do DESIGN).
**Visual overlays:** sem browser no subagente; nenhum overlay reivindicado.

## Overall Impression
A11y de engenharia acima da média, copy bilíngue com voz, 1 CTA. Oportunidade: disponibilidade inline do código antes do submit.

## What's Working
- Mode switch como radiogroup acessível (sr-only radios + :has(:checked)).
- Ordem nick→código→avatar→espectador; código oculto no create.
- autoComplete nickname/one-time-code, autoCapitalize, OTP mono.

## Priority Issues
- **[P1] Sem disponibilidade inline: código com typo só falha após handshake WS completo** — frustração tardia. Why: feedback fora do momento da digitação. Fix: debounce checkSala no 4º char, inline "Sala encontrada · N na mesa" ou erro de campo pré-submit. Sug: $impeccable harden
- **[P2] Checkbox espectador 18px (linha sem hit-area 44px).** Fix: box 24px + row 44px. Sug: $impeccable adapt
- **[P2] Avatar persiste instantâneo antes do join.** Fix: stage local, persistir no submit ("foto salva neste dispositivo"). Sug: $impeccable clarify
- **[P3] Span statusCreating/Joining duplica Button loading.** Fix: remover span, confiar em aria-busy do Button. Sug: $impeccable polish

## Persona Red Flags
- **Jordan (mobile):** OTP 4×50px+gaps aperta 320px; rotulagem SR do slot 1 inconsistente (codeCharAria pula índice 0).
- **Alex (host apressado):** distinção create/join sutil; ?mode=join ajuda mas contraste muted baixo.
- **Casey (teclado/SR):** switchMode limpa codeError/formError mas não nickError.

## Minor Observations
- H1 duplica promessa da home sem prova; navigatedRef guard correto.

## Questions to Consider
- Por que escolher foto antes de saber se a sala existe?
- Por que o submit de criar não promete o código (passo 2 do ritual)?
