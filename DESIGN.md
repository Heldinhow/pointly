---
version: alpha
name: Pointly — Autonomy / Industrial
colors:
  bg: "#f5f5f5"
  surface: "#ffffff"
  ink: "#1f1d1c"
  ink-soft: "#3d3a39"
  ink-mute: "#4d4947"
  ink-faint: "#5c5855"
  table: "#ebebeb"
  accent: "#ee6018"
  on-accent: "#1f1d1c"
  accent-hover: "#ef6f2e"
  line: "#ccc9c7"
  signature: "#ef6f2e"
  focus: "#9c3d08"
  danger: "#a32e3b"
  danger-soft: "#ffe8eb"
  success: "#256a52"
  success-soft: "#dff2e9"
  warning: "#835007"
  warning-soft: "#fff0ce"
  avatar: "#e4e0de"
  avatar-ink: "#3d3a39"
  avatar-self: "#1f1d1c"
  avatar-self-ink: "#fafafa"
  avatar-blue: "#d8d3d0"
  avatar-blue-ink: "#2e2c2b"
  avatar-rose: "#f3d9c8"
  avatar-rose-ink: "#7a3410"
typography:
  display-hero:
    fontFamily: Geist
    fontSize: clamp(3.25rem, 4.6vw, 4.6rem)
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: -0.04em
  display-landing:
    fontFamily: Geist
    fontSize: clamp(2rem, 3.5vw, 3.2rem)
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: -0.045em
  display-entry:
    fontFamily: Geist
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: -0.04em
  numeral:
    fontFamily: Geist
    fontSize: 1.65rem
    fontWeight: 700
  body:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  lede:
    fontFamily: Geist
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.65
  caption:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 800
    letterSpacing: 0.08em
rounded:
  sm: 3px
  md: 6px
  lg: 8px
  card: 8px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.lg}"
    minHeight: 44px
    padding: 12px 20px
    fontWeight: 800
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-outline:
    textColor: "{colors.ink}"
    borderColor: "{colors.line}"
    rounded: "{rounded.lg}"
    minHeight: 44px
  card-surface:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.line}"
    rounded: "{rounded.card}"
  deck-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.line}"
    rounded: "{rounded.lg}"
    size: 64px x 84px
  deck-card-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  felt-table:
    backgroundColor: "{colors.table}"
    borderRadius: 38% / 30%
  avatar:
    backgroundColor: "{colors.avatar}"
    textColor: "{colors.avatar-ink}"
    rounded: "{rounded.full}"
    size: 36px
---

# Pointly — Autonomy / Industrial

Factory-tokens system effectively rendered after Task 1 (commits 065ae15..21badfb). Replaces Mesa compartilhada / Azul tinta integrally. Source of truth is the rendered code: `apps/web/src/index.css` (`:root` + dark) + `apps/web/tailwind.config.ts` + `apps/web/src/styles/*.css`. This document describes exactly what is rendered — no invented tokens.

## Overview

Industrial autonomy: warm-neutral surfaces, hairline borders, one orange accent ramp, no elevation on cards. The landing shows the experience next to an elliptical table demo; the arena stages presence, vote and discussion on a felt ellipse with an accent ring. Light theme is Factory paper (`#f5f5f5` page, `#fff` raised, `#ebebeb` sunken); dark is a warm tonal derivation (`#161413` / `#1f1d1c` / `#0a0908`), never blue. Name Pointly preserved; symbol `pointly-mark` stays a 2×2 grid rotated -8° (three pieces `accent`, the fourth `signature`), now at 13px cells / 3px gap (11px mobile).

## Ref precedence

Tokens were extracted from the live Factory refs in this order; higher rows win on conflict.

| Prec. | Ref | What was adopted |
|---|---|---|
| 1 | factory.ai (`/_next/static/css/*.css`, `:root` verbatim) | Raw source tokens: accent ramp, surfaces, neutrals 100–1000, radii, type scale, 1440px column, flat hairlines |
| 2 | factory.ai /product/cli | Same system, no new tokens (CLI product page) |
| 3 | factory.ai /company#careers | Same system; the 01–07 numbered list is editorial content, NOT adopted (numbered eyebrow rejected) |
| 4 | docs.factory.ai | Own Mintlify theme, lowest precedence, NOT adopted (only confirms dark industrial aesthetic) |

