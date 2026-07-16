---
target: @apps/web/src/pages/join.tsx
total_score: 26
p0_count: 1
p1_count: 2
timestamp: 2026-07-16T00-29-51Z
slug: apps-web-src-pages-join-tsx
---
# Critique — `apps/web/src/pages/join.tsx`

Method: dual-agent (A: design review · B: detector + browser evidence).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | `ConnectionStatus` only mounts after first interaction; idle state shows nothing. The 200 ms `connected` flash before navigation is a fake system status. |
| 2 | Match System / Real World | 3 | Code + nick constraints match real-world conventions; copy explains the model in plain language. |
| 3 | User Control and Freedom | 3 | Voltar exists, but no mid-flight cancel; no Escape; both inputs lock with no escape hatch. |
| 4 | Consistency and Standards | 3 | Mostly aligned to Atelier Zero — the glassmorphism topbar is the single one-off that breaks the paper aesthetic. |
| 5 | Error Prevention | 3 | Layered live validation, URL sanitization, disabled submit until valid. |
| 6 | Recognition Rather Than Recall | 3 | Placeholders + Sala: strip help; first-timer joining with no querystring must still recall the code from chat. |
| 7 | Flexibility and Efficiency | 2 | Mouse-only Voltar; no keyboard shortcuts; paste normalization works but is invisible. |
| 8 | Aesthetic and Minimalist Design | 3 | Editorial composition is restrained; form footer is busy and host=1 has three overlapping signals. |
| 9 | Error Recovery | 2 | Invalid code shows a toast but does not focus the field; empty-form Enter leaves no feedback. |
| 10 | Help and Documentation | 2 | In-flow copy explains the nick and host mode; no doc for "where do I get a code?" in joiner mode. |
| **Total** | | **26 / 40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A):** "Minor tells." Score 6/10. The composition is genuinely handmade — Ø Playfair mark, period-punctuated headline "Seu nome na sala.", single coral CTA, two-tier paper hierarchy — none of it reads as AI scaffold. The tells that remain: the `bg-bg/95 backdrop-blur-sm sticky top-0` topbar is the single highest-signal AI tell on the page and violates the design system's "no glassmorphism" rule; the duplicate Ø glyph (topbar at 22 px, card at 36 px) without semantic reason; the "—" placeholder in the Sala: strip is decorative noise; the 200 ms `setTimeout` + ConnectionStatus=connected flash before navigation is a textbook AI "simulate progress" pattern; the pre-emptive `Bem-vindo, ${nick}` toast fires before any actual WS round-trip.

**Deterministic scan (Assessment B CLI):** 8 advisory findings, all `design-system-font-size`. Arbitrary `text-[…]` values off the DESIGN.md type ramp:
- line 221 — 18 px (logo wordmark)
- line 224 — 22 px (topbar Ø)
- line 231 — 10 px (mono label)
- line 239 — 10 px (mono strip)
- line 256 — 36 px (card Ø)
- line 259 — 34 px (headline)
- line 263 — 14 px (body)
- line 356 — 10 px (hint)

DESIGN.md documents the ramp as 11 px label / 24 px logo / 28 px brand-mark / clamp(2.5–4.5 rem) display. The page picks six off-ramp values instead of either committing to the documented ramp or extending it. The 10 px values on hint + labels also drop below the 11 px minimum stated in the design system.

**Browser detector (Assessment B injection):** Injection succeeded (live-server bound to port 8403 because 5174 was taken by an unrelated Python process; functionally equivalent). 4 impeccable findings logged:

1. `gpt-thin-border-wide-shadow` — 1 px border + 60 px shadow blur pairing. This is the Card component's `Bone Shadow` (0 30px 60px -30px rgba(21,20,15,0.15)). DESIGN.md's Border+Shadow Rule states: "Never combine a border heavier than 1 px with a shadow wider than 8 px." The rule and the Card spec contradict each other in the same document — the Card component's Bone Shadow is 60 px blur. Systemic design-system conflict, not a join.tsx-only defect.
2. `low-contrast` — 2.6:1 #ed6f5c (coral) on #f7f1de (ivory). WCAG needs 3:1 for UI components and 4.5:1 for body text. Likely culprit: the coral period in "Seu nome na sala." (line 260) or the 11 px coral labels at lines 305 / 326 / 349. Coral Deep (`#b8412f`) is the documented accessible substitute.
3. `tiny-text` — 10 px body text (lines 231, 239, 356). DESIGN.md sets the label minimum at 11 px.
4. `cream-palette` — page background `rgb(239, 231, 210)` = `#efe7d2` = DESIGN.md `Warm Parchment` `oklch(93% 0.02 85)`. **False positive**: this is the intentional Atelier Zero brand surface, not the 2026 AI cream reflex. Documented for completeness, not a defect.

