Phase 5 implementada. Resumo:

**Phase 5 — Client core (T22–T26) — completa ✓**

| Task | Status | Tests |
|---|---|---|
| **T22** Zustand store | ✓ via subagente | 29 |
| **T23** WebSocket client wrapper | ✓ via subagente | 18 |
| **T24** Router setup | ✓ via subagente | (build only) |
| **T25** Tailwind + Atelier Zero tokens | ✓ via subagente | (build only) |
| **T26** Primitive library + shadcn base | ✓ worker | 41 |

**T26 (esta execução) — primitivos Atelier Zero:**

**Arquivos criados** (`apps/web/src/components/ui/`):
- `utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `button.tsx` — 4 variants (coral/default/ghost/link) × 3 sizes
- `card.tsx` — bone-fill + surface-noise + subcomponents (Header/Body/Footer)
- `pill.tsx` — 4 variants (default/critical/gold/ghost) × 2 sizes
- `toast.tsx` — Provider + `useToast()` hook com auto-dismiss 3s + a11y
- `ellipse.tsx` — SVG mesa da Arena com radial gradient + dashed border
- `connection-status.tsx` — 3 variants (loading/error/connected) com dot
- `seat.tsx` — primitive (T31 instancia com lógica)
- `test-helpers.tsx` + `jest-dom-augment.ts` — bootstrap para bun:test + RTL
- `button.test.tsx` (8), `card.test.tsx` (5), `pill.test.tsx` (6), `toast.test.tsx` (5), `connection-status.test.tsx` (4), `ellipse.test.tsx` (4), `seat-primitive.test.tsx` (9) = **41 testes novos**

**Arquivos modificados:**
- `apps/web/src/App.tsx` — wrap `AppRouter` em `ToastProvider`
- `apps/web/bunfig.toml` — preload `test-jsdom.ts` (DOM globals antes de test files)
- `apps/web/src/test-jsdom.ts` — instala jsdom globals
- `apps/web/package.json` — adiciona `@types/jsdom`
- `apps/web/src/index.css` — restaurado conteúdo Tailwind (race condition com T24)

**Resultados agregados finais:**
- `bun run test:web` → **90 pass / 0 fail** (2 → 90, +88)
- `bun run typecheck` → todos os 4 workspaces exit 0

**Pontos de atenção resolvidos:**
- bun:test + jsdom: preload em `bunfig.toml` garante DOM antes do `screen` ser cacheado
- jest-dom types augmentados via `declare module "bun:test"`
- Race condition entre T24 e T25 (sobrescrita do `index.css`) corrigida: restaurado conteúdo Tailwind

**Riscos residuais:**
- `@testing-library/dom` v10 cacheia `screen.body` em module-load — depende de preload ser executado antes; documentado em `test-helpers.tsx`
- T26 é só estrutura visual dos primitivos; componentes de arena (T31-T37) consomem e adicionam comportamento de negócio (avatar inicial, vote state, animações face-up)