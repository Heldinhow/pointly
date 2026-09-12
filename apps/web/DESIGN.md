---
name: Pointly
description: Planning Poker web para times ágeis — salas efêmeras, votação síncrona, zero cadastro.
colors:
  primary: "#171717"
  ink-hover: "#383838"
  on-primary: "#fafafa"
  neutral-bg: "#f5f5f5"
  neutral-surface: "#ffffff"
  neutral-sunken: "#ebebeb"
  border: "#c9c9c9"
  danger: "#a32e3b"
  danger-soft: "#ffe8eb"
  success: "#256a52"
  success-soft: "#dff2e9"
  warning: "#835007"
  warning-soft: "#fff0ce"
  felt: "#c4d0c7"
  felt-edge: "#b0bfb3"
  felt-ink: "#1b2a21"
  avatar: "#dedede"
  avatar-blue: "#d0d0d0"
  avatar-rose: "#e8e8e8"
typography:
  display:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "clamp(3rem, 5.2vw, 4.6rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.5vw, 3.2rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Geist Mono', ui-monospace, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
  xl: "8px"
  2xl: "10px"
  3xl: "12px"
  card: "10px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  input-field:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  card:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.card}"
    padding: "28px"
---

# Design System: Pointly

## 1. Overview

**Creative North Star: "The Workshop Table"**

Pointly looks like a well-kept workbench: flat gray surfaces, hairline borders, and type that organizes instead of decorating. Density is restrained — one idea per viewport, generous whitespace, hairline rules doing the separating. The aesthetic philosophy is contained precision: monochrome carries the interface, a single sage-green felt marks the arena, and status colors speak only when something needs a verdict. This system explicitly rejects the generic SaaS dashboard (identical icon-card grids, giant hero metrics, an uppercase kicker over every section) and any casino-poker cliché — no green felt excess, no suits, no neon.

Motion is feedback, never choreography: only transform and opacity move (150–420ms on exponential-out curves), and every animation collapses to near-zero under reduced motion. On small screens the system stacks instead of squeezing — the hero goes single-column, the deck becomes a snap-scroll dock, pills reflow rather than collide.

**Key Characteristics:**
- Monochrome workbench: ink on light gray, borders instead of shadows.
- One saturated surface per screen at most: the sage arena felt.
- Mono labels in uppercase carry metadata; display type carries voice.
- Flat by default; depth is a border, not a blur.

## 2. Colors

Restrained monochrome with one structural green and verdict-only status hues.

### Primary