Framework noise (not detector output, included for awareness): 6 React Router v7 future-flag warnings and 1 React DevTools info message.

**Visual overlays:** Detector findings were injected as a `[Human]` overlay on `http://localhost:5173/join` and logged to the browser console. The four findings above are the user-visible overlay output.

## Overall Impression

A genuinely handmade editorial form page that loses points on three things: a fake success state that pre-empts the WS round-trip, a single glassmorphism topbar that contradicts the rest of the paper aesthetic, and a joining-mode empty state that abandons first-timers. The bones are right (Atelier Zero composition, restrained typography, single coral CTA, humane validation). What's missing is honesty — about connection state, about whether the user needs to type a code, about focus when something goes wrong. Fix the P0 and the page reads as craft instead of competent scaffold.

## What's Working

1. **Editorial restraint is real.** Single card, single coral CTA, two-tier paper hierarchy, Playfair italic Ø mark with a period-punctuated headline — this does not read as AI scaffold. The Ø mark at 36 px + "Seu nome na sala." gives the form a moment of editorial calm before the functional UI starts asking things of the user.
2. **Validation is humane.** Live on every keystroke, empty input is intentionally non-error (line 54 of join.tsx), leading/trailing spaces rejected with clear copy, character counter only appears when valid (no nagging). The `validateNick` function is exported for unit testing and the rules mirror the inline hint copy.
3. **Input sanitization is security-minded.** NFKD normalization + A-Za-z0-9 strip + uppercase + slice(0,4) for codes (lines 124–129) plus URL-param pre-validation before persisting (line 177) defends against malicious `?code=<script>` payloads — a thing most form pages get wrong.

## Priority Issues

### **[P0] Fake success state before the WS round-trip**
- **Why it matters:** `handleSubmit` (join.tsx:185–203) fires `toast.push(\`Bem-vindo, ${nick}\`, 'success')`, sets `connectionState='connected'`, and renders a 200 ms `ConnectionStatus=connected` flash before navigating. No WS round-trip happens — this is a T28 stub. When T38 wires the real `ws-client`, users will see "Conectado" then "Conexão perdida" or a silently broken arena, destroying trust in the system-status indicator across the entire app.
- **Fix:** Until T38 lands, render the submit in a single `pending` state — drop the `connected` flash and the success toast. Move the success toast to the post-navigation `welcome` listener.
- **Suggested command:** `$impeccable audit join.tsx — strip fake success state from T28 stub, defer success toast to ws-client welcome listener`

### **[P1] Glassmorphism topbar violates Atelier Zero**
- **Why it matters:** `border-b border-ink/10 py-4 … bg-bg/95 backdrop-blur-sm sticky top-0 z-10` (join.tsx:217) is the single highest-signal AI tell on the page. DESIGN.md explicitly bans glassmorphism; this is the only place in the app using it. It also wastes Casey's thumb-reach real estate on a one-screen form page where sticky is unnecessary.
- **Fix:** Remove `backdrop-blur-sm`; change `bg-bg/95` to `bg-bg`. If stickiness is still wanted for the theme toggle, that's fine — it just doesn't need translucency.
- **Suggested command:** `$impeccable harden join.tsx — strip backdrop-blur from topbar, restore solid bg-bg per Atelier Zero`

