# Arena · Spec visual

> Complementa `docs/design-proposals.md` com o deep-dive da superficie
> onde 95% do tempo do usuario acontece. Estado por estado, tokens
> novos propostos, wireframes ASCII, criterios de aceitacao.

**Leitura de design**: ferramenta de produtividade para times ageis
pequenos (3-12 jogadores), com foco ritual da mesa de Planning Poker.
A Arena e o **palco**: tudo nela precisa ler em 200ms sem ler copy
longa. Hierarquia clara, motion justificada, estados cobertos.

---

## 1. Estados da Arena

Quatro fases (`phase` no client). Cada fase tem composicao visual
propria. Cobertura incompleta hoje (estados 1 e 2 ainda piscam entre
vazio/sem info).

### Estado 1 · idle (aguarda 1o voto)

```
+---------------------------------------------------------------+
|  o Pointly  SALA A8K2  RODADA 01  VOCE HELDER    [compartilhar]|
+---------------------------------------------------------------+
|                              o                                |
|         o         o         o          o       <- 7 assentos  |
|                              o                              |
|                                                            |
|                       ( Revelar votos )                    |  <- awaiting
|                       Aguardando 7 jogadores...             |  <- hint
|                                                            |
|                                                            |
|             [0] [1/2] [1] [2] [3] [5] [8] [13] [☕]       |  <- deck
+---------------------------------------------------------------+
```

- **Topbar** (sempre): brand lockup + sala + rodada + nick + share.
- **Table** (sempre): ellipse + N seats + skeleton slots (3 max).
- **Center**: RevealButton em **estado awaiting** (ghost, disabled,
  "Aguardando N jogadores..."). Apenas icone de status + texto.
  Sem cara de CTA - ver `docs/design-proposals.md` DESIGN-4.
- **StatsPill**: **skeleton** (h-10, w-40, opacity-30, animate-pulse
  suave 4s). Sem numero, sem label. Preenche layout e indica que
  "algo vai aparecer aqui".
- **TimerPill**: visivel, `bg-surface border-ink/5 text-ink-faint`.
  Valor em 60s. **Nao inicia contagem regressiva** ate o primeiro voto.
- **Deck**: enabled. Estado neutro.

### Estado 2 · voting (>=1 voto)

```
+---------------------------------------------------------------+
|  o Pointly  SALA A8K2  RODADA 01  VOCE HELDER    [compartilhar]|
+---------------------------------------------------------------+
|                                                              |
|                                                              |
|         o         o         o          o       <- VOTED      |
|                              o                              |
|                       ( Revelar votos. )                    |  <- coral CTA
|                       Todos podem revelar.                  |
|                                                            |
|                                                            |
|             [0] [1/2] [1] [2] [3] [(5)] [8] [13] [☕]       |  <- sua carta selecionada
+---------------------------------------------------------------+
```

- **StatsPill**: ainda skeleton (so aparece em revealed).
- **TimerPill**: countdown ativo. `<=30s` muda para `bg-coral-soft
  border-coral text-ink` (ja implementado). **Proposta**: adicionar
  `animate-pulse` sutil (2s) no estado critical para reforcar.
- **Center**: RevealButton em **estado ready** (coral pill).
  Hint: "Todos podem revelar." ou "Faltam 3 votos".
- **Progress**: **NOVO**. Adicionar contador discreto
  `5 / 8 votaram` abaixo do RevealButton quando state=ready.
  Ver `docs/design-proposals.md` DESIGN-7.
- **Seats**: VOTED state visivel (border-ink/15). Sua carta no deck
  com `border-2 border-coral bg-coral-soft/8` (ja implementado).

### Estado 3 · revealed

```
+---------------------------------------------------------------+
|  o Pointly  SALA A8K2  RODADA 01  VOCE HELDER    [compartilhar]|
+---------------------------------------------------------------+
|  MEDIA 5.5  MEDIANA 5  INTERVALO 3-8            ROUND 01  35s|
+---------------------------------------------------------------+
|                                                              |
|         5         8         5          13       <- face-up   |
|                              3                              |  <- median gold
|                       ( Nova rodada )                       |
|                       Limpar votos, reiniciar.              |
|                                                            |
|                                                            |
|                  ( deck desabilitado, opacity 0.4 )         |
+---------------------------------------------------------------+
```

- **StatsPill**: **agora visivel** com `MEDIA / MEDIANA / INTERVALO`.
  - MEDIA: `font-mono text-[11px] text-ink font-medium`.
  - MEDIANA: `font-italic text-[18px] text-mustard font-bold border-b
    border-mustard`. **Proposta**: subir numeral da mediana para
    `text-[20px]` e dar `tracking-[-0.02em]`. Ver DESIGN-14.
  - INTERVALO: caps mono discreto.
- **TimerPill**: **transforma**. Ao entrar em revealed, o timer
  congela no valor final (35s no exemplo) e mostra "TEMPO FINAL"
  abaixo do numero. Estilo: ghost, ink-faint, sem coral. Indica
  fim do countdown sem competir com o CTA.
