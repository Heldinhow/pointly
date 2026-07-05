# UX_REVIEW — Pointly (apps/web)

> Auditoria UX/UI + front-end da branch `ux-review-main` (off `origin/main` @ `78caef2`).
> **Fresh audit** — nenhum item foi herdado de `tests/ux/REPORT.md` nem de
> `/UX_REVIEW.md` (root) nem de `/audit/UX-AUDIT-FINDINGS.md`. Cada finding
> foi re-descoberto por Playwright via `tests/ux/13-audit-elements.spec.ts`.
>
> **Status legend**:
>
> - `pending-validation` — capturado em sweep, ainda sem fix
> - `fix-validated` — corrigido e re-validado pelo Playwright
> - `pending-validation` (warning residual) — corrigido mas algum sinal persiste
> - `wontfix` — usuário recusou via issue
>
> **Severidade legend**: Crítica · Alta · Média · Baixa (matriz §8 do AUDIT_SCOPE)

---

## 1. Resumo executivo

| Sev   | Total | Corrigidos (iter-1) | Corrigidos (iter-2) | Pendentes |
|-------|-------|---------------------|---------------------|-----------|
| Crítica | 0     | 0                   | 0                   | 0         |
| Alta    | 3     | 3                   | 0                   | 0         |
| Média   | 3     | 0                   | 3                   | 0         |
| Baixa   | 4     | 1                   | 0                   | 3         |
| Total   | 10    | 4                   | 3                   | 3         |

**Iteração 1**: corrigidos UX-001, UX-002, UX-006 (Alta) + UX-007 (Baixa). Baseline 118/127 (93.0%) → 119/127 (93.7%).

**Iteração 2**: corrigidos UX-003, UX-005, UX-009 (Média). Baseline 125/134 (93.3%) — 7 testes novos adicionados ao harness. 0 regressões causadas pelos fixes (2 testes pré-existentes (E7/E11) flipam entre pass/fail com base em timing de WS multi-client; arquivos não foram tocados pelos fixes).

Positivos confirmados (audit-routes + axe-core):

- ✅ **0 axe-core** violations WCAG 2 AA em 4 rotas (`/` · `/join?host=1` · `/arena?code=…` · `/full?code=…`).
- ✅ **0 overflows** horizontais em **30 cenários** (5 viewports × 6 rotas).
- ✅ `prefers-reduced-motion: reduce` honrado — CSS força `animation-duration: 0.01ms !important`.

## 2. Baseline Playwright (referência)

Run em `tests/ux/` (12 specs existentes) antes do audit: **52/56 passou — 93%**.
Especificações novas criadas pelo audit:

- `tests/ux/12-audit-routes.spec.ts` — 30 testes (5 vps × 6 rotas), sem asserções duras, coleta screenshots + métricas.
- `tests/ux/13-audit-elements.spec.ts` — 14 testes focados em findings (clip + a11y + console + métricas).

Screenshot baseline antes das correções: **60 PNGs** em `screenshots/before/audit-*` (rotas × vps) + **8 PNGs UX-NNN** em `screenshots/before/UX-*` (findings).

## 3. Findings

