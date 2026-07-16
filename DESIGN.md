---
name: Pointly
description: Planning Poker web app using the Atelier Zero design system.
colors:
  primary: "#ed6f5c"
  primary-soft: "#f08e7c"
  primary-deep: "#b8412f"
  neutral-bg: "#efe7d2"
  paper-warm: "#ece4cf"
  paper-dark: "#ddd2b6"
  neutral-surface: "#f7f1de"
  neutral-text: "#15140f"
  text-soft: "#2a2620"
  text-mute: "#3a352a"
  text-faint: "#4a4438"
  jewelry-mustard: "#e9b94a"
  jewelry-olive: "#6e7448"
typography:
  display:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 700
    letterSpacing: "-0.04em"
  brand-mark:
    fontFamily: "Playfair Display, Georgia, serif"
    fontStyle: "italic"
    fontSize: "28px"
    fontWeight: 500
  logo:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "11px"
    letterSpacing: "0.04em"
    fontWeight: 400
rounded:
  card: "18px"
  full: "9999px"
spacing:
  sm: "16px"
  md: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.primary-soft}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
  button-default:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.full}"
  card-elevated:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.card}"
    padding: "28px"
---

# Design System: Pointly

## 1. Overview

**Creative North Star: "The Atelier Zero Gallery"**

Pointly's visual language is artisanal, restrained, and tactile. It treats the digital workspace like a physical gallery: structured around fine lines, clean margins, and an off-white warm paper canvas. Identity is driven by strategic typographic choices and a high-contrast ink hierarchy, rather than heavy background fills or elaborate UI frames.

Every page features a fine SVG fractal noise filter to mimic the texture of heavy paper. The design deliberately rejects the cold, sterile conventions of modern software design: there are no generic blue CTAs, no soft grey boxes, and no glow/glassmorphism. 

**Key Characteristics:**
- **Paper & Ink Foundation**: The interface relies on warm paper tones and dark ink text, establishing immediate reading contrast.
- **Micro-textured Surfaces**: All containers and full pages apply a subtle SVG turbulence noise in a radial gradient mask.
- **Restrained Jewelry**: High-chroma color is strictly capped; primary coral is limited, and mustard yellow is reserved exclusively for highlights.

## 2. Colors

Pointly's colors follow the Atelier Zero palette, prioritizing warm neutrals and high contrast.

### Primary
- **Terracotta Coral** (`#ed6f5c` / `oklch(69% 0.17 32)`): Used exclusively for primary CTAs and active states.
- **Coral Soft** (`#f08e7c`): Hover state for primary CTAs.
- **Coral Deep** (`#b8412f`): Accessibility-safe coral (5.8:1 contrast) for small text labels, active icons, and secondary hover states.

### Neutral
- **Warm Parchment** (`#efe7d2` / `oklch(93% 0.02 85)`): Main body background (`--bg`). Imparts a physical, organic feel.
- **Bleached Ivory** (`#f7f1de` / `oklch(96% 0.01 88)`): Elevated surface container color (`--surface`). Used for cards and overlays.
- **Carbon Ink** (`#15140f` / `oklch(15% 0.005 85)`): Body text and high-priority solid UI boundaries (`--fg`).
- **Paper Warm** (`#ece4cf`): Subtle warm tint for input/field backgrounds (`--paper-warm`). Distinguishes form fields from card surfaces without adding visual weight.
- **Paper Dark** (`#ddd2b6`): Container/avatar backgrounds on the parchment surface (`--paper-dark`). Used for non-elevated tiles inside a bone card.
- **Ink Soft** (`#2a2620`): Secondary text — links, helper copy.
- **Ink Mute** (`#3a352a`): Tertiary text — labels, captions.
- **Ink Faint** (`#4a4438`): Quaternary text — micro-copy, uppercase tags, helper annotation.

### Accent (jewelry)
- **Antique Gold / Mustard** (`#e9b94a`): Jewelry highlight for nav dot, vote-mediana underline, stars. Never covers >1% of any screen.
- **Olive** (`#6e7448`): Confirmation state — copy success, checkmark, optimistic feedback. Never as a CTA.

### Dark Mode overrides
In dark mode, the color hierarchy shifts to a low-luminance warm palette to maintain reading comfort under low ambient light:
- **Carbon Charcoal** (`#13120d`): Main dark background (`--bg`).
- **Parchment Dark** (`#1a1914`): Elevated container surfaces (`--paper-warm`).
- **Container Dark** (`#222019`): Avatar/tile background (`--paper-dark`).
- **Dark Surface** (`#1b1a14`): Card surface (`--surface`).
- **Ivory Soft** (`#f7f1de`): Body text color (inverted from Bleached Ivory, `--fg`).
- **Coral Soft** (`#f08e7c`): Dark-mode primary CTA (`--accent`). Brighter than light-mode coral to maintain contrast against charcoal.
- **Coral Deep** (`#ed6f5c`): Accessible coral for small labels in dark mode (`--coral-deep`). Different value than light mode because light-mode `--coral-deep` is too dark on charcoal.
- **Mustard Bright** (`#f4cd68`): Jewelry in dark mode (`--mustard`).
- **Olive Bright** (`#8a9163`): Confirmation in dark mode (`--olive`).

