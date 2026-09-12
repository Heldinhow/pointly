---
target: Arena
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-09-12T21-48-29Z
slug: apps-web-src-pages-arena-tsx
---
# Critique — Arena, re-run (`apps/web/src/pages/arena.tsx`)

Method: dual-agent (A: ses_f686a2bb1ffe · B: ses_f686a2b51ffe)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Bare timer numeral, no visible unit; cooldown visible only as disabled mira |
| 2 | Match System / Real World | 3 | Fluent PT-BR ceremony copy; 🎯/🍅 arsenal clashes with workshop voice |
| 3 | User Control and Freedom | 3 | Esc/4s-disarm/disarm-on-phase; same-card no-op is silent |
| 4 | Consistency and Standards | 2 | Amber star + rounded-full + "coral"-means-ink all survive via CSS overrides, not at the component |
| 5 | Error Prevention | 3 | Two-tap destructive confirm, share guard, hello guard, awaiting-disabled reveal |
| 6 | Recognition Rather Than Recall | 2 | Coffee rule + auto-reveal rule live in hover tooltips, not the visible surface |
| 7 | Flexibility and Efficiency | 3 | R/N now visible on desktop; arrows/Home/End in menu; nothing more needed |
| 8 | Aesthetic and Minimalist Design | 3 | One saturated surface, flat; triple invite + emoji menu are the remaining noise |
| 9 | Error Recovery | 2 | Disconnect is a dimmed pill with no visible reconnect path in-arena |
| 10 | Help and Documentation | 3 | Empty state, center sub, and coffee title teach the loop; no external help needed |
| **Total** | | **27/40** | **Acceptable (top of band) — was 21/40** |

## Fix verification (F1–F6)

| ID | Verdict | Evidence |
|---|---|---|
| F1 projectiles post-reveal; floating emoji + badge gone | Fixed | `seat.tsx:261` faceUp gate; no random-emoji code in src; sr-only status only |
| F2 revealable beat + auto-reveal rule | Fixed | "Todos votaram." + sub (`arena.tsx:237-244`); timer title + aria (`timer-pill.tsx:68-69`) |
| F3 mobile full verdict; header chip retired | Fixed | `StatsPill variant="panel"` atop mobile list; header is counter + timer only |
| F4 visible deck chunking; coffee self-explains | Fixed | Captions baixas/altas/pausa; coffee title + aria "pausa — fora da média" |
| F5 kbd hints; ink star; critical border; single guard; hello guard | Fixed, 1 brittle | kbd R/N live-verified; exit/hello guards in; critical border restored; star reads ink ONLY via CSS override — component still ships amber |
| F6 timer ticks in revealable; overlap resolved | Fixed | Ticker covers both phases; clamp + max-width + sub-900px stacking |

## Anti-Patterns Verdict

**LLM assessment**: Pass. No absolute bans in rendered output — no side-stripes, gradient text, glassmorphism, card grids, per-section kickers, numbered sections, or overflow. Two watch-items stay legal: deck peek gradients are a functional scroll affordance, and the StatsPill hero numeral is verdict-attached where DESIGN.md says stats live. One real product-ban deviation remains: the projectile menu is an invented, desktop-only, hover-gated, emoji-only affordance.
**Deterministic scan**: `detect.mjs --json` over arena page + 6 components — exit 0, **0 findings** (verified engine, no suppressions).
**Browser evidence**: overlay correctly skipped (no JS mutation API); instead a full read-only solo round was driven live at 1440px and 390px — vote → two-tap new-round confirm → reset → mobile vote → reveal → verdict panel — 8 snapshots, zero console problems, screenshots captured at both widths.

## Overall Impression

+6 points, all of them earned in communication and parity: the round now narrates itself ("Todos votaram."), the verdict is byte-identical on both platforms, and the celebration stays past the reveal. What remains is component-honesty debt — overrides hiding the truth from the components — not missing features. Biggest opportunity: make the components say what the CSS already says.

## What's Working

1. **One verdict, two stages** — `StatsPill variant="panel"` killed the mobile/desktop dialect split with a single component. Best fix of the five passes.
2. **The revealable beat is legible** — no player has to ask "e agora?" out loud anymore.
3. **Restrained celebration** — post-reveal-only throws, no floating emoji, no pulsing badge: motion conveys state.

## Priority Issues

- **[P1] Host star lies at the component level.** `ui/seat.tsx:95` and `MobileSeatRow.tsx:136` ship amber; ink arrives only via `arena.css` overrides. Any reuse outside `.arena-shell` leaks verdict-hue authority. Fix: ink token in both components; keep or delete the overrides. Suggested command: `/impeccable colorize`
- **[P1] Projectile menu is an unchunked 7-option emoji quiz, desktop-only.** No grouping, no labels beyond 🎯, hover-gated discovery, zero mobile parity. Fix: cut to 3–4 labeled favorites or chunk + caption the 7; state the mobile scope gap instead of hiding it in a code comment. Suggested command: `/impeccable distill`
- **[P2] Solo state invites three times at once.** SharePill + EmptyOverlay + inlay copy compete for one job. Fix: quiet holding line in the inlay while the overlay owns the invite. Suggested command: `/impeccable quieter`
- **[P2] Selected deck card jumps.** `border-2` over `border` + `translateY(-2px)` on the highest-frequency interaction, against the no-jump rule. Fix: constant 1px border, fill + inner outline for selection, drop the lift. Suggested command: `/impeccable polish`
- **[P3] Unitless timer; mobile verdict scrolls away.** Bare "60" at a glance; facilitator loses the number mid-discussion. Fix: visible `s` unit; sticky verdict under the mobile header. Suggested command: `/impeccable clarify`

## Persona Red Flags (delta since 21/40 run)

- **Alex:** R/N fixed on desktop; remaining: Tab in projectile menu closes without refocusing trigger (reverse focus trap).
- **Sam:** menu items noun-only ("Tomate" — needs "arremessar tomate em X" for out-of-context SR); 9px `ss-you` mono is a contrast risk on sage — verify, don't assume.
- **Casey:** tall mobile stack is manageable, but the verdict scrolling away hurts touch users most — sticky verdict matters here above all.
- **Marina:** progress at 8–12 seats means scanning pills for AGUARDANDO — bottleneck with no nudge affordance (out of scope, noted).

## Minor Observations

- `MobileSeatRow.tsx:11-12` doc claims a coral 2px border-left the code no longer renders — doc wrong, code right.
- Deck cards render 6px radius vs DESIGN.md's 8px.
- `reveal-button.tsx:192` `rounded-full` rescued by CSS override — same hide-the-truth pattern, lower stakes.

## Questions to Consider

- If the projectile menu can't survive contact with mobile, is it ceremony or cruft?
- Should the auto-reveal rule print on the instrument face (tiny "auto" tag) instead of hiding in a tooltip touch users can't open?
- What is the desktop pre-reveal stats slot holding space for — would deleting it improve the table's symmetry?
