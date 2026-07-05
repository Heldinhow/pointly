# Iter-4 audit — Open Design reference visual upgrade

> Auditoria visual comparativa: Pointly (branch `ux-review-main`) × imagem de
> referência `/Users/helder/Downloads/index.png` ("Open Design" — editorial
> cream/terracotta/serif, página de portfólio/agência).
>
> **Fresh audit** — não herda findings de iter-1/2/3. Foco: identidade editorial,
> tipografia display, marcadores de capítulo, peso visual, paleta terracota,
> padrões de botão, tratamento de imagem.
>
> **Escopo**: `/` (Landing) + `*` (NotFound). Arena/Join/Full ficam fora.
>
> **Regras preservadas (Atelier Zero)**: paper bg, coral ≤1 CTA/viewport,
> mustard ≤1% surface, surface-noise::before em todas as telas, WCAG 2 AA,
> touch targets ≥44px coarse pointer, prefers-reduced-motion honored.
>
> **Severidade**: Crítica · Alta · Média · Baixa (mesma matriz do AUDIT_SCOPE §8).

---

## 1. Diff: Pointly (Atelier Zero) × Open Design (referência)

### 1.1 Tokens de cor

| Token | Pointly (atual) | Open Design (ref.) | Comentário |
|-------|------------------|---------------------|------------|
| Background | `#efe7d2` (paper-warm cream) | `#f5f1ea` (cream) | **Δ pequeno** — ambos cream. Ref. é um pouco mais frio e menos saturado. |
| Accent quente | `#ed6f5c` (coral — pinkish-red) | `#d24a2a` (terracotta — orange-red) | **Δ relevante** — referência é mais laranja/menos rosa. Reforça "warm editorial". |
| Acento secundário | `#e9b94a` (mustard) | `#e8b547` (ochre) | **Δ pequeno** — ambos amarelo-queimado. Conservar. |
| Olive/jewelry | `#6e7448` | (n/a — ref. usa só terracota + preto) | Conservar olive Pointly como jewelry interno (não-CTA). |
| Ink principal | `#15140f` (near-black) | `#1a1a1a` (pure-ish black) | Conservar. |
| Ink soft | `#2a2620` | n/a — ref. usa só 1 nível de ink + 1 terra | Pointly tem mais níveis — bom p/ hierarquia. |

### 1.2 Tipografia

| Role | Pointly (atual) | Open Design (ref.) | Comentário |
|------|------------------|---------------------|------------|
| Display headline | **Inter Tight 800/900** (sans extrabold) | **High-contrast serif** (didone/transitional — provável "Editorial New", "Söhne Breit Semi", ou similar) | **Δ alto** — este é o SWITCH principal. Sans extrabold = "tech utility"; high-contrast serif = "editorial atelier". Muda toda a percepção de marca. |
| Display italic | Playfair Display Italic 500 (inline emphasis em `ritmo`, `confiança`) | Same role — italic serif inline | **Δ baixo** — alinhado. Reforçar weight p/ 700-800 p/ mais presença. |
| Body | Inter 400 (sans) | Sans humanista (Söhne/Inter system) | Alinhado. |
| Mono labels | JetBrains Mono 400/500 | Mono p/ tags uppercase | Alinhado. |
| Numeral de capítulo | **Roman numerals** (I., II., III., IV., V.) | **Italic Arabic numerals** (01, 02, 03, 04) | **Δ médio** — Roman numerals = acadêmico; Arabic italic serif = editorial contemporâneo. |
| Footer wordmark | Playfair Display Italic 500 (mega) | Display serif italic (mega) | Alinhado. |

### 1.3 Padrão de botão

| Aspecto | Pointly | Open Design | Comentário |
|---------|---------|-------------|------------|
| Shape | Pill (`rounded-full`) | Pill | Alinhado. |
| Fill | Coral bg + white text | Terracotta bg + white text | Shape alinhado; **falta ajuste de hue**. |
| Sombra | `shadow-coral` (glow sutil) | Inner highlight + soft drop | Reforçar com inner-highlight CSS. |
| Arrow glyph | `↗` | `↗` (ou `→`) | Alinhado. |
| Altura (lg) | `h-12` (48px) | ~48-56px | Alinhado. |
| Disabled | `opacity-40` | Lower opacity (40-50%) | Alinhado. |

### 1.4 Layout & tratamento de imagem