### Named Rules
**The Single CTA Rule.** No more than one solid coral CTA may be visible within a single screen viewport. Secondary actions must use border outlines or ghost treatments.
**The Jewelry Scale Rule.** High-chroma highlights like Antique Gold (`#e9b94a`) must cover less than 1% of any screen surface. They are jewelry, not structural color.

## 3. Typography

**Display Font:** Inter Tight (fallback: system-ui, sans-serif)
**Body Font:** Inter (fallback: system-ui, sans-serif)
**Italic Font:** Playfair Display (fallback: Georgia, serif)
**Mono Font:** JetBrains Mono (fallback: ui-monospace, monospace)

### Hierarchy

A ramp inteira é twelve-step, intencional. Todo valor fora dela é tell de IA.

| Token | Size | Line | Weight | Tracking | Uso |
|---|---|---|---|---|---|
| `display-xl` | clamp(70, 13vw, 200) | 0.95 | 500 | -0.04em | Mega footer `Pointly.`, display numbers |
| `card-title` | 34 | 1.05 | 800 | -0.03em | h1 dentro de Card (Join, Arena) |
| `card-mark` | 36 | 1 | 500 (italic) | 0 | Ø glyph dentro de Card |
| `headline` | clamp(1.5, 3vw, 2) rem | 1.15 | 700 | -0.03em | Section title fora de Card (Landing) |
| `brand-mark` | 28 | 1 | 500 (italic) | 0 | Ø no lockup primário (Landing nav) |
| `logo` | 24 | 1 | 800 | -0.03em | Wordmark primário |
| `nav-mark` | 22 | 1 | 500 (italic) | 0 | Ø no site-header lockup secundário |
| `nav-wordmark` | 18 | 1 | 800 | -0.02em | Wordmark do site-header secundário |
| `vote-mark` | 20 | 1 | 500 (italic) | 0 | Glyph Fibonacci em vote card (Seat face-up) |
| `vote-numeral` | 18 | 1 | 500 (italic) | 0 | Glyph Fibonacci em cards compactos (Seat trigger, /full) |
| `body` | 16 | 1.5 | 400 | 0 | Texto corrido, listas, tabelas, inputs |
| `caption` | 14 | 1.55 | 400 | 0 | Micro-copy abaixo de headlines |
| `label` | 11 | 1.4 | 500 (mono) | 0.04em | Labels uppercase em JetBrains Mono |
| `micro-label` | 10 | 1.4 | 500 (mono) | 0.04em | Tags de header, contadores, FIG.## |

### Named Rules

**The Ramp Rule.** Use um token da tabela acima para qualquer texto. `text-[Npx]` solto é tell de IA — pare, escolha o token mais próximo, ou proponha extensão da ramp em PR.
**The No-Condensed Display Rule.** Letter spacing on display headings must never go below -0.04em. Anything tighter makes the glyphs collide, hurting legibility and character.
**The Playfair Highlight Rule.** The Playfair Display font is used exclusively in italics for the brand Ø glyph and numerical deck values (e.g., Fibonacci cards). Never use it for standard headings or body copy.

## 4. Elevation

Pointly uses a structural and tactile approach to depth. There is no heavy stacked shadowing. Depth is established through the juxtaposition of the main Warm Parchment background with Bleached Ivory surface cards, using subtle ink-tinted borders and a single ambient shadow.

### Decision: why two shadow tokens

**Two tokens exist because two surface archetypes coexist in the product.** A bordered container (Card, banner, section) carries its elevation in the hairline itself — the shadow is just an ambient nudge. A borderless floating surface (modal, popover, toast) has no border to carry the lift, so the shadow has to do all the work — hence the wider blur.

| Surface archetype | Border | Shadow | Examples |
|---|---|---|---|
| Container (in-flow) | `border-ink/5` (1px) | `shadow-card` (≤8px blur) | `Card`, banners, sections |
| Floating (overlay) | none | `shadow-bone` (~60px blur) | modals, popovers, tooltips, toasts |
| Coral CTA | none | `shadow-coral` (~26px blur) | primary buttons (coral) |

**Do not collapse the two tokens into one.** If `shadow-bone` were tightened to ≤8px to match `shadow-card`, floating overlays would lose all their lift and visually recede into the surface below. If the Border+Shadow Rule were loosened (allow `border-ink/5 + shadow-bone` together), every Card becomes a "ghost card" — the saturated Codex tell.

The rule and the two-token system are inseparable. They are the same architectural decision, not two competing ones.

### Shadow Vocabulary

