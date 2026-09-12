---
target: Arena
total_score: 21
p0_count: 0
p1_count: 3
timestamp: 2026-09-12T20-58-20Z
slug: apps-web-src-pages-arena-tsx
---
# Critique — Arena (`apps/web/src/pages/arena.tsx`)

Method: dual-agent (A: ses_f6897cb37ffe · B: ses_f6897cb24ffe)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | `revealable` collapses into `faceUp: boolean` — no distinct "todos votaram" beat |
| 2 | Match System / Real World | 2 | Ceremony copy is excellent PT-BR; projectile arsenal breaks the workshop register |
| 3 | User Control and Freedom | 2 | Two-tap new-round confirm is textbook; double exit interrogation (`useBlocker` + `beforeunload`) |
| 4 | Consistency and Standards | 2 | Result exists in three dialects: full stats desktop, median-only mobile, caption-less solo |
| 5 | Error Prevention | 3 | Reveal blocked at 0 votes, destructive confirm; but partial reveal (3/8) costs one unconfirmed click |
| 6 | Recognition Rather Than Recall | 2 | R/N shortcuts and deck group labels are screen-reader-only — invisible to sighted users |
| 7 | Flexibility and Efficiency | 2 | Shortcuts undiscoverable; deck→center pointer path crosses a 920px table |
| 8 | Aesthetic and Minimalist Design | 2 | Deck's 9 cards are domain-necessary; projectile system is a second product inside the ceremony |
| 9 | Error Recovery | 1 | Disconnect surfaces only as a seat pill on others' screens — the highest-stakes moment is silent |
| 10 | Help and Documentation | 2 | EmptyOverlay teaches inviting; nothing teaches what ☕ means or that the timer auto-reveals |
| **Total** | | **21/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: Clean bill with one earned exception. No gradient text, glassmorphism, side-stripes, card grids, or decorative kickers anywhere. The post-reveal `StatsPill` is structurally an eyebrow + hero numeral + caption block (the banned hero-metric shape) — it passes only because it is a single round verdict pinned to the table inlay, exactly where DESIGN.md says stats must live. Its 2.5–3.5rem mono numeral is still the loudest thing on the felt and competes with the reveal button for the peak moment.

**Deterministic scan**: `detect.mjs --json` over `arena.tsx` and over `src/pages/` — exit 0, **0 findings**. Engine verified working via positive control (synthetic gradient-text probe → 1 finding, exit 2). No suppressions configured. Note: the StatsPill hero-metric shape above is a detector gap — the rule engine doesn't cover component structure — caught by review, missed by scan.

**Visual overlays**: No overlay — this environment exposes no JS mutation API, so `detect.js` injection was correctly skipped. Fallback signal: read-only snapshot of live `/arena` (empty state: share pill disabled, 9 deck cards, reveal disabled, "AGUARDANDO VOTOS…") plus one console warning the review missed: `[ws-client] refusing to send invalid event` (`ws-client.ts:157`).

## Overall Impression

The core ritual is usable and honestly built — one ink primary per viewport, legible table-center copy, a non-modal empty overlay done right. But it isn't ceremony-trustworthy yet with 8 people watching: play projectiles fight the vote, the all-voted beat has no UI, the mobile ending is starved, and a dropped connection is met with silence. Biggest opportunity: make the round's narration beats (`revealable`, auto-reveal, disconnect) as legible as the vote itself.

## What's Working

1. **Morphing single-commit RevealButton** (`reveal-button.tsx:63-131`) — awaiting/ready/post-reveal in one component, democratic per ADR-0002, destructive action demoted to ghost with two-tap confirm + 4s auto-disarm + Escape. The "tool disappears" principle as a component.
2. **Table-center state copy** (`arena.tsx:249-258`) — "Tem lugar para o time" → "Cada um no seu tempo" → "Podemos revelar" plus live "N de M" counts. The ritual reads without a manual, in the team's own language.
3. **Non-modal EmptyOverlay** (`empty-overlay.tsx:110-119`) — `role="dialog" aria-modal="false"`, table stays interactive behind it, Esc + focus-restore + session-scoped dismiss.

