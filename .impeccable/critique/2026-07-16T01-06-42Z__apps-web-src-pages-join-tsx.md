---
target: apps/web/src/pages/join.tsx
total_score: 29
p0_count: 2
p1_count: 2
timestamp: 2026-07-16T01-06-42Z
slug: apps-web-src-pages-join-tsx
---
# Join Room page — Impeccable UX Critique (Assessment reports preserved)

**Method:** dual-agent (A: design review by subagent · B: CLI detector + manual anti-pattern grep by subagent).
**Target:** apps/web/src/pages/join.tsx (Planning Poker v1, T28, lobby/Join Room).
**Slug:** apps-web-src-pages-join-tsx
**Browser overlay:** skipped — no viewable target running (parent chose not to start dev server).

## Design Health Score (29/40 — Good)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | ConnectionStatus never renders during stub; "Conectando…" appears without real WS handshake (TODO P0 in code). Fake-success during commit. |
| 2 | Match System / Real World | 4 | PT-BR domain terms (Apelido, Sala, Código) match user's mental model. |
| 3 | User Control and Freedom | 3 | Esc → landing, Voltar button, focus-on-bad-code + select. Cancel button visually weak on dark. |
| 4 | Consistency and Standards | 2 | Join reimplements header inline instead of using <SiteHeader>. Section rule system (I/II/III) absent despite JSDoc promise. Pill `rounded-full` buttons vs. 18px card — visual mismatch. |
| 5 | Error Prevention | 4 | disabled gating + inline validation + NFKD/uppercase/slice auto-normalize on code + maxLength on nick. Best-in-class. |
| 6 | Recognition Rather Than Recall | 3 | Placeholders + hints + URL-strip code. But sr-only legend hides nick label from sighted users. |
| 7 | Flexibility and Efficiency | 3 | sessionStorage pre-fill + Esc shortcut. Missing Cmd/Ctrl+Enter to submit. |
| 8 | Aesthetic and Minimalist | 3 | Editorial-lite, surface-noise, no decoration bloat. Disabled coral is muddy and keeps the directional arrow. |
| 9 | Error Recovery | 4 | role=alert, aria-live=polite, focus+select on bad code, toast. |
| 10 | Help and Documentation | 1 | In-flow hint copy only; no external docs/shortcut help. |
| **Total** | | **29/40** | **Good** |

## AI Slop — PASS

Confirmed by deterministic scan + manual grep:

- No gradient text
- No ghost-card combo (`shadow-card` is 8px blur, not the prohibited wide-blur)
- No over-rounded ≥32px (tokens cap at 18px; `rounded-full` only on intentional pills)
- No identical card grids (single card)
- No sketchy SVG illustrations
- No repeating-linear-gradient stripes
- No decorative grid backgrounds (`surface-noise` only)
- No meta-criticism copy
- No side-stripe borders >1px (hairlines only)

CLI detector: **0 findings** on target files. False-positive flags raised and explained by subagent B (rounded-full pill is correct for buttons, not cards).

## Cognitive Load — 0/8 failed

Single-card form, 2 fields gated by inline validation, clean header → main → form → actions hierarchy. No competing elements.

## Emotional Journey

**Peak:** olive `✓ 5/20` micro-affirmation — well-designed reward.
**End:** redirect to `/arena` after a 200ms `setTimeout` without a real WS handshake (TODO line 220-223 in source admits "fake UX"). Jordan lands in arena unsure if they're connected. Peak preserved, end hollow.

## Priority Issues

### P0 — Disabled coral CTA reads as "broken"
**What:** `Entrar ↗` with `disabled:opacity-40` renders as muddy `#6b4b41` (pixel-confirmed in screenshot at button center). The arrow still points outward like an actionable affordance.
**Why:** First impression on the first action of the app. Jordan sees a broken-looking button before typing.
**Fix:** Thread `disabled` to hide the arrow and either (a) add a hint "preencha o apelido" inside the button, or (b) raise opacity to 70% so it reads "live but waiting."
**Suggested command:** `$impeccable polish`

### P0 — Header pattern breaks landing ↔ join consistency
**What:** Landing uses `<SiteHeader>` (fixed, scroll-state, hairline divider, "Criar sala" outline CTA). Join re-implements header inline — losing scroll-state, the divider, AND the "Criar sala" quick-jump affordance.
**Why:** Brand inconsistency on transition; no escape hatch when users change their mind mid-flow.
**Fix:** Add `rightSlot` prop to `<SiteHeader>`, or extract `<Topbar variant="join|landing" />`. Use it on Join so "Criar sala" is one tap from commitment hesitation.
**Suggested command:** `$impeccable polish`

### P1 — sr-only legend hides nick label from sighted users
**What:** `<legend className="sr-only">Como você quer ser chamado</legend>` (line 379) — sighted users see only placeholder "Luna" + hint. Meanwhile code input gets a visible `<label>` (line 350). Asymmetric a11y treatment between sibling fields.
**Why:** Jordan first-timer doesn't know what the second input is for until focus.
**Fix:** Make the nick label visible (mirroring the code input label), remove the fieldset/legend ceremony.
**Suggested command:** `$impeccable audit`