- **Card Shadow** (`box-shadow: 0 4px 8px -1px rgba(21, 20, 15, 0.10)`): The default for bordered containers — `Card`, banners, sections that carry a 1px hairline. ≤8px blur, low opacity, slight negative spread. Deliberately small so it doesn't compete with the border.
- **Bone Shadow** (`box-shadow: 0 30px 60px -30px rgba(21, 20, 15, 0.15)`): Reserved for **borderless** floating surfaces — modals, popovers, tooltips, toasts. The dramatic 60px blur carries the lift alone (no border needed).
- **Coral Shadow** (`box-shadow: 0 14px 26px -16px rgba(237, 111, 92, 0.6)`): Applied to primary coral buttons to give them a tactile, active pressed feel. No border on the button — only shadow.

### Named Rules

**The Border-Plus-Shadow Rule.** Never combine a `border-ink/5` (or any 1px border) with `shadow-bone`. The pairing reads as a "ghost card" — soft wide drop shadow plus hairline border — and is a saturated Codex tell. Pick **one** elevation cue:
- Bordered containers pair with `shadow-card` (≤8px blur).
- Borderless floating surfaces use `shadow-bone` alone.
- A single 1px border at ink/5 with no shadow is also fine.

**Exception — pills (toast, projectile menu).** Compact floating pills (`rounded-full` with `border` AND `shadow-bone`) are exempt from this rule. The pill silhouette carries identity; without the border, the shadow defines a vague blob. The pairing reads as a tactile object (e.g. confetti-like toast) — not a ghost card — because the radius is tight (`rounded-full`, not `rounded-card`). Document these as `pill archetype` in component code so reviewers know the rule was considered.

If a feature needs both a border AND dramatic lift, drop one or the other — not both.

### Counter-Scale Rule (Arena)

The Arena's table (960×560) is **scaled** to fit any viewport via `--arena-scale` (ResizeObserver, range 0.45–1). `transform: scale()` shrinks the parent's bounding box — including tap targets inside it. Anything interactive must counteract the scale.

**Two acceptable patterns:**

1. **Relocate** the interactive element OUTSIDE the scaled container. Example: RevealButton lives in `arena-reveal-wrapper`, not `arena-table-inner`. Its bounding box is read in CSS pixels and stays ≥44×44 regardless of `--arena-scale`.
2. **Counter-scale** the element with `transform: scale(calc(1 / var(--arena-scale, 1)))` so it visually appears unchanged. Example: TimerPill wrapper, deck wrapper. The wrapper's outer bounding box is the **inverse** of the parent's, so `getBoundingClientRect()` reports the visual size.

**Forbidden pattern:** placing interactive elements inside a scaled container without counter-scaling. Their reported tap targets will report the scaled (smaller) size, failing the 44×44 WCAG minimum in mobile viewports.

This rule is mechanical, not aesthetic — violating it produces silent a11y regressions on small screens.

## 5. Components

### Buttons
- **Shape:** Full pill-shaped (rounded-full).
- **Primary:** Solid Terracotta Coral background, white label, size md (h-10 px-5) or lg (h-12 px-7). Pairs with `shadow-coral` (no border).
- **Hover / Focus:** Transitions to Coral Soft background, active state translate-y-px. Focus ring uses coral-deep at ~40% opacity with a offset-bg ring.
- **Secondary / Default:** Transparent background, 1px border at ink/20, text color Carbon Ink. Hovers to border-ink/40.

### Cards / Containers
- **Corner Style:** Gently curved corners (18px radius).
- **Background:** Bleached Ivory (`var(--surface)`) background.
- **Shadow Strategy:** 1px border at ink/5 + `shadow-card` (≤8px blur). NOT `shadow-bone`.
- **Internal Padding:** 28px padding by default (md scale).
- **Exception — pills (toast, projectile menu, IDLE/VOTED badge):** Compact floating pills (`rounded-full` with `border` AND `shadow-bone`) are exempt from the Border+Shadow Rule. The tight pill silhouette carries identity; without the border, the shadow defines a vague blob. See §4 "Pill exception" for the full rationale.

### Inputs / Fields
- **Style:** Clean border at ink/10, rounded-lg, background `var(--paper)`.
- **Focus:** Sharp transition to `border-coral` with a 2px focus-visible ring at `coral-deep/40` for AA contrast.
- **A11y note:** small coral labels and error text below 14px must use `text-coral-deep` (5.8:1 contrast on paper). Never `text-coral` for size ≤13px.

## 6. Do's and Don'ts

### Do:
- **Do** apply the `.surface-noise` class to all primary page roots and cards to maintain a unified tactile texture.
- **Do** use Playfair Display italic for all Fibonacci cards and the brand Ø mark.
- **Do** ensure small labels and icons in coral use the accessible Coral Deep (`#b8412f`) to meet AA contrast standards.

### Don't:
- **Don't** use border-left or border-right accent stripes on cards or lists.
- **Don't** use gradient text or glassmorphism blurs.
- **Don't** use standard sans-serif uppercase eyebrows on every section (use section rules `.sec-rule` instead).
- **Don't** round cards or sections with border-radius larger than 18px (except for fully rounded buttons or tags).