## Priority Issues

- **[P1] Projectile play system fights the ceremony.** Hover 🎯 on every seat, 7-emoji menu, hit/dodge/deflect animations, random floating reactions, 5s cooldown badge (`seat.tsx:274-347`, `index.css:74-127`). Mid-vote tomatoes are ammunition, not feedback; violates PRODUCT.md #4 and the decorative-motion ban. Fix: gate behind an opt-in room toggle (default off), or restrict throwing to post-reveal celebration; minimum is removing the floating emoji + cooldown badge. Suggested command: `/impeccable quieter`
- **[P1] `revealable` is a phase users can't see.** Four server phases collapse to `faceUp` (`arena.tsx:242-243`); nothing names auto-reveal-at-zero. The facilitator's key beat ("fechamos, revelando…") has no UI. Fix: distinct center copy for all-voted plus a one-line timer caption stating the auto-reveal rule. Suggested command: `/impeccable clarify`
- **[P1] Mobile result starves the discussion.** Mobile shows median-or-"Unânime" only (`MobilePlayerList.tsx:119-143`); mean, range, distribution are desktop-exclusive. The facilitator holds a phone — the ending *is* the memory. Fix: full verdict (median + mean + range + distribution pips) in the mobile dock post-reveal. Suggested command: `/impeccable adapt`
- **[P2] Deck chunking is invisible + ☕ is unexplained.** 9 choices with aria-only group labels (`deck.tsx:147-152`); coffee card never says it abstains. Fix: visible micro-labels per group (or 4·4·1 spatial rhythm) + ☕ caption ("pausa — fora da média"). Suggested command: `/impeccable onboard`
- **[P2] R/N shortcuts are ghosts.** `useKeyboardShortcuts` (`arena.tsx:296-305`) with zero visible hint. Fix: `<kbd>` hints on reveal/new-round buttons (desktop), `title` minimum. Suggested command: `/impeccable polish`

## Persona Red Flags

- **Alex (power user):** R/N invisible; deck→center pointer path twice per round; same-card re-click is a silent no-op (`arena.tsx:280`); EmptyOverlay steals initial focus to the copy CTA in every new room.
- **Sam (screen reader / keyboard):** revealed vote value in a role-less `div` (`seat.tsx:400-408`) may never announce; no live region for join/leave/disconnect; solo `aria-label` announces "média —" via `formatMean(null)`; emoji menu gating is hover/focus-only.
- **Casey (mobile, distracted):** cards ½–13 hide behind scroll with 24px gradient peeks; toast dock (`bottom: calc(13rem…)`) can cover the sticky reveal dock; header `flex-wrap` reflows the list when the timer flips critical.
- **Marina (facilitator, 8 watching):** anyone can early-reveal 3/8 with one click — ritual spoiled live, no confirm; disconnect shows only a seat pill, no "aguardar?" cue; 640–1050px range kills the felt entirely (`arena.css:275-285`); her phone can't show the distribution she must discuss.

## Minor Observations

- Deck selected card lifts `translateY(-2px)` (`arena.css:226-229`), contradicting `deck.tsx:13` ("border only").
- Host ★ and median outline share `--warning` amber — one hue for identity *and* verdict.
- Timer pill and reveal button override to 3px radius while DESIGN.md reserves 999px pills for arena elements — pick one.
- Double exit interrogation: `useBlocker` confirm + native `beforeunload` — keep native, drop custom.
- Live `/arena` console warning (detector evidence, review missed): `[ws-client] refusing to send invalid event` (`ws-client.ts:157`) — worth one look.
- Prior P0s BUG-401 (timer freeze) and BUG-409 (pill overlap) look fixed in current code — flagged for visual confirmation, not re-reported. Reduced-motion handling is genuinely good.

## Questions to Consider

- If tomato-throwing is what the team actually loves, what makes it ceremony-grade — post-reveal celebration only — instead of mid-vote ammunition?
- Should a 1-of-8 early reveal really cost one click, or does "democratized" deserve a confirm on partial votes?
- Is desktop the product and mobile the companion — or must the verdict be byte-identical everywhere, since the facilitator discusses from her phone?