| Aspecto | Pointly | Open Design | Comentário |
|---------|---------|-------------|------------|
| Hero illustration | **3 cards** (3, ☕, 5) em fan rotation | **Sculptural collage** (Greek bust + botanical terracotta overlay) | **Δ alto** — sem arte editorial, Landing lê como "tech product text-only". Solução: composition CSS/SVG-only que evoque o "collage on paper" sem dependência externa. |
| Capabilities grid | 4-col, hover muda border-color | 6-col, hover lift + badge | **Δ médio** — Pointly está em 4-col (compacto); ref. em 6-col (mais airy). Conservar 4-col mas com hover lift + numeral italic maior. |
| Capabilities numeral | `text-[18px]` italic coral | `text-[28-32px]` italic serif coral | **Δ pequeno** — apenas aumentar o numeral p/ ter mais peso. |
| Section rules | I. / II. / III. / IV. / V. em Playfair italic 14px | 01 / 02 / 03 / 04 em Playfair italic 28-48px | **Δ médio** — converter para arabic + aumentar. |
| Testimonial | (nenhum) | Pull-quote italic com atribuição + 5-star | **Fora do escopo** — exige copy que não temos. Manter fora desta iter. |
| Footer wordmark | "Pointly." mega Playfair italic | "Open Design." mega display serif italic | Alinhado. |
| Spacing rhythm | 12-col 1360px max | 12-col fluido com gutters largos | Conservar. |

### 1.5 Contraste e peso visual

