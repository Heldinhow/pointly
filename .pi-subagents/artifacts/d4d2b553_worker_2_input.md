# Task for worker

[Read from: /Users/helder/last-chance/planning/context.md, /Users/helder/last-chance/planning/plan.md]

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Você está implementando **T25 — Tailwind + Atelier Zero tokens** da Phase 5 do projeto Planning Poker (Pointly).

**Contexto:** Monorepo em `/Users/helder/last-chance/planning/`. Você trabalha em `apps/web/`. Tailwind v3.4, PostCSS, autoprefixer já instalados.

**Leia primeiro:** `apps/web/vite.config.ts` (estrutura atual) e `apps/web/src/index.html` (favicon, title).

**Spec T25 (vide `.specs/features/planning-poker-v1/tasks.md` linha ~753):**
Criar/configurar:
- `apps/web/tailwind.config.ts` — Tailwind config TypeScript com tokens Atelier Zero
- `apps/web/postcss.config.js` — PostCSS com tailwindcss + autoprefixer plugins
- `apps/web/src/index.css` — `@tailwind base/components/utilities` + Google Fonts imports + surface noise
- (opcional) `apps/web/src/styles/tokens.css` — exporta tokens como CSS variables se preferir

**Tokens Atelier Zero (do plan.md):**
```css
--bg:        #efe7d2;  /* paper */
--paper-warm:#ece4cf;
--paper-dark:#ddd2b6;
--surface:   #f7f1de;  /* bone, card elevado */
--fg:        #15140f;  /* ink */
--fg-soft:   #2a2620;
--fg-mute:   #5a5448;
--fg-faint:  #8b8676;
--accent:    #ed6f5c;  /* coral */
--coral-soft:#f08e7c;
--mustard:   #e9b94a;
--olive:     #6e7448;
```

**Fontes:** Inter Tight 700-900 (display sans), Playfair Display Italic 500 (italic/serif), Inter 300-500 (body), JetBrains Mono 400-500 (mono).

**Tailwind config:**
- `content: ['./index.html', './src/**/*.{ts,tsx}']`
- `theme.extend.colors`: tokens acima como `bg`, `surface`, `ink`, `ink-soft`, `ink-mute`, `ink-faint`, `coral`, `coral-soft`, `mustard`, `olive`, `paper-warm`, `paper-dark`
- `theme.extend.fontFamily`: `display: ['"Inter Tight"', 'sans-serif']`, `italic: ['"Playfair Display"', 'serif']`, `sans: ['"Inter"', 'sans-serif']`, `mono: ['"JetBrains Mono"', 'monospace']`
- `theme.extend.fontSize`: adicione uma `display-xl` clamp(70px, 13vw, 200px) usada no footer
- `theme.extend.borderRadius`: `card: '18px'`
- `theme.extend.boxShadow`: `bone: '0 30px 60px -30px rgba(21,20,15,0.15)'` (paper noise shadow)

**index.css:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800;900&family=Playfair+Display:ital,wght@1,500&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { /* CSS variables com os tokens Atelier Zero */ }
body { background: var(--bg); color: var(--fg); font-family: 'Inter', sans-serif; }
```

**Surface noise** — adicione a regra:
```css
.surface-noise::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,...");
  opacity: 0.06; mix-blend-mode: multiply;
}
```

(Gere um SVG turbulence inline mínimo — barulhento sutil.)

**Acceptance (gate "build"):**
- `bun run typecheck` exit 0
- `bun run build` (vite build) exit 0 (se conseguir testar)
- `bun run --filter web test` não regredir (2 smoke tests ainda passam)

**Pontos de atenção:**
- Use Tailwind v3 (não v4) — temos `tailwindcss@^3.4.17`
- NÃO modifique main.tsx, App.tsx, store/, lib/
- Apenas crie/modifique os arquivos listados acima
- Mantenha todos os tokens exatamente como no plan.md

**APÓS IMPLEMENTAR:** Rode `bun run --filter web typecheck` no root e confirme exit 0. Reporte arquivos criados, status do gate.

---
Update progress at: /Users/helder/last-chance/planning/.pi-subagents/artifacts/progress/d4d2b553/progress.md

---
**Output:**
Write your findings to exactly this path: /Users/helder/last-chance/planning/.agents/results/t25.json
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