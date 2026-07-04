# Task for worker

[Read from: /Users/helder/last-chance/planning/context.md, /Users/helder/last-chance/planning/plan.md]

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Você está implementando **T23 — WebSocket client wrapper** da Phase 5 do projeto Planning Poker (Pointly).

**Contexto:** Monorepo em `/Users/helder/last-chance/planning/`. Você trabalha em `apps/web/`. Stack: Bun + Vite + React 18 + TypeScript + Zod (via shared).

**Shared types disponíveis:**
```ts
import {
  type HelloPayload, type CastVotePayload, type RevealVotesPayload,
  type StartNewRoundPayload, type PingPayload,
  type WelcomeResponse, type RoomStateResponse, type PlayerJoinedEvent,
  type VoteCastEvent, type VotesRevealedEvent, type RoundStartedEvent,
  type SalaEndedEvent, type ErrorEvent, type PongPayload,
  type ClientToServerEvent, type ServerToClientEvent,
  // Zod runtime dos eventos:
  ClientHelloEventSchema, ServerWelcomeSchema, ServerRoomStateSchema,
  // ... (vide packages/shared/src/schemas/events.ts)
} from "@planning-poker/shared";
```

**Spec T23 (`apps/web/src/lib/ws-client.ts` + `ws-client.test.ts`):**
API factory: `createWSClient(options: { url?: string; onEvent: (e: ServerToClientEvent) => void }) → { connect, send, close, status }`

- `url` lido de `import.meta.env.VITE_WS_URL` (default: `ws://localhost:3001/ws`)
- `connect()` abre WS; valida cada evento recebido com Zod (rejeita malformed — logs warn, drop)
- `send(event: ClientToServerEvent)` serializa e envia; valida com Zod antes
- Auto-reconnect exponencial backoff: 1s, 2s, 4s, ..., max 30s. Cap retries configurável (default infinito)
- Heartbeat: envia `ping` a cada 30s; se `pong` não chega em 5s, fecha + reconnect
- `status: 'idle' | 'connecting' | 'open' | 'closed' | 'error'` observável via getter
- `close()` para heartbeat e fecha WS sem reconnect

**ONDE ENCONTRAR OS SCHEMAS:**
- `packages/shared/src/schemas/events.ts` tem os Zod schemas. Leia esse arquivo para ver nomes exatos (`HelloPayloadSchema`, `WelcomeResponseSchema`, etc.) e a discriminated union de eventos.

**Tests (`apps/web/src/lib/ws-client.test.ts`, ≥5 testes):**
Use `bun:test`. Mock o `WebSocket` global injetando uma classe fake antes de cada test (no test setup). Cover:
1. `connect` retorna status 'open' quando mock aceita
2. Eventos recebidos são parseados via Zod e entregues ao `onEvent` callback
3. Eventos malformed são dropados (Zod rejeita) sem throw
4. `send` valida payload antes de chamar `ws.send` (mock `ws.send`)
5. Reconnect dispara após `close` event do mock (use fake timers se possível — senão, mock direto o handler)
6. Heartbeat: verifica que `ping` é enviado após 30s (com fake timers)

**Acceptance (gate "quick"):**
- `bun run test:web` passa com ≥5 testes em `ws-client.test.ts`
- `bun run typecheck` exit 0
- Files: `apps/web/src/lib/ws-client.ts` + `apps/web/src/lib/ws-client.test.ts`

**Pontos de atenção:**
- Use `globalThis.WebSocket = MyMock` no test setup pra mockar
- TypeScript strict: `noUncheckedIndexedAccess` etc.
- NÃO modifique outros arquivos
- Zod parse errors devem ser logados com `console.warn`, não throw

**APÓS IMPLEMENTAR:** Execute `bun run --filter web test` no root e verifique gate. Reporte arquivos criados, contagem de testes, status.

---
Update progress at: /Users/helder/last-chance/planning/.pi-subagents/artifacts/progress/d4d2b553/progress.md

---
**Output:**
Write your findings to exactly this path: /Users/helder/last-chance/planning/.agents/results/t23.json
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