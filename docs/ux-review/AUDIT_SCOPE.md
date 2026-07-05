# UX/UI Audit Scope — Pointly (apps/web)

> Documento de escopo da auditoria UX/UI/front-end iniciada em
> 2026-07-04 na branch `ux-review-main` (filha de `origin/main` @ `78caef2`).
> Define **o que** será auditado, **em quais estados**, e **com quais critérios**.
> Não contém findings — findings vão em `UX_REVIEW.md`.

---

## 1. Stack confirmado (read-only)

| Camada | Tecnologia | Arquivo de referência |
|--------|-----------|------------------------|
| Build | Vite 6 + TS 5.7 | `apps/web/vite.config.ts` |
| UI | React 18 + react-router-dom 6 | `apps/web/src/App.tsx`, `routes.tsx` |
| Estado | Zustand 5 | `apps/web/src/store/sala.ts` |
| Style | Tailwind 3.4 + CVA + clsx + tailwind-merge | `apps/web/tailwind.config.ts` |
| Tokens | Atelier Zero (CSS vars em `:root`) | `apps/web/src/index.css` |
| Schema | Zod 3 (shared) | `packages/shared/` |
| Test E2E UX | Playwright 1.49 + axe-core | `tests/ux/playwright.config.ts` |
| Server | Bun + Hono (read-only — fora de escopo) | `apps/server/` |

## 2. Sistema visual — Atelier Zero (tokens imutáveis)

```css
--bg:        #efe7d2;  /* paper, fundo */
--paper-warm:#ece4cf;  --paper-dark:#ddd2b6;
--surface:   #f7f1de;  /* bone, card elevado */
--fg:        #15140f;  /* ink, texto */
--fg-soft:   #2a2620;  --fg-mute:#3a352a;  --fg-faint:#4a4438;
--accent:    #ed6f5c;  /* coral, ÚNICO acento quente */
--coral-soft:#f08e7c;
--mustard:   #e9b94a;  /* joia — NUNCA CTA */
--olive:     #6e7448;  /* tags, glyphs */
```

Tipografia: Inter Tight (display 700-900), Playfair Display Italic 500
(emphasis), Inter (body 300-500), JetBrains Mono (UI mono). Surface
noise `::before` obrigatório em todas as 4 telas.

Regras críticas herdadas do `plan.md §4`:

- **≤1 CTA coral** por viewport.
- **Mostarda nunca é CTA** (≤1% da superfície, só joia).
- **Branco puro só** dentro do painel "Selected Work"; preto puro proibido — `--fg` é o mais escuro.
- **`overflow-x: hidden`** esperado em todas as páginas em mobile.

## 3. Rotas em escopo

| Rota runtime | Page | Componentes principais | Estados a cobrir |
|--------------|------|------------------------|-------------------|
| `/` | `pages/landing.tsx` | `Button`, `Card` (hero), `Ellipse` (footer mark) | carregado · hover CTA · scroll · focus visível |
| `/join?code=…&host=1` | `pages/join.tsx` | `Button`, `Pill`, input controlado | vazio · typing · erro nome curto · nick ok · submit host · submit join · navegação back |
| `/arena?code=…&host=1` | `pages/arena.tsx` | `Seat`, `Deck`, `RevealButton`, `NewRoundButton`, `TimerPill`, `StatsPill`, `EmptyOverlay`, `HelpModal`, `ToastQueue`, `ConnectionStatus` | sala vazia · 1 player (solo) · 2+ players · host votou · todos votaram · revelado · stats visíveis · nova rodada · desconectado · reconectando |
| `/full?code=…` | `pages/full.tsx` | `Button` ghost | carregado · hover · focus |
| `*` (404) | `routes.tsx` | texto plano | carregado |

## 4. Componentes a auditar individualmente