### **[P1] Joining-mode first-timers have no "where's the code?" hint**
- **Why it matters:** When `showCodeInput=true` (no querystring, not host), the topbar shows `Sala: —` (line 243) and the form shows an empty code field with placeholder `ex. ABCD`. Zero affordance for "where do I get this from?" — Jordan persona hits a hard wall.
- **Fix:** Add a single line of helper copy under the code label: "O código foi compartilhado pelo anfitrião da sala (4 letras/números)." Surface the `Sala: —` em-dash as `aria-label="código pendente"` for screen readers; consider hiding the strip entirely in this mode since the field itself is the affordance.
- **Suggested command:** `$impeccable onboard join.tsx — add 'code source' hint for joiner mode, replace '—' placeholder with actionable copy`

### **[P2] Card's Bone Shadow contradicts the Border+Shadow Rule (systemic)**
- **Why it matters:** B's browser detector flagged `gpt-thin-border-wide-shadow` — 1 px border + 60 px shadow blur. The Card component uses `Bone Shadow: 0 30px 60px -30px rgba(21,20,15,0.15)`. DESIGN.md's Border+Shadow Rule states: "Never combine a border heavier than 1 px with a shadow wider than 8 px." The rule and the Card spec contradict each other in the same document. join.tsx doesn't cause this, but it inherits it; fixing join.tsx alone won't fix the rest of the app.
- **Fix:** Decide: either tighten Bone Shadow to ≤ 8 px blur (and accept a flatter elevation), or relax the Border+Shadow Rule in DESIGN.md (and accept that the system is committed to soft elevation). Whichever you pick, update both the rule and the Card token.
- **Suggested command:** `$impeccable document DESIGN.md — resolve Bone Shadow vs. Border+Shadow Rule conflict`

### **[P2] Coral on ivory hits 2.6:1 — fails WCAG for labels and decoration**
- **Why it matters:** Browser detector logged `low-contrast 2.6:1 (#ed6f5c on #f7f1de)`. Likely culprits: the coral period in "Seu nome na sala." (line 260) and the 11 px coral labels at lines 305 / 326 / 349. DESIGN.md's Do section states: "small labels and icons in coral use the accessible Coral Deep (`#b8412f`) to meet AA." The page uses `#ed6f5c` (terracotta) for these instead.
- **Fix:** For the 11 px labels at lines 305 / 326 / 349, switch to `text-coral-deep` (or the Tailwind token mapped to `#b8412f`). For the 34 px headline period, `#ed6f5c` is decorative — wrap it in `aria-hidden="true"` and the contrast doesn't apply to readability, but document the decision.
- **Suggested command:** `$impeccable audit join.tsx — replace small-text coral with coral-deep per DESIGN.md do's`

### **[P2] Six off-ramp arbitrary font sizes**
- **Why it matters:** CLI detector flagged 8 `design-system-font-size` advisories. The page uses 10 px, 14 px, 18 px, 22 px, 34 px, 36 px — none of which are on DESIGN.md's documented ramp (11 px label / 24 px logo / 28 px brand-mark / 1 rem body / clamp(2.5–4.5 rem) display). The page either commits to the ramp or extends it intentionally; right now it ignores it.
- **Fix:** Either (a) align each value to a documented step (e.g., 18 → 24, 22 → 24, 36 → 28 brand-mark + scale up via clamp, 34 → clamp at the display step), or (b) update DESIGN.md to add the missing steps. (a) is cheaper if the new values were arbitrary; (b) is correct if the new steps are intentional.
- **Suggested command:** `$impeccable typeset join.tsx — align font sizes to DESIGN.md type ramp (or document the new steps)`

### **[P3] Host=1 has three overlapping signals; invalid code does not focus the field**
- **Why it matters:** When host=1: topbar shows "será gerada ao entrar" (line 243), the card shows the host-note (lines 268–275), and no code field is rendered — three channels for one fact. Separately, when an invalid code is submitted (line 151), a toast fires but the code input is not focused, scrolled to, or visually flagged with `aria-invalid` the way the nick input is. Both are easy fixes.
- **Fix:** Suppress the topbar strip when `host=1 && !code`, OR drop the in-card host-note — pick one. For invalid code, add a `codeInputRef` and call `focus()` + `select()` in the invalid-code branch; add `aria-invalid` mirroring the nick input.
- **Suggested command:** `$impeccable polish join.tsx — collapse host=1 redundancy + wire codeInputRef focus/select + aria-invalid`

## Persona Red Flags

