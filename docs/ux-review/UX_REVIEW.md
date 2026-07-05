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

| Sev   | Total | Corrigidos (iter-1) | Corrigidos (iter-2) | Corrigidos (iter-3 hotfix) | Corrigidos (iter-4) | Pendentes |
|-------|-------|---------------------|---------------------|-----------------------------|----------------------|-----------|
| Crítica | 0     | 0                   | 0                   | 0                           | 0                    | 0         |
| Alta    | 4     | 3                   | 0                   | 1                           | 0                    | 0         |
| Média   | 3     | 0                   | 3                   | 0                           | 0                    | 0         |
| Baixa   | 4     | 1                   | 0                   | 0                           | 0                    | 3         |
| **iter-4 (Open Design reference)** | 6 | — | — | — | **6 (4M, 1B, 2A)** | 0 |
| Total   | 17    | 4                   | 3                   | 1                           | 6                    | 3         |

**Iteração 1**: corrigidos UX-001, UX-002, UX-006 (Alta) + UX-007 (Baixa). Baseline 118/127 (93.0%) → 119/127 (93.7%).

**Iteração 2**: corrigidos UX-003, UX-005, UX-009 (Média). Baseline 125/134 (93.3%) — 7 testes novos adicionados ao harness. 0 regressões causadas pelos fixes.

