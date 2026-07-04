# Task for worker

[Read from: /Users/helder/last-chance/planning/context.md, /Users/helder/last-chance/planning/plan.md]

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Você está implementando **T22 — Zustand store** da Phase 5 do projeto Planning Poker (Pointly).

**Contexto:** Projeto é um monorepo em `/Users/helder/last-chance/planning/`. Você trabalha em `apps/web/`. Stack: Bun + Vite + React 18 + TypeScript. Já temos T3 (web base) e T10 (shared types) prontos.

**Specs do shared (já disponíveis via `@planning-poker/shared`):**
- Tipos relevantes: `SalaState`, `Player`, `Phase` (`'idle' | 'voting' | 'revealable' | 'revealed'`), `Vote`, `DECK_VALUES`
- Path: `import { type SalaState, type Player, type Phase, type Vote } from "@planning-poker/shared"`

**Spec T22 (ler `.specs/features/planning-poker-v1/tasks.md` linha ~727):**
- Store Zustand em `apps/web/src/store/sala.ts` chamado `useSalaStore`
- Estado: `{ sala: SalaState | null, currentPlayerId: string | null, ui: { toast?: { kind: 'info' | 'success' | 'error'; text: string } } }`
- Actions: `setSala(sala: SalaState)`, `setCurrentPlayerId(id)`, `upsertPlayer(player)`, `removePlayerById(id)`, `markVoted(playerId, hasVoted)`, `applyReveal(votes, stats: { median, mean, range, unanimous })`, `resetForNewRound(round)`, `setSalaEnded(reason)`, `pushToast(text, kind?)`, `dismissToast()`
- Selectors granulares: `useSala()`, `usePlayers()`, `useCurrentPlayer()`, `usePhase()`, `useTimer()`, `useCritical()`, `useRound()`, `useVotes()`, `useConsensus()`, `useMySeat()`
- **REGRA CRÍTICA:** Selectors devem ser imutáveis e retornar novas referências SOMENTE quando o subset relevante mudar (use shallow comparison ou filtros finos). Isso evita re-render excessivo.

**Pattern Zustand v5:** `import { create } from "zustand"` (Zustand v5 syntax — sem `createContext`/middleware requirido). Para TypeScript, declare interface do estado e exporte `useSalaStore` como `UseBoundStore<StoreApi<State>>`.

**Tests (`apps/web/src/store/sala.test.ts`):**
Use `bun:test` (já configurado: `bun test src/`). ≥4 testes:
1. `setSala` armazena sala
2. `applyReveal` injeta votos + stats
3. `resetForNewRound` limpa votos e incrementa round
4. Selectors retornam subset correto (teste usando `useSalaStore.getState().selectors`)

**Acceptance (gate "quick"):**
- `bun run --filter web test` passa com ≥4 testes
- `bun run typecheck` exit 0
- Arquivos: `apps/web/src/store/sala.ts` + `apps/web/src/store/sala.test.ts`

**Pontos de atenção:**
- NÃO modifique outros arquivos
- Use `import type` para tipos
- Siga o estilo do projeto: `bun:test` (`describe`/`test`/`expect`), strict TypeScript
- Após criar, execute `bun run test:web` no diretório raiz e verifique que ≥4 testes passam

Reporte: arquivos criados, contagem de testes, gate pass.

---
Update progress at: /Users/helder/last-chance/planning/.pi-subagents/artifacts/progress/d4d2b553/progress.md

---
**Output:**
Write your findings to exactly this path: /Users/helder/last-chance/planning/.agents/results/t22.json
This path is authoritative for this run.
Ignore any other output filename or output path mentioned elsewhere, including output destinations in the base agent prompt, system prompt, or task instructions.

## Acceptance Contract
Acceptance level: checked
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope

Required evidence: changed-files, tests-added, commands-run, residual-risks, no-staged-files

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```