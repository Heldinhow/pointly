# Interações e convite

## Sub-features

- Send a projectile at another seat (paper ball, paper plane, rock, brick, tomato, epic flying chair); the epic chair has a longer reload ("cadeirada épica").
- Each item has its own beat on a hit (HEL-72), identical for thrower and target: paper ball bounces once and rolls off; paper plane flies an S path and stays stuck in the avatar ring for ~0.8s; rock drops fast, the avatar sinks and a "galo" (`[data-testid="projectile-bump"]`) shows for ~1s; brick cracks the avatar ring (`projectile-crack`); tomato splats and drips (`projectile-splat`, 3× `projectile-drip`) for ~2.7s over the avatar only. Dodge/deflect keep the old miss paths.
- Epic chair (cadeirada, HEL-72): enters from off-screen (above the viewport), spinning, opaque, for ~0.9s; on impact the target seat sways, the table shakes ~3px for 150ms, wood shards + 5 orbiting stars (dark-outlined, readable in both themes) and a "CADEIRADA!" stamp (`[data-testid="projectile-stamp"]`; "CHAIR SMASH!" in EN) appear by the target; the chair then lies tipped over beside the avatar (never over the name) until ~3.1s and fades by 3.4s. The chair flies in `.projectile-layer-under` (inside `.poker-table`, above the felt, below the seats), so avatars, names and status pills always paint over it; stamp/stars/shards stay in the top `.projectile-layer`.
- `prefers-reduced-motion`: no flight/shake; a static pill with the item icon + label (`[data-testid="projectile-static"]`, chair = "CADEIRADA!") sits above the target for 1.5s.
- Nudge (cutucada): preset messages ("Bora!", "☕ Café?", "Polêmica!", "Confia") as a balloon over the target's seat; shares the projectile reload.
- Reload feedback: buttons lock and show a countdown; a second send inside the reload is refused with an inline message, not a crash. The UI names the interval in plain words (no "throw"/"cooldown"/"seat" jargon).
- Invite: "Copy invite" sits in the sticky room header (`toolbar-copy-invite`) so it never needs scrolling, with a persistent screen-reader status (`invite-copy-status`) for success and failure. The sidebar has the same action labeled "Copy link" (`invite-copy-button`). The link field shows start and end of the URL, middle-truncated (`…`), with the full URL on focus.
- Leave room: when you are the host or the round has votes, leaving asks first and spells out what happens to the room (next host, votes kept, or room ended when nobody else is left). The confirmation renders inside the sticky header, so it is visible even after scrolling.
- Connection resilience: "reconnecting" banner with "Retry now"; a lost connection shows a warning instead of dropping the room.

## How to get to it (user POV)

In a room with ≥2 people, hover/tap another seat to send an item (paying the reload), or open the seat menu to nudge. Copy the invite from the header to bring teammates in.

## Driving it

Projectiles/nudges need a **second player** — open a second browser tab (or a second `openchamber_web` tab) that joins the same code, so one seat can target the other. Then:

```
browser.hover { selector: "<seat of the other player>" }   // reveal the item menu
browser.click { ... }                                       // pick an item; watch the countdown
```

Self-target and disconnected targets are refused (inline error), so verify against the *other* seat. Invite copy needs no second player:

```
browser.click  { selector: "button[data-testid=\"toolbar-copy-invite\"]" }  // sticky header
browser.snapshot   // button reads "Copied" and the sidebar keeps the URL
browser.click  { selector: "[data-testid=\"invite-copy-button\"]" }         // same action in the sidebar
// then check the clipboard / `Invite link` input == <origin>/join?code=<CODE>
```

Leaving as host (or with votes) needs the second step:

```
browser.click { selector: "button ... label 'Leave room'" }
browser.snapshot   // [data-testid="leave-confirm"] inside the header explains the consequence
browser.click { selector: "[data-testid=\"leave-cancel-button\"]" }         // stays
browser.click { selector: "[data-testid=\"leave-confirm-button\"]" }        // leaves
```

Animation pass (HEL-72): two separate browser contexts (thrower + target), desktop 1280×800 and 390×844, light and dark (`localStorage["pointly-theme"]`), plus one run with `reducedMotion: "reduce"`. Add a story first (`#pauta-novo-titulo` + `pauta-add-button`) so the deck is enabled, then throw the chair and click `deck-card-5` on the target while the chair is on screen — the vote must register (`aria-pressed="true"`). Screenshot both pages at ~0.45/1.0/1.35/2.3/3.0s for the chair; sample rAF deltas for fps (expect ~60, no frames >34ms) and a `layout-shift` PerformanceObserver (expect 0 on the target).

## Gotchas

- Outcome (hit/dodge/deflect) is rolled by the server; the per-item beats only play on `data-outcome="hit"` (read it on `[data-testid="projectile-flight"]`) — retry the throw after the 1s reload until you get a hit. The chair always hits.
- In dev the web app opens the WS straight at `ws://<host>:3001/ws` (not via the Vite proxy); on non-default ports set `VITE_WS_URL` and the server's `ALLOWED_ORIGINS`, or you will create rooms on whatever server owns :3001.

- Reloads are enforced client-side *and* server-side; the server is SSOT (`PROJECTILE_COOLDOWN_MS` / `PROJECTILE_CHAIR_COOLDOWN_MS` in `packages/shared`). A successful-looking click inside the reload should still be refused.
- Sending at yourself or at a disconnected seat surfaces `content.projectile.unavailable` — not proof of the happy path.
- The invite field is middle-truncated until it gets focus; read it with a focus first (or use the copy button) before parsing the URL. The truncated value is sized to fit the field at the 390px width with the 16px mobile font.
- The leave confirmation is not a modal: it is a header row with its own Confirm/Cancel buttons; no focus trap.
- Cutucada never persists: the balloon is ephemeral and does not survive a reload.
- This feature was **not** fully live-proven at generation time (needs two seats); treat the two-player pass as the first coverage gap for `maintain-verification-skill`.
