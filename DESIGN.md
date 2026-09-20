---
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
  header: 48px
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
**SSOT de código:** `apps/web/src/index.css` (`:root` / `.dark`) + `apps/web/src/brand.css` (`--header-h`, chrome do shell, geometria do deck) — este arquivo é camada semântica, não duplica tokens. Tokens acima são os valores normativos; a prosa explica como aplicá-los. Se mudar o CSS, este doc acompanha.
**Validar:** `npx @google/design.md lint DESIGN.md` · `diff DESIGN.md DESIGN-v2.md` · `export --format css-tailwind|dtcg`.

## Overview

**Creative North Star: "A mesa de feltro bem iluminada."**

Interface de ritual rápido: calma, tátil, sem fricção — cada carta ganha seu lugar e a ferramenta some dentro da tarefa. Barato para entrar (sem cadastro), caro na sensação: verde-pinheiro profundo, feltro radial, tipografia track-tight, números sempre mono tabulares. Dark-first: `html.dark` é o padrão (`localStorage: pointly-theme`). Copy em pt-BR, tom direto: "Boas conversas. Melhores estimativas.", "Sem cadastro. Direto à conversa."

**Key Characteristics:**

- Uma única ação principal por tela, em verde-pinheiro; o resto é ghost/outline ou link.
- Mesa e cartas são o vocabulário de domínio — o resto do chrome é neutro e contido.
- Densidade calibrada por superfície: home respira, arena é densa e previsível no meio do voto.
- Todo estado async é anunciado (`aria-live`); foco sempre visível em `var(--ring)`; `prefers-reduced-motion` respeitado.

### Dials deste projeto (Stitch)

| Dial | Level | Descrição |
|------|-------|-------------|
| **Creativity** | `5` | `1` = ultra-minimal suíço. `5` = limpo com personalidade (ferramenta real-time). `10` = editorial expressivo. Home pode ousar, arena deve ser previsível. |
| **Density** | `6` | `1` = galeria arejada. `5` = app diário. `10` = cockpit denso. Home ~4, Arena ~7. Média 6. |
| **Variance** | `5` | `1` = grids simétricos. `5` = offsets sutis. `10` = caótico artístico. Arena não pode ser caótica no meio do voto. |
| **Motion Intent** | `5` | `1` = estático. `5` = hover/entrada sutil. `10` = coreografia cinemática. Respeita `prefers-reduced-motion` (já implementado). |

> **Como usar:** gere telas novas no Stitch com estes dials. Home/demo aceita Creativity até 6. Arena/sala aceita no máximo 4 — legibilidade > expressão durante votação.

### Shell e contenção (o chrome global)

Modelo **Fixed-Max-Width Grid** no desktop, **Fluid** de 1 coluna no mobile. Grid-first: CSS Grid estrutural, `calc(33% - 1rem)` banido.

- **Containment:** shell global `max-width: 1304px` (`.site-header/.site-main/.site-footer`). Home inner `1240px`. Padding `32px` desktop / `20px` mobile.
- **Header (`ShellHeader`, `--header-h: 48px`):** sticky `top-0`, `z-30`, borda inferior 1px; ao rolar, fundo a 86% com `blur(12px) saturate(1.25)`. Todos os offsets dependentes (herói da home, TOC do guide, `scroll-margin`) derivam de `var(--header-h)` — nunca valor fixo. Nav com gap `26px`, links `14px/500` com underline deslizante de 2px em primary (só `transform`) e altura mínima `44px`. Colapsa <700px (esconde "Início"); rodapé empilha `column/align-start/gap 5px`.
- **Padrões por superfície:** home em split assimétrico (nunca centrado); arena em `grid 1fr / 288px` com sidebar à direita; entrada em 1 coluna de no máximo `560px`; landing com 1 CTA primário; guide com TOC sticky e FAQ em accordion nativo; 404 com CTA primário que preserva o convite.
- **Full-height:** `min-h-dvh` no wrapper. Nunca `h-screen` / `height:100vh` (jump do Safari iOS).
- **Camadas:** sem overlap de conteúdo. `z-index` só para navbar/modal/overlay. Feltro `z:0`, assentos `z:1` — exceção técnica documentada, não padrão.
- **Responsivo (verificar SEMPRE em `375px / 390px / 768px / 1024px / 1440px`):** uma coluna na entrada/home ≤1000px, arena ≤1050px. Sem scroll horizontal — overflow = falha crítica. Touch: alvos ≥ `44px`, botões mobile full-width onde couber. Arena mobile: esconde símbolo da sala, sair vira ícone, dicas de atalhos ficam no desktop, deck `padding-inline 16px`.

