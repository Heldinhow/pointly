---
target: /join PT+EN
total_score: 27
p0_count: 0
p1_count: 3
timestamp: 2026-09-20T01-34-21Z
slug: apps-web-src-pages-join-tsx
---
# Critique — apps/web/src/pages/join.tsx
Method: dual-agent (A: design-review · B: detector-static)

## Design Health Score
| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Busy apaga verbo visível; WS connect é caixa-preta |
| 2 | Match System / Real World | 3 | "assento", "espaços duplos" = jargão |
| 3 | User Control and Freedom | 3 | Espectador sem desfazer contextual |
| 4 | Consistency and Standards | 2 | Mode switch refeito; submit fora do form; missing→Alert vs invalid→inline |
| 5 | Error Prevention | 3 | Normaliza bem, mas pune trim/duplo-espaço |
| 6 | Recognition Rather Than Recall | 3 | ?code= preenche; "onde acho o código" sem resposta |
| 7 | Flexibility and Efficiency | 3 | Query code/draft/enterKeyHint; paste OTP não evidenciado |
| 8 | Aesthetic and Minimalist Design | 3 | Contido, 1 CTA; avatar+espectador incham core |
| 9 | Error Recovery | 3 | role_denied manda sair/entrar (loop) |
| 10 | Help and Documentation | 2 | Ritual some no mobile (display:none <1000px) |
| **Total** | | **27/40** | **Acceptable** |

## Anti-Patterns Verdict
**LLM:** Não é slop. Sem gradiente/glass/hero-centrado/emoji/clichê. 1 ban real: ghost-card (.join-card border 1px + shadow 0 20px 60px). 01/02/03 permitido (sequência real), estilo batido mas ok. Segmented refeito com 2 Buttons = padrão genérico.
**Deterministic scan:** `detect.mjs --json join.tsx avatar-picker.tsx language-toggle.tsx` → exit 0, `[]` (0 findings). not-found.tsx fora do escopo do scan.

## Overall Impression
Engenharia de a11y acima da média, copy PT/EN com voz, tokens disciplinados. Maior oportunidade: reduzir carga antes do core (avatar+espectador) e devolver reassurance no submit.

## What's Working
- Copy bilíngue com voz ("só um apelido para a mesa"), EN é tradução real.
- A11y: fieldset-disabled + aria-busy + sr-only status, enterKeyHint/autocomplete, normalizeCode + preflight.
- Tokens contidos, 1 CTA primário, motion 180ms só em botão.

## Priority Issues
- **[P1] Mode switch reinventa segmented** — 2 Buttons outline/ghost, delta ativo fraco. Fix: primitivo Tabs/Segmented coss ou radiogroup; reforçar contraste do ativo. Sug: $impeccable layout
- **[P1] Submit fora do form (CardFooter via form=)** — fieldset disabled não cobre submit; ordem DOM/AT quebrada. Fix: submit dentro do form DOM. Sug: $impeccable harden
- **[P1] Busy apaga o verbo** — texto transparente + spinner; vidente perde confirmação. Fix: spinner inline mantendo label + destino ("você vai ganhar um código"). Sug: $impeccable clarify
- **[P2] Ritual display:none no mobile** — some onde convidado mais precisa. Fix: colapsar, nunca esconder. Sug: $impeccable adapt
- **[P2] Espectador no create + "assento" fantasma** — cria-e-assiste quebra modelo; role_denied punitivo. Fix: espectador só no join. Sug: $impeccable clarify

## Persona Red Flags
- **Jordan (SR/teclado):** slot 1 OTP sem aria-label (join.tsx:309-318); erro não diz posição.
- **Sam (mobile apressado):** ritual some <1000px (join.css:292-294); convidado com ?code= perde contexto.
- **Alex (novato):** marca espectador no create → role_denied "saia e entre" (loop convidado pelo UI).

## Minor Observations
- ghost-card: shadow 20px/60px → token ≤12px ou só border no dark.
- nickHint expõe regra interna; colapsar espaços em vez de reprovar.
- codeHint promete paste; garantir distribuição nos 4 slots.
- H1 com <br> fixo quebra EN estranho; preferir 1 string + balance.
- join-page + not-found-page dividem seletor; separar.
- lang-link (button) sem :focus-visible dedicado (brand.css); só fallback global.
- spectate checkbox 18px (área via label, não caixa 44px).

## Questions to Consider
- Por que a foto é pedida antes do primeiro join?
- Por que o submit de criar não promete o código (passo 2 do ritual)?
- O que um espectador da própria sala deveria ver?
- Se o mobile nunca vê o ritual, o que sobra do register?
- Qual o custo de autocorrigir em vez de 3 erros de apelido?
