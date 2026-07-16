# 03 — Remove heroVisible fade-out and switch header CTA to outline

Status: ready-for-agent
Depends on: 02

## Goal

Strip the `heroVisible` state machine from `landing.tsx` and the
`IntersectionObserver` that drives it. The header CTA becomes
**always visible, always interactive** — the rule "coral ≤1 CTA por
viewport" is reinterpreted as "1 CTA coral sólido por landing", and
the header's coral CTA switches to a new outline variant (added in
04) so it doesn't visually compete with the hero's solid coral
button.

This issue is the accessibility + regression fix; it must land
**before** 04 so the variant swap happens in a clean component
without leftover state.

## Decisions

- **Delete everything hero-visible-related in one shot.** Not in
  stages — the partial states are bugs themselves.
- **Hero CTA stays `variant="coral"`** (solid). This is the one solid
  coral CTA per landing.
- **Header CTA becomes `variant="coral-outline"`** (the new variant
  from 04). For this issue, the variant does not yet exist in
  `Button`. Two options for the agent:
  - (a) Add the variant now (out-of-scope creep, but small).
  - (b) Use `variant="coral"` for now + add a comment `// TODO(04):
    swap to coral-outline` and let 04 do both.
  Pick **(a)** — moving the variant definition to here is fine
  because it's a single line addition and unblocks landing tests
  from breaking on a missing variant. Update this issue's Touches
  section to reflect the choice if you go with (a).
- **`heroCtaRef` is no longer needed** in `landing.tsx`. The hero
  Button drops the `ref` prop. (Verify it's not used by any test —
  if `landing.test.tsx` queries the ref, drop the query.)

## Touches

- `apps/web/src/pages/landing.tsx`:
  - Delete `const heroCtaRef = useRef<HTMLButtonElement | null>(null);`
    (line 229).
  - Delete `const [heroVisible, setHeroVisible] = useState(false);`
    (line 230).
  - Delete the entire `useEffect` with the `IntersectionObserver`
    (lines 232-241).
  - Delete `const navCtaStyle = useMemo(...)` (lines 264-271).
  - On the hero Button (around line 364-374): remove `ref={heroCtaRef}`,
    keep everything else.
  - On the `<SiteHeader />` JSX (the result of 01): no props change
    needed, but the header's internal Button switches from
    `variant="coral"` to `variant="coral-outline"`. If you chose
    option (a), also add the variant definition to
    `apps/web/src/components/ui/button.tsx` in this issue.
- `apps/web/src/components/ui/button.tsx` (only if option (a)):
  - Add `coral-outline: "border-2 border-coral text-coral bg-transparent
    hover:bg-coral/10 focus-visible:ring-coral"` to the `cva`
    variants block (or whatever variant-definition pattern
    `button.tsx` uses — read the file first).
  - Ensure the new classes appear in
    `apps/web/tailwind.config.ts` content globs (they already do —
    `content: ["./src/**/*.{ts,tsx}"]`).
- `apps/web/src/pages/landing.test.tsx` (if it asserts on
  `heroVisible` indirectly via query selectors that now resolve
  differently):
  - Update selectors accordingly. Most likely no change — the test
    queries the Button by testid, which keeps its
    `data-testid="cta-nav-create-room"`.

## Verification

- `bun run --filter web typecheck` returns 0.
- `bun run --filter web test` passes.
- `grep -rn 'heroVisible\|heroCtaRef' apps/web/src` returns empty.
- `grep -rn 'IntersectionObserver' apps/web/src/pages/landing.tsx`
  returns empty.
- Manual at 1440x900:
  - Header CTA is visible at `scrollY = 0` AND at deep scroll
    positions (e.g. `scrollY = 3000`). No fade.
  - Tab order: Tab from URL bar enters the header CTA first
    (visible at top of page), then continues into hero content.
    No `tabindex="-1"` trap.
  - Screen reader (VoiceOver / NVDA): header CTA is announced
    normally at any scroll position.
  - Visual: hero CTA is solid coral, header CTA is outline coral
    (border + text, transparent fill). Both clearly CTAs; only
    one looks "primary".

## Out of scope

- Adding the code input to the header. Done in 04.
- Removing the hero's `<form>` block (input + Entrar button).
  Done in 04.
- Touching `tailwind.config.ts` — no new tokens needed.
- Touching `apps/web/src/index.css` — no new CSS needed.
- Modifying routes (`/join`, `/arena`, `/full`). Header stays
  scoped to landing only.