### **Jordan (First-Timer)**
- Lands on `/join` with no querystring. Topbar says `Sala: —`. Code field says `ex. ABCD`. Nowhere does the page tell Jordan where the code comes from. **First wall, second screen of the app.**
- The 36 px Playfair Ø glyph (line 256) is unexplained; Jordan may interpret it as an avatar placeholder or a broken image.
- Two-button row at the bottom: coral "Entrar" + ghost "Voltar". Jordan doesn't know which to press. "Voltar" looks like it might cancel the room creation she's about to make.
- Disabled submit with no explanation: types `Lu` and the button stays grey. No inline message saying "now enter the 4-char code" or "we're waiting for the room code."

### **Sam (Accessibility-Dependent)**
- `role='alert'` on the empty `nick-error` div (lines 347–353). When the input is empty after a blur, screen readers may announce an empty alert. Prefer `aria-live='polite'` and only set `role='alert'` when the error string is non-empty.
- Focus ring `focus-visible:ring-coral/20` (lines 318, 343) — `coral/20` over warm parchment likely fails WCAG 2.4.11 (focus appearance, 3:1 minimum). The visible ring color is `#ed6f5c33` ≈ 1.6:1 against `#efe7d2`. Use a solid `ring-coral` or `ring-coral-deep`.
- 11 px uppercase tracked labels at letter-spacing 0.22em can be hard to parse at mobile zoom; verify with the largest expected mobile-zoom level.
- ConnectionStatus appears mid-flow (line 278) with no announce buffer — for screen reader users, the `Conectado` / `Conectando…` announcement can collide with the navigation announcement.
- Em-dash `—` in `Sala: —` (line 243) is read by some screen readers as the word "em dash" — set `aria-label="código pendente"` on the span.

### **Casey (Distracted Mobile User)**
- Card max-width 520 px centered (line 252) — on a 375 px iPhone, that means ~120 px of wasted margin per side. Form-feeling pages typically want edge-to-edge or 16 px gutters for thumb reach.
- Header strip with `Sala: —` (line 239) consumes ~50 px of vertical space with no actionable content — wastes prime thumb-reach real estate on a one-screen form.
- Sticky topbar with backdrop-blur (line 217) eats height on Casey's already-shorter viewport and adds a glassmorphism that doesn't belong on the page.
- Voltar button is full-width below Entrar on mobile (lines 383, 394) — Casey wants to abort fast, but the coral Entrar above visually dominates; she has to look twice for the back action.
- Code input uppercase letter-spacing tracking-widest (line 318) is striking on desktop but on small screens the four chars with wide spacing can look like 8 chars — Casey may type past 4 chars without realizing.

## Minor Observations

- Ø glyph appears twice (topbar 22 px line 224, card 36 px line 256) — fine for brand, but the 36 px card version competes with the 34 px headline. Drop one or differentiate sizes more deliberately.
- Form footer (error region + hint region + character counter) uses three separate divs where a single grouped `<fieldset>`/`<legend>` semantic block would be cleaner for AT.
- `autoComplete='off'` on the code input is correct (codes aren't a recognized autocomplete type), but on the nick input (line 337) it suppresses the OS's nickname memory — consider `autoComplete='nickname'`.
- The `connected` state at line 193 is dead code that will need to be removed when T38 lands — flag with `// TODO: remove on T38`.
- `validateNick` (line 51) is exported but its rules duplicate the inline hint copy `2–20 caracteres` (line 359) — keep them in sync manually.
- `data-od-id='nick-card'` (line 253) suggests an Overdrive/observability hook — verify the field is still in use elsewhere or remove it.
- Detector noted 6 React Router v7 future-flag warnings — not a defect, but enabling the future flags now would silence them and is one-line.

## Questions to Consider

- Should the form auto-detect a deep-link code and skip the code input entirely when querystring has `?code=ABCD`, or is showing the code in the field for visual confirmation intentional?
- Is the "fake success then navigate" stub actively misleading enough that this page should ship with a "Connecting to room…" persistent state and no success toast until T38 wires the real ws-client?
- Why does joining a room require entering the code at all when `?code=XXXX` already carries it in the URL — is the join code field only for cases where the user landed without a deep link, and if so, why not surface a single "Paste the room code your host shared" CTA in the empty state?