- **Workshop Ink** (#171717): CTAs, body text, primary buttons. The single darkest value on screen; nothing goes darker.

### Neutral

- **Workbench** (#f5f5f5): page background, light theme.
- **Paper White** (#ffffff): cards and raised surfaces.
- **Sunken Gray** (#ebebeb): wells, table fills, recessed fills.
- **Hairline** (#c9c9c9): the 1px border that separates everything.
- **Sage Felt** (#c4d0c7): the arena table surface, with **Felt Edge** (#b0bfb3) rails and **Felt Ink** (#1b2a21) type on top. The only saturated surface in the system.
- **Avatar Grays** (#dedede, #d0d0d0, #e8e8e8): seat and player avatars; tinted per-player fallbacks (peach, blue, self, rose) exist for the landing demo.

### Status (verdicts only)

- **Signal Red** (#a32e3b on #ffe8eb): errors and destructive states.
- **Signal Green** (#256a52 on #dff2e9): success confirmations.
- **Signal Amber** (#835007 on #fff0ce): warnings and the critical timer state.

Dark mode is automatic (prefers-color-scheme plus manual toggle): background drops to near-black (#111), surfaces to #191919, ink inverts to #eee, and the felt deepens to pine (#1d3527) with pale felt ink (#eef3ef). Status hues lighten to hold contrast against dark fills.

### Named Rules

- **The One Surface Rule.** At most one saturated surface per viewport — either the arena felt or a status fill, never both competing.
- **The Verdict Rule.** Status colors appear only attached to a verdict (error, success, warning). Never as decoration, never as brand.
- **The Hairline Rule.** Separation is always a 1px Hairline border. If a boundary needs more than that, the layout is wrong, not the border.

## 3. Typography

**Display Font:** Geist (with Inter, system-ui fallback)
**Body Font:** Geist (with Inter, system-ui fallback)
**Label/Mono Font:** Geist Mono (with ui-monospace, Menlo fallback)

**Character:** A single sans family in disciplined weights, voiced by uppercase display cuts and mono micro-labels. No serif, no second voice — contrast comes from scale, case, and tracking, not from pairing.

### Hierarchy

- **Display** (500, clamp(3rem, 5.2vw, 4.6rem), line-height 1, tracking -0.04em, uppercase on desktop): hero headlines only. Ceiling is 4.6rem; above that the page shouts.
- **Headline** (500, clamp(2rem, 3.5vw, 3.2rem), line-height 1.04): section titles and entry/recovery titles.
- **Title** (700, 18px, line-height 1.2): step and card titles inside sections.
- **Body** (400, 16–17px, line-height 1.6–1.65, max 44ch): ledes, descriptions, form copy. Long prose caps at 44–75ch.
- **Label** (600, 12px, tracking 0.06em, uppercase): eyebrows, pills, timer readouts, metadata. Timer numerals use tabular figures.
- **Deck numeral** (600, 20px, Geist, upright — never italic): Fibonacci card faces.

### Named Rules

- **The Tracking Floor Rule.** Display tracking never goes below -0.04em. Tighter and glyphs collide.
- **The Single Voice Rule.** Geist speaks everywhere; Geist Mono annotates. No third family, no italic display, no gradient text — emphasis is weight or size.
- **The Balance Rule.** Headlines ship with balanced wrap; long prose with pretty wrap. No orphaned words, no ragged shouting.

## 4. Elevation

This system is flat by default and says so: shadows are zeroed at the token level (card, accent, and header shadows are all none or transparent) and tonal layering plus 1px Hairline borders carry every boundary. The single exception is the modal card, which floats on one ambient shadow (0 16px 48px rgb(31 29 28 / 18%)) because it must detach from the page behind a scrim.

### Shadow Vocabulary

- **Modal lift** (`box-shadow: 0 16px 48px rgb(31 29 28 / 18%)`): dialog and overlay cards only. Nothing else casts a shadow.

### Named Rules

- **The Flat-By-Default Rule.** Surfaces rest flat. If an element needs elevation to be understood, it is either a modal — or the layout needs rethinking.
- **The Border-Not-Blur Test.** If a boundary disappears when you remove its border, no shadow may rescue it. Fix the border.

## 5. Components

Contained and precise: small radii, mono uppercase actions, honest states.

### Buttons

- **Shape:** sharp small radius (3px) on every button, reveal included. Pills (999px) are reserved for seat cards only.
- **Primary:** Workshop Ink fill (#171717) with off-white text (#fafafa), mono 13px semibold uppercase with wide tracking, padding 12px 20px, min-height 44–46px.
- **Hover / Focus:** fill warms to ink-hover (#383838) with a 1px lift on landing CTAs; focus is always a 3px solid outline offset 2–3px — never a glow, never removed.
- **Secondary / Ghost / Link:** transparent fill inside a 1px Hairline border; ghost is borderless ink-soft text; link is underlined ink. Disabled drops to 40–50% opacity, no color shift.

### Inputs / Fields

- **Style:** recessed Workbench fill (#f5f5f5), 1px Hairline border, radius 4px, min-height 3.15rem, semibold 16px text (never below 16px — iOS zooms otherwise). Code fields are mono, letterspaced, centered, uppercase.
- **Focus:** 3px solid outline plus border-color shift to focus ink. Placeholder text holds full-contrast muted ink at full opacity.
- **Error / Disabled:** invalid fields take a Signal Red border with an inline red message; disabled controls fade, never recolor.

### Cards / Containers

- **Corner Style:** 10px card radius (12px max for shells and modals).
- **Background:** Paper White on Workbench pages; recessed panels mix Workbench toward surface.
- **Shadow Strategy:** none — see Elevation. Borders do the work.
- **Border:** 1px Hairline, always.
- **Internal Padding:** 20–28px shells; tight 6px pill seats in the arena.

### Pills / Tags

- **Style:** mono micro-labels at radius 3px — status, timer, and reveal alike. 999px is seat-only. Critical timer pill is amber wash with amber text and amber border; gold/median pill is amber wash with ink text.
- **State:** timer flips to critical at 30s or less; stats pill shows median, mean, and range after reveal.

### Navigation

- Fixed 72px header shared by landing, entry, and arena. Brand mark left (30px two-card glyph + 26px wordmark), mono uppercase actions right. Past the scroll point the nav collapses into a bordered capsule that insets symmetrically. On mobile the capsule is dropped for a plain hairline rule and the wordmark stands alone. Touch targets never go below 44px.

### Signature Components

- **Arena felt:** an elliptical sage table (radial felt gradient, 22px rail, stitched inner border) holding up to 12 pill seats around its edge. The center inlay carries round state and the reveal action.
- **Seat pill:** 8.5rem × 3.75rem pill with 40px avatar, name, and mono state. Your seat is marked by a 2px outline offset 3px — never a stripe, never a fill change. Host gets a small ink star (amber is verdict-only).
- **Fibonacci deck:** 9 cards (0, ½, 1, 2, 3, 5, 8, 13, ☕) at 64×84px desktop / 48×68px mobile, radius 8px, chunked into lows / highs / pause by hairline dividers. Selected card is solid ink with off-white numeral; hover shifts the border only — cards never jump. On small screens the dock scroll-snaps horizontally with edge peeks.
- **Toasts:** top-stacked under the header on desktop, bottom-docked on mobile. Success is a green wash with green text at full contrast; error inverts to solid red with white text.

## 6. Do's and Don'ts

### Do:

- **Do** keep one primary action per viewport in solid Workshop Ink (#171717).
- **Do** separate surfaces with 1px Hairline borders (#c9c9c9) on flat fills.
- **Do** set display type in Geist 500, uppercase, tracking at or above -0.04em.
- **Do** reserve the Sage Felt (#c4d0c7) for the arena table and Signal hues for verdicts.
- **Do** give every interactive element a visible 3px focus outline and a 44px minimum target.
- **Do** collapse motion to a crossfade under reduced motion.

### Don't:

- **Don't** build identical icon-plus-heading-plus-text card grids — vary the composition or drop the cards.
- **Don't** ship a giant-number hero-metrics strip; stats live in pills attached to the round they describe.
- **Don't** put a tiny uppercase tracked kicker over every section — one deliberate kicker per page is voice, one per section is scaffolding.
- **Don't** number sections 01/02/03 unless the section truly is an ordered sequence the reader must follow.
- **Don't** use side-stripe accent borders thicker than 1px on cards, seats, or alerts.
- **Don't** use gradient text, glassmorphism, or decorative blur anywhere.
- **Don't** dress the game as a casino — no green-felt excess beyond the arena table, no card suits, no neon.
- **Don't** let body or placeholder text fall below 4.5:1 contrast against its fill.
