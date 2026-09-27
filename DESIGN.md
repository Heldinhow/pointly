---
name: Pointly
description: Ritual rápido de planning poker — meia-noite, vidro e uma aurora violeta. Dark-first, mesa de feltro profundo, números sempre mono tabulares.
colors:
  primary: "#5B3DE0"
  primary-dark: "#6C5CE7"
  on-primary: "#FFFFFF"
  ring: "#7C6BFF"
  ring-dark: "#A99BFF"
  background: "#F4F5FC"
  background-dark: "#0A0D1D"
  surface: "#FFFFFF"
  surface-dark: "#131731"
  on-surface: "#191C38"
  on-surface-dark: "#EDEDF7"
  muted: "#E9EBF9"
  muted-dark: "#1B2044"
  muted-foreground: "#565C80"
  muted-foreground-dark: "#A2A8CF"
  border: "#DDE0F2"
  border-dark: "#2B3158"
  input: "#B9BEDA"
  input-dark: "#3D4478"
  secondary: "#E9EBF9"
  secondary-dark: "#1E2450"
  on-secondary: "#3A3F6B"
  on-secondary-dark: "#C7CCF0"
  glass: "rgb(255 255 255 / 72%)"
  glass-dark: "rgb(19 23 49 / 66%)"
  glass-border: "rgb(91 61 224 / 14%)"
  glass-border-dark: "rgb(169 155 255 / 18%)"
  aurora-1: "#7C6BFF"
  aurora-1-dark: "#6C5CE7"
  aurora-2: "#2FD4C4"
  aurora-3: "#5B8CFF"
  table-rail: "#D4D8F0"
  table-rail-dark: "#262C55"
  table-wordmark: "#8E96CC"
  felt-start: "#2B3069"
  felt-end: "#141838"
  felt-ink: "#ECEEFC"
  card-face: "#F4F5FC"
  card-back: "#4B3FC4"
  card-ink: "#191C38"
  wordmark: "#8E96CC"
  error: "#EF4444"
  success: "#10B981"
  gradient-text-light: "linear-gradient(100deg, #5B3DE0, #7C3AED 48%, #0F766E 92%)"
  gradient-text-dark: "linear-gradient(100deg, #C7BFFF, #8B7CFF 48%, #5EEAD4 92%)"
typography:
  headline-display:
    fontFamily: Geist
    fontSize: 62px
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: -0.045em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: -0.04em
  headline-sm:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.035em
  body-lg:
    fontFamily: Geist
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  label-caps:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.12em
  stats:
    fontFamily: Geist Mono
    fontSize: 42px
    fontWeight: 600
    lineHeight: 1
    fontFeature: tnum
rounded:
  sm: 12px
  md: 14px
  lg: 16px
  xl: 20px
  card: 24px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  gutter: 32px
  header: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "color-mix(primary 90%, white)"
    rounded: "{rounded.lg}"
    padding: 12px
  card-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.card}"
    padding: 24px
  deck-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: 9px
  felt:
    background: "radial-gradient(ellipse at 50% 35%, #2B3069, #141838)"
    textColor: "{colors.felt-ink}"
    rounded: 180px
---

# Design System: Pointly

**SSOT de código:** `apps/web/src/index.css` (`:root` / `.dark` = cores, vidro, gradiente) + `apps/web/src/brand.css` (aurora, chrome, deck, utilitários `.glass-card` / `.text-gradient`) + CSS por página. Este arquivo é a camada semântica; se o CSS mudar, este doc acompanha.
**Validar:** `npx @google/design.md lint DESIGN.md`.

## Overview

**Creative North Star: "A mesa de vidro sob a aurora."**

O ritual continua calmo e sem fricção, mas agora acontece à meia-noite: fundo de tinta profunda com aurora violeta em deriva lenta, superfícies de vidro que deixam a luz passar, e um único acento — violeta elétrico (`#5B3DE0` light / `#6C5CE7` dark) — sempre na ação principal. A mesa de feltro troca o verde-pinheiro por violeta profundo; as cartas continuam táteis, com verso violeta e face de papel frio. Tipografia Geist track-tight, números sempre mono tabulares; o texto de destaque usa gradiente violeta→teal (nunca em parágrafos). Dark-first: `html.dark` é o padrão (`localStorage: pointly-theme`), e o light é um papel frio lavanda com a mesma aurora em pastel. Copy em pt-BR, tom direto.