## Colors

Raw Factory source tokens live verbatim at the top of `:root` in `index.css`; semantic tokens below remap via `var()`. Accent ramp: `--accent-100 #ef6f2e`, `--accent-200 #ee6018`, `--accent-300 #d15010`. Surfaces: page `#f5f5f5`, sunken `#ebebeb`, raised `#fff`. Neutrals: `100 #d6d3d2, 200 #ccc9c7, 300 #b8b3b0, 400 #a49d9a, 500 #8a8380, 600 #5c5855, 700 #4d4947, 800 #3d3a39, 900 #2e2c2b, 1000 #1f1d1c`. Light/dark bases (`#eee`/`#fafafa`, `#020202`/`#101010`) and `theme-color #f5f5f5` are carried verbatim; `::selection` is accent bg + on-accent text.

| Role | Light | Dark |
|---|---|---|
| Page (`bg`) | #f5f5f5 | #161413 |
| Surface (`surface`) | #ffffff | #1f1d1c |
| Sunken (`sunken`) | #ebebeb | #0a0908 |
| Ink (`fg`) | #1f1d1c | #ede9e4 |
| Ink soft (`fg-soft`) | #3d3a39 | #d6d3d2 |
| Ink mute (`fg-mute`) | #4d4947 | #b8b3b0 |
| Ink faint (`fg-faint`) | #5c5855 | #a49d9a |
| Table (`table`) | #ebebeb | #2e2c2b |
| Primary (`primary`, neutral, ≠ accent) | #1f1d1c | #ede9e4 |
| On-primary (`on-primary`) | #fafafa | #1f1d1c |
| Primary hover (`primary-hover`) | #3d3a39 | #d6d3d2 |
| Action (`accent` = accent-200) | #ee6018 | #ef6f2e |
| Action deep (`accent-deep` = accent-300) | #d15010 | #ee6018 |
| Action hover (`accent-hover` = accent-100) | #ef6f2e | #f1854d (derived: accent-100 +15% toward white) |
| Accent ink (`accent-ink`) | #9c3d08 (incumbent hover shade, kept: white on it is 6.81 AA; white on accent-300 would be 4.32, fails) | #ef6f2e (= accent) |
| Accent ink as text (Task 3) | kickers/eyebrows, VOCÊ badge, post-reveal hover, all small orange-on-light text — accent #ee6018 at 12px on light is 3.05, fails; accent-ink is 6.24 light / 6.11 dark | same token |
| Text on action (`on-accent`) | #1f1d1c | #1f1d1c |
| Accent soft (`accent-soft`) | #fdeede | #3e271b |
| Signature (`signature` = accent-100) | #ef6f2e | #ef6f2e |
| Hairline (`border-rule`) | #ccc9c7 | #3d3a39 |
| Focus (`focus`) | #9c3d08 | #ef6f2e |
| Danger / soft | #a32e3b / #ffe8eb | #ff6b6b / #4c2635 |
| Success / soft | #256a52 / #dff2e9 | #8fce9f / #1f433d (Task 3: text #6fab78 on soft was 4.03, fails AA — lightened one step; text on surface 9.19) |
| Warning / soft | #835007 / #fff0ce | #f0a330 / #46391e |

Avatars keep their own bg/ink pairs (light / dark): `avatar` #e4e0de / #3d3a39 with ink #3d3a39 / #ede9e4; `avatar-self` #1f1d1c / #ef6f2e with ink #fafafa / #1f1d1c; `avatar-blue` #d8d3d0 / #4d4947 with ink #2e2c2b / #ede9e4; `avatar-rose` #f3d9c8 / #5a2f18 with ink #7a3410 / #f3d9c8. Error/attention/success use distinct semantic tokens; labels and shapes complement color, never color alone. `theme-color` meta: `#f5f5f5` light / `#161413` dark.

### AA pairs (measured, python script — Task 1)