- `apps/web/src/components/ui/button.tsx` — primário/suave/ghost/coral; forwardRef; estados
- `apps/web/src/components/ui/card.tsx` — bone-card 18px + surface noise
- `apps/web/src/components/ui/pill.tsx` — `mono-tag` + variantes ghost/coral/mustard/olive
- `apps/web/src/components/ui/ellipse.tsx` — `brand-glyph` Ø
- `apps/web/src/components/ui/toast.tsx` + `toast-queue.tsx` — sucesso/erro/info; aria-live
- `apps/web/src/components/ui/seat.tsx` (primitiva) + `seat.tsx` (componente) — ring de assentos, estados voted/host/you
- `apps/web/src/components/deck.tsx` — Fibonacci 0, ½, 1, 2, 3, 5, 8, 13, ☕ · peek no mobile · keyboard nav
- `apps/web/src/components/timer-pill.tsx` — 60s + estado crítico coral ≤30s + auto-reveal
- `apps/web/src/components/stats-pill.tsx` — média, mediana, intervalo; gold highlight na mediana
- `apps/web/src/components/reveal-button.tsx` — host-only; disabled se faltam votos
- `apps/web/src/components/empty-overlay.tsx` — sala solo / share URL
- `apps/web/src/components/help-modal.tsx` — Esc fecha, focus trap
- `apps/web/src/components/connection-status.tsx` — connected/reconnecting/offline

## 5. Viewport matrix (Playwright)

Alinhado com `DESIGN-HANDOFF.md §Responsive contract`. Sempre testar com
Playwright `Desktop Chrome` (sem emulação de touch a menos que explícito).

| ID | Resolução | Categoria | DPR |
|----|-----------|-----------|-----|
| `vp-360` | 360×800 | Mobile compact | 2 |
| `vp-390` | 390×844 | Mobile standard (iPhone 12-14) | 3 |
| `vp-430` | 430×932 | Mobile large | 3 |
| `vp-600` | 600×960 | Foldable / small tablet | 2 |
| `vp-820` | 820×1180 | Tablet portrait | 2 |
| `vp-1024` | 1024×768 | Tablet landscape | 2 |
| `vp-1366` | 1366×768 | Laptop | 1 |
| `vp-1440` | 1440×900 | Desktop (default do projeto) | 1 |
| `vp-1920` | 1920×1080 | Wide desktop | 1 |

Tema: **light only** no v1 (a app não expõe toggle; `prefers-color-scheme`
não é tratado no tokens).

## 6. Estados interativos por categoria

Cobrir cada item em pelo menos `vp-1440` e `vp-390`:

- **Hover**: botões primários e ghost; cards clicáveis; share URL pill
- **Focus-visible**: tab order completo em cada rota; outline custom vs default
- **Active/pressed**: deck cards, primary CTA, ghost buttons
- **Disabled**: RevealButton antes da maioria votar; submit Join com nick vazio
- **Loading**: `PageFallback` (Suspense lazy); estados de WebSocket
- **Empty**: Arena com 1 player; StatsPill antes da reveal
- **Error/Edge**: nick com 1 char; nick com 21 chars; `/full`; 404; rapid double-vote
- **Reduced motion**: `prefers-reduced-motion: reduce` → animações (steam, pulse, projectile) devem parar/diminuir
- **Keyboard**: Tab/Shift-Tab por todas as rotas; Enter em cards do deck; Esc em modal

## 7. Critérios de aceitação por categoria de finding

| Categoria | O que conta como issue | Severidade padrão |
|-----------|------------------------|-------------------|
| A11y (WCAG 2.2 AA) | Falha em axe-core; contrast < 4.5:1; missing aria-label; focus trap quebrado; keyboard unreachable | Crítica |
| UX / fluxo | Usuário fica preso, confuso, ou faz 2+ passos pra concluir; feedback ausente >300ms | Alta |
| UI / consistência | Mesmo conceito com 2+ visuais diferentes; mesmo CTA com 2 cores; spacing fora do ritmo | Média |
| Tipografia | Hierarquia ambígua; tracking/leading inconsistente; numeral ≠ spec (Playfair) | Média |
| Espaçamento | Ritmo 4/8/16 quebrado; padding assimétrico em pares lógicos | Baixa |
| Responsividade | overflow-x > 0; toque < 44×44; texto quebra feio | Alta |
| Copy | Ortografia, tom inconsistente com a voz editorial; texto overflow; truncamento agressivo | Média |
| Feedback de interação | Ação sem estado pressed/active; loading sem skeleton; sucesso sem confirmação | Média |
| Performance percebida | LCP > 2.5s em mobile; jank durante reveal/projéteis; layout shift > 0.1 | Média |
| Navegação | Back não preserva estado; deep-link ausente; URL inconsistente | Alta |
| Visual / hierarquia | Hierarquia invertida (CTA secundário > primário); acento competindo | Média |