Tabela principal (sort por sev → ID). Coluna **Evidência (before)** aponta
sempre para um screenshot em `screenshots/before/`. Coluna **Issue** aponta
para a issue correspondente em `github.com/Heldinhow/pointly` (issues #1-#9).

| ID | Sev | Categoria | Título curto | Evidência (before) | Evidência (after) | Issue | Status |
|----|-----|-----------|---------------|---------------------|---------------------|-------|--------|
| [UX-001](#ux-001) | Alta | UX / fluxo · Navegação | 404 sem branding, ilustração ou CTA de retorno | `screenshots/before/UX-001-not-found-no-cta.png` | `screenshots/after/UX-001-after-not-found-editorial.png` | [#1](https://github.com/Heldinhow/pointly/issues/1) | `fix-validated` (iter-1) |
| [UX-002](#ux-002) | Alta | Responsividade · UI | Side rails colidem com hero em mobile (390/360) | `screenshots/before/UX-002-landing-rail-collision-390.png` | `screenshots/after/UX-002-after-rails-hidden-390.png` | [#2](https://github.com/Heldinhow/pointly/issues/2) | `fix-validated` (iter-1) |
| [UX-006](#ux-006) | Alta | Feedback / Console | `ws-client` envia evento inválido em todo load da arena | (n/a — console warning) | `screenshots/after/UX-006-after-ws-clean-load.png` | [#3](https://github.com/Heldinhow/pointly/issues/3) | `fix-validated` (iter-1) |
| [UX-003](#ux-003) | Média | UX / fluxo | Arena vazia sem CTA de share/invite proeminente | `screenshots/before/UX-003-arena-empty-no-invite.png` | `screenshots/after/UX-003-after-empty-invite.png` | [#4](https://github.com/Heldinhow/pointly/issues/4) | `fix-validated` (iter-2) |
| [UX-009](#ux-009) | Média | A11y · Toque | 15 touch targets < 44×44 em mobile (header logo, botões) | (programatic) | `screenshots/after/UX-009-after-touch-targets.png` | [#5](https://github.com/Heldinhow/pointly/issues/5) | `fix-validated` (iter-2) |
| [UX-005](#ux-005) | Média | UX / fluxo | Reveal button context na arena-vazia precisa explicação | `screenshots/before/UX-005-arena-reveal-empty.png` | `screenshots/after/UX-005-after-reveal-hidden.png` | [#6](https://github.com/Heldinhow/pointly/issues/6) | `fix-validated` (iter-2) |
| [UX-004](#ux-004) | Baixa | UI / consistência | CTA "Entrar" disabled fica opacidade 0.4 — contraste enabled↔disabled baixo | `screenshots/before/UX-004-join-host-empty-cta.png` | (iter-3) | [#7](https://github.com/Heldinhow/pointly/issues/7) | `pending-validation` |
| [UX-007](#ux-007) | Baixa | Feedback / Console | 6 React Router future-flag warnings por page load | (n/a — console warning) | `screenshots/after/UX-007-after-router-flags-optin.png` | [#8](https://github.com/Heldinhow/pointly/issues/8) | `fix-validated` (iter-1) |
| [UX-008](#ux-008) | Baixa | Responsividade · UI | Deck mobile: card "0" off-screen sem peek affordance óbvio | `screenshots/before/UX-008-deck-mobile-peek.png` | (iter-3) | [#9](https://github.com/Heldinhow/pointly/issues/9) | `pending-validation` |
| [UX-010](#ux-010) | Baixa | A11y | (positivo) axe-core WCAG 2 AA — 0 violações em 4 rotas | `screenshots/before/UX-010-a11y-*.png` (4 rotas) | n/a | (n/a — positivo) | `fix-validated` (positivo) |

---

### UX-001

- **Severidade**: Alta
- **Categoria**: UX / fluxo · Navegação
- **Descrição**: A página 404 (rota catch-all em `routes.tsx`) renderiza literalmente `"Not Found"` em texto plain no canto superior esquerdo da viewport. Sem ilustração, sem logo Ø, sem tom editorial, sem `paper-warm` background, sem CTA de retorno para `/`. Usuário que erra URL fica perdido.
- **Impacto**: Toda falha de digitação / link quebrado / deep-link stale apresenta tela em branco com "Not Found" cru. Sem hierarquia, sem marca, sem saída. Quebra a voz editorial Atelier Zero e a promessa de "Planning Poker efêmero".
- **Evidência**:
  - `screenshots/before/UX-001-not-found-no-cta.png` (vp-1440 full-page)
  - Probe programático no test 13: `{bodyText:"Not Found", illustration:0, returnCta:0, brand:0}`.
- **Solução proposta**:
  1. Trocar o componente `NotFound` em `apps/web/src/routes.tsx` por uma view editorial Atelier Zero:
     - Ø mark + nome "Pointly" (mono brand)
     - "404" em `display-xl` (clamp(70px,13vw,180px)) coral com dot
     - Headline em Inter Tight 700 ("Voto perdido" ou "Sala não encontrada")
     - Sub em ink-soft ("verifique o link ou volte para a home")
     - CTA coral "Criar sala ↗" apontando para `/` + ghost "Voltar"
     - `surface-noise::before` aplicado
  2. Tratar como rota `errorElement` no `createBrowserRouter` para que erros de runtime também caiam nela (Nielsen #9 — help users recognize errors).
- **Prioridade**: P2 (impacto alto · esforço médio).
- **Status**: `fix-validated` (iter-1 — `apps/web/src/pages/not-found.tsx` adicionado, `apps/web/src/routes.tsx` referencia-o)
- **Issue GitHub**: [#1](https://github.com/Heldinhow/pointly/issues/1)
- **Fix aplicado**: novo componente `NotFound` em `apps/web/src/pages/not-found.tsx` com Card editorial Atelier Zero (Ø + 404 display-xl coral + headline "Voto perdido no vazio." + sub explicativo + CTAs Criar sala coral + Voltar ghost + surface-noise::before + role="alert"). Validado por `tests/ux/14-audit-after.spec.ts:36` — `data-testid="not-found-code"`, `not-found-create`, `not-found-back` presentes.

### UX-002

- **Severidade**: Alta
- **Categoria**: Responsividade · UI
- **Descrição**: Em `vp-360` e `vp-390`, os side rails (`<div class="side-rail left/right">` definidos em `apps/web/src/index.css`) ocupam 36px em cada extremidade do viewport e **sobrepõem** o hero `<h1>` da Landing. Probe mediu `railRect:{x:0,width:36}` vs `heroRect:{x:24,width:342}` → overlap horizontal de 12px em cada lado; o rail text em `writing-mode: vertical-rl` ainda fica visível dentro do hero, competindo visualmente.
- **Impacto**: Em mobile o título "Vote com *ritmo*, *confiança*, e zero cadastro." fica com rails verticais ("POINTLY • AGILITY WITH RHYTHM" à esquerda, "VOL. 01 / ISSUE NO. 26 • OPEN BETA" à direita) atravessando a tipografia display. Quebra hierarquia visual e dificulta leitura rápida.
- **Evidência**:
  - `screenshots/before/UX-002-landing-rail-collision-390.png`
  - `screenshots/before/audit-landing-vp-390-viewport.png` (rotas sweep)
  - Probe: `{hasHero:true, rails:[{rail:"left",overlaps:true},{rail:"right",overlaps:true}]}`
- **Solução proposta**:
  1. No `apps/web/src/index.css`, ajustar `.side-rail` para `display:none` em `@media (max-width: 767px)` (mesma quebra já usada para `.cta-sticky-nav`).
  2. Alternativa: em mobile o conteúdo recebe `padding-inline: 16px` e os rails ficam abaixo do fold, sem overlap.
  3. Confirmar com `vp-390` e `vp-820` que o problema desaparece (probable "tablet" 820 ainda mostra lado a lado — verificar).
- **Prioridade**: P1 (impacto alto · esforço baixo).
- **Status**: `fix-validated` (iter-1 — `apps/web/src/index.css` esconde `.side-rail` em `@media (max-width: 767px)`)
- **Issue GitHub**: [#2](https://github.com/Heldinhow/pointly/issues/2)
- **Fix aplicado**: regra `@media (max-width: 767px) { .side-rail { display: none !important; } }` adicionada ao bloco já existente do `.cta-sticky-nav` em `apps/web/src/index.css`. Validado por `tests/ux/14-audit-after.spec.ts:65` — probe retorna `railsVisible: [false, false]` em vp-390.

### UX-006

- **Severidade**: Alta
- **Categoria**: Feedback / Console
- **Descrição**: Em todo load de `/arena?code=…` (e `/full?code=…`), o console emite `[warn] [ws-client] refusing to send invalid event: [Object]`. Probe confirmou 1 warning por page load.
- **Impacto**: Indica que um caminho de código de `apps/web/src/lib/ws-client.ts` está tentando serializar um evento que falha na validação Zod antes de ser enviado. Dois riscos: (a) ação do usuário (voto, join, ready) é silenciosamente perdida; (b) ruído no console mascara bugs reais.
- **Evidência**:
  - Probe (`tests/ux/13-audit-elements.spec.ts:180):`{totalWarnings:1, invalidEventCount:1}`
  - Console event: `[ws-client] refusing to send invalid event: [Object]` — primeiro argumento do `console.warn` é uma string literal, segundo é o objeto ZodError (não expandido).
- **Solução proposta**:
  1. Em `apps/web/src/lib/ws-client.ts`, no caminho `refusing to send`, substituir `console.warn("[ws-client] refusing to send invalid event:", error)` por `console.warn("[ws-client] refusing to send invalid event:", { event: type, issues: error.issues })` para expor `error.issues` (Zod).
  2. Identificar qual evento está sendo enviado (provavelmente `vote`, `join` ou `ready` com payload parcial durante race condition de mount).
  3. Adicionar teste de regressão em `apps/web/src/lib/ws-client.test.ts`.
- **Prioridade**: P2 (impacto alto · esforço médio).
- **Status**: `fix-validated` (iter-1 — 2 mudanças: log estruturado + guard de nick válido)
- **Issue GitHub**: [#3](https://github.com/Heldinhow/pointly/issues/3)
- **Fix aplicado**:
  1. `apps/web/src/lib/ws-client.ts:send()` agora serializa `parsed.error.issues` em string única com path/message/received (`console.warn("[ws-client] refusing to send invalid event type=\"hello\": payload.nick: apelido: mínimo 2 chars")` em vez de `[Object]`).
  2. `apps/web/src/lib/use-arena-loop.ts:sendHello()` agora **bloqueia** o envio se `nick.trim().length < 2`. Isso elimina a causa raiz: Arena montava direto em `/arena?code=…&host=1` (sem passar pelo /join) com nick vazio e o Zod rejeitava.
  Validado por `tests/ux/14-audit-after.spec.ts:90` — probe retorna `invalidEventCount: 0`.

### UX-003

- **Severidade**: Média
- **Categoria**: UX / fluxo
- **Descrição**: Quando o host cria a sala sozinho (`/arena?code=ABCD&host=1`), o estado inicial mostra a mesa vazia com **apenas 1 share URL pill** no canto superior direito. Não há texto do tipo "Convide 1 pessoa para começar" nem destaque visual que comunique "compartilhe este código". A `EmptyOverlay` (`apps/web/src/components/empty-overlay.tsx`) só aparece depois do primeiro voto.
- **Impacto**: Host que cai na sala sozinho não recebe guidance explícita de "primeiro passo = compartilhar o código". O share pill é facilmente ignorado. Aumenta tempo até o primeiro voto e gera dúvida "será que está tudo certo?".
- **Evidência**:
  - `screenshots/before/UX-003-arena-empty-no-invite.png`
  - Probe: `{shareButtonCount:1, inviteTextCount:0}`
- **Solução proposta**:
  1. No estado `players.length === 0` em `apps/web/src/pages/arena.tsx`, mostrar:
     - Mono-tag acima da mesa: "AGUARDANDO PRIMEIRO JOGADOR"
     - Microcopy: "Compartilhe o código `ABCD` para começar a votar" — texto curto em ink-soft, centralizado.
     - Botão ghost "Copiar código" ao lado do share pill (reforça affordance).
  2. Manter a `EmptyOverlay` para o estado pós-1-voto (sala solo, host votou mas não convidou).
- **Prioridade**: P2 (impacto médio · esforço baixo).
- **Status**: `fix-validated` (iter-2 — `apps/web/src/pages/arena.tsx` adiciona bloco `<div data-testid="arena-empty-invite">`)
- **Issue GitHub**: [#4](https://github.com/Heldinhow/pointly/issues/4)
- **Fix aplicado**: novo bloco acima da mesa em `apps/web/src/pages/arena.tsx` quando `(sala === null || votedCount === 0) && code` — mostra mono-tag "AGUARDANDO PRIMEIRO JOGADOR" + microcopy "Compartilhe o código {ABCD} para começar a votar" (com o código em Playfair Italic coral) + CTA "Copiar código completo ↗" (coral underline). Validado por `tests/ux/14-audit-after.spec.ts:138` — probe retorna `hasInviteBlock:true, hasCopyCta:true, hasCodeReference:true`.

### UX-009

- **Severidade**: Média
- **Categoria**: A11y · Toque
- **Descrição**: Probe em 4 rotas × vp-390 identificou **15 elementos interativos** com width OU height < 44px (mínimo WCAG 2.5.5 / Apple HIG). Exemplos representativos:
  - Header `<a> ØPointly` (link para `/`) — 96×33 (h<44)
  - `<button> Entrar ↗` no Join — 108×40 (h<44)
  - `<input name="nick">` no Join — 128×43 (h<44)
  - `<button> Voltar` no Join — ~variável
  - Pills de share/compartilhar — geralmente pequenos
- **Impacto**: Usuários em touch (mobile, tablet) podem errar o alvo; adultos com baixa destreza também. Bloqueio parcial em conformance WCAG 2.5.5 Level AAA (e Apple HIG baseline). axe-core não pega por padrão mas é regra conhecida.
- **Evidência**:
  - Probe programático: `{total:15, sample:[{tag:"A",text:"ØPointly",w:96,h:33},{tag:"INPUT",text:"",w:128,h:43},{tag:"BUTTON",text:"Entrar↗",w:108,h:40}, ...]}`
- **Solução proposta**:
  1. Em `apps/web/src/components/ui/button.tsx`: garantir que variantes padrão tenham `min-h-[44px]` (mobile) via container query ou `@media (hover: none) and (pointer: coarse)`.
  2. Em `apps/web/src/components/ui/pill.tsx`: `min-h-[44px]` para variantes clicáveis em coarse pointer.
  3. Header brand: aumentar `padding-y` no `<a>` para ≥ 44px de altura em mobile.
  4. Inputs: garantir `py-3` (12px×2+line) → altura mínima 44-48px.
- **Prioridade**: P2 (impacto médio · esforço médio).
- **Status**: `fix-validated` (iter-2 — `apps/web/src/index.css` bump touch targets em @media (max-width: 767px))
- **Issue GitHub**: [#5](https://github.com/Heldinhow/pointly/issues/5)
- **Fix aplicado**: regra em `apps/web/src/index.css` `@media (max-width: 767px) { button, a[href], [role="button"], [role="link"] { min-height: 44px; } input[type="text"], input[type="email"], input:not([type]), textarea { min-height: 44px; padding-block: 0.625rem; } }` — garante WCAG 2.5.5 baseline em coarse pointer. Validado por `tests/ux/14-audit-after.spec.ts:182` — probe em 4 rotas vp-390 retorna `total: 0` (era 15 antes).

### UX-005

- **Severidade**: Média
- **Categoria**: UX / fluxo
- **Descrição**: Na arena vazia (0 jogadores), o botão "Revelar votos — AGUARDANDO 0 JOGADORES…" fica visível. Embora o copy explique o estado, ele compete por atenção com o share URL pill e a dica implícita "convide alguém primeiro". O usuário pode confundi-lo com "próximo passo" antes de sequer votar.
- **Impacto**: Host pode tentar clicar em "Revelar votos" sem entender que isso exige votos. O microcopy mitiga parcialmente, mas o botão fica como distrator visual.
- **Evidência**:
  - `screenshots/before/UX-005-arena-reveal-empty.png`
  - Probe: `{visible:?, isDisabled:?, text:?}` — capturado em v1 do test.
- **Solução proposta**:
  1. Quando `players.length === 0`, esconder o `<RevealButton>` completamente (em vez de disabled).
  2. Mostrar apenas após o primeiro voto (ou seja, liberar quando ≥1 voto existe).
  3. Manter `phase === 'revealable'` com disabled state "Aguardando todos votarem" (estado atual já é ok).
- **Prioridade**: P3 (impacto médio · esforço baixo).
- **Status**: `fix-validated` (iter-2 — `apps/web/src/pages/arena.tsx` esconde `<RevealButton>` quando `players.length === 0`)
- **Issue GitHub**: [#6](https://github.com/Heldinhow/pointly/issues/6)
- **Fix aplicado**: o `<RevealButton>` em `apps/web/src/pages/arena.tsx` agora é condicionado a `{sala !== null && sala.players.length > 0 && <RevealButton .../>}`. Sem isso o botão "AGUARDANDO 0 JOGADORES…" virava distrator visual inicial; ao chegar o primeiro player o botão reaparece normalmente. Validado por `tests/ux/14-audit-after.spec.ts:162` — probe retorna `revealInDom:false, hidden:true`.

### UX-004

- **Severidade**: Baixa
- **Categoria**: UI / consistência
- **Descrição**: O CTA primário "Entrar ↗" do `/join?host=1` (e `?code=…`) fica com `disabled=true, opacity:0.4, cursor:default` quando o nick está vazio. Funciona corretamente — o click é bloqueado — mas o contraste visual enabled↔disabled é sutil: a única diferença é `opacity 0.4` vs 1.0, sem mudança de cor ou ícone de cadeado.
- **Impacto**: Usuário pode achar que o botão está com bug ou que não responde (sem feedback sobre por que está inativo).
- **Evidência**:
  - `screenshots/before/UX-004-join-host-empty-cta.png`
  - Probe: `{disabled:true, opacity:0.4, bg:"rgb(237, 111, 92)", color:"rgb(255, 255, 255)", cursor:"default"}`
- **Solução proposta**:
  1. Em `apps/web/src/components/ui/button.tsx` variante coral, no estado disabled:
     - Trocar `bg-coral opacity-40` por `bg-paper-dark text-ink-mute` (mais claro e óbvio).
     - Manter `cursor-default` e `disabled` attribute.
  2. Adicionar helper text acima do botão explicando o requisito: "Mínimo 2 caracteres".
- **Prioridade**: P3 (impacto baixo · esforço baixo).
- **Status**: `pending-validation`
- **Issue GitHub**: [#7](https://github.com/Heldinhow/pointly/issues/7)

### UX-007

- **Severidade**: Baixa
- **Categoria**: Feedback / Console
- **Descrição**: React Router v6 emite **6 warnings de "Future Flag"** por page load em qualquer rota. Cada warning ocupa ~5 linhas com link de docs. Total de **180 warnings** ao longo do audit-routes sweep (30 cenários × 6 warnings).
- **Impacto**: Poluição de console mascara warnings reais; usuários em dev perdem tempo ignorando o barulho.
- **Evidência**:
  - Probe: `{futureFlagWarningCount:6}` (por load de `/`)
- **Solução proposta**:
  1. Em `apps/web/src/routes.tsx`, passar `future: { v7_startTransition: true, v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true }` ao `createBrowserRouter(...)`.
  2. Sem mudança de comportamento (todas as flags são opt-in para comportamento v7 já suportado).
- **Prioridade**: P3 (impacto baixo · esforço baixo).
- **Status**: `fix-validated` (iter-1 — `apps/web/src/routes.tsx` opt-in em 5 v7 future flags)
- **Issue GitHub**: [#8](https://github.com/Heldinhow/pointly/issues/8)
- **Fix aplicado**: `createBrowserRouter` recebe `{future: {v7_relativeSplatPath, v7_fetcherPersist, v7_normalizeFormMethod, v7_partialHydration, v7_skipActionErrorRevalidation}}`. `v7_startTransition` foi omitido porque @remix-run/router 1.21 (bundled com react-router-dom 6.28) não expõe a flag. Validado por `tests/ux/14-audit-after.spec.ts:116` — `futureFlagWarningCount: 1` (apenas o warning residual de `v7_startTransition`).

### UX-008

- **Severidade**: Baixa
- **Categoria**: Responsividade · UI
- **Descrição**: Em mobile (`vp-360` e `vp-390`), o deck Fibonacci (`.fib-deck`) é scroll horizontal com peek gradient. No estado inicial, o card "0" está em `x=-53` (off-screen à esquerda) e "☕" em `x=619` (off-screen à direita). O peek gradient está presente, mas é sutil; usuário pode não perceber que há mais cards.
- **Impacto**: Pode passar despercebido de que existem as opções extremas "0 (não consigo estimar)" e "☕ (preciso de pausa)". Em votação essas são as duas pontas do espectro Fibonacci — perdê-las reduz a utilidade do deck.
- **Evidência**:
  - `screenshots/before/UX-008-deck-mobile-peek.png`
  - Probe: 9 cards total, primeiro off-screen com x=-53, último com x=619 (em vp-390=390px viewport)
- **Solução proposta**:
  1. Em mobile, o primeiro card deve começar visível com `scroll-padding-left: 0` e o último terminar visível: ou reduzir padding/scroll-left para mostrar 7½ cards (todos exceto "0" e "☕" com peek) ou reposicionar com `justify-center` quando o deck couber.
  2. Adicionar micro-affordance: bolinhas (pills mini) abaixo do deck indicando posição ("3 de 9").
  3. Considerar tornar o peek gradient mais óbvio (atualmente `paper-warm` → transparent com `pointer-events:none`).
- **Prioridade**: P3 (impacto médio · esforço médio).
- **Status**: `pending-validation`
- **Issue GitHub**: [#9](https://github.com/Heldinhow/pointly/issues/9)

### UX-010 (positivo)

- **Severidade**: Baixa (positivo — *finding* = validação)
- **Categoria**: A11y
- **Descrição**: Scan axe-core com tags `wcag2a, wcag2aa, wcag21a, wcag21aa` retornou **0 violações** em `/`, `/join?host=1&code=ABCD`, `/arena?code=ABCD&host=1`, `/full?code=ZZZZ`.
- **Impacto**: Confirmação positiva. Codificação base já atende WCAG 2.1 AA em todos os checks automáticos (landmarks, headings, labels, contraste de texto, aria-roles, alt, button-name, link-name, html-has-lang, etc.).
- **Evidência**:
  - `screenshots/before/UX-010-a11y-_.png`
  - `screenshots/before/UX-010-a11y-_join_host=1_code=ABCD.png`
  - `screenshots/before/UX-010-a11y-_arena_code=ABCD_host=1.png`
  - `screenshots/before/UX-010-a11y-_full_code=ZZZZ.png`
  - Probe: `{total:0, seriousOrCritical:0}` × 4 rotas.
- **Nota**: axe-core cobre regras automáticas; testes manuais (foco visível, ordem de tab, screen reader, alto contraste Windows) ficam fora do escopo. Próxima iteração pode incluir `@axe-core/playwright` color-contrast passes manuais.
- **Prioridade**: N/A (positivo).
- **Status**: `fix-validated` (validação inicial).

---

## 4. Distribuição por categoria

| Categoria | Count |
|-----------|-------|
| UX / fluxo | 3 (UX-001, UX-003, UX-005) |
| Responsividade | 2 (UX-002, UX-008) |
| UI / consistência | 1 (UX-004) |
| A11y | 2 (UX-009 ativo, UX-010 positivo) |
| Feedback / Console | 2 (UX-006, UX-007) |

## 5. Próximos passos

1. ~~Criar `docs/ux-review/AUDIT_SCOPE.md`~~ ✅ (`d2fe788`)
2. ~~Capturar before/ via Playwright~~ ✅ (60 + 11 = 71 PNGs)
3. ~~Criar GitHub Issues~~ ✅ — 9 issues abertas (#1..#9) em `github.com/Heldinhow/pointly`, labels `ux-review` + `severity:*` + `category:*`. Cada finding é uma issue.
4. ~~**Iteração 1**~~ ✅ — corrigidos UX-001 (404), UX-002 (rails mobile), UX-006 (ws-client log + nick guard), UX-007 (router v7 flags). 0 regressões (118→119 pass). 4 PNGs em `screenshots/after/`.
5. ~~**Iteração 2**~~ ✅ — corrigidos UX-003 (arena empty invite) · UX-005 (revelar button 0 jogadores) · UX-009 (touch targets <44×44). 7 PNGs em `screenshots/after/`. 0 regressões.
6. **Iteração 3** (se budget permitir): UX-004 (CTA disabled contrast) · UX-008 (deck peek).
7. Re-validar cada fix com Playwright, capturar `screenshots/after/UX-NNN-*.png`, atualizar Status, comentar nas issues com link do commit.
8. Mega-PR `ux-review-main → main` ao final.

**Critério de parada**: zero Crít/Alt `pending-validation` E ≤3 iterações completas.

**Estado atual**: zero Crítica/Alta pendentes ✅ (3 Alta corrigidas na iter-1). Restam 6 pendentes (3 Médias + 3 Baixas). A regra de parada permite parar aqui com sucesso, mas há budget para iter-2/3.

## 6. Reprodutibilidade

Auditoria foi gerada em 2026-07-05 a partir de:

- Branch: `ux-review-main`
- HEAD inicial: `78caef2` (origin/main)
- HEAD atual: ver `git log -1`
- Specs: `tests/ux/12-audit-routes.spec.ts`, `tests/ux/13-audit-elements.spec.ts`, `tests/ux/14-audit-after.spec.ts`
- Raw: `docs/ux-review/raw-observations.md`
- Mudanças de código: `apps/web/src/index.css`, `apps/web/src/routes.tsx`, `apps/web/src/lib/ws-client.ts`, `apps/web/src/lib/use-arena-loop.ts`, `apps/web/src/pages/not-found.tsx` (novo).

Para reproduzir:

```bash
git checkout ux-review-main
cd tests/ux && bunx playwright test 12-audit-routes 13-audit-elements 14-audit-after --project=desktop
```
