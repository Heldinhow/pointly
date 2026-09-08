# NOTES — Pointly

## Mundo do usuário
- Produto: Pointly, planning poker em tempo real, zero cadastro, in-memory, salas efêmeras.
- Stack: Bun monorepo (apps/web React 18 + Vite + Tailwind, apps/server Hono + WS, packages/shared Zod), Playwright E2E.
- Prod: https://pointly.space (Dokploy + Traefik). Repo: Heldinhow/pointly.

## Canais e termos canônicos
- Domínio: sala, host, player, apelido, código, assento, rodada, voto, reveal, mediana, deck, timer.
- Rotas: `/` landing, `/join` (entrada, `?host=1` criar, `?code=` convite), `/arena`, `/full` (cheia), 404.
- `data-theme` no `html` (claro/escuro/sistema). Tokens via CSS vars em `apps/web/src/index.css` + `tailwind.config.ts`.

## Decisões vigentes (grilling 2026-09-07)
- Redesign Factory one-shot, 1 spec (`workflows/pointly-factory-redesign.md`), 3 fases, checkpoint único final.
- Precedência refs: factory.ai > /product/cli > /company#careers > docs.factory.ai.
- Fonts: Geist via fontsource (OFL), fallback Inter/system-ui + mono.
- Dark por derivação tonal com AA, não cópia literal.
- Screenshots em `screenshots/factory-*`, matriz rotas × light/dark × 1440/375.
- `loop-prompt.md` superseded (desktop-only + cream/coral mortos). Drift conhecido: `index.css` já Factory, `DESIGN.md` ainda Mesa/Azul tinta.