- **Center**: RevealButton em **estado post-reveal** (coral pill,
  "Nova rodada" + hint "Limpar votos, reiniciar.").
- **Seats face-up**:
  - Numeral reveal em `font-italic text-[28px] text-ink` (default).
  - Numeral reveal mediano: `font-italic text-[40px] text-coral
    font-bold`. **Proposta**: subir default de 24px para 28px
    (consistencia com o numeral do deck 32px). Ver DESIGN-5.
  - Avatar + nick: opacity 0.18 (ja implementado).
- **Medalhao "unanimous"**: se `consensus.unanimous === true`,
  substituir Mediana por `o UNANIMOUS` mono caps mustard,
  MAS manter `MEDIA X . INTERVALO Y` ao lado. Ver DESIGN-10.

### Estado 4 · post-reveal (transicao)

Janela entre "Nova rodada" clicado e o proximo voting state. Hoje
e instantanea - o usuario ve a UI zerar de uma vez. **Proposta**:
orquestrar 600ms de saida (cards viram para baixo, stats fade,
revela "ROUND 02").

---

## 2. Wireframes

### Desktop (1440×900)

```
                       1360px container
   <------------------------------------------------->
   64px padding                                       64px padding

   +--[ topbar 48px ]-------------------------------------+
   |  Ø Pointly  SALA A8K2  RODADA 01  HELDER  [share]  |
   +-----------------------------------------------------+

   +--[ stage: flex-1 ]----------------------------------+
   |                                                    |
   |  [stats]                              [timer]      |  <- 56px from top
   |                                                    |
   |              960x500 ellipse + 12 seats            |
   |                                                    |
   |                  [ Reveal votos. ]                 |  <- center
   |                  Todos podem revelar.              |
   |                                                    |
   |                                                    |
   |             [deck 9 cards 72x100]                 |  <- bottom 32px
   |                                                    |
   +-----------------------------------------------------+
```

Breakpoints:
- `>=1280px` (lg): layout completo (12 seats em ellipse).
- `1024-1279px` (md): ellipse reduzida, timer/stats menores.
- `<1024px`: scroll vertical, mesa em aspect-ratio responsivo
  (ja implementado via `.arena-table { transform: scale(0.8) }`
  em index.css). Timer **escondido** no mobile (ja em arena.tsx:317).

### Mobile (<640px)

```
   <------------------- 360px ------------------>

   +--[ topbar ]-------------------------------+
   |  Ø Pointly        HELDER   [share ↓]      |
   +-------------------------------------------+

   +--[ stage scrollable ]---------------------+
   |                                           |
   |            (mesa menor, 80% scale)        |
   |                                           |
   |  (RevealButton 92% width, maior tap       |
   |   target 56px de altura)                  |
   |                                           |
   |  [stats pill - opcional hide se nao       |
   |   revealed, skeleton se pre-reveal]       |
   |                                           |
   |     0  ½  1  2  3  5  8  13  ☕          |  <- horizontal scroll deck
   |                                           |
   +-------------------------------------------+
```

Acoes mobile:
- Topbar colapsa metadata (mostra so "HELDER" + share).
- RevealButton largura total com `min-h-14` (56px tap target).
- Stats: so visivel pos-reveal, em sticky-top com o timer.
- Deck: ja tem scroll-snap com peek (`.fib-deck-peek-left/right`).

---

## 3. Tokens novos propostos

Adicoes ao `apps/web/src/index.css` `:root`:

```css
/* ---- Arena motion timings ---- */
--motion-vote-select: 180ms;      /* card-bump on vote */
--motion-reveal-flip: 320ms;      /* seat face-num opacity transition */
--motion-stats-appear: 240ms;     /* stats pill fade-in post-reveal */
--motion-timer-critical-pulse: 1800ms; /* timer pulse when <=30s */

/* ---- Arena-specific states ---- */
--coral-critical: #e36747;        /* timer critical bg - ja existe coral-soft */
--mustard-medal: #e9b94a;          /* median highlight - ja existe mustard */

/* ---- Voted progress ---- */
--vote-progress-bg: var(--ink-faint);
--vote-progress-fg: var(--ink);

/* ---- Typography refinements ---- */
--font-numeral-default: 28px;     /* seat face-num nao-mediano */
--font-numeral-median: 40px;      /* seat face-num mediano */
--font-numeral-deck: 32px;        /* deck carta numeral */

/* ---- Border (estados) ---- */
--seat-border-voted: rgba(21,20,15,0.15);
--seat-border-revealed: var(--ink);
--seat-border-median: var(--mustard);
--seat-border-you: var(--coral);
```

E no `tailwind.config.ts` `extend.boxShadow`:

