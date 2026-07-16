# 04 — Code input migration and Button variant completion

Status: ready-for-agent
Depends on: 03

## Goal

Migrate the 4-letter code input from the hero to the header. Hero
becomes: headline + subcopy + one solid coral "Criar sala agora"
button. Header becomes: logo + code input + outline coral "Criar
sala" button. This deduplicates the entry points (hero creates, header
enters) and makes the field accessible from any scroll position.

Also formalize the `coral-outline` Button variant (started in 03 if
option (a) was taken; finalized here regardless).

## Decisions

- **Code input goes between logo and the CTA Button** in the header
  layout. Grid: `grid-cols-[auto_1fr_auto]` or `flex justify-between
  items-center` with the input having `flex-1 max-w-[180px]` cap.
  Decision: flex with capped input width — matches neo-mirai's
  proportions and avoids awkward alignment on intermediate
  viewports.
- **Input reuses the hero's sanitization verbatim.** NFKD normalize,
  strip non-alphanumeric, slice(0,4), toUpperCase. Submit handler
  lives in `SiteHeader` (passed `onJoinWithCode: (code: string) =>
  void` prop); `landing.tsx` keeps `handleJoinWithCode` and passes
  it down. No new sanitization logic — copy-paste-with-rename, then
  refactor in a follow-up if it ever bites.
- **Hero block after this issue:**
  - Headline (`<h1>`)
  - Subcopy (`<p>`)
  - One Button "Criar sala agora" (solid coral)
  - Stat rings (`0 / 12 / 60`) — kept as-is
  - MockTable illustration — kept as-is
- **Hero block deleted:**
  - The "ou" divider (`hidden sm:flex` with two `h-px` lines and the
    "OU" label) — lines 376-385.
  - The `<form>` with input + Entrar button — lines 387-423.
  - The "código de 4 letras" hint — lines 424-429.
- **Mobile (<768px): header input is hidden, header CTA button is
  hidden.** The existing rule
  `@media (max-width: 767px) { .cta-sticky-nav { display: none } }`
  in `index.css:223-227` already hides the CTA button. Extend it to
  also hide the new code input (add `.site-header-code-input {
  display: none }` in the same media query). Hero keeps its inline
  CTA-only layout on mobile — but wait, the hero also loses the form
  in this issue. Result: on mobile, the only entry path is the hero
  CTA "Criar sala agora". To enter with a code on mobile, the user
  would have to… not be able to. **Decision: on mobile, render the
  input in the hero (not in the header).** This means the migration
  is conditional:
  - Desktop (≥768px): input in header, hero has no input.
  - Mobile (<768px): input in hero, header has no input/button.
  The hero CTA "Criar sala agora" stays in both viewports.
- **Why this asymmetry is OK:** the header is a desktop-only
  convenience layer. Mobile users see a focused hero with one
  obvious CTA. They can still paste a code in the hero input if they
  have one. Desktop users get the field persistently above the fold
  as they scroll.
- **Implementation:** use the existing `hidden sm:flex` /
  `sm:hidden` Tailwind classes to toggle visibility, mirroring the
  pattern already in the hero (the "ou" divider and code hint used
  this). No new media queries in `index.css` needed.

## Touches

- `apps/web/src/components/site-header.tsx`:
  - Add prop `onJoinWithCode: (code: string) => void`.
  - Add internal state `const [joinCode, setJoinCode] = useState("")`.
  - Add internal `handleSubmit` that calls the sanitization chain
    and invokes `onJoinWithCode(cleanCode)` if length === 4.
  - Add `<form onSubmit={handleSubmit}>` containing the input and
    submit button (or input alone with implicit submit via Enter).
  - Input gets `className="hidden md:block ..."` (md = 768px in
    Tailwind defaults — verify the project's `screens` config in
    `tailwind.config.ts`; if non-default, use the matching
    breakpoint class).
  - Update layout to flex layout: `<nav>` is
    `flex items-center gap-4`, then `<Link>`, `<form>` (input only,
    the form wraps the input), `<Button>Criar sala</Button>`.