## 8. Severidade (mapeada para Crítica/Alta/Média/Baixa)

- **Crítica** — feature principal quebrada OU a11y blocker OU regressão visual óbvia (ex.: texto ilegível, CTA invisível, navegação presa)
- **Alta** — UX ruim que prejudica percepção; usuário completa fluxo mas com fricção significativa
- **Média** — polish / fidelidade; perceptível mas não bloqueante
- **Baixa** — observação; nice-to-have; non-blocking

## 9. Prioridade = Impacto × Esforço (matriz 3×3)

|           | Esforço Baixo | Esforço Médio | Esforço Alto |
|-----------|---------------|----------------|--------------|
| **Impacto Alto** | P1 (fazer primeiro) | P2 | P3 |
| **Impacto Médio** | P2 | P3 | P4 (deferir) |
| **Impacto Baixo** | P3 | P4 | P5 (rejeitar) |

## 10. O que **NÃO** está em escopo

- Alterações em `apps/server/` ou contratos WebSocket
- Mudanças em `packages/shared/` (schemas/protocolos)
- Refactor de testes `tests/e2e/` (usado só como oráculo de regressão)
- Mudanças em CI/infra (Dockerfile, hooks Dokploy)
- Adicionar novas dependências top-level (só `tests/ux/` pode ganhar deps Playwright já instaladas)
- Reescrever tokens Atelier Zero — só **tokenize dentro da paleta existente** se pagar
- Temas dark (não existem no v1)

## 11. Convenções de arquivo e naming

- `UX_REVIEW.md` → uma linha por finding; campos obrigatórios: ID (`UX-NNN`), Severidade, Categoria, Descrição, Impacto, Evidência (before), Solução proposta, Prioridade, Status
- `screenshots/before/UX-NNN-<slug>.png` → screenshot do problema antes do fix
- `screenshots/after/UX-NNN-<slug>.png` → screenshot após fix (validação)
- `raw-observations.md` → notas cruas do Playwright sweep (sem julgamento)
- IDs `UX-NNN` estáveis; **nunca** reusar número mesmo se finding for rejeitado
- Slugs kebab-case ≤ 60 chars, descritivo (`empty-overlay-no-dismiss`, `landing-mobile-overflow`, `toast-coral-contrast`)

## 12. Fluxo de validação por fix

1. Implementar fix em commit dedicado (`fix(ux-NNN): <resumo>`)
2. Re-rodar Playwright: `cd tests/ux && bun run test`
3. Confirmar 0 regressões vs baseline 93%
4. Capturar `screenshots/after/UX-NNN-<slug>.png` (mesma rota + viewport do before)
5. Atualizar `UX_REVIEW.md` linha do finding:
   - `Status` → `fix-validated` se passou tudo
   - `Status` → `pending-validation` se passou com aviso
   - `Status` → `wontfix` se o usuário recusar via issue
6. Comentar no GitHub Issue correspondente com link do commit + screenshot after

## 13. Regra de parada (do goal principal)

O ciclo termina quando **ambas** condições forem verdade:

- **Zero** findings com Severidade Crítica ou Alta ainda `pending-validation` no `UX_REVIEW.md`
- **≤3** iterações completas de fix (não contamos re-survey como iteração)

Whichever fires first ends the work.