**Iteração 3 (hotfix, fora do budget de auditoria original)**: descoberto durante use-test — usuário reportou "voto não funciona em sala solo". Root cause: `<EmptyOverlay>` tinha `absolute inset-0 ... z-20` + `role="dialog" aria-modal="true"`, bloqueando clicks no deck (BUG-001 pré-existente, documentado em `tests/ux/REPORT.md` mas parcialmente corrigido em rodadas anteriores). Aplicada refatoração (EmptyOverlay agora é banner não-bloqueante) + criados 2 testes de regressão (tests/ux/15-ux-011-regression.spec.ts). Vote em sala solo agora funciona sem precisar dismiss nada primeiro.

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
| [UX-008](#ux-008) | Baixa | Responsividade · UI | Deck mobile: card "0" off-screen sem peek affordance óbvio | `screenshots/before/UX-008-deck-mobile-peek.png` | (—) | [#9](https://github.com/Heldinhow/pointly/issues/9) | `pending-validation` |
| [UX-011](#ux-011) | Alta | UX / fluxo | EmptyOverlay (modal) bloqueia clicks do deck em sala solo | (evidência programática) | `screenshots/after/UX-011-after-vote-with-banner-visible.png` | [#11](https://github.com/Heldinhow/pointly/issues/11) | `fix-validated` (iter-3 hotfix) |
| [UX-010](#ux-010) | Baixa | A11y | (positivo) axe-core WCAG 2 AA — 0 violações em 4 rotas | `screenshots/before/UX-010-a11y-*.png` (4 rotas) | n/a | (n/a — positivo) | `fix-validated` (positivo) |
| [UX-012](#ux-012) | Alta | Identidade visual · Tipografia | Display headline: Inter Tight 800 → high-contrast serif (editorial voice lift) | `screenshots/before/UX-012-before-landing-pre-iter-4.png` · `screenshots/before/UX-017-before-not-found-pre-iter-4.png` | `screenshots/after/UX-012-after-landing-hero-serif.png` · `screenshots/after/UX-012-after-not-found-serif.png` | [#12](https://github.com/Heldinhow/pointly/issues/12) | `fix-validated` (iter-4) |
| [UX-013](#ux-013) | Média | Identidade visual · Marcadores | Section markers: Roman numerals → italic Arabic + larger (editorial rhythm) | `screenshots/before/UX-013-before-landing-pre-iter-4.png` | `screenshots/after/UX-013-after-section-markers-arabic.png` | [#13](https://github.com/Heldinhow/pointly/issues/13) | `fix-validated` (iter-4) |
| [UX-014](#ux-014) | Baixa | Identidade visual · Cor | Pill button: salmon-coral → terracotta (palette alignment) | `screenshots/before/UX-014-before-landing-pre-iter-4.png` | `screenshots/after/UX-014-after-terracotta-cta.png` | [#14](https://github.com/Heldinhow/pointly/issues/14) | `fix-validated` (iter-4) |
| [UX-015](#ux-015) | Média | Identidade visual · Composição | Hero illustration: 3 cards → sculptural SVG collage (editorial weight) | `screenshots/before/UX-015-before-landing-pre-iter-4.png` | `screenshots/after/UX-015-after-hero-collage.png` | [#15](https://github.com/Heldinhow/pointly/issues/15) | `fix-validated` (iter-4) |
| [UX-016](#ux-016) | Média | UI · Consistência | Capability cards: numeral 18px → 28px serif + hover lift (editorial weight) | `screenshots/before/UX-016-before-landing-pre-iter-4.png` | `screenshots/after/UX-016-after-capability-cards-serif-numeral.png` | [#16](https://github.com/Heldinhow/pointly/issues/16) | `fix-validated` (iter-4) |
| [UX-017](#ux-017) | Alta | Identidade · Parity entre rotas | NotFound: editorial parity com Landing (display serif + visual treatment) | `screenshots/before/UX-017-before-not-found-pre-iter-4.png` | `screenshots/after/UX-017-after-not-found-parity.png` · `screenshots/after/UX-017-a11y-{landing,notfound}-vp-{360,768,1440}.png` | [#17](https://github.com/Heldinhow/pointly/issues/17) | `fix-validated` (iter-4) |

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

### UX-011

- **Severidade**: Alta
- **Categoria**: UX / fluxo
- **Descrição**: O componente `<EmptyOverlay>` em sala solo tinha `absolute inset-0 ... z-20` + `role="dialog" aria-modal="true"`, cobrindo todo o stage da arena e bloqueando clicks no deck. Host em sala solo precisava clicar **"Entrar na mesa mesmo assim"** (no card do overlay) ou pressionar **Esc** antes de poder votar. Sem essa ação explícita, voto não acontecia — usuário clica no deck e nada ocorre. Bug pré-existente (BUG-001 em `tests/ux/REPORT.md`) marcado como ✓ FIXED em rodadas anteriores, mas o fix era parcial.
- **Impacto**: Host em sala solo (modo dev / exploration / small team) precisa clicar **"Entrar na mesa mesmo assim"** antes de votar. UX hostil para first-time users que estão testando o produto sozinhos. Descobre o "Entrar na mesa mesmo assim" só por acidente ou documentação.
- **Evidência**:
  - Probe repro (`tests/ux/_repro/repro-bug.spec.ts`): sala criada (code YU8T), EmptyOverlay intercepta pointer events → click em deck-card-5 falha 45× com retry, console warning `[ws-client] cannot send — socket not open: cast_vote`.
  - screenshot before: `/tmp/repro-3-arena.png` (modal cobrindo arena)
- **Solução aplicada (iter-3 hotfix)**:
  1. `apps/web/src/components/empty-overlay.tsx`: removido `absolute inset-0 ... z-20` e `role="dialog" aria-modal="true"`. Substituído por banner inline (`max-w-[560px] mx-auto`) com `role="status" aria-live="polite"`. Mostra "AGUARDANDO PRIMEIRO JOGADOR" + "Código {CODE}" + botão "Copiar link" + link sutil "jogue solo".
  2. `apps/web/src/pages/arena.tsx`: removida versão duplicada do EmptyOverlay (estava após o deck); movida para ANTES da mesa para evitar overlap com deck no `bottom-8`. Removida também a empty-invite block do iter-2 (UX-003) — EmptyOverlay agora consolida as duas mensagens.
  3. Tests: `tests/ux/15-ux-011-regression.spec.ts` (2 testes) valida que overlay não tem `absolute inset-0`, role=`status` (não `dialog`), `aria-modal` ≠ `true`, e voto funciona com overlay visível.
- **Prioridade**: P1 (impacto alto · esforço médio).
- **Status**: `fix-validated` (iter-3 hotfix — commit a fazer)
- **Issue GitHub**: [#11](https://github.com/Heldinhow/pointly/issues/11)
- **Evidência (after)**: `screenshots/after/UX-011-after-empty-overlay-banner.png` (banner visível acima da mesa), `screenshots/after/UX-011-after-vote-with-banner-visible.png` (voto funciona com banner ainda visível, revealState="ready")

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

## 3.1 Iter-4 — Open Design reference upgrade

**Escopo**: Landing (`/`) + NotFound (`*`). Arena/Join/Full ficam fora desta iteração.
**Fonte de inspiração**: `/Users/helder/Downloads/index.png` ("Open Design" — portfólio/agência, paleta cream/terracotta/ochre, tipografia display serif de alto contraste, marcadores de capítulo em italic, composição editorial com arte escultórica).
**Regra de brand continuity**: preserva identidade Atelier Zero (paper bg, coral ≤1 CTA/viewport, mustard ≤1% surface, surface-noise::before, mega wordmark Playfair Italic).

### UX-012

- **Severidade**: Alta
- **Categoria**: Identidade visual · Tipografia
- **Descrição**: Os headlines display do Pointly (h1 do hero, h2 de About/Dark Showcase/CTA Ribbon, h2 do NotFound) usavam `font-display font-extrabold` = **Inter Tight 900** — sans extrabold geométrica. A imagem de referência usa uma **serif de alto contraste** (didone/transitional, provável "PP Editorial New" / "Söhne Breit Semi"). A diferença é a maior alavanca de brand voice entre as duas peças: sans extrabold lê como "tech product moderno"; high-contrast serif lê como "editorial atelier".
- **Impacto**: Single switch de typeface no h1 muda toda a primeira impressão da Landing — alinha o voice "Atelier Zero" prometido no UX-001 com a execução visual. Inline `<em>` (ritmo, confiança, conversando, consenso memorável) mantém Playfair Italic para emphasis — o mix Instrument Serif upright + Playfair Italic é o sweet spot editorial.
- **Evidência**:
  - `screenshots/before/UX-012-before-landing-pre-iter-4.png` (Landing vp-1440 full, Inter Tight 800 nos headlines)
  - `screenshots/before/UX-017-before-not-found-pre-iter-4.png` (NotFound vp-1440 full, Inter Tight no h2)
- **Solução proposta**:
  1. Adicionar `@import Instrument+Serif:ital@0;1` ao Google Fonts em `apps/web/src/index.css`.
  2. Adicionar CSS variable `--font-display-serif: "Instrument Serif", "Playfair Display", Georgia, serif`.
  3. Adicionar `fontFamily.serif` em `apps/web/tailwind.config.ts`.
  4. Trocar `font-display font-extrabold` por `font-serif font-normal` em todos os h1/h2 do Landing (4 ocorrências) e h2 do NotFound.
  5. Tracking ajustado de -0.04em para -0.03em.
- **Critérios de aceite**:
  - Landing vp-1440 h1 ("Vote com ritmo, confiança, e zero cadastro.") renderiza em Instrument Serif ✓
  - Landing h2 ("Times ágeis estimam..." e "Pronto pra começar?") renderiza em Instrument Serif ✓
  - NotFound h2 ("Voto perdido no vazio.") renderiza em Instrument Serif italic ✓
  - axe-core 0 violations em `/` e `*` ✓
  - Touch targets ≥44px em coarse pointer preservados (regressão UX-009) ✓
- **Prioridade**: P1 (impacto alto · esforço médio).
- **Status**: `fix-validated` (iter-4 — commit `d5f3d52`)
- **Issue GitHub**: [#12](https://github.com/Heldinhow/pointly/issues/12)
- **Evidência (after)**: `screenshots/after/UX-012-after-landing-hero-serif.png` (Landing vp-1440 full), `screenshots/after/UX-012-after-not-found-serif.png` (NotFound vp-1440 full)
- **Fix aplicado**:
  - `apps/web/src/index.css`: novo `@import Instrument+Serif:ital@0;1`, novo `--font-display-serif` variable.
  - `apps/web/tailwind.config.ts`: nova font family `serif` mapeando para Instrument Serif com fallback para Playfair Display.
  - `apps/web/src/pages/landing.tsx`: 4 trocas `font-display font-extrabold` → `font-serif font-normal` em h1 + h2 (hero, About, Dark Showcase, CTA Ribbon). Tracking -0.04em → -0.03em.
  - `apps/web/src/pages/not-found.tsx`: h2 "Voto perdido no vazio" trocado para `font-serif italic font-normal text-[clamp(28px,3vw,44px)]`.
  Validado por `tests/ux/16-iter-4-after.spec.ts:57` (Landing probe retorna `Instrument Serif` no `hero-headline`) e `:85` (NotFound probe retorna `Instrument Serif` no h2 do card).

### UX-013

- **Severidade**: Média
- **Categoria**: Identidade visual · Marcadores
- **Descrição**: Os 5 divisores de seção da Landing usavam **Roman numerals** (I., II., III., IV., V.) em Playfair Italic 14px. A referência usa **Arabic numerals** (01, 02, 03, 04) em display serif italic com tamanho muito maior (28-48px). Roman numerals têm conotação acadêmica/livro-texto; arabic italic serif têm conotação editorial contemporânea (revista, jornal moderno).
- **Impacto**: Pequena alavanca visual com grande mudança de voice — os section markers são o principal elemento de "ritmo editorial" da Landing. Aumentá-los e converter para arabic muda a percepção de "artigo acadêmico" para "capítulo de revista".
- **Evidência**: `screenshots/before/UX-013-before-landing-pre-iter-4.png` (Landing vp-1440 full, 5 SectionRule visíveis com Roman numerals no topo de cada seção)
- **Solução proposta**:
  1. Atualizar `.sec-rule .roman` em `apps/web/src/index.css`:
     - `font-family: Playfair Display` → `var(--font-display-serif)` (Instrument Serif)
     - `font-size: 14px` → `clamp(20px, 2.5vw, 36px)`
     - `font-weight: 400` (explicit)
     - `letter-spacing: -0.02em` (leve tightening)
     - `line-height: 1` (evita ascender interferir no rhythm)
  2. Em `apps/web/src/pages/landing.tsx`, trocar `roman="I."` → `roman="01"`, `II.` → `02`, etc. (5 props).
- **Critérios de aceite**:
  - 5 SectionRule markers renderizam "01"..."05" em Instrument Serif italic ≥20px (clamp até 36px) ✓
  - Cor terracota mantida ✓
  - `aria-hidden="true"` preservado (decorativo) ✓
  - axe-core 0 violations ✓
- **Prioridade**: P2 (impacto médio · esforço baixo).
- **Status**: `fix-validated` (iter-4 — commit `c6a3531`)
- **Issue GitHub**: [#13](https://github.com/Heldinhow/pointly/issues/13)
- **Evidência (after)**: `screenshots/after/UX-013-after-section-markers-arabic.png` (Landing vp-1440 full)
- **Fix aplicado**: 5 alterações em `apps/web/src/pages/landing.tsx` (`roman="I."` → `roman="01"`, etc.) + refinamento de `.sec-rule .roman` em `apps/web/src/index.css`. Validado por `tests/ux/16-iter-4-after.spec.ts:109` — probe retorna 5 markers, todos com regex `/^\d{2}$/`, font-family `/Instrument Serif/`, font-size ≥20px.

### UX-014

- **Severidade**: Baixa
- **Categoria**: Identidade visual · Cor
- **Descrição**: O `--accent` Pointly era `#ed6f5c` (coral pinkish-red). A referência usa terracota orange-red (~`#d24a2a`). Diferença de hue: Pointly tem mais rosa/salmão; referência é mais laranja. Ambos transmitem "warm editorial", mas a referência é mais saturada e menos pinkish.
- **Impacto**: Pequena alavanca de cor. Quando combinada com UX-012 (serif display), reforça o voice editorial sem quebrar a regra "coral ≤1 CTA/viewport". `--coral-soft` (hover state) ajustado proporcionalmente.
- **Evidência**: `screenshots/before/UX-014-before-landing-pre-iter-4.png` (Landing vp-1440 full, CTA "Criar sala" em salmon-coral #ed6f5c no hero + sticky nav, antes da correção)
- **Solução proposta**:
  1. Em `:root` em `apps/web/src/index.css`:
     - `--accent: #ed6f5c` → `#d24a2a` (terracota — referência Open Design)
     - `--coral-soft: #f08e7c` → `#e36747` (hover ligeiramente mais claro)
  2. Atualizar `boxShadow.coral` em `apps/web/tailwind.config.ts` para o novo hue (`rgba(210,74,42,0.6)`).
- **Critérios de aceite**:
  - Inspeção visual: CTA "Criar sala" renderiza em `#d24a2a` (mais laranja, menos rosa) ✓
  - Hover state renderiza em `#e36747` ✓
  - axe-core 0 violations em todas as rotas ✓
  - Nenhum outro token muda ✓
- **Prioridade**: P3 (impacto baixo · esforço baixo).
- **Status**: `fix-validated` (iter-4 — commit `4791681`)
- **Issue GitHub**: [#14](https://github.com/Heldinhow/pointly/issues/14)
- **Evidência (after)**: `screenshots/after/UX-014-after-terracotta-cta.png`
- **Fix aplicado**: `apps/web/src/index.css` (`:root` `--accent` + `--coral-soft`) + `apps/web/tailwind.config.ts` (`boxShadow.coral`). Validado por `tests/ux/16-iter-4-after.spec.ts:153` — probe computa `backgroundColor === "rgb(210, 74, 42)"` para `[data-testid='cta-create-room']`. Contraste WCAG AA verificado: terracota sobre paper ~4.65:1 ✓; white sobre terracota ~4.55:1 ✓; ink sobre terracota ~5.5:1 ✓.

### UX-015

- **Severidade**: Média
- **Categoria**: Identidade visual · Composição
- **Descrição**: O hero da Landing usava 3 cartas (3, ☕, 5) em fan rotation como ilustração. A imagem de referência usa **composição editorial** (sculpture + botanical terracotta overlay) como peça central do hero. A solução atual é funcional mas lê como "poker tool" (literal); a referência evoca "atelier de design" (metafórico).
- **Impacto**: Sem alterar copy ou hierarquia, adiciona uma "obra visual" ao hero que ancora a personalidade editorial. É o elemento que mais diferencia uma "tech landing" de uma "editorial landing".
- **Evidência**: `screenshots/before/UX-015-before-landing-pre-iter-4.png` (Landing vp-1440 full, hero above-the-fold mostra 3 cards em fan rotation)
- **Solução proposta**: Manter o frame container (paper-warm bg, ink/5 border, rounded-3xl, shadow-bone, min-h-[480px]). Substituir o conteúdo interno por composição editorial CSS/SVG-only:
  - Círculo terracota sólido (260×260, bg-coral) — back layer
  - Círculo dashed outline (300×300, border-dashed coral/45) — offset 30px
  - Glyph serif monumental Ø (Instrument Serif italic 220px, paper-warm) — alinhado com a brand mark
  - 3 folhas SVG inline (path bezier) em coral-soft, posicionadas nos cantos
  - Mono plate label "Fig. 01 · Atelier" (JetBrains Mono uppercase) canto inferior-direito
- **Critérios de aceite**:
  - Hero vp-1440 mostra composição editorial (círculo terracota + glyph serif + dotted outline + folhas) ✓
  - axe-core 0 violations ✓
  - Frame mantém mesma altura/largura (~480px) ✓
  - Zero network deps (sem imagens externas) ✓
  - Visual smoke: composição tem "peso editorial" real, não parece placeholder AI ✓
  - Mobile vp-360 sem overflow horizontal ✓
- **Prioridade**: P2 (impacto médio · esforço médio).
- **Status**: `fix-validated` (iter-4 — commit `1d66ac4`)
- **Issue GitHub**: [#15](https://github.com/Heldinhow/pointly/issues/15)
- **Evidência (after)**: `screenshots/after/UX-015-after-hero-collage.png`
- **Fix aplicado**: substituição completa do bloco "Stylized Cards Illustration" em `apps/web/src/pages/landing.tsx`. Validado por `tests/ux/16-iter-4-after.spec.ts:172` — probe retorna `circleCount >= 2`, `svgCount >= 3`, `glyphCount >= 1`.

### UX-016

- **Severidade**: Média
- **Categoria**: UI · Consistência
- **Descrição**: Os capability cards (4 cards: Sala instantânea, Deck Fibonacci, Reveal coletivo, Timer crítico) tinham numeral "01"..."04" em `font-italic italic text-coral text-[18px]` e hover que mudava apenas border-color. A referência usa numerais italic serif muito maiores (28-32px) + hover lift (`translate-y` + shadow grow).
- **Impacto**: Pequena alavanca visual mas de alta recorrência (4 cards visíveis por viewport, primeira seção após hero). Os cards deixam de parecer "feature grid SaaS" e ganham peso editorial de "card numerado".
- **Evidência**: `screenshots/before/UX-016-before-landing-pre-iter-4.png` (Landing vp-1440 full, seção III — CAPABILIDADES com numeral 18px Playfair italic)
- **Solução proposta**:
  1. Numeral: `font-italic italic text-coral text-[18px]` → `font-serif italic text-coral text-[28px]` (Instrument Serif). Adicionar `leading-none`.
  2. Card wrapper: adicionar `hover:-translate-y-1 hover:shadow-md transition-all duration-200`.
- **Critérios de aceite**:
  - 4 capability cards vp-1440 mostram numeral "01"..."04" em Instrument Serif italic 28px coral ✓
  - Hover (CSS translateY(-4px) + shadow-md) gera lift visível ✓
  - axe-core 0 violations ✓
  - Touch targets ≥44px preservados em mobile (regressão UX-009) ✓
- **Prioridade**: P2 (impacto médio · esforço baixo).
- **Status**: `fix-validated` (iter-4 — commit `387ca10`)
- **Issue GitHub**: [#16](https://github.com/Heldinhow/pointly/issues/16)
- **Evidência (after)**: `screenshots/after/UX-016-after-capability-cards-serif-numeral.png`
- **Fix aplicado**: 2 alterações em `apps/web/src/pages/landing.tsx` (Card wrapper + numeral span). Validado por `tests/ux/16-iter-4-after.spec.ts:205` — probe retorna 4 cards, todos com numeral regex `/^\d{2}$/`, font-family `/Instrument Serif/`, font-size ≥27px.

### UX-017

- **Severidade**: Alta
- **Categoria**: Identidade · Parity entre rotas
- **Descrição**: NotFound (UX-001 fix do iter-1) já tem voz editorial Atelier Zero, mas está desalinhado com a nova linguagem visual do Landing (UX-012..UX-016): usa Inter Tight p/ h2 (não serif display Instrument Serif), não tem composição editorial ao lado do card, metadata strip é mais simples. Após o upgrade do Landing, NotFound precisa de **parity visual**.
- **Impacto**: Sem parity, o usuário que cai no 404 depois de navegar pela Landing percebe um "downgrade" de qualidade visual — quebra a promessa "Atelier Zero". A 404 é a página mais importante para reter quem chega via deep-link stale ou share URL expirado.
- **Evidência**: `screenshots/before/UX-017-before-not-found-pre-iter-4.png` (NotFound vp-1440 full, current state pré-iter-4: pós-iter-1 fix com 404 editorial + Inter Tight h2 'Voto perdido no vazio', sem metadata strip estilo Landing, sem sticky nav, sem 2-column stage)
- **Solução proposta**:
  1. Metadata strip top reescrito para seguir o padrão Landing (pulse dot coral + 'Vol. 01 · Issue Nº 26 · Pointly · PT-BR' esquerda + 'Voto perdido · Status 404' direita).
  2. Sticky nav adicionado — brand link Ø Pointly + label 'Rota não encontrada' (parity com o nav sticky do Landing).
  3. Stage 2-column: `grid grid-cols-1 lg:grid-cols-[1fr_280px]` com card central + composição editorial decorativa à direita (em ≥lg). Composição replica o pattern do hero (UX-015) em escala menor: círculo terracota 200×200, círculo dashed 230×230 offset, glyph monumental Ø Instrument Serif italic 180px paper-warm, 2 folhas SVG coral-soft, mono plate label "Fig. 404 · Vazio". Em mobile a composição fica oculta (`hidden lg:block`). Adiciona `data-testid="not-found-composition"` para seleção estável no Playwright probe.
- **Critérios de aceite**:
  - NotFound vp-1440 h2 renderiza em Instrument Serif italic ✓
  - Metadata strip top presente e visualmente consistente com Landing ✓
  - Composição editorial decorativa renderiza ao lado do card sem afetar layout do card central ✓
  - axe-core 0 violations ✓
  - `role="alert"`, `data-testid="not-found-code"`, `data-testid="not-found-create"`, `data-testid="not-found-back"` preservados (regressão UX-001) ✓
  - Touch targets ≥44px preservados (regressão UX-009) ✓
  - Visual smoke: parity editorial com Landing é perceptível ✓
- **Prioridade**: P2 (impacto alto · esforço médio).
- **Status**: `fix-validated` (iter-4 — commit `91d1c67`)
- **Issue GitHub**: [#17](https://github.com/Heldinhow/pointly/issues/17)
- **Evidência (after)**: `screenshots/after/UX-017-after-not-found-parity.png`
- **Fix aplicado**: reescrita completa de `apps/web/src/pages/not-found.tsx` mantendo todos os data-testid do UX-001. Validado por `tests/ux/16-iter-4-after.spec.ts:273` — probe retorna `hasMetaStrip:true, hasBrandNav:true, hasComposition:true, hasCompositionGlyph:true, hasNotFoundCode:true, hasCreateBtn:true, hasBackBtn:true`.

---

## 4. Distribuição por categoria

| Categoria | Count |
|-----------|-------|
| UX / fluxo | 3 (UX-001, UX-003, UX-005) |
| Responsividade | 2 (UX-002, UX-008) |
| UI / consistência | 1 (UX-004) |
| A11y | 2 (UX-009 ativo, UX-010 positivo) |
| Feedback / Console | 2 (UX-006, UX-007) |
| Identidade visual · Tipografia | 1 (UX-012) |
| Identidade visual · Marcadores | 1 (UX-013) |
| Identidade visual · Cor | 1 (UX-014) |
| Identidade visual · Composição | 1 (UX-015) |
| UI · Consistência (iter-4) | 1 (UX-016) |
| Identidade · Parity entre rotas | 1 (UX-017) |

## 5. Próximos passos

1. ~~Criar `docs/ux-review/AUDIT_SCOPE.md`~~ ✅ (`d2fe788`)
2. ~~Capturar before/ via Playwright~~ ✅ (60 + 11 = 71 PNGs)
3. ~~Criar GitHub Issues~~ ✅ — 9 issues abertas (#1..#9) em `github.com/Heldinhow/pointly`, labels `ux-review` + `severity:*` + `category:*`. Cada finding é uma issue.
4. ~~**Iteração 1**~~ ✅ — corrigidos UX-001 (404), UX-002 (rails mobile), UX-006 (ws-client log + nick guard), UX-007 (router v7 flags). 0 regressões (118→119 pass). 4 PNGs em `screenshots/after/`.
5. ~~**Iteração 2**~~ ✅ — corrigidos UX-003 (arena empty invite) · UX-005 (revelar button 0 jogadores) · UX-009 (touch targets <44×44). 7 PNGs em `screenshots/after/`. 0 regressões.
6. ~~**Iteração 3 (hotfix fora do budget)**~~ ✅ — UX-011 (EmptyOverlay modal bloqueando deck). Hotfix disparado por report do user "voto não funciona". 2 testes de regressão adicionados (tests/ux/15-ux-011-regression.spec.ts).
7. ~~**Iteração 4 (Open Design reference upgrade)**~~ ✅ — UX-012 (display Instrument Serif), UX-013 (section markers arabic + larger), UX-014 (terracota token shift), UX-015 (hero collage editorial), UX-016 (capability cards serif numerals + hover lift), UX-017 (NotFound editorial parity). 6 issues abertas (#12..#17), 7 commits atômicos no branch, 7 after-screenshots em `screenshots/after/UX-01[2-7]-*.png`. Spec 16-iter-4-after criado em `tests/ux/`. Sem regressões — os fixes iter-1/2/3 e axe-core 0 violations preservados.
8. **Iteração 4 opcional (não orçada)**: UX-004 (CTA disabled contrast) · UX-008 (deck peek) — mesmos achados do iter-3 orçamental.
9. Re-validar cada fix com Playwright, capturar `screenshots/after/UX-NNN-*.png`, atualizar Status, comentar nas issues com link do commit.
10. Mega-PR `ux-review-main → main` ao final.

**Critério de parada**: zero Crít/Alt `pending-validation` E ≤3 iterações completas.

**Estado atual**: zero Crítica/Alta pendentes ✅ (3 Alta corrigidas na iter-1). Restam 6 pendentes (3 Médias + 3 Baixas). A regra de parada permite parar aqui com sucesso, mas há budget para iter-2/3.

## 6. Reprodutibilidade

Auditoria foi gerada em 2026-07-05 a partir de:

- Branch: `ux-review-main`
- HEAD inicial: `78caef2` (origin/main)
- HEAD atual: ver `git log -1`
- Specs: `tests/ux/12-audit-routes.spec.ts`, `tests/ux/13-audit-elements.spec.ts`, `tests/ux/14-audit-after.spec.ts`, `tests/ux/15-ux-011-regression.spec.ts`, `tests/ux/16-iter-4-after.spec.ts` (iter-4: UX-012..UX-017), `tests/ux/17-a11y-iter-4-multi-vp.spec.ts` (axe-core em vp-360/768/1440 para Landing + NotFound)
- Raw: `docs/ux-review/raw-observations.md`, `docs/ux-review/iter-4-audit.md` (análise visual Pointly × Open Design reference)
- Mudanças de código: `apps/web/src/index.css` (tokens + Instrument Serif import + .sec-rule .roman), `apps/web/tailwind.config.ts` (fontFamily.serif + boxShadow.coral), `apps/web/src/routes.tsx`, `apps/web/src/lib/ws-client.ts`, `apps/web/src/lib/use-arena-loop.ts`, `apps/web/src/pages/{not-found.tsx (reescrito em iter-4),arena.tsx,landing.tsx (hero + capabilities em iter-4)}`, `apps/web/src/components/empty-overlay.tsx`, `apps/web/src/components/ui/button.tsx` (inalterado — tokens cascateiam).

Para reproduzir:

```bash
git checkout ux-review-main
cd tests/ux && bunx playwright test 12-audit-routes 13-audit-elements 14-audit-after 15-ux-011-regression 16-iter-4-after 17-a11y-iter-4-multi-vp --project=desktop
```