## Colors

Paleta enraizada em neutros de alto contraste com **um único acento verde por tema**. Tokens `primary`/`secondary`/`neutral`/`surface` abaixo são o light (`:root`); variantes `-dark` espelham o `.dark` (padrão).

### Primary

- **Pine Signal (#17634F / #A9D6AD Mint Signal dark):** o único driver de interação. CTAs, avatar self, reveal, deck selecionado. Texto sobre: #FFFFFF (light) / #183523 (dark). Hover escurece (`primary-hover` #12503F no light; `primary/90` nos componentes coss).

### Secondary

- **Moss (#606E65 / #A8B6AA Faded Sage dark):** corpo, descrições, metadata utilitária.
- **Soft Felt (#E5ECE4 container / #2B3D30 dark):** fills secundários e callouts. Texto sobre: #304D3B / #C8DFC8.

### Tertiary

- **Ring (#38856C / #8ABB91 dark):** exclusivamente focus-visible 2px, nunca CTA.

### Neutral

- **Canvas Mist (#F4F6F3 / #141D19 Night Pine dark):** fundação das páginas, mais suave que branco puro.
- **Pure Surface (#FFFFFF / #1B2721 Felt Card dark):** cards, popovers. Texto sobre: #202B27 Pine Ink / #EBF0E9 Paper Mint — nunca preto puro.
- **Bordas e fills:** Sage Line #DCE3DB / Bark Line #334439 (bordas 1px); Soft Felt #E9EEE8 / Deep Moss #24332A/#2B3D30/#2A3C30 (muted/secondary fills).
- **Mesa (fixos, não tematizam):** Table Rail #D6E1D4/#394D3E, Wordmark #C4DBCD ("Pointly" vazado), Felt Gradient `radial-gradient(ellipse at 50% 35%, #246951, #154634)` com texto sempre #F2F7F3, carta verso #286451 (borda #E7EEE8), carta face #F3F5EB.
- **`chart-4` roxo / `chart-5` rose do tema:** só em gráficos, nunca em CTA.

### Named Rules

**The One Voice Rule.** O acento primary aparece em ≤10% de qualquer tela, sempre na ação principal. Sua raridade é o ponto.
**The Restrained Surface Rule.** Neutros carregam a superfície; cor saturada além do primary é proibida fora de gráficos e da celebração de unânime.

## Typography

**Display Font:** Geist Semi-Bold (with system sans)
**Body Font:** Geist Regular (with system sans)
**Label/Mono Font:** Geist Mono (with ui-monospace)

**Character:** Uma família geométrica bem calibrada carrega tudo (via `@fontsource/geist`, sem Inter); a mono entra só onde o número É a informação (votos, resultados, códigos, atalhos). Tracking sempre contido, nunca abaixo de `-0.04em`.

### Hierarchy

- **Display** (`headline-display`, 650, 48px, 1.08, -0.04em): Home H1 `clamp(38px, 4.4vw, 58px)` → mobile `clamp(30px, 6.8vw, 48px)`, com `text-wrap: balance` e `<em>` em Pine Signal na segunda frase. Home H2 `clamp(30px, 3.3vw, 42px) / 1.15`. Entrada H1 `40px` (`32px` em uma coluna); título do formulário `28px`; erro 404 `32px`.
- **Headline** (`headline-md`, 650, 20px, 1.2, -0.04em): Arena H1 `20px` (`18px` no mobile), código da sala em mono tabular.
- **Title** (`headline-sm`, 600, 32px, 1.1, -0.03em): títulos de seção e containers de entrada.
- **Body** (`body-lg` 17px/1.65 / `body-md` 16px/1.6 / `body-sm` 14px/1.55): Geist 400, leading relaxado, cor Moss/Faded Sage. Lede hero `17px`, max `430px`. Descrições, sidebar, feedback e rodapé `14px`. Corpo nunca < `14px` (`12px` só em metadata densa da arena). Prosa longa respeita 65–75ch.
- **Label** (`label-caps`, Mono 500, 11px, tracking 0.1em, uppercase): kickers `10–11px uppercase tracking 0.09–0.1em`, pips de distribuição `11px`, `<kbd>` de atalhos, invite input `11px`.

### Named Rules

**The Mono Tabular Numbers Rule.** Todo número de votação/resultado é Geist Mono com `tabular-nums` — mediana `38–40px/600`, timer `14px/500`, pips `11px`. Números proporcionais na arena são falha.
**The No Inter Rule.** `Inter` é banido (já conforme). Serifadas genéricas (`Times`, `Georgia`, `Garamond`, `Palatino`) são banidas — se serif um dia for preciso, só modernas distintivas (`Fraunces`, `Instrument Serif`); serif sempre banida na arena/dashboard.

## Elevation

Hierarquia por **camadas tonais e bordas**; sombra só quando comunica elevação — nunca glow neon. O sistema é flat-by-default: superfícies planas em repouso, sombra como resposta a estado.

### Shadow Vocabulary

- **Home demo (`box-shadow: 0 20px 60px rgb(28 57 45 / 8%)`):** palco elevado da mesa ilustrada, curto e difuso.
- **Arena deck (`box-shadow: 0 8px 20px -16px #163c2d44`):** elevação mínima sob a área de voto.
- **Feltro (`0 15px 30px -18px #143c3259` + highlights internos `inset 0 0 0 2px #ffffff13, inset 0 5px 22px #08271d66`):** a mesa afunda o centro e acende a borda — profundidade de objeto, não de card.
- **Deck (`0 3px 0 var(--border)`; selecionada `0 5px 0 color-mix(primary 65%, background)` + cantoneiras `::before/::after 5px`):** a carta é tátil por construção, não por drop-shadow genérica.
- **Sidebar fantasma:** cards transparentes, sem sombra, com `border-top` como separador.

### Motion (intent de código — Stitch exporta estático)

- **Física:** springs `stiffness:100, damping:20`, easings `--ease-out-quart/quint`, sem linear easing, sem bounce/elastic. Reveal de carta: `card-reveal 0.35s ease-out (rotateY 90°→0 + rotate 12°)`; voto no assento: `card-flip 0.35s ease-out (rotateY 180°→0 + rotate 12°)`. Ambas terminam no tilt fixo `12°` da carta no assento.
- **Celebração de Unânime (14.3):** anel claro no contorno do feltro (`unanimous-ring 0.9s ease-out`) + 14 peças de confete determinísticas (`unanimous-confetti 0.95s cubic-bezier(0.17,0.67,0.35,1)`), só `transform/opacity`, sem glow; dispara uma vez na transição ao vivo para `revealed` unânime (edição pós-reveal atualiza o badge sem replayar); `reduced-motion` desliga.
- **Confirmação de nova rodada:** barra de 2px que encolhe no ritmo exato de `NEW_ROUND_CONFIRM_TIMEOUT_MS` (duração via inline style, nunca hardcoded), só `transform` linear; o `reduced-motion` global já colapsa.
- **Micro-loops:** pulse no dot de presença/timer crítico, shimmer em skeleton, float sutil em ícones da home. Timer crítico (`≤30s`) com `aria-live=assertive` + borda destructive.
- **Orquestra:** assentos/votos/feed montam em cascata (`delay: index*100ms`), nunca instantâneo.
- **Hardware:** animar SÓ `transform` e `opacity`; nunca `top/left/width/height`. Grain só em pseudo fixo `pointer-events-none`. Isolar loops em leaf components, 60fps mínimo.
- **Acessibilidade:** `@media (prefers-reduced-motion: reduce)` colapsa duração para `0.01ms` e atraso para `0ms` (global em `index.css` + animações de carta `none` em `poker-table.css`); preferir variantes `motion-safe:`. Wordmark sempre visível, sem entrada por letras; símbolo gira apenas em hover, sem loop permanente.
- **Confirmações:** nova rodada exige duplo `N`/clique em janela de 5s — primeiro toque arma, segundo confirma, timeout desarma sem tráfego.

### Named Rules

**The Flat-By-Default Rule.** Superfícies planas em repouso; sombra aparece só como resposta a estado (hover, elevação, foco). Se parece app de 2014, a sombra está escura e o blur pequeno demais.
**The Transform-Only Rule.** Animação fora de `transform/opacity` é proibida; layout animado nunca passa no review.

## Components

### Buttons (coss `Button`)

- **Character:** flat e tátil, sem outer glow. Hover = shift de background, nunca glow; active = `translateY(-1px)` ou `scale(0.98)`.
- **Shape:** radius `lg` (`12px`); pills `999px` para tags.
- **Primary:** acento (`button-primary` / `button-primary-hover`); Secondary = `secondary` fill; Outline/ghost para convite e ações terciárias; `link` para text-links sublinhados; `destructive-outline` para a confirmação de nova rodada.
- **Sizes:** `xl` no CTA do hero; reveal `40px`, invite `37px`, new-round `38px/100% width` no desktop; touch/mobile mínimo `44px` (ponteiros coarse).
- **States:** focus-visible em anel 2px + offset; `disabled` sem pointer events a 64%; loading preserva o nome acessível com `aria-busy` e `Spinner` decorativo absoluto.
- **Atalhos:** sempre em `<kbd>` (R revela, N nova rodada) com `aria-keyshortcuts`.

### Navigation (ShellHeader + coss tokens)

- **Style:** `ShellHeader` a `var(--header-h)` (`48px`), `max-width 1304px`, `px-5/sm:px-8`, sticky com blur funcional no scroll. Marca `Brand` (pinwheel + wordmark em cascata, só `transform/opacity`; símbolo gira só em hover).
- **Nav:** links `14px/500` em muted com underline de 2px em primary; rota ativa com `aria-current="page"`.
- **Seletor de idioma:** código em mono `12px/600 tracking 0.08em`, alvo `44px`.
- **Mobile:** colapsa <700px; rodapé empilha.

### Cards / Containers (coss `Card`)

- **Corner Style:** `rounded-2xl` no primitivo coss (o `card` semântico do frontmatter usa `lg`/`12px` com `16px` de padding).
- **Background:** `bg-card` sobre `bg-background`; texto `card-foreground` — nunca preto puro.
- **Shadow Strategy:** ver Elevation — elevação só quando comunica hierarquia; sidebar usa cards fantasma.
- **Internal Padding:** `p-6` nos primitivos (`CardHeader`/`CardPanel`/`CardFooter`); `16px` no papel semântico.

### Deck (assinatura, CSS próprio em `brand.css`)

- **Character:** cartas táteis com cantoneiras — nunca spinner no lugar do deck.
- **Shape:** radius `9px` desktop, `7px` mobile; desktop `clamp(44px, 4.8vw, 58px) × 80px`, fonte `24px`; sombra `0 3px 0 var(--border)`, selecionada `0 5px 0 color-mix(primary 65%, background)`.
- **State:** selecionada = primary fill + ring; desabilitado perde opacidade e hover.
- **Mobile:** cinco colunas ≥`44px`, gap `12px/6px`, cartas `61px`/`20px`; a pausa ocupa a coluna própria à direita nas duas linhas.

### PokerTable (domínio, CSS próprio)

- **Character:** oval de feltro fixa com assentos ao redor; self = primary fill + ring 2px.
- **Shape:** mesa `365px` (compact `330px`), feltro `inset 64px 45px`, rail `10px`, radius `180px`, highlight interno + tracejado interno. Assentos `84px`, avatar `44px`, played-card `27×38px rotate(12deg)` à frente do assento, voltada ao centro. Mobile (<700px, não-compact): coluna `520px`, assentos em 2 colunas laterais `65px`, played-card `22×32px`.
- **Behavior:** carta votada mostra verso (`card-flip` ao votar, classe `--dealt`) antes do reveal e face com o valor (`card-reveal`) depois; o pill do assento (`Votou`/valor) segue como leitura acessível.

### Inputs / Fields (coss `Field`, `Input`, `OTP Field`)

- **Style:** label acima, erro abaixo, gap `0.5rem`; radius `md` (`10px`); fundo `surface`.
- **Focus:** ring do acento `2px + offset`. Sem floating labels.
- **Join:** código após apelido, antes de foto/espectador; slots `50px`; modo como radiogroup nativo; durante o envio, fieldset desabilitado e status anunciado; erro limpo ao reeditar. Invite input `11px`, mono para código da sala.

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

- **Style:** `output[aria-live]` com mediana grande mono (`38–40px/600 tabular-nums`) + média/intervalo + pips `N×V` de `11px`.
- **`Unânime`:** badge `success/12%`. `Só pausa/ausência`: mensagem explícita, sem média/mediana.

### Confirmação de nova rodada

- **Style:** o botão arma no primeiro toque/clique ou `N`; a barra `arena-confirm-countdown` (2px, destructive, `border-radius 999px`) encolhe via `scaleX` linear com duração inline de `NEW_ROUND_CONFIRM_TIMEOUT_MS`.
- **Behavior:** segundo toque confirma; timeout de 5s desarma sem tráfego. Duração nunca hardcoded no CSS.

### Projéteis (domínio, qualquer fase)

- **Character:** os seis projéteis (papel, aviãozinho, pedra, tijolo, tomate e cadeira) têm SVG próprio — sem emoji. Catálogo em `@/lib/projectiles`.
- **Painel próprio** junto ao avatar/nome do alvo (sem coss Menu — o Menu travava o bun test no jsdom): hover no desktop, toque alterna, Enter abre; seis opções com ícone, nome e área de toque de 44px; setas navegam, Esc fecha e devolve o foco. Sem seletor de alvo separado; sem menu em si mesmo, assentos vazios ou desconectados. Espectadores podem arremessar e ser alvo pelo nome.
- **Cooldown:** 1s por participante (8s para a cadeirada épica; SSOT em `PROJECTILE_COOLDOWN_MS` / `PROJECTILE_CHAIR_COOLDOWN_MS`), com opções desabilitadas e contagem no menu.
- **Voo:** arco com origem anônima no centro da mesa até a posição real do alvo (avatar ou nome de espectador), duração proporcional à distância, sombra de contato no feltro e partículas de impacto na direção do voo; o desfecho (impacto, esquiva ou rebatida) vem do servidor. Overlay sem interação acima dos assentos, animações só de `transform/opacity`; movimento reduzido não cria voo. Sem lista/feed de arremessos — só o voo some sozinho.

### Padrões de página

- **Home:** split assimétrico `1.16fr/1fr`, gap `48px`, padding `32px 0 40px`, `border-bottom`; copy `max 680px`; 1 CTA primário `Criar sala →` (`size=xl`) + 1 text-link sublinhado `Entrar com código` (ambos `44px` mín.), mais link discreto `Experimente uma rodada` para `#demo`. Visual de feltro em CSS (palco `aspect 1.35 / min-height 430px`); steps `repeat(3, 1fr)` com divisórias `border-right`; fechamento "Agora, reúna seu time." com a sequência `Crie a sala → Compartilhe o código → Estimem juntos`.
- **Landing:** 1 CTA primário + text-link; nunca 2 CTAs primários.
- **Entrada:** introdução curta seguida do formulário, sem repetir os três passos da home; desktop mantém o ritual ao lado; ao mudar de rota, scroll volta ao topo e foco vai ao conteúdo principal.
- **Guide:** TOC sticky (`top: calc(var(--header-h) - 8px)`, `max-height: calc(100dvh - var(--header-h) - 16px)`) com scroll-spy; FAQ em accordion nativo.
- **404:** título `32px`, CTA primário com ponte ao ritual, preserva o convite.

## Do's and Don'ts

### Do:

- **Do** usar o primary para **uma única ação principal por tela**; o resto é ghost/outline/link.
- **Do** manter contraste WCAG AA (4.5:1 texto normal, 3:1 texto grande); placeholders também batem 4.5:1.
- **Do** derivar todo offset do header de `var(--header-h)` (`48px`) — nunca valor fixo.
- **Do** passar a duração da confirmação via inline style de `NEW_ROUND_CONFIRM_TIMEOUT_MS`.
- **Do** calçar callouts com borda cheia + fill (como `solo-hint`); números de votação sempre mono tabulares.
- **Do** alvos de toque ≥ `44px` e botões mobile full-width onde couber.
- **Do** rotear erros ao alerta da superfície (`vote-error`, `reveal-error`, `new-round-error`, `projectile-error`, `rejoin-error`).
- **Do** demo com `Você/Bia/Caio/Dani` e história `Checkout mobile`; consenso com mediana/média/intervalo reais.

### Don't:

- **Don't** emojis — o catálogo de projéteis (`@/lib/projectiles`) também usa SVG próprio.
- **Don't** side-stripe (`border-left/right` > 1px como acento) — o exemplo canônico do erro era o hint de solo; hoje é borda cheia + fill.
- **Don't** `Inter`, serif genérica, preto puro (#000000), glow neon, gradiente neon, "AI Purple".
- **Don't** acento com saturação > 80% ou segundo acento; **Don't** misturar warm/cool gray.
- **Don't** `gradiente-text` em header grande, cursor custom, `h-screen`, `z-index` spam, overlap texto-sobre-imagem.
- **Don't** "3 cards iguais" para features — usar steps numerados / bento assimétrico / zig-zag 2-col.
- **Don't** hero centrado, filler ("Scroll to explore", setas bounce, "Discover more", chevrons) ou 2 CTAs primários.
- **Don't** landing cinematográfica, AIDA/GSAP, troca de biblioteca de ícones, sobreposição de conteúdo (anti-referências do PRODUCT.md, ipsis litteris).
- **Don't** nomes genéricos ("John Doe", "Acme", "Nexus").
- **Don't** números fake redondos (`99.99%`, `50%`).
- **Don't** clichê AI ("Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize" — nem traduzidos).
- **Don't** `shadcn/ui` default sem customizar (radii/cores/sombras deste sistema); **Don't** coss Menu no painel de projéteis (painel próprio — o Menu travava o bun test no jsdom).
- **Don't** spinner circular em conteúdo ou no lugar do deck; **Don't** foto stock na intro do join (lista ritual 01/02/03 em texto, sem asset fotográfico).
- **Don't** quebrar a11y: todo estado async tem `aria-live`, atalhos têm `aria-keyshortcuts` + `<kbd>`, foco sempre visível em `var(--ring)`.
