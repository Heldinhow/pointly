---
target: arena — presença, voto, revelação, reação
total_score: 21
p0_count: 1
p1_count: 3
timestamp: 2026-09-07T01-56-24Z
slug: apps-web-src-pages-arena-tsx
---
Method: dual-agent (A: design-review · B: detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | StatsPill null pré-reveal; cooldown projétil não anunciado |
| 2 | Match System / Real World | 2 | PT/EN misturado: IDLE/VOTED/DISCONNECTED, Players, ROUND, Unanimous |
| 3 | User Control and Freedom | 2 | confirm+beforeunload prendem saída; Nova rodada sem confirmação |
| 4 | Consistency and Standards | 2 | Dois dialetos coral/paper vs accent/table; Revelar votos vs Revelar votos. |
| 5 | Error Prevention | 2 | Reveal com 1 voto; nova rodada limpa tudo sem guardrail |
| 6 | Recognition Rather Than Recall | 2 | Projéteis hover-only; atalhos R/N/? invisíveis |
| 7 | Flexibility and Efficiency | 3 | Atalhos + Deck button nativo; ponto mais forte |
| 8 | Aesthetic and Minimalist Design | 3 | Mesa elíptica contida; ruído de projéteis/shield |
| 9 | Error Recovery | 1 | Cópia falha só console.error; DISCONNECTED só opacity-40 |
| 10 | Help and Documentation | 2 | HelpModal só via ?; sem botão visível na arena |
| **Total** | | **21/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment**: Não é AI slop clássico — passa nos absolute bans (sem side-stripe, gradient-text, hero-metric, eyebrow-everywhere). Mesa elíptica + felt com anel accent 30% é voz própria. Falha no registro produto: motion decorativo (projéteis 7 emojis + hit-shake/dodge/deflect + emoji aleatório), display font no CTA (reveal-button font-display), affordance reinventada (deck scrollbar escondida + peeks), modal confirm como primeiro reflexo. Metáforas quebradas: paper_ball=🏐, rubber_duck=🧸. Playfair residual em comentários vs Space Grotesk real.

**Deterministic scan**: detect.mjs exit 2, 35 findings (5 warning overused-font + 30 advisory: 8 radius, 13 font-size, 9 color). Zero em arena.tsx/landing.tsx direto; tudo em CSS importado. Detector capturou o que o LLM subestimou: feedback.css com #fbe1dc/#b8412f/#e5ecd9 fora do sistema (6 ocorrências), entry.css .7rem/.82rem fora da escala, landing 13px/11px/15px/10px fora da escala, arena.css .6rem radius fora. Concordam em: mint #c8e9ba fora da paleta, radius 8px vs 9px, focus com accent vs focus token, label 11px/.04em vs 12px/.08em, display-xl 200px vs teto 5.9rem.

**False positives**: overused-font Space Grotesk x5 é identidade cometida (DESIGN.md 34,40,46,52,159,198) — preservação vence. mini-card 5px é exceção documentada (DESIGN.md 178). Nomes coral/paper/mustard/olive são aliases compat (DESIGN.md 205), não drift por si.

**Visual overlays**: sem injeção live nesta rodada; evidência via leitura de código + curl 200 + detector CLI. Nenhum overlay visível no browser.

## Overall Impression

Mesa com copy de facilitador e branch mobile honesto, mas afogada em dois dialetos de token, PT/EN quebrado e um jogo paralelo de projéteis que compete com estimar. Dark mode da arena morto por nesting inválido. Maior oportunidade: matar o nesting + unificar idioma + diferenciar Revelar vs Nova rodada — isso eleva confiança mais que qualquer micro-interação.

## What's Working

- Copy de estado da mesa (arena.tsx 240-249): Tem lugar / Podemos revelar / Cada um no seu tempo + contador. Fala como facilitador.
- Branch mobile honesto: MobilePlayerList + MobileRevealDock sticky com safe-area, deck primeiro e CTA depois, thumb-zone respeitada.
- Fundação semântica: role timer/group/status/list, aria-pressed no deck, tabular-nums, text-wrap balance.

## Priority Issues

- **[P0] Dark mode da arena morto** — arena.css 18-29 aninha .arena-shell dentro de html[data-theme=dark] .arena-shell (seletor .arena-shell .arena-shell nunca casa). Vars dark locais nunca aplicam; arena fica clara no app escuro. Fix: desaninhar bloco. Suggested: /impeccable polish
- **[P1] Idioma PT/EN quebrado** — seat.tsx 71-76 IDLE/VOTED/DISCONNECTED, MobilePlayerList Players, timer ROUND, stats Unanimous num produto PT-BR. Fix: PT-BR visível, EN só em data/API. Suggested: /impeccable clarify
- **[P1] Revelar vs Nova rodada indistinguíveis + destrutiva sem guardrail** — reveal-button 145-159 ambos bg-coral; ready com 1 voto (61-68); nova rodada limpa sem confirmação. Fix: reveal primário, nova rodada outline/ghost + confirmação inline + hint de contagem. Suggested: /impeccable harden
- **[P1] Deck 9 opções cruas + scroll escondido** — deck.tsx 117-129 48x68, scrollbar escondida, só peeks w-12; disabled só opacity-40. Viola working memory ≤4 no core loop. Fix: chunking visual, selecionada sempre visível, disabled com label não só opacidade. Suggested: /impeccable layout
- **[P2] Projéteis como feature paralela** — seat.tsx 92-181 hover-only, 7 emojis, window.__pointly_cooldown + interval 200ms, shield bg-mustard/15 colide com signature reservada. Metáforas erradas 🏐/🧸. Fix: reduzir a pós-reveal ou tornar focável com aria-haspop, sem global. Suggested: /impeccable quieter

## Persona Red Flags

**Alex (power, scrum master 8 pessoas)**: R/N/? invisíveis (arena.tsx 291-300); reveal com 1 voto sem fricção; sem Esc no menu projéteis; sem reassurance de voto privado — hesita votar cedo.
**Sam (teclado+leitor)**: projéteis só onMouseEnter (seat.tsx 212-217), emoji só title, sem aria-expanded/haspopup; HelpModal sem botão (só ? com Shift); mediana só border-b mustard (cor sozinha); StatsPill 10px uppercase.
**Casey (mobile 1 mão, 4G)**: dock salva (44px), mas header strip espreme 3 infos em 360px; sem aria-live ao voltar de interrupção; beforeunload+confirm pune troca de app; snap-mandatory exige scroll preciso de polegar.

## Minor Observations

- emptyOverlayNonce useState(0) nunca atualiza (arena.tsx 185) — código morto.
- h1.sr-only + 2 stubs hidden duplicam anúncio (arena.tsx 314-324).
- Badge Você 10px border-coral-deep no limite de contraste (seat.tsx 317).
- Comentários citam Atelier Zero descartada (stats-pill 76-79, timer-pill 77-79).
- --shadow-coral:none + shadow-coral = CTA sem elevação; hover coral-soft imperceptível (index.css 11, reveal-button 147).
- StatsPill/TimerPill absolutos top 1.25rem colidem em 640-720px (arena.css 43-52,162-166).
- Mobile dot w-1.5 como único sinal além do número — cor sozinha.
- Landing mint #c8e9ba/#284229 fora do sistema (landing.css 54); PLAYERS VO mint (landing.tsx 12-17).
- Focus landing usa accent não focus token (landing.css 67 vs DESIGN.md 17,150,178).
- Radius 8px vs 9px (landing.css 21,34 vs DESIGN.md 75-79,178,182,185); label 11px/.04em vs 12px/.08em (tailwind 69-77 vs DESIGN.md 70-74); display-xl 200px vs teto 5.9rem (tailwind 30-31).

## Questions to Consider

- Se o voto é privado, por que VOTED grita igual em vez de sussurrar "só você vê"?
- O que a mesa perderia se projéteis sumissem amanhã — e ganharia em foco na divergência (destacar fora da mediana)?
- Revelar com 1 de 8 é democracia ou acidente — qual fricção mínima preserva autonomia?
- Fim da rodada é Limpar ou Convergir (registrar mediana X)?