- Light rest on-accent/accent `#1f1d1c`/`#ee6018`: **5.05** · Light hover on-accent/hover `#1f1d1c`/`#ef6f2e`: **5.58**
- Dark rest on-accent/accent `#1f1d1c`/`#ef6f2e`: **5.58** · Dark hover on-accent/hover `#1f1d1c`/`#f1854d`: **6.56**
- Body/muted text pairs pass AA in both themes (light body 15.40, dark body 15.20). Hairlines sit ~1.6 in both themes, same as the Factory ref (non-text, by design).

### Dark strategy

The old blue dark system (`#141a2b`…) was discarded. Dark is a warm tonal derivation of the Factory light tokens: neutral-1000-based surfaces (`#161413` page / `#1f1d1c` raised / `#0a0908` sunken), accent steps one rung lighter than light (rest = accent-100, deep = accent-200, hover = derived `#f1854d` so hover stays distinct from rest), hairline = neutral-800 `#3d3a39`. Theme selection: `data-theme` light/dark on `html` wins; otherwise `prefers-color-scheme: dark` applies the same dark block; `color-scheme` is set per theme.

## Typography

Geist for interface AND display, Geist Mono for code/timer/room-code. Loaded via fontsource (OFL-1.1, Vercel Geist Project) in `main.tsx`: sans latin 400/500/600/700/800, mono latin 400/500/600. Stacks: `Geist, Inter, system-ui, -apple-system, sans-serif`; mono `"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace`. No Space Grotesk, no Manrope, no local `/fonts` files. Titles use `text-wrap: balance` (h1–h3); ledes cap at ~44ch.

### Full tailwind config scale (`tailwind.config.ts`)

| Token | Size | Line-height / tracking / weight |
|---|---|---|
| `brand-mark` | 28px | 1 / 500 |
| `nav-mark` | 22px | 1 |
| `vote-mark` | 20px | 1 / 500 |
| `vote-numeral` | 18px | 1 / 500 |
| `caption` | 14px | 1.55 |
| `body` | 16px | 1.5 |
| `label` | 12px | 1.4 / 0.08em / 800 |
| `micro-label` | 10px | 1.4 / 0.04em |

Plus `letterSpacing` extras: `caps` 0.06em, `eyebrow` 0.18em, `tight` -0.02em, `tighter` -0.03em, `display` -0.04em.

### Actually rendered (CSS rules in use)

- **Hero h1** (landing): Geist, `clamp(3.25rem, 4.6vw, 4.6rem)` (mobile `clamp(3rem, 14vw, 4.2rem)`), 800, lh 1.04, ls -.04em; `em` accent, non-italic.
- **Section h2** (landing): `clamp(2rem, 3.5vw, 3.2rem)`, 700, lh 1.04, ls -.045em.
- **Entry title**: 3rem (mobile 2rem), 700, lh 1.08, ls -.04em. **Recovery title**: `clamp(2.3rem, 7vw, 4.4rem)`, 700, lh .98, ls -.055em.
- **Lede**: 17px/1.65 `fg-mute`, 44ch. **Body** 16px/1.5, **caption** 14px/1.55, **label/eyebrow/kicker** 12px 800 uppercase ls .08em.
- **Numerals/codes**: Geist/Geist Mono — room code (entry-code-value) and timer use mono with tabular-nums and wide tracking (.18em–.2em) uppercase; `vote-numeral` (18px/500) renders seat vote badges and mobile avatars; `vote-mark` (20px/500) renders revealed numerals; `brand-mark` renders projectile emoji; `nav-mark` renders the help title; `micro-label` + `caps` render status pills.
- **Pruned in Task 3 (zero tsx consumers)**: `display-xl`, `card-title`, `display-hero`, `card-mark`, `nav-wordmark` removed from `tailwind.config.ts`. The phantom `fontFamily.italic` key is also gone — it hijacked Tailwind's `font-italic` utility into a font-family, so `font-italic` usages (deck/seat/mobile-row numerals) were rendering Geist-as-family instead of an italic style; all five switched to `font-display` (numerals are non-italic by design, zero visual change).

## Layout

