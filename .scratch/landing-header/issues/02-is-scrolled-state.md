# 02 — is-scrolled state and fixed position

Status: ready-for-agent
Depends on: 01

## Goal

Convert `SiteHeader` from `position: sticky` (always fully opaque) to
`position: fixed` with a transparent-to-paper transition triggered by
scroll, matching the neo-mirai reference behavior. The header should
"materialize" as the user scrolls past 8px: transparent over the hero,
then `paper-warm` background + border-bottom + soft shadow once
scrolled.

The hero must not slide under the header content — add
`padding-top: var(--header-height)` (or use a CSS variable the agent
introduces) to whichever element wraps the hero content.

## Decisions

- **Threshold: `scrollY > 8`.** 8px avoids overscroll bounce on macOS
  trackpads. Configurable via a constant near the top of the file, no
  prop yet.
- **State management: `useState<boolean>` + `useEffect` with
  `requestAnimationFrame` throttle.** Do not use `IntersectionObserver`
  here — the listener is a single `window.scrollY` read per frame,
  cheaper than observer setup. Throttle via `requestAnimationFrame`
  flag (set `pending = true`, when the rAF callback fires read
  `scrollY` and clear flag) — not via `setTimeout`.
- **Reduced motion: read `window.matchMedia('(prefers-reduced-motion:
  reduce)').matches` once** in the effect and skip the state flip if
  true. Header still fixed, just always in the paper-warm state. The
  global rule in `index.css:65-73` already neuters CSS transitions;
  this JS guard prevents the `data-scrolled` attribute toggle which
  would otherwise still fire the transition if CSS allowed it.
- **CSS approach: keep Tailwind for the structural classes, add a few
  custom classes in `index.css`.** Don't fight Tailwind's purge by
  introducing arbitrary value strings. Use `data-scrolled="true"`
  attribute on `<nav>` and a `.site-header[data-scrolled="true"]` rule
  in `index.css` for the state-specific styles.
- **Header height: define `--header-height: 64px` in `:root` of
  `index.css`** so the hero padding and any future
  `scroll-margin-top` rules share one source of truth. Match
  neo-mirai's pattern.
- **No new z-index layers.** Reuse existing `z-20` (matches neo-mirai).
  The `side-rail` elements use `position: fixed` in their own
  breakpoint — verify they don't overlap visually with the new
  fixed header. They sit at `top: 0` and `border-left/right: 1px` —
  the header `max-width: 1360px mx-auto` is centered, so rails
  (outside 1360px) and header (inside 1360px) coexist visually at
  ≥1280px. Below 1280px the rails are hidden by their own
  `hidden xl:flex` class. Document this coexistence in a code comment
  on the header root.

## Touches

- `apps/web/src/components/site-header.tsx`:
  - Change `<nav className="... sticky top-0 ...">` to
    `<nav className="... fixed top-0 left-0 right-0 z-20 ...">`.
  - Add `useState<boolean>(false)` for `isScrolled`.
  - Add `useEffect` that registers a passive `scroll` listener with
    the rAF-throttle pattern. Inside, read `scrollY`, set
    `isScrolled(scrollY > 8)`. Cleanup removes the listener.
  - Add `data-scrolled={isScrolled}` attribute to `<nav>`.
  - Reduce-motion guard: skip the `setIsScrolled` if
    `prefers-reduced-motion: reduce` matches.
- `apps/web/src/pages/landing.tsx`:
  - The hero `<section>` (line 333) gets `style={{ paddingTop:
    "var(--header-height)" }}` OR the section element gets
    `className="pt-[var(--header-height)]"`. Pick the cleaner one;
    existing `pt-8 sm:pt-12` is replaced, not stacked.
  - The `<SectionRule roman="I." ...>` element (line 328) sits above
    the hero — confirm it doesn't go under the fixed header. If it
    does, add `scroll-margin-top: var(--header-height)` to
    `section[id]` (already declared globally in `index.css`). No
    change needed.
- `apps/web/src/index.css`:
  - Add `--header-height: 64px;` in `:root` block (around line 37,
    near other tokens).
  - Add at end of file (before the existing media queries):
    ```css
    .site-header {
      background: linear-gradient(
        180deg,
        oklch(94% 0.035 78 / 0) 0%,
        oklch(94% 0.035 78 / 0.72) 100%
      );
      transition:
        background 240ms ease-out,
        border-color 240ms ease-out,
        box-shadow 240ms ease-out;
    }
    .site-header[data-scrolled="true"] {
      background: var(--paper-warm);
      border-bottom: 1px solid oklch(58% 0.06 76 / 0.25);
      box-shadow: 0 18px 50px oklch(18% 0.03 76 / 0.08);
    }
    ```
  - Note: the OKLCH literals here are from neo-mirai's reference,
    which uses `oklch(94% 0.035 78 / ...)` as "paper". Pointly's
    `--bg` is `#efe7d2` (the `--bg` token). The agent should NOT
    copy neo-mirai's OKLCH literals literally — use
    `var(--paper-warm)` for the solid scrolled state. Keep the
    gradient transparent (`oklch` not needed) or use
    `rgba(236, 228, 207, 0)` (the RGB of paper-warm). For the
    scrolled border + shadow, use opacity-based ink color:
    `border-color: oklch(from var(--fg) l c h / 0.08);` OR a static
    hex with low opacity like `rgba(21, 20, 15, 0.08)` (matching
    `--fg`). The shadow uses `--bone` (already defined in
    `tailwind.config.ts:84` as `0 30px 60px -30px
    rgba(21, 20, 15, 0.15)`). Use the shadow token via
    `box-shadow: var(--shadow-bone);` after exposing it, OR inline
    `box-shadow: 0 18px 50px rgba(21, 20, 15, 0.08);`. Choose
    whichever fits the project's existing CSS variable convention —
    inspect `:root` and existing utility classes for precedent
    before adding new globals.

## Verification

- `bun run --filter web typecheck` returns 0.
- `bun run --filter web test` passes — `landing.test.tsx` should
  still find `cta-nav-create-room`. If tests check the header
  background, they need updating to read `data-scrolled`. Inspect
  `landing.test.tsx` first; if no header background assertions
  exist, this is a no-op.
- Manual scroll at 1440x900:
  - At `scrollY = 0`: header has no visible background, hero text
    shows through behind the logo.
  - At `scrollY > 8` (e.g. 100): header shows `paper-warm` solid
    background, 1px bottom border, soft shadow.
  - Scrolling back to top restores transparent background.
- Manual check at 1280x720 with side rails visible: rails and
  header don't visually overlap (header max-width 1360px keeps it
  centered; rails are in the 1280-1360 outer margins).
- Reduced motion: with macOS "Reduce motion" enabled in System
  Preferences, the header is always in the scrolled state from
  page load (no animation, no toggle).
- `grep -n 'sticky top-0' apps/web/src/components/site-header.tsx`
  returns empty.
- `grep -n 'position: sticky' apps/web/src/index.css` returns empty
  (no new sticky declarations introduced).

## Out of scope

- Removing `heroVisible` / `IntersectionObserver` from `landing.tsx`.
  Done in 03.
- Changing the CTA variant from `coral` to `coral-outline`. Done in
  03.
- Adding the code input or modifying the hero. Done in 04.
- Touching `apps/web/src/components/ui/button.tsx`. Done in 04.
- Touching `tailwind.config.ts`. No new tokens needed for this
  issue.