- `apps/web/src/components/ui/button.tsx` (if not added in 03):
  - Finalize `coral-outline` variant with classes:
    `border-2 border-coral text-coral bg-transparent hover:bg-coral/10`.
- `apps/web/src/pages/landing.tsx`:
  - Pass `onJoinWithCode={(code) => navigate(\`/join?code=${code}\`)}`
    to `<SiteHeader />`. This handler is the trimmed-down version of
    `handleJoinWithCode` (no event arg, no preventDefault — the
    form's onSubmit already handles that internally in the header).
  - Delete the hero `<form>` (lines 387-423) — input + Entrar button.
  - Delete the "ou" divider (lines 376-385).
  - Delete the "código de 4 letras" hint (lines 424-429).
  - **Conditional restore for mobile:** if the input lived only in
    the header and mobile hides the header input, mobile loses code
    entry. Solution: wrap the deleted hero `<form>` in
    `<div className="md:hidden">…</div>` (or equivalent conditional)
    and keep it. The desktop version stays deleted. The hero CTA
    "Criar sala agora" stays unchanged in both viewports.
  - Verify `handleJoinWithCode` is now unused — if yes, delete it.
    If `landing.test.tsx` references it, update the test or keep
    the function as a thin wrapper.

## Verification

- `bun run --filter web typecheck` returns 0.
- `bun run --filter web test` passes.
- `bun run --filter web build` (vite build) — no Tailwind class
  purge warnings (verify by running with `--logLevel info` or
  reading the build output for missing-class warnings).
- Manual at 1440x900:
  - Top of page: header shows logo + input "XXXX" placeholder +
    outline coral "Criar sala" button. Hero shows headline +
    subcopy + solid coral "Criar sala agora" button + stat rings.
  - Type "ab1" in header input, paste "ABCD" — paste is
    sanitized to "ABCD" (uppercase, alphanumeric). Submit via
    Enter → navigates to `/join?code=ABCD`.
  - Type "  hello!  " then paste — sanitized to "HELL", sliced to
    "HELL" (4 chars), submitted on Enter → `/join?code=HELL`.
  - At `scrollY = 2000`: header input still visible, still
    functional. No focus loss.
- Manual at 375x812 (mobile viewport via DevTools):
  - Header shows only the logo (or is empty — see "Out of scope"
    below for the trade-off).
  - Hero shows headline + subcopy + solid coral "Criar sala agora"
    + inline input "XXXX" + Entrar button.
  - Pasting a code in the hero input on mobile still works.
- Lighthouse a11y ≥95 (input has accessible label, button has
  aria-label or visible text, focus order is sensible).
- `grep -n 'XXXX' apps/web/src/components/site-header.tsx` returns
  one hit (the input placeholder).
- `grep -rn 'código de 4 letras' apps/web/src` returns empty
  (deleted from hero).
- `grep -rn 'aria-hidden={heroVisible' apps/web/src` returns empty.

## Out of scope

- Refactoring the duplicated sanitization into a shared utility
  (`lib/sanitize-code.ts`). One-time copy-paste is fine; extract on
  second duplication.
- Adding the code input to `/join` or `/arena`. Out of scope —
  those routes have their own entry flow.
- Showing the "código de 4 letras" hint anywhere in the header
  (the input's `aria-label` already explains it).
- Touching the hero CTA copy. "Criar sala agora" stays.
- Touching `apps/web/src/index.css` — no new CSS rules; the
  breakpoint-toggling is pure Tailwind utility classes.
- Touching `tailwind.config.ts` — no new tokens or screens.
- Deciding whether to render the brand wordmark on mobile in the
  header. Out of scope: this issue hides the entire header CTA +
  input on mobile, but keeps the logo (which is just a `<Link>`
  without breakpoint hiding). If the logo looks lonely on mobile,
  that's a follow-up issue.