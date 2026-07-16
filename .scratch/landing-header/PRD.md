# Landing header refactor — Pointly

Status: ready-for-agent

## Context

A landing do Pointly (`apps/web/src/pages/landing.tsx`) já tem um sticky nav
com botão "Criar sala" coral, mas o comportamento não bate com a referência
que o usuário quer seguir (neo-mirai) e a lógica de visibilidade do CTA
coral introduz regressões sutis:

1. É `position: sticky`, não `fixed`. O efeito "materializa ao rolar" não
   existe — o header sempre aparece com a mesma cara.

2. Tem `IntersectionObserver` que esconde o CTA do header quando o CTA do
   hero entra em viewport (`heroVisible` → `opacity: 0`,
   `pointerEvents: none`, `aria-hidden`). Isso foi adicionado pra respeitar
   a regra "coral ≤1 CTA por viewport" do Atelier Zero, mas a regra só
   vale **dentro do mesmo fold visual** — não justifica esconder o CTA
   do header depois que o usuário rolou pra longe do hero.

3. Quando o usuário rola até a seção escura ("Escolhas secretas…") ou a
   CTA ribbon final, o CTA do header volta a aparecer — mas a referência
   visual pra aquele frame é outro CTA coral, criando dois botões
   coral simultâneos em viewport (viola a regra).

4. O campo de código de 4 letras está acoplado ao botão "Criar sala
   agora" no hero. Isso duplica informação: criar vs entrar são ações
   distintas, mas hoje aparecem como bloco único.

5. O `aria-hidden` + `tabIndex` swap baseado em `heroVisible` cria uma
   armadilha de foco pra usuários de teclado/screen reader quando o CTA
   some/aparece dinamicamente.

Helder pediu uma landing que siga o padrão neo-mirai: header fixo que
sempre mostra "Criar sala" durante o scroll, e quer resolver todos os
problemas levantados. Repo: `Heldinhow/pointly` (GitHub) ↔
`/Users/helder/last-chance/planning` (local). `AGENTS.md` no repo raiz.

## Sintomas / Problema

1. `apps/web/src/pages/landing.tsx:301-325` — sticky nav usa
   `sticky top-0 z-10` + `bg-bg/95` opaco sempre. Sem estado `is-scrolled`
   que o neo-mirai faz com `linear-gradient → var(--paper)` ao rolar.

