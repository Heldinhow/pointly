# Design System: Pointly
**Skill:** stitch-design-taste (adaptado do padrão Google Stitch)
**SSOT de código:** `apps/web/src/index.css` (`:root` / `.dark`) — este arquivo é camada semântica, não duplica tokens.

---

## Configuration — Dials deste projeto

| Dial | Level | Descrição |
|------|-------|-------------|
| **Creativity** | `5` | `1` = ultra-minimal suíço. `5` = limpo com personalidade (ferramenta real-time). `10` = editorial expressivo. Pointly é ferramenta: home pode ousar, arena deve ser previsível. |
| **Density** | `6` | `1` = galeria arejada. `5` = app diário. `10` = cockpit denso. Home ~4, Arena ~7. Média 6. |
| **Variance** | `5` | `1` = grids simétricos. `5` = offsets sutis. `10` = caótico artístico. Arena não pode ser caótica no meio do voto. |
| **Motion Intent** | `5` | `1` = estático. `5` = hover/entrada sutil. `10` = coreografia cinemática. Respeita `prefers-reduced-motion` (já implementado). |

> **Como usar:** gere telas novas no Stitch com estes dials. Home/demo aceita Creativity até 6. Arena/sala aceita no máximo 4 — legibilidade > expressão durante votação.

---

## 1. Visual Theme & Atmosphere

Interface de ritual rápido: calma, tátil, sem fricção — como uma mesa de feltro bem iluminada onde cada carta ganha seu lugar. Densidade equilibrada-densa (Level 6), variância contida (Level 5) para não distrair do voto, movimento fluido mas nunca teatral (Level 5).

Impressão geral: barato para entrar (sem cadastro), caro na sensação — verde-pinheiro profundo, feltro radial, tipografia track-tight, números sempre mono tabulares. Dark-first: `html.dark` é o padrão (`localStorage: pointly-theme`).

## 2. Color Palette & Roles

SSOT em `apps/web/src/index.css`. Nomes abaixo são semânticos; valores entre parênteses são o estado atual — se mudar o CSS, este doc acompanha.

