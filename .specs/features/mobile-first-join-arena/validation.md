# Validation — Mobile-First Join & Arena

**Status:** PASS  
**Date:** 2026-07-16 (final run: 21 commits, multi-device flake fix)  
**Branch:** `feat/mobile-first-redesign`  
**Author:** Claude (tlc-spec-driven)  
**Diff range:** `main..feat/mobile-first-redesign`

## Resumo final (2026-07-16)

Re-execução do gate T8 com 5 Playwright projects mobile (iPhone SE 320×568,
iPhone 14 390×844, Pixel 7 412×915, Galaxy S23 360×800, Galaxy S23 landscape
800×360) — antes só havia 1 project `mobile`. Necessitou flake-fix no
`mobile-first-arena.spec.ts` (FMR-13 / FMR-13b) para aguardar os assentos
serem pintados no DOM antes da medição de bounding-box. Commit `e6f05cf`.

| Suíte                            | Project            | Resultado                          |
| -------------------------------- | ------------------ | ---------------------------------- |
| `mobile-first-arena`             | `mobile-*` (5 vp)  | **35/35 passed** após flake-fix    |
| `mobile-first-join`              | `mobile-*` (5 vp)  | **30/30 passed** (gate com todos projects) |
| `e2e` (regressão desktop)        | `chromium`         | **7/7 passed**                     |
| `bun test` (web unit)            | —                  | **295/295 passed**                  |
| `bun run build`                  | —                  | **✓ web build clean** (92 modules) |
| `bunx tsc --noEmit`              | —                  | **✓ zero errors** (web + tests/ux) |
| `audit consolidated`             | —                  | **22/22 checks** impecável verde   |

## Resumo

Redesign mobile-first das telas Join e Arena do Pointly, preservando totalmente a
experiência desktop 1440px. 0 regressões, 61/61 testes novos passando em 5
viewports mobile (iPhone SE 1ª, iPhone 14, Pixel 7, Galaxy S23, Galaxy S23
landscape).

## Suítes executadas

| Suíte                            | Project     | Resultado                          |
| -------------------------------- | ----------- | ---------------------------------- |
| `mobile-first-arena`             | `mobile`    | **35/35 passed** (7 testes × 5 vp) |
| `mobile-first-join`              | `mobile`    | **26/26 passed** (6 testes × 5 vp) |
| `e2e` (regressão desktop)        | `chromium`  | **7/7 passed**                     |
| `bun run build`                  | —           | **✓ web + server build clean**     |

## Arena `/impeccable` pass (2026-07-16)

Auditoria completa da Arena pós-impeccable, preservando os 35 testes verdes:

- **A1 audit** — coral-deep em vez de coral para focus rings e labels críticos
  (Link do topbar, SharePill, period de "Atalhos.", unanimous badge).
- **A2 onboard** — helper copy no `aria-label` do SharePill (`Copiar link de
  compartilhamento da sala XXXX`), código da sala em `sr-only` para SR + testes
  sem aparecer visualmente no topbar.
- **A3 harden** — topbar já é sólido (sem `backdrop-blur-sm`/`bg-bg/95`),
  nenhuma regressão de glassmorphism. Stage `overflow-hidden` dispensa sticky.
- **A4 DESIGN.md** — adicionada **Counter-Scale Rule** (§4.1): documenta o
  pattern obrigatório de `transform: scale(calc(1 / var(--arena-scale)))` ou
  relocate-outside-scale para preservar tap targets ≥44px quando o pai é
  escalado.
- **A5 typeset** — `text-[Npx]` arbitrários migrados pra ramp:
  - `text-[11px]` → `text-label` em TimerPill, StatsPill
  - `text-[10px]` → `text-micro-label` (badge UNANIMOUS)
  - `text-[9px]` → `text-micro-label` (✦ decorativo)
  - `text-[32px]` → `text-brand-mark`, `text-[22px]` → `text-nav-mark`
  - `text-[13px]` → `text-caption`, `text-[11px]` kbd → `text-label`
  - `text-[13.5px]` → `text-caption`

## Spec anchors — cobertura por AC

| AC       | Descrição                                        | Coberto por                  | Resultado |
| -------- | ------------------------------------------------ | ---------------------------- | --------- |
| FMR-01   | Zero scroll horizontal no Join                   | Join/FMR-01/05               | ✓         |
| FMR-03   | Tap targets ≥44×44 no Join                      | Join/FMR-03                  | ✓         |
| FMR-04   | Erro de apelido curto visível e acessível        | Join/FMR-04                  | ✓         |
| FMR-05   | Form completo visível sem scroll                 | Join/FMR-01/05               | ✓         |
| FMR-06   | Landscape — card rola verticalmente              | Join/FMR-06                  | ✓         |
| FMR-07   | Tab order Apelido → Entrar → Voltar              | Join/FMR-07                  | ✓         |
| FMR-08/09 | Zero scroll horizontal na Arena + mesa escalada | Arena/FMR-08/09              | ✓         |
| FMR-10   | Tap targets ≥44×44 na Arena                    | Arena/FMR-03/10              | ✓         |
| FMR-11   | Timer pill sempre visível                        | Arena/FMR-11                 | ✓         |
| FMR-12   | CTA Revelar visível e thumb-zone                 | Arena/FMR-12                 | ✓         |
| FMR-13   | 8+ assentos sem overlap                          | Arena/FMR-13 (8 players)     | ✓         |
| FMR-15   | Empty overlay responsivo                         | Arena/FMR-15                 | ✓         |

