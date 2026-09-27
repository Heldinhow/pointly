---
name: Pointly
description: Ritual rápido de planning poker — claro, tátil, sem fricção. Light-first, tinta quase preta, acento ultramarino e uma camada espectral coral-violeta-ciano reservada a momentos narrativos.
colors:
  primary: "#2F3BE0"
  on-primary: "#FFFFFF"
  primary-hover: "color-mix(primary 90%, black)"
  primary-dark: "#98A0FF"
  on-primary-dark: "#12122A"
  secondary: "#ECE9E0"
  on-secondary: "#2E2D36"
  secondary-dark: "#26262F"
  on-secondary-dark: "#D5D4DE"
  surface: "#FFFFFF"
  on-surface: "#17171D"
  background: "#F6F5F0"
  background-dark: "#101015"
  surface-dark: "#18181F"
  on-surface-dark: "#EFEEE9"
  border: "#E3E0D6"
  border-dark: "#2C2C36"
  ring: "#3A43E8"
  ring-dark: "#8B93FF"
  muted: "#EDEBE3"
  muted-foreground: "#5F5E68"
  muted-dark: "#1F1F27"
  muted-foreground-dark: "#A6A5B0"
  neutral: "#EDEBE3"
  error: "#DC2626"
  error-dark: "#F87171"
  success: "#059669"
  success-dark: "#34D399"
  warning: "#F59E0B"
  info: "#2563EB"
  chroma-coral: "#E8482F"
  chroma-violet: "#6B46E5"
  chroma-cyan: "#0E7F97"
  chroma-coral-dark: "#FF8570"
  chroma-violet-dark: "#A78BFF"
  chroma-cyan-dark: "#4FC9DE"
  card-back: "#1E1E28"
  card-back-dark: "#2A2A34"
  card-ink: "#F4F3EE"
  table-rail: "#DFDCD0"
  table-rail-dark: "#2E2E38"
typography:
  display:
    fontFamily: Bricolage Grotesque
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: -0.035em
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 20px
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.03em
  body-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Bricolage Grotesque
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  label-caps:
    fontFamily: Spline Sans Mono
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.1em
  timer:
    fontFamily: Spline Sans Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
  stats:
    fontFamily: Spline Sans Mono
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1
    fontFeature: tnum
rounded:
  sm: 10px
  md: 12px
  lg: 14px
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
  header: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: 16px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 8px
  deck-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: 12px
    padding: 8px
---

# Design System: Pointly — Chromatic Playroom

**Skill:** stitch-design-taste (adaptado do padrão Google Stitch).
**SSOT de código:** `apps/web/src/index.css` (`:root` / `.dark`) + `apps/web/src/brand.css` (`--header-h`, chrome do shell, geometria do deck) + `apps/web/src/components/round-demo.css` (palco cromático da rodada). Este arquivo é camada semântica, não duplica tokens. Tokens acima são os valores normativos; a prosa explica como aplicá-los. Se mudar o CSS, este doc acompanha.
**Validar:** `npx @google/design.md lint DESIGN.md` · `diff DESIGN.md DESIGN-v2.md` · `export --format css-tailwind|dtcg`.

## Overview

**Creative North Star: "O Playroom Cromático."**

Canvas claro e arejado, tinta quase preta, um único acento ultramarino vívido e uma **camada espectral coral-violeta-ciano** que pertence a momentos com função narrativa — nunca a todas as superfícies. O produto real (mesa + deck) é o hero: a demo local de votação aparece na primeira dobra, e o reveal transforma o voto oculto em resultado com os números reais. A votação começa silenciosa; a revelação acende a cor. Barato para entrar (sem cadastro), caro na sensação — sem cadastro, direto à conversa.

**Key Characteristics:**

