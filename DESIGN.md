---
version: alpha
name: Pointly — Mesa compartilhada / Azul tinta
colors:
  bg: "#f5f6fa"
  surface: "#ffffff"
  ink: "#222c48"
  ink-soft: "#3c4965"
  ink-mute: "#555f78"
  ink-faint: "#64708a"
  table: "#e1e7f5"
  accent: "#354c91"
  on-accent: "#ffffff"
  accent-hover: "#263c7c"
  line: "#c7cddc"
  signature: "#e9aa77"
  focus: "#9e4519"
  danger: "#a32e3b"
  danger-soft: "#ffe8eb"
  success: "#256a52"
  success-soft: "#dff2e9"
  warning: "#835007"
  warning-soft: "#fff0ce"
  avatar: "#f5d7c0"
  avatar-ink: "#5c3925"
  avatar-self: "#d4ddf6"
  avatar-self-ink: "#293c72"
  avatar-blue: "#c6d9f5"
  avatar-blue-ink: "#244259"
  avatar-rose: "#efc6de"
  avatar-rose-ink: "#5c2948"
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 5.9rem
    fontWeight: 800
    lineHeight: 0.99
    letterSpacing: -0.045em
  display-landing:
    fontFamily: Space Grotesk
    fontSize: 3.2rem
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: -0.045em
  display-entry:
    fontFamily: Space Grotesk
    fontSize: 5.5rem
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: -0.055em
  numeral:
    fontFamily: Space Grotesk
    fontSize: 1.65rem
    fontWeight: 700
  body:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  lede:
    fontFamily: Manrope
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.65
  caption:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 800
    letterSpacing: 0.08em
rounded:
  sm: 7px
  md: 9px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    minHeight: 44px
    padding: 12px 20px
    fontWeight: 800
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-outline:
    textColor: "{colors.ink}"
    borderColor: "{colors.line}"
    rounded: "{rounded.md}"
    minHeight: 44px
  card-surface:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.line}"
    rounded: "{rounded.lg}"
  deck-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.line}"
    rounded: "{rounded.md}"
    size: 64px x 86px
  deck-card-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  felt-table:
    backgroundColor: "{colors.table}"
    borderRadius: 50%
  avatar:
    backgroundColor: "{colors.avatar}"
    textColor: "{colors.avatar-ink}"
    rounded: "{rounded.full}"
    size: 36px
---

# Pointly — Mesa compartilhada / Azul tinta

Identidade escolhida pelo usuário em 6 de setembro de 2026. Substitui integralmente Atelier Zero. Referência aprovada: `design/redesign-2026/mesa.html`, composição A, paleta `ink`.

## Overview

Pessoas ao redor de uma rodada compartilhada. A landing mostra a experiência; a arena destaca presença, voto e discussão. Interface colaborativa e memorável: azul tinta sobre branco frio no claro, azul profundo com ações claras no escuro. Sem decoração editorial de papel, serifas ou textura. Nome Pointly preservado; símbolo de quatro peças que se reúnem (marca `pointly-mark`: grade 2×2 rotacionada -8°, três peças em `accent`, a quarta em `signature`).

## Colors

Base branco frio (não creme) com azul tinta como ação e tinta de leitura. A assinatura quente (`signature`, laranja-areia) é a única cor quente do sistema: reservada ao detalhe da marca e a estados de atenção, nunca a superfícies grandes. Erro, atenção e conexão usam tokens semânticos distintos (`danger`, `warning`, `success` com seus softs); rótulos e formas complementam a cor, nunca a cor sozinha.

| Papel | Claro | Escuro |
|---|---|---|
| Fundo (`bg`) | #f5f6fa | #141a2b |
| Superfície (`surface`) | #ffffff | #202a40 |
| Tinta (`ink`) | #222c48 | #edf1fb |
| Tinta suave (`ink-soft`) | #3c4965 | #d5dded |
| Tinta muda (`ink-mute`) | #555f78 | #b3bfd9 |
| Tinta esmaecida (`ink-faint`) | #64708a | #a2afca |
| Mesa (`table`) | #e1e7f5 | #283752 |
| Ação / seleção (`accent`) | #354c91 | #bacdff |
| Texto sobre ação (`on-accent`) | #ffffff | #192847 |
| Ação hover (`accent-hover`) | #263c7c | #d1deff |
| Borda (`line`) | #c7cddc | #475879 |
| Assinatura quente (`signature`) | #e9aa77 | #f0b985 |
| Foco (`focus`) | #9e4519 | #f4bb87 |
| Perigo (`danger`) / soft | #a32e3b / #ffe8eb | #ffadb8 / #4c2635 |
| Sucesso (`success`) / soft | #256a52 / #dff2e9 | #a8dfc8 / #1f433d |
| Atenção (`warning`) / soft | #835007 / #fff0ce | #f4cb89 / #46391e |

Avatares têm pares próprios de fundo e tinta (claro / escuro): `avatar` #f5d7c0 / #694a3d com tinta #5c3925 / #ffe1c8; `avatar-self` #d4ddf6 / #40547c; `avatar-blue` #c6d9f5 / #3c526b; `avatar-rose` #efc6de / #69445c. O tema Sistema segue o sistema; claro/escuro persistidos pela implementação existente (`data-theme` no `html`).

## Typography

Manrope para interface, Space Grotesk para marca, títulos e numerais. Fontes locais em `apps/web/public/fonts` (Manrope regular 400 + extra-bold 700–900; Space Grotesk bold 600–900), licenças OFL. Pares semânticos: títulos e números em Space Grotesk com tracking negativo; corpo em Manrope sem tracking. Títulos usam `text-wrap: balance`; ledes limitados a ~44ch.