**Light (`:root`)**
- **Canvas Mist** (#F4F6F3) — background da app
- **Pure Surface** (#FFFFFF) — card / popover fill
- **Pine Ink** (#202B27) — texto primário, nunca puro preto
- **Moss Secondary** (#606E65) — corpo, descrições, metadata
- **Sage Line** (#DCE3DB) — bordas estruturais 1px
- **Soft Felt** (#E9EEE8 / #E5ECE4) — muted / secondary fills
- **Pine Signal** (#17634F) — ACENTO ÚNICO light. CTAs, avatar self, reveal. Texto sobre: #FFFFFF
- **Ring Focus** (#38856C) — focus-visible 2px

**Dark (`.dark`, padrão)**
- **Night Pine** (#141D19) — background
- **Felt Card** (#1B2721) — card / popover
- **Paper Mint** (#EBF0E9) — texto primário
- **Faded Sage** (#A8B6AA) — texto secundário
- **Bark Line** (#334439) — bordas
- **Deep Moss** (#24332A / #2B3D30 / #2A3C30) — muted / secondary / accent fills
- **Mint Signal** (#A9D6AD) — ACENTO ÚNICO dark. Texto sobre: #183523
- **Ring Focus Dark** (#8ABB91)

**Mesa (fixos, não tematizam)**
- **Table Rail** (#D6E1D4 light / #394D3E dark) — borda da mesa oval
- **Table Wordmark** (#C4DBCD) — "Pointly" vazado no feltro
- **Felt Gradient** (`radial-gradient(ellipse at 50% 35%, #246951, #154634)`) — feltro. Texto sobre feltro sempre #F2F7F3
- **Carta verso** (#286451, borda #E7EEE8) — face oculta. **Carta face** (#F3F5EB)

### Banned Colors
- Roxo/violeta neon, gradientes neon — estética "AI Purple" banida
- Preto puro (#000000) — sempre Pine Ink / Night Pine
- Acento com saturação > 80%, ou segundo acento (só 1 verde por tema)
- Misturar sistema warm/cool gray no mesmo projeto
- `chart-4` roxo / `chart-5` rose do tema só em gráficos, nunca em CTA

## 3. Typography Rules

- **Display:** `Geist` — track-tight (`-0.04em` a `-0.065em`), hierarchy por peso (550–650), leading comprimido (`1.08`). Home H1 `clamp(38px, 4.4vw, 58px)` → mobile `clamp(30px, 6.8vw, 48px)`. Home H2 `clamp(30px, 3.3vw, 42px)`. Arena H1 `20px / -0.04em / 650`. `Inter` BANIDO (já conforme via `@fontsource/geist`)
- **Body:** `Geist` 400 — leading relaxado (`1.55–1.7`), cor Moss/Faded Sage. Lede hero `17px`, max `430px`. Sidebar/cards `12–13px`
- **Mono:** `Geist Mono` — timer (`14px/500`), stats (`38–40px/600 tabular-nums`), kickers (`10–11px uppercase tracking 0.09–0.1em`), pips de distribuição (`11px`), kbd. **Todo número de votação/resultado é mono tabular**
- **Copy:** UI em pt-BR. Tom direto, sem fricção: "Boas conversas. Melhores estimativas.", "Sem cadastro. Direto à conversa."

### Banned Fonts
- `Inter` em qualquer contexto premium
- Serifadas genéricas (`Times`, `Georgia`, `Garamond`, `Palatino`) — se serif um dia for preciso, só modernas distintivas (`Fraunces`, `Instrument Serif`). Serif sempre banida na arena/dashboard

## 4. Component Stylings

* **Buttons:** flat, sem outer glow. Primary = acento (Pine/Mint Signal). Secondary = ghost/outline. Active: `translateY(-1px)` ou `scale(0.98)` tátil. Hover: shift de background, nunca glow. Tamanhos: reveal `40px`, invite `37px`, new-round `38px/100% width`. Atalhos sempre documentados em `<kbd>` (R revela, N nova rodada)
* **Cards/Containers:** radius base `--radius: 0.75rem`. Hero visual `18px`. Avatar `50%`, pills `999px`, clock `8px`. Sombra difusa e curta: `0 20px 60px rgb(28 57 45 / 8%)` (home demo), `0 8px 20px -16px #163c2d44` (arena deck). Sidebar usa cards "fantasma" (transparent, sem sombra, `border-top` como separador) — elevação só quando comunica hierarquia
* **Deck (cartas de voto):** assinatura do produto. Desktop `clamp(36px, 4.8vw, 58px) × 80px`, radius `9px`, `font 24px`, `box-shadow: 0 3px 0 var(--border)`. Selecionada: `0 5px 0 color-mix(primary 65%, background)` + cantoneiras `::before/::after 5px`. Mobile `clamp(27px, 7.8vw, 45px) × 61px`, `20px/7px`. Nunca spinner no lugar do deck
* **PokerTable:** oval fixa `365px` (compact `330px`), feltro `inset 64px 45px`, rail `10px`, radius `180px`, inner highlight + dashed interno. Assentos `84px`, avatar `44px` (self = primary fill + ring 2px), played-card `27×38px rotate(12deg)`. Mobile (<700px, não-compact): mesa vira coluna `520px`, assentos 2 colunas laterais `65px`
* **Inputs/Forms:** label acima, erro abaixo. Focus ring acento `2px + offset`. Sem floating labels. Gap `0.5rem`. Invite input `11px`, mono para código da sala
* **Alerts:** inline, contextual, com `AlertTitle` + `AlertDescription` + `data-testid` (`vote-error`, `reveal-error`, `new-round-error`, `projectile-error`, `rejoin-error`). Erro de reveal nunca cai no alerta de voto (roteamento por regex já implementado)
* **Loaders:** esqueleto shimmer nas dimensões do layout. `Spinner` atual só para `Carregando sala / Reconectando` — nunca spinner circular em lista de votos
* **Empty/Waiting:** composição com ícone + título + guia (`arena-waiting`: borda block, ícone 22px primary, p 12px/1.7). Nunca só "No data". Solo (`1 na sala`) mostra hint de convite
* **Stats pill:** `output[aria-live]` com mediana grande mono + média/intervalo + pips `N×V`. `Unânime` = badge `success/12%`. `Só pausa/ausência` = mensagem explícita, sem média/mediana
* **Projectiles (pós-reveal):** botões `outline/sm` com emoji+label (EXCEÇÃO à regra no-emoji — é feature, issue #157). Cooldown 5s com contagem regressiva, feed `border/bg-card 11px`, limite de feed. Indisponível durante votação com explicação

## 5. Hero Section

Hero da home é split assimétrico, nunca centrado:
- **Grid:** `1.16fr / 1fr`, gap `48px`, padding `38px 0 64px`, `border-bottom`. Copy `max 680px`, H1 2 linhas com `<em>` em Pine Signal na segunda linha
- **Ações:** 1 CTA primário (`Criar sala →`, `size=xl`) + 1 text-link sublinhado (`Entrar com código`). Sem "Learn more" secundário
- **Visual:** imagem `aspect 1.3`, radius `18px`, `object-fit cover / 65% center` — ocupa zona própria, nunca texto sobre imagem
- **Banido:** "Scroll to explore", setas bounce, chevrons, centralizado (variance 5 ainda bane), overlap com z-index, 2 CTAs primários
- **Mobile:** colapsa 1 coluna, visual `aspect 1.8` abaixo do copy, actions empilham <380px

## 6. Layout Principles

- **Grid-first:** CSS Grid estrutural. `calc(33% - 1rem)` banido. Steps da home = `repeat(3, 1fr)` com divisórias `border-right` (editorial numerado 01/02/03, não "3 cards iguais")
- **Containment:** shell global `max-width: 1304px` (`.site-header/.site-main/.site-footer`). Home inner `1240px`. Padding `32px` desktop / `20px` mobile
- **Arena:** `grid 1fr / 288px`, gap `32px`. Sidebar com `border-left + padding-left 26px`. ≤1050px: 1 coluna, sidebar vira `2-col grid` com `border-top`. ≤700px: sidebar 1 coluna
- **Full-height:** `min-h-dvh` no wrapper. Nunca `h-screen` / `height:100vh` (jump do Safari iOS)
- **Camadas:** sem overlap de conteúdo. `z-index` só para navbar/modal/overlay. Feltro `z:0`, assentos `z:1` — exceção técnica documentada, não padrão

## 7. Responsive Rules

Verificar SEMPRE em `375px / 390px / 768px / 1024px / 1440px`.
- **Colapso:** multi-coluna → 1 coluna <768px (arena <1050px). `width:100%`, `gap:1.5rem`. Sem scroll horizontal — overflow = falha crítica
- **Tipo:** headlines via `clamp()`. Corpo nunca < `14px` (`12px` só em metadata densa da arena). H1 arena `18px` no mobile
- **Touch:** alvos ≥ `44px`. Símbolo da sala `44px`. Botões mobile full-width onde couber (new-round já é 100%)
- **Arena mobile:** esconde símbolo da sala, presença resumida, botão sair vira ícone, `table-note` centraliza e esconde slogan, deck `padding-inline 6px`
- **Header/Footer:** nav colapsa (esconde "Início" <700px), footer empilha `column/align-start/gap 5px`
- **Espaçamento:** gaps verticais via `clamp(3rem, 8vw, 6rem)` (`64–66px` desktop → `40px` hero mobile)

## 8. Motion & Interaction (Code-Phase Intent)

> Stitch gera telas estáticas. Esta seção diz ao coding agent como animar o export.

- **Física:** springs `stiffness:100, damping:20`. Sem linear easing. Reveal de carta: `card-reveal 0.35s ease-out (rotateY 90°→0 + rotate 12°)`
- **Micro-loops:** pulse no dot de presença/timer crítico, shimmer em skeleton, float sutil em ícones da home. Timer crítico (`≤30s`) com `aria-live=assertive` + borda destructive
- **Orquestra:** listas Assentos/votos/feed montam em cascata (`delay: index*100ms`), nunca instantâneo
- **Hardware:** animar SÓ `transform` e `opacity`. Nunca `top/left/width/height`. Grain só em pseudo fixo `pointer-events-none`
- **Acessibilidade:** `@media (prefers-reduced-motion: reduce)` colapsa tudo para `0.01ms` (global em `index.css` + `card-reveal: none` em `poker-table.css`). Componentes preferem variantes `motion-safe:`. Performance: isolar loops em leaf components, 60fps mínimo
- **Confirmações:** nova rodada exige duplo `N`/clique em janela de 5s — primeiro toque arma, segundo confirma, timeout desarma sem tráfego

## 9. Anti-Patterns (Banned)

- Sem emojis — EXCEÇÃO: reações de projéteis (feature pós-reveal com catálogo em `@/lib/projectiles`)
- Sem `Inter`, sem serif genérica, sem preto puro, sem glow neon, sem gradiente neon
- Sem acento >80% saturação, sem segundo acento, sem warm/cool gray misturado
- Sem gradiente-text em header grande, sem cursor custom, sem `h-screen`, sem `z-index` spam
- Sem overlap texto-sobre-imagem, sem "3 cards iguais" para features (usar steps numerados / bento assimétrico / zig-zag 2-col)
- Sem hero centrado (neste nível de variância), sem filler ("Scroll to explore", setas bounce, "Discover more")
- Sem nomes genéricos ("John Doe", "Acme", "Nexus") — demo usa `Você/Bia/Caio/Dani`, história `Checkout mobile`
- Sem números fake redondos (`99.99%`, `50%`) — usar mediana/média/intervalo reais do consenso
- Sem clichê AI ("Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize" — nem traduzidos)
- Sem `shadcn/ui` default sem customizar (radii/cores/sombras deste sistema), sem spinner circular em conteúdo, sem Unsplash quebrado (hero usa `/images/planning-cards.webp` local)
- Sem quebrar a11y: todo estado async tem `aria-live`, atalhos têm `aria-keyshortcuts` + `<kbd>`, foco sempre visível em `var(--ring)`