**Key Characteristics:**

- Uma única ação principal por tela, agora violeta; o resto é ghost/outline/link.
- Vidro é a superfície padrão de destaque (hero demo, entrada, deck da arena): translúcido + blur + borda luminosa.
- A aurora é ambiente: nunca compete com conteúdo, nunca anima layout (só `transform/opacity`).
- Mesa e cartas seguem o vocabulário de domínio — feltro meia-noite, carta face clara, verso violeta.
- Todo estado async é anunciado (`aria-live`); foco sempre visível em `var(--ring)`; `prefers-reduced-motion` colapsa tudo.

### Dials deste projeto (Stitch)

| Dial | Level | Descrição |
|------|-------|-------------|
| **Creativity** | `6` | `5` = limpo com personalidade; `6` = gradiente no destaque, aurora e cartas flutuantes na home. Arena continua previsível. |
| **Density** | `6` | Home ~4, Arena ~7. Sem mudança estrutural. |
| **Variance** | `5` | Offsets sutis (cartas flutuantes, halo atrás do card). Arena nunca caótica. |
| **Motion Intent** | `7` | Entradas orquestradas, flip 3D, aurora em deriva, micro-interações de hover/press — sempre `transform/opacity` e desligável. |

### Shell e contenção

- **Containment:** shell global `max-width: 1304px`; home inner `1240px`; entrada `560px`. Padding `32px` desktop / `20px` mobile.
- **Header (`ShellHeader`, `--header-h: 48px`):** sticky, vidro sempre ativo (`color-mix(background 68%)` + `blur(14px) saturate(1.4)`), fundo sobe para 86% ao rolar. Nav com underline deslizante em gradiente `primary → aurora-2`. Todos os offsets derivam de `var(--header-h)`.
- **Superfícies:** home em split assimétrico; arena em `grid 1fr / 288px` com sidebar à direita; entrada em 1 coluna de até `560px`; landing com 1 CTA primário; guide com TOC sticky; 404 com CTA primário que preserva o convite.
- **Camadas:** sem overlap de conteúdo; `z-index` só para navbar/modal/overlay/aurora (`-1`). Feltro `z:0`, assentos `z:1`.
- **Responsivo (verificar `375/390/768/1024/1440`):** uma coluna na entrada/home ≤1000px, arena ≤1050px. Sem scroll horizontal. Touch ≥ `44px`.

## Colors

### Primary