- Uma única ação principal por tela, em ultramarino; o resto é ghost/outline ou link.
- Mesa e cartas são o vocabulário de domínio — o chrome ao redor é neutro e contido.
- O gradiente espectral é tinta de assinatura: aro da mesa, hairlines de fechamento, fios de card, numerais de passos e o wash do reveal. Fora disso, é proibido.
- Densidade calibrada por superfície: home respira, arena é densa e previsível no meio do voto.
- Todo estado async é anunciado (`aria-live`); foco sempre visível em `var(--ring)`; `prefers-reduced-motion` respeitado.

### Dials deste projeto (Stitch)

| Superfície | Variance | Motion | Density |
|------|-------|-------------|-------------|
| **Home e landings** | `9` | `8` | `4` |
| **Guias** | `7` | `5` | `4` |
| **Entrada e 404** | `7` | `5` | `4` |
| **Arena** | `6` | `6` | `7` |

> **Como usar:** home/landings podem ousar (assimetria, wash cromático, tipografia display grande); a arena não pode ser caótica no meio do voto — legibilidade > expressão durante a votação.

### Shell e contenção (o chrome global)

Modelo **Fixed-Max-Width Grid** no desktop, **Fluid** de 1 coluna no mobile. Grid-first: CSS Grid estrutural, `calc(33% - 1rem)` banido.

- **Containment:** shell global `max-width: 1304px` (`.site-header/.site-main/.site-footer`). Home inner `1240px`. Padding `32px` desktop / `20px` mobile.
- **Header (`ShellHeader`, `--header-h: 48px`):** sticky `top-0`, `z-30`, borda inferior 1px; ao rolar, fundo a 84% com `blur(12px) saturate(1.25)`. Todos os offsets dependentes (hero da home, TOC do guide, `scroll-margin`) derivam de `var(--header-h)` — nunca valor fixo. Nav com gap `26px`, links `14px/500` com underline espectral de 2px (só `transform`) e altura mínima `44px`. Colapsa <700px (esconde "Início"); rodapé empilha, com fio espectral de 1px no topo.
- **Padrões por superfície:** home em split assimétrico com a rodada real na primeira dobra; arena em `grid 1fr / 288px` com sidebar à direita; entrada em 1 coluna de no máximo `560px`; landing com 1 CTA primário e preview real; guide com TOC sticky e FAQ em accordion nativo; 404 com CTA primário que preserva o convite.
- **Full-height:** `min-dvh` no wrapper. Nunca `h-screen` / `height:100vh` (jump do Safari iOS).
- **Camadas:** sem overlap de conteúdo. `z-index` só para navbar/modal/overlay. Tapete `z:0`, assentos `z:1`, wash do reveal atrás de todo conteúdo (`z:0` com `pointer-events:none`).
- **Responsivo (verificar SEMPRE em `375px / 390px / 768px / 1024px / 1440px`):** uma coluna na entrada/home ≤1000px, arena ≤1050px. Sem scroll horizontal — overflow = falha crítica. Touch: alvos ≥ `44px`, botões mobile full-width onde couber. Arena mobile: esconde símbolo da sala, sair vira ícone, dicas de atalhos ficam no desktop, deck `padding-inline 16px`.

## Colors

Paleta clara como fundação (light-first), com **um único acento ultramarino** por tema e uma **camada cromática espectral** de uso narrativo. Tokens abaixo são o light (`:root`); o `.dark` espelha os valores. O tema padrão é o claro: o script inline do `index.html` aplica `html.dark` antes do paint apenas quando a preferência salva (`localStorage: pointly-theme`) ou do sistema pede escuro.

### Primary

