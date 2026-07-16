# 01 — Extract SiteHeader component

Status: ready-for-agent

## Goal

Move the existing sticky navigation block out of
`apps/web/src/pages/landing.tsx` (lines 301-325) into a standalone
component `apps/web/src/components/site-header.tsx`, with the same
markup and behavior. This unblocks 02 (state changes), 03 (logic
removal), and 04 (input migration) because each one needs to touch a
single file instead of reaching into the 762-line landing page.

After this issue lands, `landing.tsx` should render `<SiteHeader />` in
place of the inline `<nav>`, and nothing user-visible should change.

## Decisions

- Component is a default-export function returning JSX. No props in
  this issue — the input/state changes come in 02-04.
- Keep the data-testid `cta-nav-create-room` on the inner Button so
  existing tests in `landing.test.tsx` keep passing.
- Import `handleCreateRoom` from `landing.tsx`? **No.** Pass it as a
  prop (`onCreateRoom: () => void`) to keep the component decoupled
  from `useNavigate` and the landing-specific handler. This is the
  thin seam that lets 04 add a second handler for code submission
  without touching `landing.tsx` again.
- Component file uses the same import style as
  `apps/web/src/components/seat.tsx` (named React imports, no
  barrel).
- The `@media (max-width: 767px) { .cta-sticky-nav { display: none } }`
  rule at `index.css:223-227` continues to hide the header Button on
  mobile. Inherited behavior, not changed in this issue.

## Touches

- `apps/web/src/components/site-header.tsx` (new) — accepts
  `onCreateRoom: () => void`, renders the same `<nav>` markup.
- `apps/web/src/pages/landing.tsx`:
  - Add `import { SiteHeader } from "../components/site-header";`
  - Delete lines 301-325 (the inline `<nav>...</nav>`).
  - Replace with `<SiteHeader onCreateRoom={handleCreateRoom} />`.

## Verification

- `bun run --filter web typecheck` returns 0.
- `bun run --filter web test` — all existing tests pass, including
  any `landing.test.tsx` assertions about `cta-nav-create-room`.
- Visual diff: at 1440x900, the header looks identical to before
  extraction (same wordmark, same coral CTA, same `bg-bg/95`
  background, same `sticky top-0` behavior).
- `grep -n 'sticky top-0' apps/web/src/pages/landing.tsx` returns
  empty (the sticky class is now inside `site-header.tsx`).
- `grep -n 'SiteHeader' apps/web/src/pages/landing.tsx` returns one
  hit (the new import + JSX usage).

## Out of scope

- Changing `sticky` to `fixed`. Done in 02.
- Adding the `is-scrolled` state. Done in 02.
- Removing `heroVisible` / `IntersectionObserver`. Done in 03.
- Adding the code input or the `coral-outline` variant. Done in 04.
- Touching `apps/web/src/index.css`, `tailwind.config.ts`,
  `apps/web/src/components/ui/button.tsx`. Done in 02 / 04.
- Other routes (`/join`, `/arena`, `/full`) — header still scoped to
  landing only.