- **Violet Signal (#5B3DE0 / #6C5CE7 dark):** único driver de interação (CTA, seleção do deck, avatar self, destaque da sidebar). Hover `primary/90` (coss). Texto sobre: `#FFFFFF` (contraste 6.5:1 no light, 4.8:1 no dark — AA).
- **Ring (#7C6BFF / #A99BFF dark):** exclusivamente focus-visible 2px.

### Aurora (ambiente)

- **Violet flock (#7C6BFF), Teal drift (#2FD4C4), Indigo drift (#5B8CFF):** três blobs de gradiente radial em deriva lenta (54–76s) com `--aurora-strength` `0.2` (light) / `0.5` (dark), mais um véu de grade 46px com máscara radial. Só `transform`; nunca interativos (`pointer-events: none`, `aria-hidden`).
- **Gradiente de texto (`--gradient-text`):** `#5B3DE0→#7C3AED→#0F766E` (light) / `#C7BFFF→#8B7CFF→#5EEAD4` (dark). Uso restrito: `<em>` do hero, número do resultado, código 404 e código da sala. Nunca em parágrafos nem no header inteiro.

### Surfaces e vidro

- **Canvas:** `#F4F5FC` / `#0A0D1D` (tinta meia-noite).
- **Card:** `#FFFFFF` / `#131731`. Texto `#191C38` / `#EDEDF7` — nunca preto puro.
- **Glass (`--glass` / `--glass-border`):** `rgb(255 255 255/72%)` e `rgb(19 23 49/66%)` com blur 18–22px + saturate 1.35–1.4. Aplicado em: card da demo da home, cartão da entrada, deck da arena, tela de conexão. Não aplicar vidro em conteúdo denso (sidebar, listas) — lá a superfície é opaca/ghost.
- **Mesa (fixos, não tematizam):** rail `#D4D8F0`/`#262C55`, feltro `radial-gradient(ellipse at 50% 35%, #2B3069, #141838)`, texto do feltro `#ECEEFC`, wordmark `#8E96CC`, carta face `#F4F5FC` (tinta `#191C38`), carta verso `#4B3FC4`.

### Named Rules

**The One Voice Rule.** O violeta primário aparece em ≤10% de qualquer tela, sempre na ação principal.
**The Ambient Aurora Rule.** Aurora é fundo, nunca protagonista: opacidade baixa, sem interação, sem animar layout, desligada por `prefers-reduced-motion`.
**The Readable Glass Rule.** Texto sobre vidro precisa bater AA contra o pior caso do fundo atrás; quando em dúvida, aumente a opacidade do vidro (nunca reduza a do texto).

## Typography

**Display/Body:** Geist (via `@fontsource/geist`). **Label/Mono:** Geist Mono — onde o número É a informação (votos, resultados, códigos, atalhos, kickers).

### Hierarchy

- **Display:** Home H1 `clamp(40px, 4.6vw, 62px)/1.06/-0.045em` com linhas em reveal escalonado e `<em>` em texto-gradiente. Entrada H1 `2.6rem` (`2rem` em uma coluna); título do formulário `1.75rem`; 404 `2rem`.
- **Headline:** Arena H1 `20px` (`18px` mobile), código da sala em mono com gradiente.
- **Title:** `32px/1.1/-0.035em` em seções e containers.
- **Kickers:** mono `11px/600`, tracking `0.12em`, uppercase — títulos da sidebar da arena, pips, `<kbd>`.
- **Body:** `17px/1.6` lede; `14px/1.55` descrições e rodapé. Corpo nunca < `14px`.
- **Stats:** mediana/resultado mono `42px/600 tabular-nums` (com gradiente no valor principal); média/intervalo/pips mono.

### Named Rules

**The Mono Tabular Rule.** Todo número de votação/resultado é Geist Mono `tabular-nums`.
**The Gradient Restraint Rule.** Texto-gradiente só em display de uma linha; nunca em corpo de texto, labels ou botões.
**The No Inter Rule.** `Inter` banido; serifadas genéricas banidas.

## Elevation

Hierarquia por camadas tonais, vidro e halo. Sombra só quando comunica elevação; halo violeta difuso substitui o glow neon (sempre via `color-mix(primary …)`).

- **Vidro:** `0 1px 0 rgb(255 255 255/8–10%) inset` + `0 30–40px 80–90px -48px color-mix(primary 60–65%)`.
- **Halo de palco (home):** `radial-gradient(closest-side, color-mix(primary 30%), transparent)` atrás da mesa.
- **Feltro:** `0 26px 60px -30px rgb(76 61 214/38%)` + highlights internos brancos a 8%.
- **Deck:** repouso `0 3px 0 var(--border)`; hover `+ 0 16px 28px -18px primary/55%`; selecionada `0 5px 0 primary/65% + 0 20px 36px -16px primary/62%`.

### Motion

- **Física:** easings `--ease-out-quart/quint`; sem bounce/elastic.
- **Aurora:** três derivações lentas (54/68/76s, alternate) — `translate3d + scale`.
- **Hero:** linhas do H1 sobem em cascata (`640ms`, delays 0/120/230/330/430ms), visual entra com `translateY + scale`; cartas flutuantes em loop `translate`.
- **Mesa:** assentos entram em cascata (`--seat-i * 55ms`); carta votada flipa em 3D (`perspective: 460px` no assento + `preserve-3d`; `card-flip` `rotateY(180°→24°→0)` com overshoot de `scale(1.08)`; `card-reveal` `rotateY(90°→-14°→0)`).
- **Empty state solo:** três cartas em loop de shuffle (`rotate`/`translate`) + anel tracejado pulsando (`scale`/`opacity`).
- **Micro-interações:** deck levanta (`-translate-y-1/2` no componente + halo), botões com press `scale(0.98)`/`translateY(-1px)`, seta do CTA desliza, avatares interativos levantam 3px, cards de landing levantam 5px.
- **Hardware:** animar SÓ `transform`/`translate`/`rotate`/`scale`/`opacity`; nunca `top/left/width/height`.
- **Acessibilidade:** rede global em `index.css` colapsa animações/transições para `0.01ms`; blocos explícitos `prefers-reduced-motion` em poker-table, celebration e aurora (estática). Wordmark sempre visível.

## Components

### Buttons (coss `Button`)

- Primário: fill violeta (gradiente sutil + halo no CTA da entrada). Hover = shift de background; active = `scale(0.98)`.
- `xl` no hero; `outline`/`ghost` para convite e ações terciárias; `destructive-outline` para nova rodada armada.
- Focus-visible anel 2px; loading preserva nome acessível.

### Navigation (ShellHeader)

- Vidro sempre ativo, hairline `border 82%`, nav 14px/500 com underline em gradiente; rota ativa `aria-current`.
- Seletor de idioma mono 12px/600, alvo 44px.

### Cards / Containers

- Padrão: `rounded-2xl` (24px quando vidro), `bg-card` sobre fundo; sidebar da arena em cards-fantasma (sem borda/fundo) com títulos kicker mono.

### Deck (assinatura)

- Cartas táteis com cantoneiras; `clamp(44px, 4.8vw, 58px) × 80px`, radius 9px, mono 24px.
- Hover levanta + halo violeta; selecionada = fill primário + sombra de 5px; disabled perde opacidade.
- Mobile: 5 colunas, pausa na coluna própria à direita.

### PokerTable (domínio)

- Feltro meia-noite com rail escuro e vinheta; assentos entram em cascata; self com avatar em gradiente violeta.
- Carta votada: verso violeta com padrão → face clara com flip 3D; pills `Votou`/valor seguem como leitura acessível.
- Empty seats tracejados; host com coroa; `Justifica` em âmbar.

### Empty / Waiting

- **Sala vazia (solo):** bloco `arena-waiting` ganha ilustração animada de cartas + `solo-hint` (borda cheia + fill) + CTA `solo-copy` (`outline`, reusa clipboard, label vira "Copiado!").
- Nunca só "No data".

### Inputs / Fields (coss)

- Label acima, erro abaixo; radius 12px; foco com borda violeta + anel; `aria-invalid` tinge a borda de destructive. OTP em mono 20px.

### Alerts

- Radius `xl`, tint 4% + borda 32%; `role="alert"`; testids de superfície preservados (`vote-error`, `reveal-error`, `new-round-error`, `projectile-error`, `rejoin-error`).

### Projéteis / Cutucadas / Celebração

- Projéteis com SVG próprio (sem emoji); ripple da cadeirada em violeta claro; confete de unânime em violeta/teal/branco/âmbar (14 peças determinísticas, anel `#A99BFF`).
- Pauta e cutucadas inalteradas em comportamento; herdam tokens novos.

## Do's and Don'ts

### Do:

- **Do** usar o violeta primário para uma única ação principal por tela; o resto ghost/outline/link.
- **Do** manter AA (4.5:1 texto normal, 3:1 grande) inclusive placeholders e texto sobre vidro/feltro.
- **Do** derivar todo offset do header de `var(--header-h)`.
- **Do** animar só transform/opacity e cobrir `prefers-reduced-motion`.
- **Do** manter todos os `data-testid` e `aria-live` existentes (testes e acessibilidade dependem deles).
- **Do** passar a duração da confirmação de nova rodada via inline style de `NEW_ROUND_CONFIRM_TIMEOUT_MS`.
- **Do** manter os keyframes `card-flip`/`card-reveal` (contrato do teste) — a evolução 3D é aditiva.

### Don't:

- **Don't** emojis; projéteis usam SVG próprio.
- **Don't** gradiente arco-íris/AI-slop (violeta→azul→rosa em tudo), glow neon forte, ou mais de um acento de UI (gold só na celebração).
- **Don't** texto-gradiente em parágrafos, botões ou labels.
- **Don't** `Inter`, serif genérica, preto puro (`#000000`) ou misturar warm/cool gray.
- **Don't** overlap de conteúdo, `h-screen`, cursor custom, `z-index` spam (aurora é a única camada `-1`).
- **Don't** vidro em conteúdo denso (listas, sidebar, formulários longos) — vidro é para superfícies de destaque.
- **Don't** hero centrado, filler ("Scroll to explore"), ou 2 CTAs primários.
- **Don't** quebrar a11y: foco visível, estados async com `aria-live`, atalhos com `aria-keyshortcuts` + `<kbd>`.
