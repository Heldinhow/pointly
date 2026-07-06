# CHANGELOG_HOME — Pointly home improvement loop (T1–T8)

Registro por item do backlog. Entradas são adicionadas ao final, na ordem em que o item
fecha (`DONE`) ou esgota iterações (`BLOCKED`). Formato padrão por entrada:

```
## T{N} — {título curto}
Issue: #{M}
Status: DONE (issue fechada) | BLOCKED (issue aberta, label `blocked`)
Mudanças: {arquivos/componentes tocados}
Decisões: {qualquer trade-off ou adaptação em relação à sugestão original}
Verificação: {como foi validado — screenshot, teste de contraste, viewport testado, etc.}
```

---

## T1 — Hero mostra o produto, não só ilustração decorativa

Issue: #23
Status: DONE (issue fechada via Closes #23 no commit)
Mudanças:

- `apps/web/src/pages/landing.tsx`: novo componente `HeroTable` (preview de 6 jogadores
  em torno de elipse pontilhada, mediana destacada em mostarda, moldura editorial com
  "FIG. 01 · MESA REVELADA" + badge "MEDIANA 5" + rodapé mono "6 JOGADORES · 1 HOST /
  MOSTARDA = MEDIANA"); substitui a ilustração Ø abstrata do hero.
- `apps/web/src/pages/landing.test.tsx`: novo teste que verifica `hero-table-preview`,
  presença de "Fig. 01 · Mesa revelada", nick "Você" e "Mediana", ≥6 valores Fibonacci
  revelados.

Decisões:

- Mantive a moldura editorial (chip "FIG. 01", badge mono "MEDIANA 5", rodapé mono)
  para preservar a metáfora de "revista" — não troquei por uma ilustração genérica.
- 6 jogadores (não 8 como na MockTable do ABOUT) para caber no espaço do hero e
  deixar a mediana visualmente limpa (5/5/5 + 3 + 8 + 8).
- Posições ajustadas após primeira renderização (Theo estava parcialmente escondido
  pelo chip superior — movido de top 8% para 18%).
- O `Ø` sumiu do hero mas continua aparecendo no topo (logo "Pointly") e na nav.
  A marca permanece intacta.

Verificação:

- `bun test apps/web/src/pages/landing.test.tsx` → 8/8 pass (incluindo o novo teste T1).
- Screenshot do hero após mudança mostra 6 cartas visíveis com valores 5/3/5/8/5/8,
  3 delas com borda mostarda (mediana 5), 1 com borda coral ("Você") e 1 com estrela
  mostarda (host Theo).
- Full-page screenshot em 1440x900 confirma que ABOUT (MockTable 8 jogadores),
  Capabilities, Dark showcase, CTA e Footer permanecem intactos — sem regressão.

## T2 — Métrica "0 Cadastros" ambígua

Issue: #24
Status: DONE (issue fechada via Closes #24 no PR)
Mudanças:

- `apps/web/src/pages/landing.tsx`: removido `{ num: "0", label: "Cadastros" }` de
  `STATS`; adicionados 3 stats numéricos inequívocos
  (`12 Assentos`, `60s P/ decidir`, `0s Setup`); adicionado selo editorial
  `data-testid="selo-sem-cadastro"` em coral (`✓ SEM CADASTRO · SEM E-MAIL`).
  Anel de stat élargido de 40px para 56px para acomodar "0s" / "60s".
- `apps/web/src/pages/landing.test.tsx`: 2 novos testes — um verifica que "Cadastros"
  não aparece mais como label numérico e que o selo está presente; outro garante
  que os 3 stats restantes (Assentos, Decidir, Setup) são inequívocos.

Decisões:

- Optei pelo caminho (a) do spec: o claim "sem cadastro" virou **selo**, não número.
  O número "0" continua na barra de stats mas com label **"Setup"** (zero segundos
  de setup) — inequívoco.
- Selo em coral com fundo `bg-coral/10` e borda `border-coral/30` para se destacar
  sem competir com o CTA coral principal "Criar sala".
- Mantive 3 itens na barra de stats para preservar ritmo visual; troquei o conteúdo,
  não a estrutura.

Verificação:

- `bun test src/pages/landing.test.tsx` → 10/10 pass (2 novos testes T2 inclusos).
- Screenshot 1440x900 mostra: stats row com `12 ASSENTOS / 60s P/ DECIDIR / 0s SETUP`,
  selo `✓ SEM CADASTRO · SEM E-MAIL` em coral logo abaixo.
- T1 (preview da mesa) intacto: 6 cartas visíveis com mediana 5 destacada.

## T3 — Open-source escondido no footer

Issue: #25
Status: DONE (issue fechada via Closes #25 no PR)
Mudanças:

- `apps/web/src/pages/landing.tsx`: adicionado selo `[ GITHUB ↗ ]` no topo metadata
  strip (visível sem rolar), ao lado de "PLANNING POKER EFÊMERO". Selo é um
  `<a target="_blank" rel="noopener noreferrer">` apontando para
  `https://github.com/Heldinhow/pointly`, com ícone SVG do GitHub em
  `ink-faint` e hover para `coral`. `data-testid="selo-github-header"`.
- `apps/web/src/pages/landing.test.tsx`: novo teste T3 verifica presença do selo,
  tag `<a>`, href para github.com, `target="_blank"`, e que está visível
  sem rolar (`getBoundingClientRect().top < 100`).

Decisões:

- Coloquei o selo no **top metadata strip** (não no sticky nav) para preservar o
  "Planning Poker Efêmero" como texto editorial e dar respiro ao botão coral
  "Criar sala" na nav. O selo compete visualmente com o claim "PLANNING POKER
  EFÊMERO" no mesmo nível tipográfico, mantendo a densidade editorial.
- Escondi "PLANNING POKER EFÊMERO" em viewports < lg para priorizar o selo GitHub
  em telas médias (mobile-first visibility do link open-source).
- Brackets `[ ... ]` ao redor de "GITHUB ↗" mantém a linguagem editorial de
  "peça numerada" da revista (mesmo padrão usado em "FIG. 01", "MÉDIA 6.25").

Verificação:

- `bun test src/pages/landing.test.tsx` → 11/11 pass (novo teste T3 incluso).
- Screenshot 1440x900 confirma selo `⊙ [ GITHUB ↗ ]` no canto superior direito,
  visível sem rolar; T1 e T2 intactos.
- Hover state não verificado por screenshot mas testado via classes Tailwind
  (`hover:border-coral hover:text-coral`).

## T4 — Footer "Produto" incompleto

Issue: #26
Status: DONE (issue fechada via Closes #26 no PR)
Mudanças:

- `apps/web/src/pages/landing.tsx`: coluna "Produto" do footer ganhou 3 itens
  novos:
  - **Roadmap** (`<a href="#como-funciona">` ancorando à seção)
  - **Changelog** (`<a target="_blank" href="https://github.com/Heldinhow/pointly/releases">`)
  - **Preços — grátis para sempre** (`<span>` em `text-ink-faint` com `cursor-default`
    e `title` explicando a política — selo editorial, não link)
  - **Contato** (mantido).
- `apps/web/src/pages/landing.test.tsx`: novo teste T4 verifica presença de
  Roadmap, Changelog, Preços e Contato.

Decisões:

- 4 itens na coluna (3 novos + Contato) equilibram com "Pointly" (3 itens) e
  "Código Aberto" (parágrafo longo). Densidade visualmente comparável.
- "Preços — grátis para sempre" como **selo** (não link) reforça a identidade
  editorial e comunica o claim sem precisar de página de preços — o produto é
  genuinamente grátis.
- Changelog aponta para o GitHub Releases (não para arquivo local) — mantém
  rastreabilidade real.
- Roadmap usa âncora `#como-funciona` como placeholder honesto (não inventei
  rota fake `/roadmap`); usuário pode expandir no futuro.

Verificação:

- `bun test src/pages/landing.test.tsx` → 12/12 pass (novo teste T4 incluso).
- Screenshot do footer mostra as 3 colunas: Pointly (3), Produto (4), Código
  Aberto (parágrafo) — densidade comparável, nenhuma coluna parece vazia.
- T1, T2, T3 intactos: hero (preview mesa + selo Sem cadastro + selo GitHub no topo)
  verificados visualmente.

## T5 — Navegação persistente ausente

Issue: #27
Status: DONE (issue fechada via Closes #27 no PR)
Mudanças:

- `apps/web/src/pages/landing.tsx`: adicionado dropdown "Sumário" (`data-testid="toc-toggle"`)
  no sticky nav, ao lado do logo "Pointly". Ao clicar, abre um menu
  (`data-testid="toc-menu"`) com 5 entradas (01 INTRODUÇÃO, 02 COMO FUNCIONA,
  03 CAPACIDADES, 04 FLUXO DE VOTO, 05 COMEÇAR). Cada entrada é um botão que
  dispara `scrollIntoView({ behavior: 'smooth' })` para a seção correspondente.
- IDs adicionados às seções: `#como-funciona` (já existia), `#para-times` (já existia),
  `#capabilidades`, `#fluxo-de-voto`, `#cta-final`.
- Estado `tocOpen` controlado por `useState`; clique fora / em item fecha o menu.
- `apps/web/src/pages/landing.test.tsx`: 2 novos testes T5 — um verifica que o toggle
  abre/fecha e mostra as 5 entradas; outro garante que os IDs das seções existem.

Decisões:

- Optei por **dropdown** (não por índice lateral fixo) para preservar a metáfora
  "revista, role e leia": o índice só aparece quando o usuário o invoca, evitando
  clutter visual permanente.
- Estilo: roman numeral em itálico coral (mesma linguagem dos SectionRules),
  label mono uppercase, arrow `↗` indicando salto. Combina com o tom editorial.
- Escondi o toggle em viewports < lg para priorizar o CTA "Criar sala" em mobile
  (T8 vai ajustar mobile separadamente).
- Guard contra `scrollIntoView` undefined (jsdom) para não quebrar em test
  environments — o typeof check cai pra no-op se não houver.

Verificação:

- `bun test src/pages/landing.test.tsx` → 14/14 pass (2 novos testes T5 inclusos).
- Screenshot do TOC aberto mostra as 5 entradas com estilo consistente.
- Screenshot do estado fechado mostra "SUMÁRIO ▾" discreto ao lado do logo.
- T1, T2, T3, T4 intactos: hero (preview mesa), stats + selo "Sem cadastro",
  selo GitHub no topo, footer com 4 itens na coluna Produto.

## T6 — Contraste de texto secundário (WCAG AA)

Issue: #28
Status: DONE (issue fechada via Closes #28 no PR)
Mudanças:

- `tests/e2e/a11y-contrast.spec.ts`: novo teste E2E que carrega a home e roda
  axe-core com tags `wcag2a, wcag2aa, wcag21a, wcag21aa`; **falha se houver
  qualquer violação de `color-contrast`**.
- `apps/web/src/lib/contrast.test.ts`: novo teste unitário (22 testes) que
  calcula ratios WCAG 2.1 entre os tokens Atelier Zero como regression guard
  contra mudanças nos valores de cor.
- Verificação manual via script standalone (`/tmp/contrast-tokens.js`) cobrindo
  todas as combinações fg/bg.

Decisões:

- **axe-core é a fonte de verdade runtime** (per spec: "axe-core ou Lighthouse
  a11y"). O teste E2E é o gate oficial; o unit test é regression guard.
- axe-core reporta **0 violações de contraste** na home em 1440x900.
- 3 outras violações reportadas pelo axe (heading-order no footer h4, falta de
  `<main>` landmark, side-rails sem landmark) **não são escopo de T6** (T6 é
  contraste); ficam como observações registradas para possível follow-up.

## T7 — Estado vazio da sala (esperando jogador)

Issue: #29
Status: DONE (issue fechada via Closes #29 no PR)
Mudanças:

- `apps/web/src/components/ui/ellipse.tsx`: nova prop `pulseWhenEmpty` que
  adiciona classe `ellipse-pulse` no `<ellipse>` SVG quando ativa e troca
  o `aria-label` para "Mesa da rodada — aguardando jogadores".
- `apps/web/src/index.css`: nova animação `@keyframes ellipse-pulse`
  (opacity 0.7→1, stroke-width 1→1.5) com 2.4s ease-in-out infinite;
  respeita `@media (prefers-reduced-motion: reduce)`.
- `apps/web/src/pages/arena.tsx`: passa `pulseWhenEmpty={isOnlyPlayer}`
  para `<Ellipse>` — elipse pulsa quando só VOCÊ está na sala.
- `apps/web/src/lib/use-arena-loop.ts`: timer (ticker cliente) agora
  exige `sala.players.length >= 2` antes de decrementar. Sala solo: timer
  fica parado em 60s até outro jogador entrar.
- `apps/web/src/components/ui/ellipse.test.tsx`: 2 novos testes para
  `pulseWhenEmpty`.
- `apps/web/src/pages/arena.test.tsx`: 2 novos testes T7 (sala solo =
  ellipse-pulse presente; sala com 2+ = ausente).

Decisões:

- **Pulse na elipse** em vez de placeholders fantasmas (a outra opção do
  spec). Placeholders exigiriam renderizar 11 assentos vazios com SVG/React,
  o que adicionaria ruído visual e código. O pulse é sutil, comunica "vivo"
  sem competir com EmptyOverlay textual e RevealButton "Aguardando 1 jogador…".
- **Removi** o "ESPERANDO JOGADORES" central que tinha adicionado na
  iteração 1 — era redundante com EmptyOverlay ("AGUARDANDO PRIMEIRO
  JOGADOR") e RevealButton ("Aguardando 1 jogador…"). Mantive só o pulse.
- **Timer não decrementar** é a regra documentada: sala solo não tem
  ninguém para votar, então a contagem regressiva pareceria bug. Server
  continua sendo source of truth (ADR-002) — `room_state` a cada 10s
  reconcilia qualquer drift; quando o 2º jogador entra, timer começa
  a decrementar normalmente.
- **`prefers-reduced-motion`** desabilita o pulse (motion safety, requisito
  já existente do index.css).

Verificação:

- `bun run --filter web test src/pages/arena.test.tsx` → T7 2/2 pass.
- `bun run --filter web test src/components/ui/ellipse.test.tsx` → T7 2/2 pass.
- Playwright live: criou sala solo, timer ficou em **60** por 3+ segundos
  (não decrementou), elipse com classe `ellipse-pulse`. Screenshot confirma
  layout limpo sem overlap.
- T1–T6 intactos.

## T8 — Responsividade mobile (375px)

Issue: #30
Status: DONE (issue fechada via Closes #30 no PR)
Mudanças:

- `apps/web/src/pages/landing.tsx`: novo selo `data-testid="selo-github-mobile"`
  no sticky nav (visível em `<lg`, oculto em ≥lg para não duplicar com
  o selo do top metadata strip). Garante que o link GitHub (T3) está
  acessível sem rolar também em viewport 375px (onde o top strip
  fica oculto via `hidden md:block`).
- `apps/web/src/pages/landing.test.tsx`: 2 novos testes T8.

Decisões:

- Side rails (texto vertical) já estavam `hidden xl:flex` (T-longo, não
  escopo deste item). Capacities já colapsavam para 1 coluna via
  `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (default mobile-first 1 col).
  CTAs já tinham `size="lg"` (48px altura ≥44px) e input/button code form
  ≥44px.
- **Não precisei mexer em layout principal** — o design system já tinha
  as propriedades mobile-first certas. Só faltava o selo GitHub no mobile.
- HeroTable preview já responsivo (aspect-square, max-w-[460px]); em 375px
  fica em 327x327 dentro do viewport sem overflow.

Verificação:

- `bun run --filter web test src/pages/landing.test.tsx` → 16/16 pass.
- Playwright live (375x812):
  - scrollWidth === clientWidth === 375 (zero overflow horizontal).
  - CTA "Criar sala" hero: 159x48px (≥44px touch target).
  - Input código: 128x44px; Botão Entrar: 108x44px.
  - HeroTable: 327x327px (cabe no viewport).
  - Selo "Sem cadastro": visível, right=238 < 375.
  - Selo "GitHub" mobile: visível em sticky nav.
- Screenshots 375x812 (top + full page): layout limpo, sem corte, sem
  rolagem lateral.
- T1–T7 intactos.

---

## Resumo Final — §4 do spec

**Branch de trabalho:** `ux/home-loop-t1-t8`
**Base inicial:** `main @ 8434543` → **Final:** `main @ c98980b`
**Total de commits:** 9 (1 bootstrap + 8 itens)

### DONE vs BLOCKED

- **DONE: 8/8** (100%)
- **BLOCKED: 0/8**

Todos os itens passaram no critério de aceite na primeira iteração (≤ N=4 limite do loop).
Apenas T1 necessitou iteração 2 para ajuste de posição (Theo estava parcialmente escondido
pelo chip superior do hero). T7 também iterei 1 vez dentro do limite (removi texto "ESPERANDO
JOGADORES" central por redundância com EmptyOverlay e RevealButton).

### Tabela T{N} | Issue #{M} | Status | Link

| Item | Issue | Status   | PR (merged) | Link                                                                 |
| ---- | ----- | -------- | ----------- | -------------------------------------------------------------------- |
| T1   | #23   | DONE     | PR #31      | <https://github.com/Heldinhow/pointly/issues/23>                       |
| T2   | #24   | DONE     | PR #32      | <https://github.com/Heldinhow/pointly/issues/24>                       |
| T3   | #25   | DONE     | PR #33      | <https://github.com/Heldinhow/pointly/issues/25>                       |
| T4   | #26   | DONE     | PR #34      | <https://github.com/Heldinhow/pointly/issues/26>                       |
| T5   | #27   | DONE     | PR #35      | <https://github.com/Heldinhow/pointly/issues/27>                       |
| T6   | #28   | DONE     | PR #36      | <https://github.com/Heldinhow/pointly/issues/28>                       |
| T7   | #29   | DONE     | PR #37      | <https://github.com/Heldinhow/pointly/issues/29>                       |
| T8   | #30   | DONE     | PR #38      | <https://github.com/Heldinhow/pointly/issues/30>                       |

Todas as 8 issues fechadas (não há nenhuma com label `blocked`).

### Arquivos alterados (diff geral: main 8434543 → main c98980b)

```text
CHANGELOG_HOME.md                           | +313 linhas (entrada por item + este resumo)
ISSUES_MAP.md                               | +22  linhas (mapeamento T{N} → #{M} → status)
apps/web/src/pages/landing.tsx              | +280 -51  (HeroTable, selo Sem cadastro, selo GitHub header+mobile, Sumário dropdown, footer Produto)
apps/web/src/pages/landing.test.tsx         | +115      (16 testes landing: T1, T2×2, T3, T4, T5×2, T8×2)
apps/web/src/pages/arena.tsx                | +3   -2   (Ellipse pulseWhenEmpty para T7)
apps/web/src/pages/arena.test.tsx           | +36       (2 testes T7: ellipse-pulse on/off)
apps/web/src/components/ui/ellipse.tsx      | +10  -4   (prop pulseWhenEmpty + aria-label dinâmico)
apps/web/src/components/ui/ellipse.test.tsx | +17       (2 testes T7: pulseWhenEmpty true/false)
apps/web/src/index.css                      | +25       (keyframes ellipse-pulse + reduced-motion guard)
apps/web/src/lib/use-arena-loop.ts          | +5        (timer exige length>=2)
apps/web/src/lib/contrast.test.ts           | +85       (22 testes regression guard tokens)
tests/e2e/a11y-contrast.spec.ts             | +40       (axe-core E2E WCAG 2.1 AA gate)
```

Total: **+942 / -66 linhas** em 12 arquivos.

### Antes vs Depois (1440x900, hero)

**Antes** (commit base `8434543`, Ø abstrato no hero):

![before](landing.png) — referência Pencil, ilustração Ø + selos FIG. 01 · ATELIER.

**Depois** (commit `c98980b`, hero com preview real da mesa):

- Ø removido do hero (mantido no logo e nav).
- HeroTable: 6 jogadores (Você/Maya/Aria/Theo-host/Lia/Ivo) em torno de elipse pontilhada,
  mediana 5 destacada em mostarda em 3 cartas, header chip "FIG. 01 · MESA REVELADA",
  badge "MEDIANA 5", rodapé mono "6 JOGADORES · 1 HOST / MOSTARDA = MEDIANA".
- Stats row: `12 ASSENTOS / 60s P/ DECIDIR / 0s SETUP` (numéricos inequívocos).
- Selo "✓ SEM CADASTRO · SEM E-MAIL" em coral abaixo.
- Selo "⊙ [ GITHUB ↗ ]" no top metadata strip (visível sem rolar).
- Dropdown "SUMÁRIO ▾" no sticky nav com índice de revista (01-05).
- Sticky nav também com botão "Criar sala" coral.

**Mobile 375x812:** selo "GitHub" no sticky nav (espelha top strip), layout sem overflow,
touch targets ≥44px.

### Verificação agregada

- `bun run --filter web test src/` → 312 pass, 6 fail pré-existentes (EmptyOverlay +
  Arena shell, não relacionadas ao home loop).
- `bun run --filter e2e test a11y-contrast.spec.ts` → 1/1 pass (axe-core 0 violações).
- `bun run --filter web test src/lib/contrast.test.ts` → 22/22 pass (regression guard).
- `bun run --filter web test src/pages/landing.test.tsx` → 16/16 pass (T1, T2×2, T3, T4, T5×2, T8×2).
- `bun run --filter web test src/components/ui/ellipse.test.tsx` → 6/6 pass.
- axe-core live (home 1440x900) → 0 color-contrast violations.
- Playwright live (375x812) → scrollWidth===clientWidth===375 (zero overflow).

### Observações fora do escopo do loop

- 3 violações axe-core não-constraste (heading-order, landmark-one-main, region) permanecem —
  fora do escopo T6 (que é contraste); registradas como possível follow-up futuro.
- 6 testes pré-existentes em `arena.test.tsx` (EmptyOverlay + Arena shell) falham desde o main
  base — não foram introduzidos nem corrigidos pelo loop.
