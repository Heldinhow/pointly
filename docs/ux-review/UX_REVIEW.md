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

| Sev   | Count |
|-------|-------|
| Crítica | 0     |
| Alta    | 3     |
| Média   | 3     |
| Baixa   | 4     |
| Total   | 10    |

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
sempre para um screenshot em `screenshots/before/`.

| ID | Sev | Categoria | Título curto | Evidência (before) | Status |
|----|-----|-----------|---------------|---------------------|--------|
| [UX-001](#ux-001) | Alta | UX / fluxo · Navegação | 404 sem branding, ilustração ou CTA de retorno | `screenshots/before/UX-001-not-found-no-cta.png` | `pending-validation` |
| [UX-002](#ux-002) | Alta | Responsividade · UI | Side rails colidem com hero em mobile (390/360) | `screenshots/before/UX-002-landing-rail-collision-390.png` | `pending-validation` |
| [UX-006](#ux-006) | Alta | Feedback / Console | `ws-client` envia evento inválido em todo load da arena | (n/a — console warning) | `pending-validation` |
| [UX-003](#ux-003) | Média | UX / fluxo | Arena vazia sem CTA de share/invite proeminente | `screenshots/before/UX-003-arena-empty-no-invite.png` | `pending-validation` |
| [UX-009](#ux-009) | Média | A11y · Toque | 15 touch targets < 44×44 em mobile (header logo, botões) | (programatic) | `pending-validation` |
| [UX-005](#ux-005) | Média | UX / fluxo | Reveal button context na arena-vazia precisa explicação | `screenshots/before/UX-005-arena-reveal-empty.png` | `pending-validation` |
| [UX-004](#ux-004) | Baixa | UI / consistência | CTA "Entrar" disabled fica opacidade 0.4 — contraste enabled↔disabled baixo | `screenshots/before/UX-004-join-host-empty-cta.png` | `pending-validation` |
| [UX-007](#ux-007) | Baixa | Feedback / Console | 6 React Router future-flag warnings por page load | (n/a — console warning) | `pending-validation` |
| [UX-008](#ux-008) | Baixa | Responsividade · UI | Deck mobile: card "0" off-screen sem peek affordance óbvio | `screenshots/before/UX-008-deck-mobile-peek.png` | `pending-validation` |
| [UX-010](#ux-010) | Baixa | A11y | (positivo) axe-core WCAG 2 AA — 0 violações em 4 rotas | `screenshots/before/UX-010-a11y-*.png` (4 rotas) | `fix-validated` (positivo) |

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
- **Status**: `pending-validation`
- **Issue GitHub**: (a abrir em passo 7)

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
- **Status**: `pending-validation`

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
- **Status**: `pending-validation`

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
- **Status**: `pending-validation`

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
- **Status**: `pending-validation`

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
- **Status**: `pending-validation`

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
- **Status**: `pending-validation`

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
2. ~~Capturar before/ via Playwright~~ ✅ (60 + 8 = 68 PNGs)
3. **Criar GitHub Issues** (próximo task) para cada finding Crítica + Alta + Média relevante (UX-001..009).
4. **Iteração 1**: corrigir UX-001 (404 editorial) · UX-002 (rails mobile) · UX-006 (ws-client log) · UX-007 (router flags).
5. **Iteração 2** (se budget permitir): UX-003 (arena empty guidance) · UX-005 (esconder reveal button) · UX-009 (touch targets).
6. **Iteração 3** (se budget permitir): UX-004 (CTA disabled contrast) · UX-008 (deck peek).
7. Re-validar cada fix com Playwright, capturar `screenshots/after/UX-NNN-*.png`, atualizar Status.
8. Mega-PR `ux-review-main → main` ao final.

## 6. Reprodutibilidade

Auditoria foi gerada em 2026-07-05 a partir de:

- Branch: `ux-review-main`
- HEAD inicial: `78caef2` (origin/main)
- HEAD atual: ver `git log -1`
- Specs: `tests/ux/12-audit-routes.spec.ts`, `tests/ux/13-audit-elements.spec.ts`
- Raw: `docs/ux-review/raw-observations.md`

Para reproduzir:

```bash
git checkout ux-review-main
cd tests/ux && bunx playwright test 12-audit-routes 13-audit-elements --project=desktop
```