Header fixed 68px (`--header-height`), landing transparent-until-scroll (border transparent → `border-rule` on `data-scrolled`), entry header always hairline-bordered. Content column `--content-column: 1440px`, gutter `--content-gutter: 1rem`; landing caps at 1500px with 48px inline padding (28px ≤900px, 20px ≤600px). Landing hero: two-column desktop (copy ≤650px + table demo ≥430px tall), stacked mobile. Steps: intro + 3-column grid desktop, single column mobile — plain list, no numbered-eyebrow pattern. Arena desktop: 920/560 stage, felt ellipse at inset 15%/10%/13%, seats `clamp(7rem, 11vw, 9rem)` (6.75rem ≤720px); mobile: 2-column seat list + bottom card dock. Deck: 64×84px desktop (4rem×5.25rem, 8px radius), 3.2×4.4rem in the mobile dock, horizontal scroll when overflowing with edge-peek affordance. Spacing scale 4px (xs 4, sm 8, md 16, lg 24, xl 32). Minimum 44px hit targets on buttons/controls; `scroll-padding-top: 96px`; safe-area insets honored.

## Elevation & Depth

Flat as rule: `--shadow-card: none`, `--shadow-coral: none`; cards are `surface` + 1px `border-rule`, header has no shadow (`--shadow-header: transparent`). The only depth token is `--shadow-bone: 0 16px 48px rgb(31 29 28 / 18%)`, reserved for true overlays: the help modal card and the mobile reveal dock (sticky floating surface). Task 3 resolved all three Task 2 exceptions toward flat: seat cards lost the hardcoded `0 10px 24px` (`arena.css`) and the `shadow-bone` base (`SeatPrimitive`) — state reads from the coral 2px border + inset warning ring, never shadow; the deck shell lost `shadow-bone` (it was a ghost card: border + ≥16px shadow) and now renders `surface` + hairline, flat like every card.

Felt keeps the accent ring (1px `color-mix(accent 24–30%)` inner ring) instead of shadow; header depth comes from `backdrop`/border only (landing) — entry header is a flat hairline.

## Shapes

System 3/6/8 + card 8px: controls/inputs/buttons/deck-cards/deck-shell/shells at `--radius-lg` 8px (Task 3 folded the strays: `rounded-[9px]` ×5 in arena/empty-overlay/help-modal, deck `rounded-xl`/`rounded-2xl` cards+shell, all → `rounded-lg`); pills at 8px (`pointly-pill`, was 7px); mini-cards at Factory md 6px (was 5px); avatars fully round; arena felt elliptical (`38% / 30%`, landing demo `50%`). Kept as Factory-verbatim/semantic: `pointly-mark` cells 4px (Factory md), VOCÊ badge bare `rounded` 4px, capsule `rounded-full` only where the pill shape is semantic (reveal CTA, state pills, cooldown badge, projectile menu). Ghost-card rule: `entry-form-shell` / `recovery-shell` use `box-shadow: var(--shadow-card)` (= none) — border-only cards. Focus: visible 3px `outline` in `focus` with 2–4px offset on all interactive elements.

## Components

- **Primary button** (`.pointly-button`, `Button` coral variant `bg-accent text-on-accent`, landing/header/entry/reveal variants): `accent` bg + `on-accent` text, 8px radius, ≥44px targets, 800 weight; hover → `accent-hover` (light: one verbatim ramp step lighter `#ee6018→#ef6f2e`; dark: derived `#f1854d`) with translateY(-1px) on landing/header CTAs; 150ms transitions, transform/opacity only. (Task 3: tailwind `primary`/`on-primary` now resolve honestly to `var(--primary)`/`var(--on-primary)` — the neutral pair — and the coral variant names `accent` directly instead of aliasing through `primary`.)
- **Outline/secondary button**: `fg` text, 1px `border-rule`, transparent bg; hover → accent border + accent text (landing) or `table` bg (`.pointly-button-outline`).
- **Surface card** (`.pointly-card`, entry/recovery shells): `surface` + 1px `border-rule`, 8px radius, no shadow.
- **Deck card**: `surface`, `border-rule`, 8px, Geist numeral; selected → `accent`/`on-accent` (+ accent border, lifts ~7px in arena); disabled 60% opacity; `aria-pressed` is the selection signal. Shell is flat `surface` + hairline, 8px (Task 3: was `bg-paper-warm` — camouflaged against the page bg — with `rounded-2xl` + `shadow-bone`).
- **Seat (arena)**: 52px avatar (`accent` 16% mix on `surface`), ellipsis name, state badge below (`Pensando`/`Votou`/`Revelado`/`Reconectando`), revealed vote numeral in accent 1.65rem; "me" ring in accent.
- **Pills**: 8px; critical = `warning-soft`/`warning`; gold/default = `table`/`fg`; timer-critical is `coral-soft` bg + `ink` text (AA); network banner is `feedback-danger` (the old `text-coral-deep` class was dead — unlayered `.feedback-danger` wins — and removed in Task 3).
- **Feedback**: empty panel (`bg` 92% + `surface` mix, block hairlines), modal shell/card (`shadow-bone`), danger/success variants on soft tokens with `color-mix` borders, status dots, `aria-live="polite"` toasts; close button 44px, 8px radius.
- **Brand**: `.pointly-brand` Geist 700 26px (23px mobile) ls -.035em; mark 2×2 rotated -8°, accent cells + `signature` fourth cell offset (1px,1px).

