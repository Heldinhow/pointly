# Task for worker

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Você está implementando **T26 — Atelier Zero primitive library + shadcn/ui base** da Phase 5 do projeto Planning Poker (Pointly).

**Contexto:** Monorepo em `/Users/helder/last-chance/planning/`. Você trabalha em `apps/web/`. Stack: Bun + Vite + React 18 + TS + Tailwind v3 (tokens Atelier Zero prontos) + clsx + tailwind-merge + class-variance-authority.

**Já pronto:**
- T22: `apps/web/src/store/sala.ts` (Zustand store com `useSalaStore`, selectors granulares com `useShallow`)
- T23: `apps/web/src/lib/ws-client.ts` (factory com `createWSClient`)
- T24: `apps/web/src/routes.tsx` (exporta `router` e `<AppRouter/>`)
- T25: `tailwind.config.ts` + `postcss.config.js` + `index.css` (tokens Atelier Zero prontos)
- `packages/shared/src/schemas/sala.ts` exporta `Player`, `SalaState`, `Vote`, `Phase`, `DECK_VALUES`
- `packages/shared/src/types.ts` re-exporta os tipos

**Arquivos atuais:**
- `apps/web/src/App.tsx` é placeholder (renderiza "Pointly" em paper) — **VOCÊ pode modificá-lo** para adicionar ToastProvider
- `apps/web/src/main.tsx` renderiza `<App/>`
- `apps/web/src/test-setup.ts` importa `@testing-library/jest-dom/vitest` (vitest-specific). Você pode editar para `bun:test` se necessário — `@testing-library/jest-dom` (sem `/vitest`) é compatível com `bun:test`.

**Spec T26 (vide `.specs/features/planning-poker-v1/tasks.md` linha ~770):**

Crie **primitivos Atelier Zero** em `apps/web/src/components/ui/`:

1. **`cn(...inputs)` helper** (`utils.ts`) — clsx + tailwind-merge para merge de classes condicionais.

2. **`button.tsx`** — shadcn-style Button com `cva` (class-variance-authority):
   - variants: `default` (ghost: border ink-at-20%, transparent bg), `coral` (CTA: bg coral, label white), `ghost` (no border, transparent), `link` (underline ink)
   - sizes: `sm`, `md`, `lg`
   - Props: `<Button variant="coral" size="lg" ...>` extends React.ButtonHTMLAttributes<HTMLButtonElement>

3. **`card.tsx`** — Bone-fill card com Tailwind classes:
   - `bg-surface rounded-card shadow-bone border border-ink/5 p-7 surface-noise relative`
   - Subcomponents: `<CardHeader>`, `<CardBody>`, `<CardFooter>` (optional)
   - Props: opcional `padding` ("sm" | "md" | "lg")
   - `relative` + `z-10` para a surface-noise ::before não sobrescrever o conteúdo

4. **`pill.tsx`** — Pill com variants:
   - `default`: bone-fill, mono numerics, ink-faint
   - `critical`: bg coral-soft, label coral, ink mantida
   - `gold`: bg mustard-soft (ou border mustard), label ink
   - `ghost`: transparent, border 1px ink-at-20%
   - sizes: `sm`, `md`

5. **`toast.tsx`** — Sistema de toast (provider + hook):
   - `<ToastProvider>` (wraps children)
   - `useToast()` hook retorna `{ push: (text, kind?) => void }`
   - Renderiza toasts posicionados (fixed top-center) com auto-dismiss 3s
   - **Acessibilidade:** role="status", aria-live="polite", aria-atomic="true"
   - Vitest/bun:test — sem dependência de DOM

6. **`ellipse.tsx`** — `<Ellipse>` primitive:
   - dashed border + radial gradient (bg paper-dark radial)
   - Props: `width`, `height`, `children` (the children render absolutely positioned inside)
   - Use SVG ou Tailwind — escolha a mais limpa

7. **`connection-status.tsx`** — Indicator:
   - variants: `loading` (pulse + texto "Conectando..."), `error` (coral dot + texto), `connected` (olive dot + texto "Conectado")
   - Renderiza pequeno pill com dot + label

8. **`seat.tsx` (PRIMITIVE, NÃO Seat completo)** — primitives para `Seat` component de T31:
   - Props: `isYou`, `isHost`, `state` ('idle' | 'voted' | 'disconnected' | 'revealed'), `faceUp` (boolean), `children`
   - Aplica borda coral 2px outer se isYou, gold 2px inner (box-shadow inset) se voted-mediana (prop dedicada futura — só estrutura)
   - Bone-fill base, opacity transition

**Integração — App.tsx:**
- Modifique `apps/web/src/App.tsx` para renderizar `<AppRouter/>` wrapped em `<ToastProvider>`:
  ```tsx
  import { ToastProvider } from "./components/ui/toast";
  import { AppRouter } from "./routes";

  export function App() {
    return (
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    );
  }
  ```
- Pode remover o placeholder "Pointly" — AppRouter já cuida de landing/join/arena/full

**Testes (`apps/web/src/components/ui/*.test.tsx`):**
Use `bun:test` com `@testing-library/react` (já instalado). Configure jsdom:
- Crie `apps/web/src/components/ui/test-setup.tsx` que importa `@testing-library/jest-dom` (sem `/vitest`) e configura jsdom.
- OU atualize o `apps/web/src/test-setup.ts` global.
- Para bun:test com jsdom, use `bun test --preload ./test-setup.ts` ou configure via `bunfig.toml`.

**≥5 testes (gate "quick"):**
1. `button.test.tsx`: renderiza `Button` coral com texto esperado
2. `card.test.tsx`: renderiza Card com children + classe surface-noise
3. `pill.test.tsx`: renderiza Pill com variant critical (coral-soft bg)
4. `toast.test.tsx`: push via hook renderiza toast com role="status"
5. `connection-status.test.tsx`: renderiza variant loading mostra "Conectando..."
6. (bônus) `ellipse.test.tsx`: renderiza Ellipse com children
7. (bônus) `seat-primitive.test.tsx`: aplica borda coral quando isYou=true

**Acceptance:**
- `bun run --filter web test` passa com ≥5 testes novos
- `bun run typecheck` exit 0
- Files created: button.tsx, card.tsx, pill.tsx, toast.tsx, ellipse.tsx, connection-status.tsx, seat.tsx (primitive), utils.ts + tests
- File modified: `apps/web/src/App.tsx` (ToastProvider + AppRouter)

**Pontos de atenção:**
- Bun:test com jsdom: configure o bunfig do web (`apps/web/bunfig.toml`) OU preload global
- React Testing Library + bun:test requires hooks globais (`bun test --preload`); use o `test-setup.ts` existente
- Use TypeScript strict (noUncheckedIndexedAccess etc.) — null checks onde necessário
- Tokens Atelier Zero: `bg-coral`, `bg-coral-soft`, `bg-surface`, `text-ink`, `text-ink-soft`, `text-ink-faint`, `border-coral`, `rounded-card` estão disponíveis em Tailwind por causa do T25
- NÃO modifique `store/`, `lib/`, `routes.tsx`, `main.tsx`, `tailwind.config.ts`, `index.css`
- Símbolo brand Ø: use a classe `.brand-glyph` ou `font-italic` (Playfair)

**APÓS IMPLEMENTAR:** 
1. Rode `bun run --filter web test` no root — confirme ≥5 testes novos passam
2. Rode `bun run typecheck` no root — confirme exit 0
3. Reporte arquivos criados, contagem de testes, status dos gates.

---
**Output:**
Write your findings to exactly this path: /Users/helder/last-chance/planning/.agents/results/t26.json
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