```ts
boxShadow: {
  bone: "0 30px 60px -30px rgba(21, 20, 15, 0.15)",
  coral: "0 14px 26px -16px rgba(210, 74, 42, 0.6)",
  // novos:
  "seat-you": "0 14px 28px -16px rgba(210, 74, 42, 0.4)",
  "seat-median": "0 14px 28px -16px rgba(233, 185, 74, 0.4)",
  "reveal-glow": "0 0 0 4px rgba(210, 74, 42, 0.08), 0 14px 26px -16px rgba(210, 74, 42, 0.6)",
}
```

E no `extend.colors`:

```ts
colors: {
  // ... existente ...
  "ink-faint-soft": "rgba(21, 20, 15, 0.6)",
  "vote-progress": "var(--vote-progress-fg)",
}
```

---

## 4. Motion spec por transicao

| Transicao | Duracao | Easing | O que anima |
|---|---|---|---|
| Idle -> Voting (1o voto) | 200ms | `ease-out` | `card-bump` no deck + RevealButton ghost->coral + skeleton stats ainda skeleton |
| Voting -> Critical (<=30s) | 240ms | `ease-in-out` | TimerPill bg/border/text + `animate-pulse` 1.8s loop |
| Voting -> Revealed | 320ms | `cubic-bezier(0.16, 1, 0.3, 1)` | RevealButton coral->ghost (label "Nova rodada") + seats face-num stagger 30ms entre seats + StatsPill fade-in 240ms + timer congela |
| Revealed -> Idle (new round) | 600ms | `ease-out` em 3 estagios: t=0 cards fade-out (opacity 1->0, scale 0.96) + t=200ms stats fade-out + t=400ms RevealButton coral->awaiting + t=500ms novo "ROUND 02" badge pulse 1x |
| Hover seat | 180ms | `ease-out` | translateY(-3px) + Mira 🎯 button fade-in (sub-agente #60 ja remove isso em SVG) |
| Unanimous celebration | 1x 1200ms | `ease-out` | shimmer sweep da esquerda pra direita no border dos seats |

Todas as motion devem respeitar `prefers-reduced-motion: reduce`
(já tem override global em `index.css:65`).

---

## 5. Hierarquia de informacao (regra pratica)

Em qualquer estado, a Arena tem **1 acao primaria** + ate **2
informacoes de contexto**. Mais que isso compete por atencao.

| Estado | Acao primaria | Contexto 1 | Contexto 2 |
|---|---|---|---|
| Idle | (nenhuma) | Topbar (sala/rodada) | Skeleton stats |
| Voting | RevealButton coral | TimerPill | Voted progress |
| Revealed | RevealButton coral | StatsPill | TimerPill (final) |
| Empty solo | EmptyOverlay CTA | Skeleton slots | Topbar |

Nunca em tela ao mesmo tempo:
- EmptyOverlay + RevealButton coral (EmptyOverlay jah tem CTA share)
- StatsPill preenchida + skeleton (transicao rapida, OK)

---

## 6. Criterios de aceitacao

Para marcar como "Arena v2 done":

- [ ] Numerais face-up sobem de 24px para 28px (default) e 40px (mediano).
- [ ] StatsPill tem skeleton pre-reveal (evita layout shift e preenche o espaco).
- [ ] TimerPill em estado critical ganha `animate-pulse` sutil 1.8s.
- [ ] Contador "X / Y votaram" visivel durante voting (state=ready).
- [ ] RevealButton em estado awaiting NAO tem cara de CTA (ver DESIGN-4).
- [ ] Transicao voting->revealed e orquestrada (stagger entre seats).
- [ ] "Nova rodada" tem animacao de saida coordenada (cards fade-out).
- [ ] Unanimous preserva info numerica (MEDIA + INTERVALO ao lado do badge).
- [ ] Tokens motion-* adicionados em index.css.
- [ ] Shadows seat-you / seat-median adicionados em tailwind.config.ts.
- [ ] Mobile: RevealButton largura total, min-h-14 (56px tap target).
- [ ] Todos os testes existentes (arena.test.tsx) passando.
- [ ] axe-core: 0 violacoes.
- [ ] Lighthouse Arena 1440px >= 95.

---

## 7. Cross-ref com docs/design-proposals.md

| Arena spec | Proposal doc |
|---|---|
| §1 Estado 1 skeleton stats | DESIGN-2 *(✓ implementado #67/#81)* |
| §1 Estado 2 voted progress | DESIGN-7 |
| §1 Estado 2 critical pulse | (novo) |
| §1 Estado 3 numeral 28px/40px | DESIGN-5 |
| §1 Estado 3 unanimous preserva info | DESIGN-10 |
| §1 Estado 4 nova rodada | DESIGN-16 |
| §1 RevealButton awaiting sem cara CTA | DESIGN-4 |
| §3 tokens motion-* | (novo) |
| §4 motion spec | (consolida varios) |
| §5 hierarquia | (novo) |

---

`$ pointly/arena-design-spec.md · gerado 2026-07-10 ·
complementa design-proposals.md`