## Estados

Coverage in `design/redesign-2026/coverage.md`. Every page has a clear action, loading and recovery state. Solo invite stays reachable inside the room; help remains a focus-trapped modal. Votes never leak pre-reveal; server stays authoritative. Motion is feedback-only: projectile, hit-shake, dodge-slide, reaction fade-up on ease-out curves; global CSS clamps `transition-property` to transform/opacity, and `prefers-reduced-motion: reduce` collapses everything to .01ms instant. Invalid inputs get `danger` borders + error text; disabled controls sit at 50% opacity.

## Do's and Don'ts

- Do use `accent` for the primary action and selection; `signature` (= accent-100) is reserved to the brand mark's fourth cell and attention accents — never large surfaces.
- Do keep AA ≥4.5 for body text in both themes; `fg-mute` is the contrast floor for secondary text, never below it.
- Do use `accent-ink` (not `accent`) for small orange text — kickers, eyebrows, badges, hovers: raw accent at ≤14px on light is ~3.0, fails; large display numerals (≥24px, or ≥18.66px bold) pass at 3:1 and may stay accent.
- Do use Geist for display + interface, Geist Mono for code/timer/numerals — no other families.
- Do keep cards flat: `surface` + 1px hairline + 8px radius; new shadows need a token, not a hardcoded `box-shadow`.
- Don't use the discarded Mesa/Azul-tinta language anywhere: no ink-blue `#354c91`, no cold bg `#f5f6fa`, no blue dark `#141a2b`, no Space Grotesk/Manrope, no paper texture/serifs.
- Don't add gradient text, ghost cards (border + shadow ≥16px), radii ≥32px, numbered eyebrows, or hero-metrics — all rejected from the Factory refs.
- Don't animate layout; motion is transform/opacity only, feedback only.

## Compatibilidade

Internal variant/utility names (`coral`, `paper`, `mustard`, `olive`) remain ONLY as compatibility aliases resolving to the new tokens — they are not the discarded identity. Code wins; the previous DESIGN.md mapping text was stale drift. Actual `var()` targets in `index.css`:

| Alias | Resolves to | Light value |
|---|---|---|
| `paper-warm` | `var(--bg)` | #f5f5f5 |
| `paper-dark` | `var(--sunken)` | #ebebeb |
| `coral` | `var(--accent)` | #ee6018 |
| `coral-soft` | `var(--accent-soft)` | #fdeede |
| `coral-deep` | `var(--accent-deep)` | #d15010 |
| `mustard` | `var(--accent)` | #ee6018 (NOT signature) |
| `olive` | `var(--success)` | #256a52 |

Tailwind keeps the same alias keys (`paper` → `surface`, `ink*` → `fg*`, `coral*`/`mustard`/`olive` → above) because tested consumers render them (`deck.test.tsx`, `pill`, `timer-pill`, `reveal-button`, `MobilePlayerList` voted-dot `bg-olive`, seat/reveal `bg-coral`). Transport, schemas, store and rules are untouched by the redesign.
