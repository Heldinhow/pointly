# Executar Planning Poker v1 — Phase [N]

## Working dir

`/Users/helder/last-chance/planning/`

## Ler antes (em ordem)

1. `CONTEXT.md` — glossary (12 termos de domínio)
2. `docs/adr/0001..0010` — 10 ADRs (decisões travadas)
3. `.specs/features/planning-poker-v1/spec.md` — PRD v2 (53 F-IDs)
4. `.specs/features/planning-poker-v1/tasks.md` — 54 tasks, 9 fases (**alvo: Phase [N]**)
5. `AGENTS.md` — monorepo Bun (apps/web, apps/server, packages/shared, tests/e2e)

## Stack fixa (ADRs 0005-0010)

Bun · Hono · Bun.serve WebSocket · React 18 · Vite · TS · Zustand · Zod · Tailwind · shadcn · Vitest · Playwright. Sala em `Map<codigo, Sala>` in-memory. Sem DB, sem Redis, sem bots, sem mock. HTMLs em `/design/` (visual reference, não runtime).

## Executar

1. **Sub-agent por task** (`subagent({ agent: "package:worker", task: "..." })`): passar task definition completa + ADR relevante + context mínimo (Zod schemas, file paths, dependencies).
2. **Paralelo onde [P]**, sequencial onde há `Depends on`. Respeitar ordem da fase.
3. **Atualizar `tasks.md`** após cada task: ✓/⚠/✗ no campo Status, files changed, gate result, SPEC_DEVIATION marker se aplicável.
4. **Gate check** por task: `bun run --filter <workspace> test` (com testes) ou `bun run typecheck` (config-only).

## PARAR e me consultar quando

- Decisão arquitetural nova (não-coberta por ADR existente)
- SPEC_DEVIATION material (>10% escopo divergente do spec)
- Blocker sem solução clara após 2h
- Final de fase — resumir antes de avançar

## Output fim de fase

Tabela `task | status | gate | files | notes`. Decisões novas (sugerir ADR-XXXX ou update spec). Blocker report. Confirmação de "pronto pra próxima fase".

## Mapa de fases

| # | Fase | Tasks | ~h |
| 1 | Foundation | T0-T6 | 1-2 |
| 2 | Shared schemas | T7-T11, T7a | 2-3 |
| 3 | Server | T12,T17,T12a,T17a,T13-T18,T13a | 5-7 |
| 4 | Server tests | T19-T21 | 1-2 |
| 5 | Client core | T22-T26 | 2-3 |
| 6 | Client UI | T27-T37 | 4-6 |
| 7 | Wire-up | T38-T41 | 2-3 |
| 8 | E2E | T42-T45 | 2-3 |
| 9 | Polish | T46-T49 | 2-3 |

## Como usar

1. Copie o bloco acima
2. Substitua `[N]` pelo número da fase (1-9)
3. Cole numa nova sessão
4. Repita para cada fase, atualizando `[N]`
