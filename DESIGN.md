---
version: alpha
name: Pointly
description: Ritual rápido de planning poker — calmo, tátil, sem fricção. Dark-first, verde-pinheiro, feltro radial, números sempre mono tabulares.
colors:
  primary: "#17634F"
  on-primary: "#FFFFFF"
  primary-hover: "#12503F"
  primary-dark: "#A9D6AD"
  on-primary-dark: "#183523"
  secondary: "#606E65"
  secondary-dark: "#A8B6AA"
  secondary-container: "#E5ECE4"
  on-secondary-container: "#304D3B"
  surface: "#FFFFFF"
  on-surface: "#202B27"
  background: "#F4F6F3"
  background-dark: "#141D19"
  surface-dark: "#1B2721"
  on-surface-dark: "#EBF0E9"
  border: "#DCE3DB"
  border-dark: "#334439"
  ring: "#38856C"
  ring-dark: "#8ABB91"
  neutral: "#F4F6F3"
  error: "#B91C1C"
  error-dark: "#F87171"
  success: "#17634F"
  success-dark: "#A9D6AD"
  felt-start: "#246951"
  felt-end: "#154634"
  felt-ink: "#F2F7F3"
  card-face: "#F3F5EB"
  card-back: "#286451"
  table-rail: "#D6E1D4"
  table-rail-dark: "#394D3E"
  wordmark: "#C4DBCD"
typography:
  headline-display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: -0.04em
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
    letterSpacing: -0.03em
  body-lg:
    fontFamily: Geist
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.65
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
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.1em
  timer:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
  stats:
    fontFamily: Geist Mono
    fontSize: 38px
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: tnum
rounded:
  sm: 8px
  md: 10px
  lg: 12px
  xl: 18px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  gutter: 32px
  margin: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: 12px
  button-secondary:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 16px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 8px
  deck-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: 9px
    padding: 8px
---

# Design System: Pointly

**Skill:** stitch-design-taste (adaptado do padrão Google Stitch).
**SSOT de código:** `apps/web/src/index.css` (`:root` / `.dark`) — este arquivo é camada semântica, não duplica tokens. Tokens acima são os valores normativos; a prosa explica como aplicá-los. Se mudar o CSS, este doc acompanha.
**Validar:** `npx @google/design.md lint DESIGN.md` · `diff DESIGN.md DESIGN-v2.md` · `export --format css-tailwind|dtcg`.

## Overview

Interface de ritual rápido: calma, tátil, sem fricção — como uma mesa de feltro bem iluminada onde cada carta ganha seu lugar.

Impressão geral: barato para entrar (sem cadastro), caro na sensação — verde-pinheiro profundo, feltro radial, tipografia track-tight, números sempre mono tabulares. Dark-first: `html.dark` é o padrão (`localStorage: pointly-theme`). Copy em pt-BR, tom direto: "Boas conversas. Melhores estimativas.", "Sem cadastro. Direto à conversa."

### Dials deste projeto (Stitch)

| Dial | Level | Descrição |
|------|-------|-------------|
| **Creativity** | `5` | `1` = ultra-minimal suíço. `5` = limpo com personalidade (ferramenta real-time). `10` = editorial expressivo. Home pode ousar, arena deve ser previsível. |
| **Density** | `6` | `1` = galeria arejada. `5` = app diário. `10` = cockpit denso. Home ~4, Arena ~7. Média 6. |
| **Variance** | `5` | `1` = grids simétricos. `5` = offsets sutis. `10` = caótico artístico. Arena não pode ser caótica no meio do voto. |
| **Motion Intent** | `5` | `1` = estático. `5` = hover/entrada sutil. `10` = coreografia cinemática. Respeita `prefers-reduced-motion` (já implementado). |

> **Como usar:** gere telas novas no Stitch com estes dials. Home/demo aceita Creativity até 6. Arena/sala aceita no máximo 4 — legibilidade > expressão durante votação.

## Colors

Paleta enraizada em neutros de alto contraste com **um único acento verde por tema**. Tokens `primary`/`secondary`/`neutral`/`surface` abaixo são o light (`:root`); variantes `-dark` espelham o `.dark` (padrão).