- **Ultramarine (#2F3BE0 / #98A0FF dark):** o único driver de interação. CTAs, avatar self, reveal, deck selecionado, links. Texto sobre: #FFFFFF (light) / #12122A (dark). Hover usa `primary/90`.

### Chroma (espectral)

- **Coral #E8482F · Violet #6B46E5 · Cyan #0E7F97** (dark: #FF8570 / #A78BFF / #4FC9DE), com o gradiente normativo `--grad-spectral` (`linear-gradient(100deg, coral, violet 52%, cyan)`).
- Uso permitido: aro de 1.5px do tapete, hairline de fechamentos e cards do ritual, fio superior do painel de resultado, numerais de passos/ritual (índice → coral/violet/cyan em ordem), pips do deck, anel da celebração de unânime, wash do palco do reveal e glow épico dos projéteis.
- **Nunca** em texto de parágrafo, em botões, em títulos grandes (gradient-text banido) ou sobre controles de voto.

### Secondary

- **Sand (#ECE9E0 / #26262F dark):** fills secundários, callouts, chips de assento. Texto sobre: #2E2D36 / #D5D4DE.

### Neutral

- **Warm Canvas (#F6F5F0 / #101015 Night Ink dark):** fundação das páginas.
- **Pure Surface (#FFFFFF / #18181F dark):** cards, popovers, tapete. Texto sobre: #17171D Ink / #EFEEE9 — nunca preto puro.
- **Bordas e fills:** Line #E3E0D6 / #2C2C36 (bordas 1px); Muted #EDEBE3/#1F1F27.
- **Mesa (materiais fixos por tema):** tapete = `var(--card)` com aro espectral de 1.5px (via `background-clip` em camadas) + costura tracejada interna; carta verso #1E1E28/`#2A2A34` (borda #3C3C46/#4A4A58, tinta #F4F3EE); carta face = `var(--card-face)` (light `#EFECE3` / dark `#F4F3EE`, distinta do tapete) com numeral em `var(--card-face-ink)`.
- **Contraste validado (script de luminância WCAG, todos AA):** ink/canvas 15.2:1; muted-fg sobre canvas/card ≥ 6:1; branco sobre primary 6.8:1; primary sobre card 6.8:1; coral/violet/cyan sobre card ≥ 4.6:1 (usar em `11–13px` só como índice/pip, nunca corpo).

### Named Rules

**The One Voice Rule.** O acento primary aparece em ≤10% de qualquer tela, sempre na ação principal. Sua raridade é o ponto.
**The Spectral-Only-For-Story Rule.** O gradiente espectral só aparece onde há história: revelar, fechar, identificar posição, comemorar. Decoração plana com gradiente é falha de review.

## Typography

**Display/Body Font:** Bricolage Grotesque (variável, self-hosted `public/fonts/bricolage-grotesque-latin-wght.woff2`, OFL)
**Mono Font:** Spline Sans Mono (self-hosted `public/fonts/spline-sans-mono-latin-wght.woff2`, OFL)

**Character:** uma display grotesca com personalidade carrega títulos e corpo; a mono entra só onde o número É a informação (votos, resultados, códigos, atalhos, índices). Fontes são assets locais — sem mudança de lockfile, sem dependências novas. Tracking de display contido, nunca abaixo de `-0.035em`.

### Hierarchy

- **Display** (`display`, 600, até 60px, 1.02, -0.035em): Home H1 `clamp(38px, 4.8vw, 60px)` → mobile `clamp(30px, 7vw, 46px)`, com `<br>` entre as duas frases e `<em>` em Ultramarine na segunda. Landing H1 `clamp(34px, 4vw, 52px)`. Entrada H1 `clamp(34px, 3.8vw, 48px)`; título do formulário `28px`; h1 do 404 `32px`.
- **Headline** (`headline-md`, 650, 20px, 1.2, -0.02em): Arena H1 `20px` (`18px` no mobile), código da sala em mono tabular; história na mesa `15–17px` clampada em 2 linhas.
- **Title** (`headline-sm`, 600, 32px, 1.1, -0.03em): títulos de seção, "como funciona" `clamp(28px, 3vw, 40px)`, containers de entrada.
- **Body** (`body-lg` 17px/1.6 / `body-md` 16px/1.6 / `body-sm` 14px/1.55): leading relaxado, cor Muted Ink. Lede hero `17px`, max `46ch`. Descrições, sidebar, feedback e rodapé `14px`. Corpo nunca < `14px` (`12px` só em metadata densa da arena). Prosa longa respeita 65–75ch.
- **Label** (`label-caps`, Mono 500, 11px, tracking 0.1em, uppercase): kickers `10–11px uppercase tracking 0.06–0.1em`, pips de distribuição `12px`, `<kbd>` de atalhos, invite input `11px`.

### Named Rules

**The Mono Tabular Numbers Rule.** Todo número de votação/resultado é Spline Sans Mono com `tabular-nums` — mediana `40px/600`, timer `14px/500`, pips `11–12px`. Números proporcionais na arena são falha.
**The No Inter Rule.** `Inter` é banido; serifadas genéricas (`Times`, `Georgia`, `Garamond`, `Palatino`) são banidas. Fontes entram só self-hosted com licença livre no repositório — nunca por dependência nova.

## Elevation

Hierarquia por **camadas tonais e bordas**; sombra só quando comunica elevação — nunca glow neon. O sistema é flat-by-default: superfícies planas em repouso, sombra como resposta a estado ou profundidade de objeto.

### Shadow Vocabulary

- **Tapete (`0 28px 56px -38px color-mix(foreground 30%)`):** a mesa flutua de leve sobre o canvas; no reveal o aro ganha um `0 0 0 3px` violeta a 14%.
- **Card do ritual (`0 24px 64px -36px color-mix(foreground 26%)`):** entrada/404 elevam do canvas, fio espectral de 2px no topo.
- **Deck (`0 4px 0 color-mix(foreground 10%)`; selecionada `0 5px 0 color-mix(primary 55%)`):** a carta é tátil por construção, sem drop-shadow genérica; o pip cromático da faixa vive no canto superior direito.
- **Sidebar fantasma:** cards transparentes, sem sombra, com `border-top` como separador.

### Motion (intent de código — Stitch exporta estático)

- **Física:** easings `--ease-out-quart/quint`, sem linear fora de trilhos (contagem de confirmação usa linear de propósito), sem bounce/elastic. Reveal de carta: `card-reveal 0.35s ease-out (rotateY 90°→0 + rotate 12°)`; voto no assento: `card-flip 0.35s ease-out (rotateY 180°→0 + rotate 12°)`. Ambas terminam no tilt fixo `12°`.
- **Reveal como transformação:** a rodada local tem um wash espectral atrás da mesa que sobe de opacidade no reveal (`round-demo::before`, 500ms) e o painel de resultado entra com `round-demo-in 300ms` (só `opacity/translateY`) sob o fio espectral. Nada de autoplay: o reveal é sempre ação do usuário.
- **Celebração de Unânime (14.3):** anel cromático no contorno do tapete (`unanimous-ring 0.9s ease-out`) + 14 peças de confete determinísticas nas cores coral/âmbar/cyan/violet (`unanimous-confetti 0.95s cubic-bezier(0.17,0.67,0.35,1)`), só `transform/opacity`, sem glow; dispara uma vez na transição ao vivo para `revealed` unânime (edição pós-reveal atualiza o badge sem replayar); `reduced-motion` desliga.
- **Confirmação de nova rodada:** barra de 2px que encolhe no ritmo exato de `NEW_ROUND_CONFIRM_TIMEOUT_MS` (duração via inline style, nunca hardcoded), só `transform`.
- **Micro-loops:** pulse no dot de presença/timer crítico, shimmer em skeleton. Timer crítico (`≤30s`) com `aria-live=assertive` + borda destructive.
- **Orquestra:** assentos/votos/feed montam em cascata (`delay: index*100ms`), nunca instantâneo.
- **Hardware:** animar SÓ `transform` e `opacity`; nunca `top/left/width/height`. Isolar loops em leaf components, 60fps mínimo.
- **Acessibilidade:** `@media (prefers-reduced-motion: reduce)` colapsa duração para `0.01ms` e atraso para `0ms` (global em `index.css` + animações de carta `none` em `poker-table.css`; entradas de hero/demo e `round-demo-in` ficam sob `no-preference`). Wordmark sempre visível, sem entrada por letras; símbolo gira apenas em hover, sem loop permanente.
- **Confirmações:** nova rodada exige duplo `N`/clique em janela de 5s — primeiro toque arma, segundo confirma, timeout desarma sem tráfego.

### Named Rules

**The Flat-By-Default Rule.** Superfícies planas em repouso; sombra aparece só como resposta a estado (hover, elevação, foco) ou profundidade de objeto (a mesa).
**The Transform-Only Rule.** Animação fora de `transform/opacity` é proibida; layout animado nunca passa no review. Exceção documentada: o aro do tapete acende no reveal com `box-shadow`/cor (paint-only, sem layout) e a transição de tema troca cores em 200ms.

## Components

### Buttons (coss `Button`)

- **Character:** flat e tátil, sem outer glow. Hover = shift de background, nunca glow; active = `translateY(-1px)` ou `scale(0.98)`.
- **Shape:** radius `lg` (`14px`, `var(--radius)`); pills `999px` para tags.
- **Primary:** Ultramarine; Secondary = `secondary` fill; Outline/ghost para convite e ações terciárias; `link` para text-links sublinhados; `destructive-outline` para a confirmação de nova rodada.
- **Sizes:** `xl` no CTA do hero; reveal `40px`, invite `37px`, new-round `38px/100% width` no desktop; touch/mobile mínimo `44px` (ponteiros coarse).
- **States:** focus-visible em anel 2px + offset; `disabled` sem pointer events a 64%; loading preserva o nome acessível com `aria-busy` e `Spinner` decorativo absoluto.
- **Atalhos:** sempre em `<kbd>` (R revela, N nova rodada) com `aria-keyshortcuts`.

### Navigation (ShellHeader + coss tokens)

- **Style:** `ShellHeader` a `var(--header-h)` (`48px`), `max-width 1304px`, `px-5/sm:px-8`, sticky com blur funcional no scroll. Marca `Brand` (pinwheel + wordmark em cascata, só `transform/opacity`; símbolo gira só em hover).
- **Nav:** links `14px/500` em muted com underline espectral de 2px (`transform: scaleX`); rota ativa com `aria-current="page"`.
- **Seletor de idioma:** código em mono `12px/600 tracking 0.08em`, alvo `44px`.
- **Mobile:** colapsa <700px; rodapé empilha.

### Cards / Containers (coss `Card`)

- **Corner Style:** `rounded-2xl` no primitivo coss; o card do ritual (entrada/404) usa `20px` com fio espectral de 2px no topo.
- **Background:** `bg-card` sobre `bg-background`; texto `card-foreground` — nunca preto puro.
- **Shadow Strategy:** ver Elevation — elevação só quando comunica hierarquia; sidebar usa cards fantasma.
- **Internal Padding:** `p-6` nos primitivos (`CardHeader`/`CardPanel`/`CardFooter`).

### Deck (assinatura, CSS próprio em `brand.css`)

- **Character:** cartas de esmalte com pip cromático por faixa (coral/violet/cyan) — nunca spinner no lugar do deck.
- **Shape:** radius `12px`; desktop divide a largura com os grupos (`flex: 1 1 0`) entre `40px` e `58px` × `82px`, fonte `25px/500`; profundidade `0 4px 0 color-mix(foreground 10%)`, selecionada `0 5px 0 color-mix(primary 55%)`.
- **State:** selecionada = primary fill + pip em `primary-foreground`; hover eleva 1px; desabilitado perde opacidade e hover.
- **Mobile:** cinco colunas ≥`44px`, gap `12px/6px`; a pausa ocupa a coluna própria à direita nas duas linhas.

### PokerTable (domínio, CSS próprio)

- **Character:** tapete oval claro (`var(--card)`) com aro espectral de 1.5px e costura tracejada interna; self = primary fill + ring 2px.
- **Shape:** mesa `365px` (compact `330px`), tapete `inset 64px 45px`, radius `180px`. Assentos `84px`, avatar `44px`, played-card `27×38px rotate(12deg)` à frente do assento, voltada ao centro. Mobile (<700px, não-compact): coluna `520px`, assentos em 2 colunas laterais `65px`, played-card `22×32px`.
- **Behavior:** carta votada mostra verso (material escuro, `card-flip` ao votar, classe `--dealt`) antes do reveal e face clara com o valor (`card-reveal`) depois; o pill do assento (`Votou`/valor) segue como leitura acessível.

### RoundDemo (rodada local reutilizável)

- **Onde vive:** primeira dobra da home (alvo `#demo`, `id="demo"`) e hero das quatro landings (sem CTA pós-reveal — `showCreate={false}`).
- **Composição:** caption curta → `PokerTable` compact com a história no centro → linha de seleção (`aria-live="polite"`) → `Deck` → ação de reveal + hint → resultados (votos, stats, ações).
- **Palco:** wash espectral abstracto atrás da rodada (`::before`, blur 30px, opacity 0.45 → 0.85 no reveal); o `PokerTable` real carrega a geometria — sem ilustração substituta.
- **Contrato:** 100% local (nenhum socket/API), estado hidden → selected → revealed → reset; texto pt/en de `home-content`; tudo com `data-testid` estável.

### Inputs / Fields (coss `Field`, `Input`, `OTP Field`)

- **Style:** label acima, erro abaixo, gap `0.5rem`; radius `md` (`12px`); fundo `surface`.
- **Focus:** ring do acento `2px + offset`. Sem floating labels.
- **Join:** código após apelido, antes de foto/espectador; slots `50px` em mono; modo como radiogroup nativo com pílula selecionada em borda `primary/30%`; durante o envio, fieldset desabilitado e status anunciado; erro limpo ao reeditar.

### Alerts (coss `Alert`)

- **Style:** inline e contextual, radius `xl`, com `AlertTitle` + `AlertDescription` (+ `AlertAction` quando houver ação) e `role="alert"`.
- **Variants:** `error`/`info`/`success`/`warning` com tints a 4% e borda a 32% — nunca side-stripe colorida.
- **Routing:** cada superfície tem seu `data-testid` (`vote-error`, `reveal-error`, `new-round-error`, `projectile-error`, `rejoin-error`). Erro de reveal nunca cai no alerta de voto (roteamento por regex já implementado).

### Loaders

- **Style:** esqueleto shimmer nas dimensões do layout, nunca spinner circular em conteúdo ou lista de votos.
- **`Spinner` só para `Carregando sala` / `Reconectando`.**

### Empty / Waiting

- **Style:** ícone + título + guia (`arena-waiting`: borda block, ícone 22px primary, p 12px/1.7). Nunca só "No data".
- **Solo (`1 na sala`):** callout de orientação `solo-hint` — borda cheia + fill `secondary`, radius `12px`, padding `12px/1.6`, ícone 18px em primary, texto em foreground. Sem side-stripe, sem parágrafo solto.

### Stats pill

- **Style:** `output[aria-live]` com mediana grande mono (`40px/600 tabular-nums`) + média/intervalo sob disclosure + pips `N×V` de `12px`; fio espectral de 2px no topo do painel.
- **`Unânime`:** badge `success/12%`. `Só pausa/ausência`: mensagem explícita, sem média/mediana.

### Confirmação de nova rodada

- **Style:** o botão arma no primeiro toque/clique ou `N`; a barra `arena-confirm-countdown` (2px, destructive, `border-radius 999px`) encolhe via `scaleX` linear com duração inline de `NEW_ROUND_CONFIRM_TIMEOUT_MS`.
- **Behavior:** segundo toque confirma; timeout de 5s desarma sem tráfego. Duração nunca hardcoded no CSS.

### Projéteis (domínio, qualquer fase)

- **Character:** os seis projéteis (papel, aviãozinho, pedra, tijolo, tomate e cadeira) têm SVG próprio — sem emoji. Catálogo em `@/lib/projectiles`; materiais de papel em neutro quente para ler sobre o tapete claro.
- **Painel próprio** junto ao avatar/nome do alvo (sem coss Menu — o Menu travava o bun test no jsdom): hover no desktop, toque alterna, Enter abre; seis opções com ícone, nome e área de toque de 44px; setas navegam, Esc fecha e devolve o foco. Sem seletor de alvo separado; sem menu em si mesmo, assentos vazios ou desconectados. Espectadores podem arremessar e ser alvo pelo nome.
- **Cooldown:** 1s por participante (8s para a cadeirada épica; SSOT em `PROJECTILE_COOLDOWN_MS` / `PROJECTILE_CHAIR_COOLDOWN_MS`), com opções desabilitadas e contagem no menu.
- **Voo:** arco com origem anônima no centro da mesa até a posição real do alvo (avatar ou nome de espectador), duração proporcional à distância, sombra de contato no tapete e partículas de impacto na direção do voo; o desfecho (impacto, esquiva ou rebatida) vem do servidor. Overlay sem interação acima dos assentos, animações só de `transform/opacity`; movimento reduzido não cria voo. Sem lista/feed de arremessos — só o voo some sozinho.

### Padrões de página

- **Home:** hero assimétrico `minmax(0,1.02fr) / minmax(0,1fr)`, gap `clamp(32px,5vw,64px)`, `min-height: calc(100dvh - var(--header-h) - 60px)` no desktop (os 60px são respiro do hero, não offset de header) — headline à esquerda com 1 CTA primário `Criar sala →` (`size=xl`) + text-link `Entrar com código`, e a **rodada real** à direita (RoundDemo). "Como funciona" em trilho editorial: intro à esquerda, passos numerados em coral/violet/cyan à direita, CTA de fechamento. Sem palco CSS de feltro, sem fan de mini-cartas, sem tilt pointer-driven.
- **Landing:** 1 CTA primário + text-link; preview real (RoundDemo sem `demo-create`) no primeiro fold; passos com numerais cromáticos; nunca 2 CTAs primários.
- **Entrada:** introdução curta seguida do formulário, sem repetir os três passos da home; desktop mantém o ritual ao lado (numerais cromáticos); card com fio espectral no topo; ao mudar de rota, scroll volta ao topo e foco vai ao conteúdo principal.
- **Guide:** TOC sticky (`top: calc(var(--header-h) - 8px)`, `max-height: calc(100dvh - var(--header-h) - 16px)`) com scroll-spy; FAQ em accordion nativo; fio espectral no fechamento.
- **404:** h1 `32px`, CTA primário com ponte ao ritual, preserva o convite.
- **Cadeirada:** preparação contínua, golpe acelerado, pausa compartilhada entre cadeira e alvo, um rebote e recuperação com estrelas. Escala maior no desktop; no layout de duas colunas, golpe lateral para manter a cadeira dentro da tela. Tempos canônicos em `projectile-flight.tsx`. Movimento reduzido mostra apenas um contorno estático breve no alvo. Resize, ocultação, troca de preferência e remoção do alvo cancelam os efeitos. O menu antecipa o cooldown no selo épico, derivado da constante existente.

### Assets de marca

- **Ícone (`public/icon.svg` é a fonte):** pinwheel de 8 pás em `--primary` (#2f3be0) sobre papel (#f6f5f0), raio 14/64. Derivados raster saem dele, não de arte paralela: `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` (fundo full-bleed, marca a 68% para a safe zone) e `favicon.ico` (16/32/48). Regeneração: `rsvg-convert -w <n> -h <n> icon.svg -o <arquivo>.png` (o maskable usa o mesmo SVG com fundo quadrado e a marca escalada). `site.webmanifest` usa `background_color`/`theme_color` = `#f6f5f0` (light-first).
- **Fontes:** Bricolage Grotesque (display/corpo) e Spline Sans Mono (mono) self-hosted em `public/fonts/*.woff2` com as licenças OFL ao lado; declaradas em `index.css` como `--font-sans` / `--font-mono`. Nenhuma dependência npm de fonte.
- **og:image:** `public/images/planning-cards.webp`, 1200×630 (1.91:1), mesma URL do meta congelado em `seo/routes.ts`. Composição: papel + wash espectral, lockup (pinwheel + wordmark + `PLANNING POKER · SEM CADASTRO`), três cartas 3/5/8 na cor de carta e fio espectral no topo do quadro. Sem feltro verde.

## Do's and Don'ts

### Do:

- **Do** usar o primary para **uma única ação principal por tela**; o resto é ghost/outline/link.
- **Do** manter contraste WCAG AA (4.5:1 texto normal, 3:1 texto grande); placeholders também batem 4.5:1.
- **Do** derivar todo offset do header de `var(--header-h)` (`48px`) — nunca valor fixo.
- **Do** passar a duração da confirmação via inline style de `NEW_ROUND_CONFIRM_TIMEOUT_MS`.
- **Do** calçar callouts com borda cheia + fill (como `solo-hint`); números de votação sempre mono tabulares.
- **Do** alvos de toque ≥ `44px` e botões mobile full-width onde couber.
- **Do** usar o espectral apenas onde há história (aro da mesa, hairline de fechamento, fio do resultado, índices, pip, celebração) — via tokens `--chroma-*` / `--grad-spectral`.
- **Do** rotear erros ao alerta da superfície (`vote-error`, `reveal-error`, `new-round-error`, `projectile-error`, `rejoin-error`).
- **Do** demo com `Você/Bia/Caio/Dani` e história `Checkout mobile`; consenso com mediana/média/intervalo reais.

### Don't:

- **Don't** reintroduzir a identidade antiga: feltro verde-pinheiro, gradiente radial verde, tema dark-first, Geist/Geist Mono ou sombras esverdeadas são herança removida.
- **Don't** usar `gradient-text` em header grande, gradiente decorativo em superfície sem função narrativa, glow neon ou "AI Purple".
- **Don't** emojis — o catálogo de projéteis (`@/lib/projectiles`) também usa SVG próprio.
- **Don't** side-stripe (`border-left/right` > 1px como acento) — o exemplo canônico do erro era o hint de solo; hoje é borda cheia + fill.
- **Don't** `Inter`, serif genérica, preto puro (#000000), cursor custom, `h-screen`, `z-index` spam, overlap texto-sobre-imagem.
- **Don't** acento com saturação > 80% ou segundo acento; **Don't** misturar warm/cool gray fora dos neutros quentes definidos.
- **Don't** "3 cards iguais" para features — usar trilhos numerados / composições assimétricas / prosa editorial.
- **Don't** hero centrado, filler ("Scroll to explore", setas bounce, "Discover more", chevrons) ou 2 CTAs primários.
- **Don't** landing cinematográfica, AIDA/GSAP, troca de biblioteca de ícones, dependências novas (fontes são assets OFL locais).
- **Don't** nomes genéricos ("John Doe", "Acme", "Nexus").
- **Don't** números fake redondos (`99.99%`, `50%`).
- **Don't** clichê AI ("Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize" — nem traduzidos).
- **Don't** `shadcn/ui` default sem customizar (radii/cores/sombras deste sistema); **Don't** coss Menu no painel de projéteis (painel próprio — o Menu travava o bun test no jsdom).
- **Don't** spinner circular em conteúdo ou no lugar do deck; **Don't** foto stock na intro do join (lista ritual 01/02/03 em texto, sem asset fotográfico).
- **Don't** quebrar a11y: todo estado async tem `aria-live`, atalhos têm `aria-keyshortcuts` + `<kbd>`, foco sempre visível em `var(--ring)`.