### P1 — "Voltar" invisible on dark mode
**What:** `variant="default"` = `border border-ink/20 bg-transparent`. On dark `#1c1b16`, that hairline border is ~12% opacity ivory. Pixel scan: outline barely detectable against background.
**Why:** Cancel/escape discoverability is critical at entry. Jordan doesn't see an exit.
**Fix:** Use `variant="ghost"` instead (`hover:bg-ink/5`) for clearer link-like affordance, or bump default border to ink/40.
**Suggested command:** `$impeccable polish`

### P2 — JSDoc/code drift: "FIG. 02 · ENTRAR" promised but not shipped
**What:** JSDoc line 6 says the page includes a `FIG. 02 · ENTRAR` mono strip. The only strip renders only when arriving with `?code=X` — manual join (`/join`) and `?host=1` have no section rule.
**Why:** Editorial system promised but not delivered. Doc-vs-reality mismatch.
**Fix:** Either add a stable `<SectionRule roman="II." title="ENTRAR · IDENTIDADE" />` above `<main>` (consistent with landing), or drop the JSDoc line if intentionally absent.
**Suggested command:** `$impeccable polish`

### P2 — Disabled CTA keeps directional arrow
**What:** `Entrar ↗` (line 444) renders the `↗` even when `disabled`.
**Why:** Affordance mismatch — Alex taps, nothing happens.
**Fix:** Make arrow conditional on `!isConnecting && !disabled`. (Subsumed by the P0 fix above.)
**Suggested command:** `$impeccable polish`

## Persona Red Flags

**Alex (impatient power user):**
- No Cmd/Ctrl+Enter submit shortcut. Tab → Tab → reach for mouse.
- sessionStorage pre-fills nick, but no "Bem-vindo de volta, [Nick]" greeting — Alex wonders if it's theirs.
- Esc shortcut disabled during `isConnecting` (line 153-163) with no visible signal.

**Jordan (confused first-timer):**
- Disabled coral looks broken before any input.
- Voltar is a faint outline on dark — no visible exit cue.
- sr-only legend means "what is this field?" only resolves on focus.
- No translation toggle — non-PT locales get no fallback.

**Sam (screen reader / keyboard):**
- Strong: aria-invalid, aria-describedby, role=alert, aria-live=polite, focus+select on bad code.
- Weak: nick has sr-only label; code has visible label. Asymmetric a11y treatment between siblings.
- Disabled button still receives Tab (correct) but no tooltip explaining why.

**Riley (stress tester / edge cases):**
- Pasted "abcd-1234" → auto-normalized to `ABCD`.
- Nick with double spaces → inline error.
- Emoji in nick not blocked. May break arena render downstream.
- `0000` (all-zero code): regex allows. Server may reject; client gives no signal.
- sessionStorage unavailable: silent fallback (line 88-91). No toast informing user their nick won't persist.
- Browser back during `isConnecting`: 200ms setTimeout race window.

## Strengths (3)

1. **Validation discipline is best-in-class.** `validateNick` is pure, exported, 8 unit-test cases, integrated as both submit gate and inline error.
2. **Code-input auto-normalization** (NFKD → strip → slice(4) → UPPER) is 4 lines that defend against paste-from-Slack, URL injection, IME input, lowercase typo.
3. **Privacy-by-default storage.** sessionStorage (not localStorage) → tab-close erases nick. Correct for a no-account ephemeral product.

## Minor Observations (4)

1. `<fieldset className="contents m-0 min-w-0 p-0 border-0">` (line 378) — clever `display:contents` trick. Webkit may still render the default 2px groove border; replace with `<div role="group" aria-labelledby="nick-label">` after the visible-label fix above.
2. `getUUID()` called for side-effect, result discarded (line 190). Dead until T38 — remove or comment why the side-effect matters.
3. `setTimeout(200ms)` before navigation (lines 231-237) is a code smell. When T38 wires real WS, this becomes `await ws.hello()`; delete the setTimeout entirely.
4. Hint row uses `flex-wrap` (line 414) — at ~375-420px viewports the `✓ 5/20` badge may collide with the long copy. Test in iPhone SE.

## Questions to Consider

1. **Why does "Criar sala" vanish when users commit to "Entrar"?** Both indecisive first-timers (Jordan) and power users (Alex) flip intent at the last second. One-tap access from `/join` to `/join?host=1` beats the back-button ritual.
2. **Is the disabled CTA doing UX work or just absence?** "Disabled + greyed" is a default-state cop-out. Could it show *why* (min 2 chars), *what* (type a nick), or *progress* (1/20 ▮▯▯▯)?
3. **Does this page need FIG section rules at all?** Landing uses I/II/III. Join has no Roman numeral anchor. Either commit to editorial consistency (add SectionRule) or consciously break the system with a documented rationale.

## Run Notes (final-chat only)

- Sub-agents: 2 spawned (A design review, B detector + manual grep), full context passed in prompts.
- CLI detector: 0 findings on target files.
- Manual anti-pattern grep: 4 categories checked, only intentional `rounded-full` on buttons/pills hit; cleared.
- Browser overlay: skipped — no dev server started. Pixel sampling on the attached screenshot used as ground truth (PIL + tesseract OCR).
- OCR (tesseract por+eng) confirmed PT-BR (no Spanish regression). The "Spanish" concern raised in initial brainstorm was incorrect — the project's domain language (per AGENTS.md) is PT-BR, and the rendered text matches the source. OCR did mis-read accent characters ("vocé" for "você", "Nao" for "Não") but those are tesseract-render artifacts on this font, not source content.
- Snapshot write & trend read: pending after this body is written.