- **Display hero** (landing): Space Grotesk, clamp(3.25rem → 5.9rem), peso 800, line-height .99, tracking -.045em.
- **Título de entrada** (join/recovery): clamp(2.8rem → 5.5rem), peso 700, line-height .98, tracking -.055em.
- **Título de seção**: clamp(2rem → 3.2rem), peso 700, line-height 1.04.
- **Lede**: Manrope 17px/1.65, cor `ink-mute`.
- **Corpo**: Manrope 16px/1.5; **legenda**: 14px/1.55; **etiqueta**: 12px, peso 800, uppercase, tracking .08em.
- **Numerais** (cartas, mediana, timer): Space Grotesk, tabular-nums no timer, codes e código de sala com tracking largo (.18em–.2em) e uppercase.

## Layout

Cabeçalho fixo de 80px (`--header-height`) com fundo translúcido + blur ao rolar. Grade da landing em duas colunas no desktop (hero com mesa elíptica ao lado), empilhada no mobile. A arena usa mesa elíptica no desktop (carteado `felt` com anel interno em `accent` a ~30%) e composição linear no mobile (grade 2 colunas de assentos + dock de cartas). Cartas do baralho: 64×86px no desktop, 49×70px no mobile, sempre com scroll horizontal quando necessário. Escala de espaçamento de 4px (xs 4, sm 8, md 16, lg 24, xl 32). Nada de reduzir textos por scale: os tamanhos mínimos valem em todas as larguras.

## Elevation & Depth

Profundidade por camadas tonais e sombras suaves, não por sombras pesadas: `shadow-card` 0 5px 16px rgb(16 27 54 / 4.4%) para assentos e superfícies; `shadow-bone` 0 16px 48px rgb(16 27 54 / 20%) para overlays; cabeçalho com `backdrop-filter: blur(14px)` sobre o fundo. Felt usa anel interno translúcido de `accent` em vez de sombra.

## Shapes

Botões e cartas do baralho com raio 9px; pílulas 7px; superfícies (cards) 16px; avatares e mini-cartas totalmente redondos/quase (full e 5px na mini-carta). Felt elíptico no desktop (raio 50%) e retangular com raio 24px no mobile. Mínimo de 44px de altura de alvo em botões e controles; foco visível com outline de 3px em `focus` e offset 3–4px.

## Components

- **Botão primário**: `accent` sobre `on-accent`, raio 9px, min-height 44px, peso 800; hover em `accent-hover` com leve elevação (translateY -2px na referência) e transição de 150ms.
- **Botão outline**: tinta `ink`, borda `line`, fundo transparente; hover com borda e texto em `accent`.
- **Cartão de superfície**: `surface` sobre `bg`, borda `line` de 1px, raio 16px, sem sombra própria (elevação via sombra leve opcional).
- **Carta do baralho**: `surface` com borda `line`, raio 9px, numeral em Space Grotesk; selecionada vira `accent`/`on-accent` e sobe ~7px; desabilitada a 60% de opacidade.
- **Assento (arena)**: avatar redondo com inicial em negrito, nome com ellipsis, estado abaixo (`Pensando` / `Votou` / `Revelado` / `Reconectando`), voto em mini-carta `surface` que vira `accent` ao revelar. Assento "eu" marcado com anel de `accent`.
- **Pílulas**: raio 7px; crítica usa `warning`/`warning-soft`; padrão usa `table`.
- **Feedback**: banner com fundo misto de `bg`+`surface`, borda superior/inferior, sombra `shadow-card`; variantes `danger-soft`/`danger`, `success-soft`/`success`, neutra `surface`; dot de status e `aria-live="polite"`.

## Estados

Cobertura em `design/redesign-2026/coverage.md`. Toda página tem ação clara, carregamento e recuperação. Convite solo acessível dentro da sala; ajuda permanece modal com foco protegido. Votos privados não vazam; resultados continuam autoritativos do servidor. Movimento só para feedback: projéteis, hit-shake, dodge-slide e reação fade-up usam curvas ease-out e `prefers-reduced-motion: reduce` reduz tudo a transições instantâneas (duração .01ms).

## Do's and Don'ts

- Do usar `accent` para a ação primária e a seleção; o quente `signature` fica reservado à marca e à atenção.
- Do manter AA 4.5:1 no corpo em ambos os temas; `ink-mute` é o limite de contraste para texto secundário, nunca abaixo dele.
- Do usar Space Grotesk em títulos e numerais, Manrope em corpo — sem inverter.
- Don't usar o azul tinta em superfícies grandes; a tinta de leitura sobre a mesa é sempre escura sobre clara (ou clara sobre escura), nunca azul sobre azul.
- Don't adicionar textura, serifas ou fundo de papel; a mesa é elíptica ou linear, sem decoração.
- Don't animar layout; movimento apenas em transform/opacity e apenas para feedback.

## Compatibilidade

Alguns nomes de variantes/utilitários internos (`coral`, `paper`, `mustard`, `olive`) permanecem como aliases em `index.css` e `tailwind.config.ts` para evitar mudanças desnecessárias na API de componentes. Resolvem exclusivamente aos tokens novos (`coral-soft → table`, `coral-deep → accent`, `paper-warm → bg`, `mustard → signature`, `olive → success`); não representam a identidade descartada. Transporte, schemas, store e regras não fazem parte do redesign.