- **Primary (#17634F Pine Signal / #A9D6AD Mint Signal dark):** o único driver de interação. CTAs, avatar self, reveal, deck selecionado. Texto sobre: #FFFFFF (light) / #183523 (dark).
- **Secondary (#606E65 Moss / #A8B6AA Faded Sage dark):** corpo, descrições, metadata utilitária.
- **Tertiary/Ring (#38856C / #8ABB91 dark):** exclusivamente focus-visible 2px, nunca CTA.
- **Neutral (#F4F6F3 Canvas Mist / #141D19 Night Pine dark):** fundação das páginas, mais suave que branco puro.
- **Surface (#FFFFFF Pure Surface / #1B2721 Felt Card dark):** cards, popovers. Texto sobre: #202B27 Pine Ink / #EBF0E9 Paper Mint — nunca preto puro.
- **Bordas e fills:** Sage Line #DCE3DB / Bark Line #334439 (bordas 1px); Soft Felt #E9EEE8/#E5ECE4 / Deep Moss #24332A/#2B3D30/#2A3C30 (muted/secondary fills).
- **Mesa (fixos, não tematizam):** Table Rail #D6E1D4/#394D3E, Wordmark #C4DBCD ("Pointly" vazado), Felt Gradient `radial-gradient(ellipse at 50% 35%, #246951, #154634)` com texto sempre #F2F7F3, carta verso #286451 (borda #E7EEE8), carta face #F3F5EB.
- **`chart-4` roxo / `chart-5` rose do tema:** só em gráficos, nunca em CTA.

## Typography

Duas famílias, papéis rígidos. `Inter` BANIDO (já conforme via `@fontsource/geist`).

- **Headlines (`headline-display` / `headline-sm` / `headline-md`):** Geist Semi-Bold, tracking no mínimo `-0.04em`, com `text-wrap: balance`. Home H1 `clamp(38px, 4.4vw, 58px)` → mobile `clamp(30px, 6.8vw, 48px)`, leading `1.08`, `<em>` em Pine Signal na segunda frase. Home H2 `clamp(30px, 3.3vw, 42px) / 1.15`. Entrada H1 `40px`, `32px` em uma coluna; título do formulário `28px`; erro 404 `32px`. Arena H1 `20px / -0.04em / 650` (`18px` no mobile), código mono tabular.
- **Body (`body-lg` / `body-md` / `body-sm`):** Geist 400, leading relaxado (`1.55–1.7`), cor Moss/Faded Sage. Lede hero `17px`, max `430px`. Descrições, sidebar, feedback e rodapé `14px`. Corpo nunca < `14px` (`12px` só em metadata densa da arena).
- **Labels e dados (`label-caps` / `stats`):** Geist Mono com `tnum`. Stats `38–40px/600 tabular-nums`, kickers `10–11px uppercase tracking 0.09–0.1em`, pips de distribuição `11px`, kbd. **Todo número de votação/resultado é mono tabular.**
- Serifadas genéricas (`Times`, `Georgia`, `Garamond`, `Palatino`) banidas — se serif um dia for preciso, só modernas distintivas (`Fraunces`, `Instrument Serif`); serif sempre banida na arena/dashboard.

## Layout

Modelo **Fixed-Max-Width Grid** no desktop, **Fluid** de 1 coluna no mobile. Grid-first: CSS Grid estrutural, `calc(33% - 1rem)` banido.

- **Containment:** shell global `max-width: 1304px` (`.site-header/.site-main/.site-footer`). Home inner `1240px`. Padding `32px` desktop / `20px` mobile. Fechamento da home: “Agora, reúna seu time.”, sequência ordenada `Crie a sala → Compartilhe o código → Estimem juntos` e CTA `Criar sala`. Steps = `repeat(3, 1fr)` com divisórias `border-right`, sem altura mínima; no mobile, linhas com número à esquerda e conteúdo à direita. Demo e fechamento usam `40px` de espaço superior no desktop / `32px` no mobile.
- **Arena:** `grid 1fr / 288px`, gap `32px`. Sidebar com `border-left + padding-left 26px`. ≤1050px: 1 coluna, sidebar vira `2-col grid` com `border-top`. ≤700px: sidebar 1 coluna.
- **Hero (home, split assimétrico, nunca centrado):** grid `1.16fr / 1fr`, gap `48px`, padding `32px 0 40px`, `border-bottom`. Copy `max 680px`. Ações: 1 CTA primário (`Criar sala →`, `size=xl`) + 1 text-link sublinhado (`Entrar com código`), ambos com altura mínima `44px`; abaixo, link discreto `Experimente uma rodada` para `#demo`. Visual: mesa de feltro ilustrada em CSS, cartas e quatro assentos, palco `aspect 1.35 / min-height 430px`; costura acompanha a oval. ≤1000px: uma coluna, visual `max-width 560px`; ≤760px: feltro `min-height 300px` em fluxo, actions empilham <380px. As duas frases do título da demo quebram como unidades.
- **Entrada:** até `1000px`, uma coluna de no máximo `560px`; introdução curta seguida do formulário, sem repetir os três passos da home. Desktop mantém o ritual ao lado. Modo selecionado usa superfície neutra; o envio é a ação primária. Código vem após apelido, antes das opções de foto/espectador; slots `50px`. Durante envio, fieldset desabilitado e status anunciado. Ao mudar de rota, scroll volta ao topo e foco vai ao conteúdo principal.
- **Full-height:** `min-h-dvh` no wrapper. Nunca `h-screen` / `height:100vh` (jump do Safari iOS).
- **Camadas:** sem overlap de conteúdo. `z-index` só para navbar/modal/overlay. Feltro `z:0`, assentos `z:1` — exceção técnica documentada, não padrão.
- **Responsivo (verificar SEMPRE em `375px / 390px / 768px / 1024px / 1440px`):** uma coluna na entrada/home ≤1000px, arena ≤1050px. Sem scroll horizontal — overflow = falha crítica. Touch: alvos ≥ `44px`, botões mobile full-width onde couber. Arena mobile: esconde símbolo da sala, sair vira ícone, dicas de atalhos ficam no desktop, deck `padding-inline 16px`. Header/nav colapsa (esconde "Início" <700px), footer empilha `column/align-start/gap 5px`.

## Elevation & Depth

Hierarquia por **camadas tonais e bordas**, sombra só quando comunica elevação — nunca glow neon.

- Sombras curtas e difusas: `0 20px 60px rgb(28 57 45 / 8%)` (home demo), `0 8px 20px -16px #163c2d44` (arena deck). Sidebar usa cards "fantasma" (transparent, sem sombra, `border-top` como separador).
- Deck: `box-shadow: 0 3px 0 var(--border)`; selecionada `0 5px 0 color-mix(primary 65%, background)` + cantoneiras `::before/::after 5px`.

### Motion — intent de código (Stitch exporta estático)

- **Física:** springs `stiffness:100, damping:20`, sem linear easing. Reveal de carta: `card-reveal 0.35s ease-out (rotateY 90°→0 + rotate 12°)`.
- **Micro-loops:** pulse no dot de presença/timer crítico, shimmer em skeleton, float sutil em ícones da home. Timer crítico (`≤30s`) com `aria-live=assertive` + borda destructive.
- **Orquestra:** Assentos/votos/feed montam em cascata (`delay: index*100ms`), nunca instantâneo.
- **Hardware:** animar SÓ `transform` e `opacity`; nunca `top/left/width/height`. Grain só em pseudo fixo `pointer-events-none`. Isolar loops em leaf components, 60fps mínimo.
- **Acessibilidade:** `@media (prefers-reduced-motion: reduce)` colapsa duração para `0.01ms` e atraso para `0ms` (global em `index.css` + `card-reveal: none` em `poker-table.css`); preferir variantes `motion-safe:`. Wordmark sempre visível, sem entrada por letras; símbolo gira apenas em hover, sem loop permanente.
- **Confirmações:** nova rodada exige duplo `N`/clique em janela de 5s — primeiro toque arma, segundo confirma, timeout desarma sem tráfego.

## Shapes

Linguagem de cantos contidos e táteis; radius base `--radius: 0.75rem` (`sm 8px / md 10px / lg 12px / xl 18px / full 999px`).

- Hero visual `18px`. Avatar `50%`, pills `999px`, clock `8px`.
- Deck: radius `9px` (desktop `clamp(44px, 4.8vw, 58px) × 80px`, `font 24px`). Mobile: quatro estimativas por linha, duas linhas, pausa em coluna própria à direita ocupando ambas; cinco colunas ≥`44px`, gap `12px / 6px`, cartas `61px` de altura, fonte `20px`, radius `7px`. Desabilitado perde opacidade e movimento de hover.
- PokerTable: oval fixa `365px` (compact `330px`), feltro `inset 64px 45px`, rail `10px`, radius `180px`, inner highlight + dashed interno. Assentos `84px`, avatar `44px`, played-card `27×38px rotate(12deg)`. Mobile (<700px, não-compact): coluna `520px`, assentos em 2 colunas laterais `65px`.

## Components

- **Buttons:** flat, sem outer glow. Primary = acento (`button-primary`/`button-primary-hover`); Secondary = ghost/outline. Active tátil `translateY(-1px)` ou `scale(0.98)`; hover = shift de background, nunca glow. Desktop: reveal `40px`, invite `37px`, new-round `38px/100% width`; touch/mobile mínimo `44px`. Convite outline; nova rodada primária, confirmação destructive-outline. Loading preserva nome acessível, usa `aria-busy` e spinner decorativo. Atalhos sempre em `<kbd>` (R revela, N nova rodada).
- **Cards/Containers (`card`):** elevação só quando comunica hierarquia (ver Elevation).
- **Deck (assinatura):** nunca spinner no lugar do deck.
- **PokerTable:** self = primary fill + ring 2px (ver Shapes).
- **Inputs/Forms (`input`):** label acima, erro abaixo, gap `0.5rem`. Focus ring acento `2px + offset`. Sem floating labels. Invite input `11px`, mono para código da sala.
- **Alerts:** inline, contextual, com `AlertTitle` + `AlertDescription` + `data-testid` (`vote-error`, `reveal-error`, `new-round-error`, `projectile-error`, `rejoin-error`). Erro de reveal nunca cai no alerta de voto (roteamento por regex já implementado).
- **Loaders:** esqueleto shimmer nas dimensões do layout. `Spinner` só para `Carregando sala / Reconectando` — nunca spinner circular em lista de votos.
- **Empty/Waiting:** ícone + título + guia (`arena-waiting`: borda block, ícone 22px primary, p 12px/1.7). Nunca só "No data". Solo (`1 na sala`) mostra hint de convite.
- **Stats pill:** `output[aria-live]` com mediana grande mono + média/intervalo + pips `N×V`. `Unânime` = badge `success/12%`. `Só pausa/ausência` = mensagem explícita, sem média/mediana.
- **Projéteis (qualquer fase):** bola de papel e aviãozinho de papel com SVG próprio; pedra, tijolo e tomate com emoji (exceção da feature). Painel próprio junto ao avatar/nome do alvo (sem coss Menu — o Menu travava o bun test no jsdom): hover no desktop, toque alterna, Enter abre; cinco opções com ícone, nome e área de toque de 44px, setas navegam, Esc fecha e devolve o foco. Sem seletor de alvo separado, sem menu em si mesmo, assentos vazios ou desconectados. Espectadores podem arremessar e ser alvo pelo nome. Cooldown compartilhado de 2s por participante, com opções desabilitadas e contagem no menu. Voo em arco entre posições reais de avatares/nomes de espectadores, com impacto, esquiva ou rebatida determinados pelo servidor. Overlay sem interação acima dos assentos, animações só de `transform/opacity`; movimento reduzido não cria voo. Sem lista/feed de arremessos — só o voo some sozinho.

## Do's and Don'ts

- Do usar o primary para **uma única ação principal por tela**; Do manter contraste WCAG AA (4.5:1 texto normal).
- Don't emojis — EXCEÇÃO: reações de projéteis (catálogo em `@/lib/projectiles`).
- Don't `Inter`, serif genérica, preto puro (#000000), glow neon, gradiente neon, "AI Purple".
- Don't acento com saturação > 80% ou segundo acento; Don't misturar warm/cool gray.
- Don't `gradiente-text` em header grande, cursor custom, `h-screen`, `z-index` spam, overlap texto-sobre-imagem.
- Don't "3 cards iguais" para features — usar steps numerados / bento assimétrico / zig-zag 2-col.
- Don't hero centrado, filler ("Scroll to explore", setas bounce, "Discover more", chevrons) ou 2 CTAs primários.
- Don't nomes genéricos ("John Doe", "Acme", "Nexus") — demo usa `Você/Bia/Caio/Dani`, história `Checkout mobile`.
- Don't números fake redondos (`99.99%`, `50%`) — usar mediana/média/intervalo reais do consenso.
- Don't clichê AI ("Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize" — nem traduzidos).
- Don't `shadcn/ui` default sem customizar (radii/cores/sombras deste sistema); Don't spinner circular em conteúdo; Don't foto stock na intro do join (usa lista ritual 01/02/03 em texto, sem asset fotográfico).
- Don't quebrar a11y: todo estado async tem `aria-live`, atalhos têm `aria-keyshortcuts` + `<kbd>`, foco sempre visível em `var(--ring)`.
