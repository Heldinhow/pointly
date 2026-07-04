# Task for worker

[Read from: /Users/helder/last-chance/planning/context.md, /Users/helder/last-chance/planning/plan.md]

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Você está implementando **T24 — Router setup** da Phase 5 do projeto Planning Poker (Pointly).

**Contexto:** Monorepo em `/Users/helder/last-chance/planning/`. Você trabalha em `apps/web/`. Stack: Bun + Vite + React 18 + TS + React Router 6.28.

**Specs do shared:**
- Tipos `SalaState`, `Player`, `Phase`, `Vote` via `@planning-poker/shared`

**Spec T24 (vide `.specs/features/planning-poker-v1/tasks.md` linha ~739):**
- **NÃO modifique App.tsx** (esse arquivo será tocado por T26)
- Crie `apps/web/src/routes.tsx` exportando `router` (router do React Router v6)
- Modifique `apps/web/src/main.tsx` para renderizar `<App/>`
- **`App.tsx` continua sendo o placeholder atual** — T24 não toca nele

**routes.tsx:**
Exporte um `router` criado com `createBrowserRouter` (ou `createHashRouter` se preferir) com 4 rotas:
1. `/` → `apps/web/src/pages/landing.tsx` (crie o arquivo com placeholder: `<div data-testid="page-landing">Landing</div>`)
2. `/join` → `apps/web/src/pages/join.tsx` (placeholder: `<div data-testid="page-join">Join</div>`)
3. `/arena` → `apps/web/src/pages/arena.tsx` (placeholder: `<div data-testid="page-arena">Arena</div>`)
4. `/full` → `apps/web/src/pages/full.tsx` (placeholder: `<div data-testid="page-full">Full</div>`)
5. `*` (catch-all 404) → `<div>Not Found</div>`

Use **lazy loading** com `React.lazy` + `Suspense` para code splitting:
```tsx
const Landing = React.lazy(() => import("./pages/landing").then(m => ({ default: m.Landing })));
```

Ou, se preferir routes inline, pode usar `createBrowserRouter` diretamente. Padrão recomendado React Router v6.28 data routers.

**main.tsx:**
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```
Garanta que importa `./index.css` (precisa para Tailwind do T25). E o `App.tsx` mantém o comportamento atual (placeholder visual) — T26 vai modificá-lo depois.

**Pages placeholder (`apps/web/src/pages/{landing,join,arena,full}.tsx`):**
Cada um é só um componente named export com um `<div data-testid="page-XYZ">XYZ</div>` por enquanto.

Exemplo `landing.tsx`:
```tsx
export function Landing() {
  return <div data-testid="page-landing">Landing</div>;
}
```

**Acceptance (gate "build"):**
- `bun run typecheck` exit 0
- `bun run --filter web test` exit 0 (smoke tests ainda passam — 2 tests)
- Browser deve mostrar 4 URLs (`/`, `/join`, `/arena`, `/full`) sem 404

**Pontos de atenção:**
- **NÃO modifique App.tsx** — placeholder atual deve permanecer
- Crie `apps/web/src/pages/` com 4 arquivos
- NÃO instale deps adicionais — `react-router-dom@6.28.0` já está em package.json
- Use Bun's path resolution (paths em tsconfig são `@/*`, `@planning-poker/shared`)

**APÓS IMPLEMENTAR:** Rode `bun run --filter web typecheck` no root e confirme exit 0. Reporte arquivos criados, contagem de placeholders, status.

---
Update progress at: /Users/helder/last-chance/planning/.pi-subagents/artifacts/progress/d4d2b553/progress.md

---
**Output:**
Write your findings to exactly this path: /Users/helder/last-chance/planning/.agents/results/t24.json
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