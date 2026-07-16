# Pointly — Agent Instructions

Planning Poker web app. Bun monorepo, Hono backend, React+Vite frontend, Zod shared schemas. In-memory state, no DB.

## Commands

```bash
bun run dev          # frontend (5173) + backend (3001) in parallel
bun run typecheck    # all workspaces
bun run lint         # Biome (defaults, no biome.json)
bun run format       # Biome auto-fix
bun run test:all     # shared → server → web → e2e (sequential)
bun run test:e2e     # Playwright multi-client tests
```

Single workspace tests: `bun run --filter <workspace> test`

## Architecture

```
apps/server/    Bun + Hono + WS (port 3001), entry: src/index.ts
apps/web/       React 18 + Vite (port 5173), entry: src/
packages/shared @planning-poker/shared — Zod schemas + TS types (single source of truth)
tests/e2e/      Playwright multi-client E2E (workers: 1, sequential)
tests/ux/       Playwright UX/design audit (3 viewports)
```

## Key facts

- **Lockfile**: `bun.lockb` (binary). Never create `bun.lock` — text format has phantom drift bugs in monorepos (see bunfig.toml).
- **Build order**: web builds first (`tsc + vite build`), then server. Root `bun run build` handles this.
- **E2E tests**: Playwright config spawns both Vite + Bun via `bun run dev` as webServer. Tests run sequentially (`workers: 1`), no parallelism.
- **Vite aliases**: `@` → `src/`, `@planning-poker/shared` → `packages/shared/src/index.ts` (source, not dist).
- **NODE_ENV=production** is critical in Docker web-build stage — dev mode breaks WS URLs in prod.
- **No biome.json** — Biome runs with defaults. If you add config, place at repo root.
- **Desktop only** — 1440px viewport. No mobile/tablet responsive.
- **In-memory state** — no DB, no Redis. Salas are ephemeral (deleted when last player leaves).
- **Docker**: multi-stage build (deps → web-build → base → server/web targets). Deployed via Dokploy + Traefik on `pointly.space`.

## Domain language

Use the terms from `CONTEXT.md` — they are the source of truth for naming:
- **Sala** (not room), **Host** (not admin), **Player** (not user), **Apelido** (not username)
- **Código** (not ID), **Assento** (not seat), **Rodada** (not round), **Voto** (not choice)
- **Reveal**, **Mediana** (not average), **Deck** (not cards), **Timer** (not countdown)

## Testing

- Unit/integration: `bun test src/` per workspace (Vitest under the hood, via Bun runner)
- E2E: Playwright, requires `bun run dev` running or relies on webServer config to start it
- UX audit: separate Playwright config with desktop/tablet/mobile viewports
- Playwright browsers: `bun run --filter e2e install-browsers` if chromium not installed

## Issues

All bugs, feature requests, and improvements go to **GitHub Issues** — not TODOs in code, not comments, not local files. If you find something, open an issue at `https://github.com/Heldinhow/pointly/issues`.

### Label taxonomy (mandatory for new issues)

Every issue must have **at least 3 labels**: 1 tipo + 1 severidade + 1 categoria. Area labels are optional but encouraged.

**Tipo** (exactly one):
- `bug` — Something isn't working
- `enhancement` — New feature or request
- `ux-review` — Finding from UX/UI audit

**Severidade** (exactly one, skip for `ux-review` type):
- `severity:alta` — Bloqueia fluxo ou afeta prod
- `severity:media` — Visível mas contornável
- `severity:baixa` — Cosmético ou edge case

**Categoria** (one or more):
- `category:fluxo` — UX / user flow
- `category:ui` — UI / visual consistency
- `category:console` — Console / logs
- `category:responsividade` — Responsividade / breakpoints
- `category:a11y` — Acessibilidade

**Área** (optional, zero or more):
- `home` — Landing page (scope T1–T8)
- `ux` — UX geral (non-audit)
- `a11y` — Acessibilidade (shortcut for area, same as category:a11y)
- `blocked` — Item stuck after N iterations, needs human follow-up

## TypeScript config

Strict mode enabled. Notable flags: `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax: false`.
