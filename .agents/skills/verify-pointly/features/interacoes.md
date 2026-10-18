# Interações e convite

## Sub-features

- Send a projectile at another seat (paper ball, paper plane, rock, brick, tomato, epic flying chair); the epic chair has a longer reload ("cadeirada épica").
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

## Gotchas

- Reloads are enforced client-side *and* server-side; the server is SSOT (`PROJECTILE_COOLDOWN_MS` / `PROJECTILE_CHAIR_COOLDOWN_MS` in `packages/shared`). A successful-looking click inside the reload should still be refused.
- Sending at yourself or at a disconnected seat surfaces `content.projectile.unavailable` — not proof of the happy path.
- The invite field is middle-truncated until it gets focus; read it with a focus first (or use the copy button) before parsing the URL. The truncated value is sized to fit the field at the 390px width with the 16px mobile font.
- The leave confirmation is not a modal: it is a header row with its own Confirm/Cancel buttons; no focus trap.
- Cutucada never persists: the balloon is ephemeral and does not survive a reload.
- This feature was **not** fully live-proven at generation time (needs two seats); treat the two-player pass as the first coverage gap for `maintain-verification-skill`.