2. `apps/web/src/pages/landing.tsx:229-241, 264-271, 312-324` —
   `useState(heroVisible)` + `IntersectionObserver` ligado só no CTA do
   hero (`heroCtaRef`) governa `navCtaStyle`. Resultado:
   - Em viewport inicial: CTA header visível, CTA hero visível → 2 CTAs
     coral simultâneos (viola regra Atelier Zero "coral ≤1 CTA por
     viewport" se contarmos o header sticky como "em viewport").
   - Quando hero sai de viewport (scroll ~600px): CTA header some,
     usuário fica sem acesso rápido a "Criar sala" até voltar pro topo.
   - Quando CTA ribbon final entra em viewport (scroll profundo): CTA
     header reaparece + CTA coral da ribbon visível → 2 CTAs coral.

3. `apps/web/src/pages/landing.tsx:318-320` — `aria-hidden={heroVisible}`
   + `tabIndex={heroVisible ? -1 : 0}` é swap dinâmico de acessibilidade.
   Leitor de tela ou usuário de teclado pode perder o foco do botão
   silenciosamente durante o scroll.

4. `apps/web/src/pages/landing.tsx:387-423` — campo de código + botão
   "Entrar" formam bloco monolítico no hero. Não dá pra colar um código
   recebido por DM sem rolar até o topo.

5. `apps/web/src/pages/landing.tsx:657-666` — segundo "Criar sala agora"
   coral na CTA ribbon final. Hoje: hero CTA + sticky CTA + ribbon CTA
   = até 3 CTAs coral por página.

## Solution

Refatorar o sticky nav existente em três movimentos:

**(a) Converter `sticky` → `fixed`** com transição de estilo baseada em
scroll, igual neo-mirai:
- Topo da página (`scrollY <= 8`): fundo transparente (deixa o hero
  aparecer sob o header).
- Após scroll: fundo `var(--paper-warm)` + border-bottom 1px +
  shadow `--bone` com opacidade reduzida.

**(b) Remover a lógica `heroVisible` por completo.** O CTA do header
fica sempre visível e sempre interativo. A regra "coral ≤1 CTA por
viewport" do Atelier Zero passa a ser reinterpretada:
- Hero CTA continua coral sólido (`variant="coral"`, `size="lg"`) — é o
  "primary" do fold inicial.
- Header CTA vira outline coral (`border-coral`, `text-coral`, fundo
  transparente). Visualmente distinto do coral sólido, mas ainda lê
  como CTA.
- CTA ribbon final permanece coral sólido (`variant="coral"`, `size="lg"`)
  — é o "primary" do fold final.
- Em qualquer fold, no máximo **um** coral sólido aparece (hero no
  topo, ribbon no fundo, header sempre outline). Isso satisfaz a regra
  "coral ≤1 CTA sólido por fold" — leitura correta da regra original.

**(c) Mover o campo de código de 4 letras pro header (desktop).** No
hero fica só o botão "Criar sala agora" coral + subcopy. O header passa
a ter `<Logo /> + <CodeInput /> + <CriarSalaButton outline>`. Em mobile
(`<768px`), o input fica no hero (a regra CSS atual já esconde o header
inteiro em mobile).

**Decisão sobre variant do botão do header:** outline coral
(border-2 + text-coral + fundo `paper-warm` translúcido). Razão:
mantém o reconhecimento de CTA sem competir com o hero coral sólido.
Variante nova no `Button` (`apps/web/src/components/ui/button.tsx`)
chamada `coral-outline`.

**Decisão sobre layout do header:** flex `justify-between items-center`,
não grid `1fr auto auto`. Razão: input com `flex-1 max-w-[180px]` casa
com as proporções da referência neo-mirai e evita alinhamento estranho
em viewports intermediários. Sem nav central (não faz sentido numa
landing de ferramenta dev que tem 1 página).

## Issues

Ordem **estrita** — cada issue depende da anterior. As dependências
abaixo correspondem ao campo `Depends on:` em cada issue.

- **01 — extract-site-header-component** — Extrair o sticky nav atual
  (`landing.tsx:301-325`) pra `apps/web/src/components/site-header.tsx`
  com a mesma markup. Sem mudar comportamento ainda. Permite teste
  isolado e desbloqueia 02-04. *Depends on: nada.*

- **02 — is-scrolled-state-and-fixed-position** — Em `site-header.tsx`:
  trocar `sticky top-0` por `fixed top-0 z-20 left-0 right-0`,
  adicionar estado `is-scrolled` via scroll listener com throttle
  (`requestAnimationFrame`), fundo transparente no topo + paper-warm
  após scroll, border-bottom + shadow sutis no estado scrolled.
  Reduced-motion: ler `prefers-reduced-motion: reduce` e pular o toggle
  do state (header sempre no estado scrolled). Hero ganha
  `padding-top: var(--header-height)` pra não ficar sob o header.
  `--header-height: 64px` adicionado ao `:root`. *Depends on: 01.*

- **03 — remove-hero-visible-fade-out** — Em `landing.tsx`: remover
  `useState(heroVisible)`, `useEffect` com `IntersectionObserver`,
  `navCtaStyle`, `heroCtaRef`, e os atributos `aria-hidden`/`tabIndex`/
  inline style do Button do header. Adicionar variant `coral-outline` no
  `button.tsx` (escolha da opção (a) do issue). Trocar `variant="coral"`
  por `variant="coral-outline"` no Button do header. *Depends on: 02.*

- **04 — coral-outline-variant-completion-and-code-input-migration** —
  Em `site-header.tsx`: adicionar `<CodeInput />` inline entre logo e
  botão (mesma sanitização do hero: NFKD, alfanumérico, max 4 chars,
  uppercase, submit `navigate(\`/join?code=${cleanCode}\`)`). Em
  `landing.tsx`: remover o bloco `<form>` do hero (linhas 387-423), o
  "ou" divisor (linhas 376-385), o hint "código de 4 letras" (linhas
  424-429). Mobile (`<768px`): input do header escondido via
  `md:hidden`/`md:flex` Tailwind; input do hero **mantido** dentro de
  `<div className="md:hidden">` pra que mobile users ainda possam
  colar código. *Depends on: 03.*

## Não-objetivos

- **Não troca a estética editorial** (Atelier Zero). Mantém tokens,
  regras (coral ≤1 CTA sólido por fold, surface-noise obrigatório em
  todas as telas, mustard NUNCA CTA).
- **Não adiciona navegação central** ao header. Landing de ferramenta
  dev com 1 página não precisa.
- **Não mexe no servidor** (`apps/server/`), `packages/shared/`,
  `tailwind.config.ts` (só consome os tokens já mapeados).
- **Não move o header pra outras rotas.** Join, Arena, Full continuam
  sem header. Decisão do usuário no round anterior.
- **Não troca a variant do CTA da ribbon final.** Permanece coral
  sólido — é o "primary" do fold final, não compete com o CTA do
  hero (que está fora de viewport quando a ribbon está visível).
- **Não cria variante mobile do hero** com CTA reorganizado. O ponto
  é refatorar o header, não refazer o hero pra mobile. Mobile fica
  com input inline no hero + sem header.
- **Não adiciona animações elaborate entrance.** Sticky → fixed +
  scroll state é mudança comportamental, não estética. Sem stagger,
  sem reveal.
- **Não renomeia tokens existentes.** `var(--accent)` é `coral`,
  `var(--paper-warm)` é o fundo. Sem aliases novos.

## Verification

End-state checks que o agente roda antes de declarar done:

- `bun run --filter web typecheck` retorna 0.
- `bun run --filter web test` (bun test / Vitest) passa —
  `landing.test.tsx` continua passando porque `cta-nav-create-room`
  permanece no Button do header. Adicionar teste isolado pra
  `site-header.tsx` cobrindo: render default, callback `onCreateRoom`
  invocado no click, e (após 04) submit do código invoca
  `onJoinWithCode` com sanitização correta.
- `bun run --filter web build` (vite build) termina sem warning de
  Tailwind class purge (todas as classes `coral-outline:*` precisam
  estar em string literal, não dinâmica).
- Navegação manual em viewport 1440x900:
  - Topo: header transparente (logo Ø coral + "Pointly" à esquerda,
    campo XXXX + botão outline coral "Criar sala" à direita). Hero
    visível sob o header.
  - Após `scrollY > 8`: header ganha fundo paper-warm + border +
    shadow. Transição 240ms ease-out.
  - Em qualquer ponto do scroll, "Criar sala" sempre clicável e
    recebe foco de teclado (sem `tabindex="-1"`).
  - Colar "ABCD" no campo do header + Enter → navega pra
    `/join?code=ABCD`. Sanitização preservada (uppercase, alfanumérico).
  - Mobile (375x812): header não aparece (regra CSS existente).
    Hero mostra input de código inline + botão "Criar sala agora"
    coral.
- Lighthouse a11y score ≥95 (focus trap não pode quebrar — verificar
  com axe ou pa11y no CI).
- Grep guards:
  - `grep -rn "heroVisible\|heroCtaRef" apps/web/src` retorna vazio
    (depois de 03).
  - `grep -rn "sticky top-0" apps/web/src/pages/landing.tsx` retorna
    vazio (depois de 02).
  - `grep -rn "IntersectionObserver" apps/web/src/pages/landing.tsx`
    retorna vazio (depois de 03).

## Decisões locais (não re-decide durante implementação)

- **Variant nova no Button chama `coral-outline`**, não `coral-ghost` ou
  `outline-coral`. Combina com a convenção `<color>-<modifier>` já em
  uso (`coral-soft`, `coral-deep`).
- **Scroll threshold = 8px.** Suficiente pra não triggerar em
  overscroll elástico de trackpad, pequeno o bastante pra reagir
  antes do usuário notar. Não usar `IntersectionObserver` aqui —
  `scrollY` é O(1) com rAF throttle.
- **Header em mobile (<768px): header inteiro escondido.** Razão: a
  regra CSS existente em `index.css:223-227` (`.cta-sticky-nav { display:
  none !important }`) já esconde a CTA do header em mobile. Estender
  essa regra não é necessário — o input do hero é a porta de entrada
  para código no mobile, e a CTA do hero já é o "primary" do fold.
  Manter comportamento atual.
- **Asymmetric mobile/desktop pro input de código.** Desktop (≥768px):
  input no header. Mobile (<768px): input no hero (header inteiro
  escondido). Decisão: input vive sempre no hero (mobile) e no header
  (desktop), nunca nos dois ao mesmo tempo.
- **Sem variant `coral-outline` em mobile.** Mesmo botão do header,
  mesmo comportamento — mas como o header inteiro está escondido em
  mobile, a variant só aparece visualmente em desktop.

## ADR candidate

`docs/adr/NNNN-coral-cta-budget.md` — formalizar a interpretação de
"coral ≤1 CTA por viewport" como "≤1 CTA coral sólido por fold". Hoje a
regra tá só em comentário no `tailwind.config.ts` (linha 9-10) e no
`index.css` (linha 8-11). Vale um ADR depois que o agente terminar,
não antes.

## References

- Neo-mirai header CSS: `position: fixed`, `is-scrolled` toggle,
  `--header-height` para `scroll-margin-top` em sections.
- Atelier Zero tokens: `apps/web/src/index.css:23-37` (`:root` block).
- Regras Atelier Zero: `apps/web/tailwind.config.ts:9-10`,
  `index.css:8-11`, `AGENTS.md` (root).
- Sticky nav atual: `apps/web/src/pages/landing.tsx:301-325`.
- IntersectionObserver hero CTA: `apps/web/src/pages/landing.tsx:229-271`.
- Mobile hide rule: `apps/web/src/index.css:223-227`.
- Componente Button: `apps/web/src/components/ui/button.tsx`
  (precisa ser aberto pelo agente pra adicionar variant).
- Glossário de domínio (sala/host/player/código/etc): `CONTEXT.md` no
  repo raiz.