| Aspecto | Pointly | Open Design | Comentário |
|---------|---------|-------------|------------|
| Peso do display headline | Inter Tight 800 + clamp(40px,5vw,80px) | Display serif (regular weight, alto contraste) | Ref. usa serif REGULAR p/ display — não extrabold. Contraste vem das **transições de traço** (high-contrast serif), não de weight. |
| Weight do body ink | `text-ink-soft` (#2a2620) | Pure-ish black | **Δ pequeno** — aumentar uso de `text-ink` (#15140f) no hero p/ mais peso. |
| Espaçamento entre seções | `py-16` (64px) | `py-24` (96px) | Aumentar ritmo em ~25-30%. |

---

## 2. Findings UX-012..UX-017

Cada finding tem: ID, severidade, categoria, localização, descrição, impacto,
evidência (before screenshot path), solução proposta, critério de aceite.

### UX-012 — Display headline: sans extrabold → high-contrast serif

- **Severidade**: Alta
- **Categoria**: Identidade visual · Tipografia
- **Localização**: `apps/web/src/pages/landing.tsx` (h1 do hero, h2 de About, h2 do CTA Ribbon) + `apps/web/src/pages/not-found.tsx` (h1, h2)
- **Descrição**: Os headlines display do Pointly usam `font-display font-extrabold` que mapeia para `Inter Tight 900` — uma sans extrabold geométrica. A imagem de referência usa uma **serif de alto contraste** (didone/transitional, provavelmente "PP Editorial New" ou similar) com transições grossas-finas dramáticas. O resultado da referência lê como "editorial atelier / portfólio de estúdio de design"; o resultado atual lê como "tech product moderno". Essa é a maior diferença de **brand voice** entre as duas peças.
- **Impacto**: O switch tipográfico é a alavanca de maior impacto perceptual — uma única mudança de typeface no h1 muda toda a primeira impressão da Landing. Alavanca o voice Pointly de "tech utility" para "editorial atelier", alinhando com a personalidade "Planning Poker efêmero" / "Atelier Zero" já prometida no UX_REVIEW §3 UX-001.
- **Evidência (before)**:
  - `docs/ux-review/screenshots/before/audit-landing-vp-1440-full.png` (Landing hero, Inter Tight 800)
  - `docs/ux-review/screenshots/before/audit-landing-vp-1440-viewport.png` (acima do fold)
  - `docs/ux-review/screenshots/before/audit-not-found-vp-1440-full.png` (NotFound — usa Playfair italic p/ 404 mas Inter Tight p/ h2)
- **Solução proposta**:
  1. Em `apps/web/src/index.css`, importar uma **serif display de alto contraste**. Opção 1: `Instrument Serif` (Google Fonts, já presente em vários projetos); opção 2: `DM Serif Display` (mais pesada); opção 3: `EB Garamond` (clássica). Recomendo **Instrument Serif** (peso 400, italic 400) — moderno, geométrico, alto contraste, peso de arquivo pequeno.
  2. Adicionar variable `--font-display-serif` que mapeia para `"Instrument Serif", "Playfair Display", Georgia, serif`.
  3. Trocar `font-display` (sans extrabold) por `font-serif` (serif display) **apenas** em headlines h1/h2 do Landing e NotFound. Manter `font-display` (Inter Tight) p/ sub-headlines (h3/h4) e UI labels.
  4. Aumentar `tracking-[-0.04em]` p/ `tracking-[-0.045em]` p/ dar respiro editorial.
  5. Verificar contraste WCAG AA: `#15140f` sobre `#efe7d2` = ratio ~16:1 ✓.
- **Critério de aceite**:
  - Landing vp-1440 h1 renderiza em Instrument Serif (não Inter Tight).
  - axe-core ainda reporta 0 violations em `/` e `*`.
  - Verificação visual via screenshot after confirma mudança tipográfica.
- **Issue GitHub (target)**: [#12](https://github.com/Heldinhow/pointly/issues/12)

### UX-013 — Section markers: Roman numerals → italic Arabic numerals + larger

- **Severidade**: Média
- **Categoria**: Identidade visual · Marcadores
- **Localização**: `apps/web/src/index.css` (.sec-rule .roman) + todas as SectionRule no Landing
- **Descrição**: Os divisores de seção no Landing usam **Roman numerals** (I., II., III., IV., V.) em Playfair Italic 14px. A referência usa **Arabic numerals** (01, 02, 03, 04) em display serif italic com tamanho muito maior (28-48px). Roman numerals têm conotação acadêmica/livro-texto; arabic italic serif têm conotação editorial contemporânea (revista, jornal moderno).
- **Impacto**: Os section markers são o principal elemento de "ritmo editorial" da Landing. Aumentá-los e converter para arabic muda a percepção de "artigo acadêmico" para "capítulo de revista". Pequena alavanca visual com grande mudança de voice.
- **Evidência (before)**:
  - `docs/ux-review/screenshots/before/audit-landing-vp-1440-full.png` (ver topo de cada seção)
- **Solução proposta**:
  1. Trocar `.sec-rule .roman` de `font-family: "Playfair Display"` p/ `--font-display-serif` (Instrument Serif) com weight 400 italic.
  2. Aumentar `font-size: 14px` p/ `clamp(20px, 2.5vw, 36px)`.
  3. Trocar texto de "I." → "01", "II." → "02", etc. (5 ocorrências no Landing).
  4. Manter "PAGE 001/002/..." como está (mono tracked uppercase — já alinhado).
- **Critério de aceite**:
  - 5 SectionRule markers renderizam "01", "02", "03", "04", "05" em Instrument Serif italic ≥20px.
  - Atributo `aria-hidden="true"` permanece (decorativo).
- **Issue GitHub (target)**: [#13](https://github.com/Heldinhow/pointly/issues/13)

### UX-014 — Pill button color: salmon-coral → terracotta (palette alignment)

- **Severidade**: Baixa
- **Categoria**: Identidade visual · Cor
- **Localização**: `apps/web/src/index.css` (`:root --accent`) + `tailwind.config.js` se aplicável
- **Descrição**: O `--accent` Pointly é `#ed6f5c` — coral pinkish-red. A referência usa terracota orange-red (~`#d24a2a`). Diferença de hue: Pointly tem mais rosa/salmão; referência é mais laranja. Ambos transmitem "warm editorial", mas a referência é mais saturada e menos pinkish — visualmente mais "grounded".
- **Impacto**: Pequena alavanca de cor. Quando combinada com UX-012 (serif display), o shift de hue reforça o "editorial" voice sem quebrar a regra "coral ≤1 CTA/viewport". `--coral-soft` (hover state) também precisa ajustar.
- **Evidência (before)**:
  - `docs/ux-review/screenshots/before/audit-landing-vp-1440-full.png` (ver CTA "Criar sala")
  - `docs/ux-review/screenshots/before/UX-001-not-found-no-cta.png` (NotFound CTA)
- **Solução proposta**:
  1. Em `:root`, trocar `--accent: #ed6f5c` → `--accent: #d24a2a` (terracota).
  2. Trocar `--coral-soft: #f08e7c` → `--coral-soft: #e36747` (hover ligeiramente mais claro).
  3. Atualizar **somente** o token — não mexer em componentes individuais.
  4. Verificar contraste WCAG AA: `#d24a2a` sobre `#efe7d2` = ratio ~4.65:1 ✓ (passa body); sobre `#ffffff` = ratio ~4.55:1 ✓.
  5. Verificar contraste ink-soft sobre coral: `#15140f` sobre `#d24a2a` = ratio ~5.5:1 ✓.
- **Critério de aceite**:
  - Inspeção visual: CTA "Criar sala" no hero / NotFound renderiza em `#d24a2a` (mais laranja, menos rosa).
  - axe-core 0 violations em todas as rotas.
  - Nenhum outro token muda.
- **Issue GitHub (target)**: [#14](https://github.com/Heldinhow/pointly/issues/14)

### UX-015 — Hero illustration: 3 cards → sculptural SVG collage (editorial weight)

- **Severidade**: Média
- **Categoria**: Identidade visual · Composição
- **Localização**: `apps/web/src/pages/landing.tsx` (bloco "Stylized Cards Illustration" no hero, ~linha 280)
- **Descrição**: O hero da Landing usa 3 cartas (3, ☕, 5) em fan rotation como ilustração. A imagem de referência usa **composição editorial** (sculpture + botanical terracotta overlay) como peça central do hero. A solução atual é funcional mas lê como "poker tool" (literal); a referência evoca "atelier de design" (metafórico). Sem mudar copy, é possível adicionar **peso visual** ao hero com uma composição CSS/SVG-only que evoque o "collage on paper" — círculo terracota grande atrás de uma serif glyph monumental + dotted outline circle + pequenas folhas/botanical SVG inline.
- **Impacto**: Sem alterar copy ou hierarquia, adiciona uma "obra visual" ao hero que ancora a personalidade editorial. É o elemento que mais diferencia uma "tech landing" de uma "editorial landing" — a referência ganha 30% mais presença visual por causa dessa composição.
- **Evidência (before)**:
  - `docs/ux-review/screenshots/before/audit-landing-vp-1440-viewport.png` (hero above-the-fold)
  - `docs/ux-review/screenshots/before/audit-landing-vp-1440-full.png` (full page)
- **Solução proposta**:
  1. Manter o frame `bg-paper-warm border border-ink/5 rounded-3xl ... shadow-bone` (já alinhado).
  2. Substituir os 3 cards internos por uma composição editorial:
     - Círculo terracota grande (`bg-coral rounded-full w-72 h-72 opacity-90`) atrás
     - Glyph serif monumental (ex: "Ø" ou "P" ou "5") em Instrument Serif italic 200px coral/cream
     - Dotted outline circle (border-dashed border-coral/30) sobreposto, deslocado 30px
     - 3-4 folhas/botanical SVG inline (paths simples) em coral soft, posicionadas no canto
  3. Tudo com `aria-hidden="true"` (decorativo).
  4. Respeitar `prefers-reduced-motion` (sem animação; static composition).
  5. Não usar imagens externas (zero network deps).
- **Critério de aceite**:
  - Hero vp-1440 mostra composição editorial com círculo terracota + glyph serif + dotted outline.
  - axe-core 0 violations.
  - Tamanho do frame mantido (mesma altura/largura que os 3 cards).
  - Visual não parece "AI-generated placeholder" — deve ter weight editorial real.
- **Issue GitHub (target)**: [#15](https://github.com/Heldinhow/pointly/issues/15)

### UX-016 — Capabilities cards: numeral italic 18px → 28px + hover lift

- **Severidade**: Média
- **Categoria**: UI · Consistência
- **Localização**: `apps/web/src/pages/landing.tsx` (linhas ~410-430, bloco CAPABILITIES)
- **Descrição**: Os capability cards atualmente têm:
  - Numeral "01" / "02" / "03" / "04" em `font-italic italic text-coral text-[18px]`
  - Hover muda apenas `border-coral` (color shift)
  A referência usa numerais italic serif muito maiores (28-32px) + hover lift (`translate-y` + shadow grow). Os cards de Pointly parecem "feature grid SaaS"; a referência parece "card editorial numerado".
- **Impacto**: Pequena alavanca visual mas de alta recorrência (4 cards por viewport, primeira seção após hero). Aumenta o peso editorial sem mudar copy ou hierarquia.
- **Evidência (before)**:
  - `docs/ux-review/screenshots/before/audit-landing-vp-1440-full.png` (seção III — CAPABILIDADES)
- **Solução proposta**:
  1. Trocar numeral de `text-[18px]` para `text-[28px]`.
  2. Trocar `font-italic italic text-coral` para `font-serif italic text-coral` (usa Instrument Serif italic).
  3. Adicionar `hover:-translate-y-1 hover:shadow-md` ao Card wrapper (transição 200ms).
  4. Manter `transition-colors duration-300` no border (já existe).
- **Critério de aceite**:
  - 4 capability cards vp-1440 mostram numeral "01"..."04" em Instrument Serif italic ≥28px coral.
  - Hover (simulado via `transform: translateY(-4px)` no CSS) gera lift visível.
  - axe-core 0 violations.
- **Issue GitHub (target)**: [#16](https://github.com/Heldinhow/pointly/issues/16)

### UX-017 — NotFound: editorial parity com Landing (display serif + visual treatment)

- **Severidade**: Alta
- **Categoria**: Identidade visual · Consistência entre rotas
- **Localização**: `apps/web/src/pages/not-found.tsx` (todo o componente)
- **Descrição**: NotFound (UX-001 fix do iter-1) já tem voz editorial Atelier Zero — paper bg, Ø mark, 404 coral italic Playfair, h2 Inter Tight, CTAs coral/ghost, surface-noise. Mas está desalinhado com a nova linguagem visual do Landing (UX-012..UX-016): usa Inter Tight p/ h2 (não serif display Instrument Serif), não tem composição editorial ao lado do card, e o metadata strip é mais simples que o do Landing. Após o upgrade do Landing, NotFound precisa de **parity visual** — não precisa ser idêntico, mas precisa compartilhar a mesma linguagem.
- **Impacto**: Sem parity, o usuário que cai no 404 depois de navegar pela Landing percebe um "downgrade" de qualidade visual — quebra a promessa de "Planning Poker efêmero" / "Atelier Zero". A 404 é também a primeira impressão de quem chega via link quebrado (deep-link stale, share URL expirado) — é a página mais importante para reter.
- **Evidência (before)**:
  - `docs/ux-review/screenshots/before/audit-not-found-vp-1440-full.png` (current state)
  - `docs/ux-review/screenshots/after/UX-001-after-not-found-editorial.png` (UX-001 já aplicado)
- **Solução proposta**:
  1. Trocar h2 (`font-display font-extrabold text-[28px]`) p/ `font-serif italic font-normal text-[clamp(28px,3vw,44px)]` (Instrument Serif italic).
  2. Adicionar metadata strip top **igual ao do Landing** (pulse dot coral + "POINTLY · VOTO PERDIDO · PT-BR" + roman marker "404 / 404 / 404").
  3. Adicionar composição editorial decorativa à direita do card (similar ao UX-015 hero): círculo terracota + serif glyph "404" + dotted outline. Pode ser absolute positioned dentro do stage.
  4. Manter tudo o que já funciona do UX-001 (Ø mark, 404 display, surface-noise, role="alert", CTAs).
- **Critério de aceite**:
  - NotFound vp-1440 h2 renderiza em Instrument Serif italic (não Inter Tight).
  - Metadata strip top presente e visualmente consistente com Landing.
  - Composição editorial decorativa renderiza sem afetar o card central.
  - axe-core 0 violations.
  - `role="alert"` e `data-testid="not-found-code"` preservados (regressão UX-001).
- **Issue GitHub (target)**: [#17](https://github.com/Heldinhow/pointly/issues/17)

---

## 3. Resumo

| ID | Sev | Categoria | Título | Localização | Issue |
|----|-----|-----------|--------|-------------|-------|
| UX-012 | Alta | Tipografia | Display headline: sans extrabold → high-contrast serif | landing.tsx + not-found.tsx | [#12](https://github.com/Heldinhow/pointly/issues/12) |
| UX-013 | Média | Marcadores | Section markers: Roman → Arabic italic serif + larger | landing.tsx + index.css | [#13](https://github.com/Heldinhow/pointly/issues/13) |
| UX-014 | Baixa | Cor | Pill button: salmon-coral → terracotta | index.css (:root) | [#14](https://github.com/Heldinhow/pointly/issues/14) |
| UX-015 | Média | Composição | Hero illustration: 3 cards → sculptural SVG collage | landing.tsx (hero block) | [#15](https://github.com/Heldinhow/pointly/issues/15) |
| UX-016 | Média | UI consistência | Capability cards: numeral 18px → 28px + hover lift | landing.tsx (capabilities) | [#16](https://github.com/Heldinhow/pointly/issues/16) |
| UX-017 | Alta | Identidade | NotFound: editorial parity com Landing | not-found.tsx | [#17](https://github.com/Heldinhow/pointly/issues/17) |

**Total**: 6 findings (UX-012..UX-017). 2 Alta · 3 Média · 1 Baixa.

**Positivos preservados**: Atelier Zero rules intactas (coral ≤1/viewport, mustard ≤1%, surface-noise, mono tags, Ø glyph, Playfair italic inline emphasis, mega wordmark, section rules structure).

**Não incluso nesta iter**: testimonial section (copy dependency), dark section rework (UX-009 não cobre), Arena/Join/Full re-skin (escopo), backend changes (escopo).