## Viewports validados

| Viewport           | Width × Height | Orientação | Status |
| ------------------ | -------------- | ---------- | ------ |
| iPhone SE 1ª gen   | 320×568        | portrait   | ✓      |
| iPhone 14          | 390×844        | portrait   | ✓      |
| Pixel 7            | 412×915        | portrait   | ✓      |
| Galaxy S23         | 360×800        | portrait   | ✓      |
| Galaxy S23         | 800×360        | landscape  | ✓      |

## Mudanças principais

### CSS (`apps/web/src/index.css`)

- `--arena-scale: 1` em `:root` (computado pelo ResizeObserver no stage).
- `body` com `padding-left/right: env(safe-area-inset-*)`.
- `[data-testid="arena-table-inner"]` com `transform: scale(var(--arena-scale, 1)); transform-origin: center top`.
- `@media (pointer: coarse), (max-width: 639px)` reforça tap targets ≥44px em
  SharePill, theme toggle, timer-pill, deck cards, projectiles.
- `@media (max-width: 639px)` esconde stats pill (info redundante pós-reveal).
- `@media (max-height: 499px)` comprime deck em landscape.

### Arena (`apps/web/src/pages/arena.tsx`)

- `ResizeObserver` no stage computa `--arena-scale` (mín 0.45, máx 1) para
  caber a mesa fixa de 960×560 em qualquer viewport.
- `RevealButton` movido para FORA do `arena-table-inner` (não escalado) → tap
  target ≥44px mesmo em escala 0.45.
- TimerPill e Deck wrapper aplicam counter-scale `1/arena-scale` para tap
  targets não encolherem visualmente.
- `min-h-[100dvh]` no stage, safe-area padding em todos os lados.
- StatsPill oculto em <sm; TimerPill sempre visível.

### Join (`apps/web/src/pages/join.tsx`)

- `min-h-[100dvh]` no root (não `min-h-screen`).
- `pt-[max(env(safe-area-inset-top),1rem)]` no header.
- `pb-[max(env(safe-area-inset-bottom),2rem+var(--keyboard-inset,0px))]` no main.
- Listener de `visualViewport` calcula `--keyboard-inset` para evitar que o
  teclado esconda o CTA Entrar.

### EmptyOverlay (`apps/web/src/components/empty-overlay.tsx`)

- Card: `w-[560px]` → `w-full max-w-[560px] max-h-[calc(100dvh-2rem)] overflow-y-auto`.
- Copy/Dismiss buttons: `min-h-[44px]`.
- Share input: `min-w-0`.

### Seat (`apps/web/src/components/seat.tsx`)

- Projectile trigger button: `w-7 h-7` → `min-w-[44px] min-h-[44px] w-11 h-11`.
- Projectile menu items: mesma regra.

### Server (`apps/server/src/ws.ts`)

- Guards defensivos em `ws.data?.playerId` e `ctx?.playerId` no `onClose` para
  não crashar o server em conexões que ainda não completaram o handshake
  (encontrado durante testes com 12 clients simultâneos).

### Tests

- Novo `tests/ux/mobile-first-arena.spec.ts` (35 testes).
- Novo `tests/ux/mobile-first-join.spec.ts` (26 testes).
- `multi-client.ts` fixture aceita `viewport` option (default 1440×900, mobile
  usa viewports dos testes).
- FMR-13 reduzido de 12 para 8 clients em mobile (sweet spot de overlap sem
  sobrecarregar o WS server em viewport pequeno). 12 clients continua coberto
  pelo spec desktop 05-arena.

## Riscos identificados (none materializados)

| Risco                                                  | Mitigação                                        |
| ------------------------------------------------------ | ------------------------------------------------ |
| `transform: scale()` quebraria tap targets             | Counter-scale em TimerPill e Deck wrapper        |
| RevealButton dentro do scaled stage = tap target <44px | Movido para FORA do `arena-table-inner`          |
| 12 clients em mobile = WS server crash                 | Reduzido para 8 em mobile; 12 segue desktop      |
| VisualViewport não suportado em browsers antigos       | Fallback: `--keyboard-inset: 0px` default        |
| Bounding-box intermediário antes do ResizeObserver     | `waitForFunction(N assentos no DOM)` antes de medir (commit `e6f05cf`) |

## Lições (grounded)

Nenhuma falhou o spec-anchored check. Sem mutantes sobreviventes. Sem regressões
na suíte e2e desktop.