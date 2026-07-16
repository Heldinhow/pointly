---
target: /Users/helder/last-chance/planning/apps/web/src/pages/landing.tsx
total_score: 33
p0_count: 0
p1_count: 1
timestamp: 2026-07-15T23-14-32Z
slug: apps-web-src-pages-landing-tsx
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Input validation feedback is clear, but CTA lack loading feedback during room connection transitions. |
| 2 | Match System / Real World | 4/4 | Terminology matches Portuguese Planning Poker domains perfectly ("sala", "mediana", "deck Fibonacci"). |
| 3 | User Control and Freedom | 4/4 | standard navigation, logo links to home, clear theme toggle support. |
| 4 | Consistency and Standards | 2/4 | Font size drift in header (`22px`, `26px`, `9px`) and ad-hoc button overrides. Violates the Border-Plus-Shadow Rule. |
| 5 | Error Prevention | 4/4 | Numeric and uppercase constraints on room join codes prevent invalid form submissions. |
| 6 | Recognition Rather Than Recall | 4/4 | Clean, sequential 3-step guide provides immediate inline documentation. |
| 7 | Flexibility and Efficiency | 3/4 | Standard keyboard form submission works, but no custom accelerators or keyboard shortcuts. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Major contrast issues on primary coral CTAs (3.0:1) and header outline button (2.43:1). Scrolled header uses banned ghost-card shadow. |
| 9 | Error Recovery | 4/4 | Input constraint handles all validation; no error paths can trigger on this page. |
| 10 | Help and Documentation | 3/4 | Excellent inline step-by-step documentation, but no searchable help or FAQ pages. |
| **Total** | | **33/40** | **Good** |

---

### Anti-Patterns Verdict

#### LLM Assessment
The design is aesthetically beautiful and captures the "Atelier Zero Gallery" editorial style well. However, it contains two notable anti-patterns:
- **Low Contrast CTAs**: The primary CTAs use white text on light coral background, creating a severe accessibility hurdle (3.0:1 contrast ratio). The header button is even worse (2.43:1 ratio).
- **Ghost-Card Header Shadow**: Once scrolled, the site header combines a 1px border with a soft 50px blur box shadow. This violates the project's *Border-Plus-Shadow Rule* and falls under the absolute ban for decorative drop-shadow/border pairing.

#### Deterministic Scan
The CLI design system scanner successfully completed and flagged 3 warnings in `site-header.tsx`:
- **Line 97**: Font size `text-[22px]` is off the `DESIGN.md` type ramp.
- **Line 100**: Font size `text-[26px]` is off the `DESIGN.md` type ramp.
- **Line 107**: Font size `text-[9px]` is off the `DESIGN.md` type ramp.
These arbitrary font sizes represent styling drift from the project's standardized typography scale (which designates `11px` for labels, `16px` for body, and `24px` for headlines).

#### Visual Overlays
- **Overlay Status**: skipped (no browser automation available in this sub-agent context).

---

### Overall Impression
The "Atelier Zero Gallery" concept (warm parchment, bleached ivory cards, carbon ink text, terracotta coral) is extremely premium and deliberate. It stands out from generic SaaS templates. However, small design details—especially text contrast and ad-hoc typography choices in the header—undermine this direction, making parts of the page hard to read and breaking the design system rules.

---

### What's Working
- **Section Rule Dividers (`.sec-rule`)**: The vertical lines, Roman numerals, and page numbering provide a highly structured, editorial catalog vibe that feels authentic and high-craft.
- **Micro-Textured Depth**: The integration of `.surface-noise` with the warm parchment color scale successfully breaks the "flat digital canvas" feel, giving the landing page a tactile paper texture.
- **Concise Product Copy**: Clear value proposition ("zero cadastro", "salas efêmeras em memória") directly answers user concerns without corporate jargon.

---

### Priority Issues

#### [P1] High-Contrast Accessibility Failures on Primary and Secondary CTAs
- **Why it matters**: The main CTA button uses white text on `#ed6f5c` (3.0:1 contrast) and the header outline button uses `#ed6f5c` text on `#efe7d2` (2.43:1 contrast). Both fail WCAG AA (4.5:1). Critical buttons are illegible for visually impaired users.
- **Fix**: Change primary CTA text to Carbon Ink (`text-ink` / `#15140f`) to hit 5.8:1 contrast. Use `--coral-deep` (`#b8412f`) for the outline button border and text to raise contrast to an accessible level on the paper background.
- **Suggested command**: `$impeccable colorize`

#### [P2] Scrolled Header Violates "Border-Plus-Shadow" Rule
- **Why it matters**: Pairing `border-bottom: 1px` with `box-shadow: 0 18px 50px` on the scrolled state of the header creates a generic, fuzzy shadow appearance that conflicts with the flat, gallery aesthetic. It matches the banned "ghost-card" pattern.
- **Fix**: Remove the box-shadow entirely to rely on the fine border, or reduce the shadow blur to a tight, crisp offset (e.g., `0 4px 8px`).
- **Suggested command**: `$impeccable layout` or `$impeccable quieter`

#### [P2] Typography Drift & Off-Ramp Font Sizes in Site Header
- **Why it matters**: The ad-hoc sizes `22px`, `26px`, and `9px` in the header bypass the design system. The `9px` subtitle is illegible on many screens, and the arbitrary logo sizes introduce inconsistency.
- **Fix**: Map the logo and brand mark to the nearest standard typography scale elements (`1.5rem` / `24px` for logo; `1.75rem` / `28px` for Ø glyph). Increase the header subtitle size to `11px` (`text-[11px]` or standard `Label` class).
- **Suggested command**: `$impeccable typeset`

#### [P3] Dead / Unused CSS Styles for Side Rails
- **Why it matters**: `index.css` contains styles for vertical `.side-rail` markers, but they are not implemented in the layout. This is dead CSS code and represents a missed opportunity to enforce the print-gallery design on wide viewports.
- **Fix**: Add side rail elements to `landing.tsx` or clean up the unused styles in `index.css`.
- **Suggested command**: `$impeccable layout`

---

### Persona Red Flags

#### Sam (Accessibility-Dependent User)
- **Red Flag**: Cannot read the main CTA "Criar sala grátis" easily due to the low-contrast white-on-coral styling.
- **Red Flag**: The outline CTA in the navigation header is almost invisible (contrast is below 2.5:1), meaning Sam will struggle to locate the primary navigation action.

#### Casey (Distracted Mobile User)
- **Red Flag**: On mobile screens, the room code form layout wraps awkwardly—the code input stays at a rigid `110px` while the "Entrar" button stretches to full width. This makes the text input extremely small and difficult to tap on the move.

#### Jordan (First-Timer)
- **Red Flag**: The placeholder `XXXX` in the join code input does not explain that it must be an alphanumeric room code. Jordan might try typing their name or a room title, and only learn it is invalid when they type the 5th character (restricted by `maxLength`).

---

### Minor Observations
- **Uppercase Scale Drift**: The landing page uses `text-xs` (12px) for mono kickers and footer labels instead of the design system's defined `11px` `Label` step.
- **Ad-Hoc Styling in CTA Final**: The final CTA button uses standard `variant="default"` but overrides all borders and colors manually rather than using a semantic button variant.

---

### Questions to Consider
- *Should we make the design system's Label step mapped strictly to `text-[11px]` to prevent text-xs drift?*
- *Should the Terracotta Coral accent color be deepened or paired with dark ink text on all CTAs to ensure compliance across both light and dark themes?*
- *Could we add the side-rail vertical text layout to the landing page to further emphasize the print catalog aesthetic?*
