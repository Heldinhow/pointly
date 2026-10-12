# Interações e convite

## Sub-features

- Throw a projectile at another seat (tomato, coffee, rubber duck, chair); chair cooldown is longer ("cadeirada épica").
- Nudge (cutucada): preset messages ("Bora!", "☕ Café?", "Polêmica!", "Confia") as a balloon over the target's seat; shares the projectile cooldown.
- Cooldown feedback: buttons lock and show a countdown; a second throw inside the cooldown is refused with an inline message, not a crash.
- Invite: copy the room link (`inviteUrl = <origin>/join?code=<CODE>`), or hide the invite panel once the room is no longer solo.
- Connection resilience: "reconnecting" banner with "Retry now"; a lost connection shows a warning instead of dropping the room.

## How to get to it (user POV)

In a room with ≥2 people, hover/tap another seat to throw (paying the cooldown), or open the seat menu to nudge. Copy the invite from the sidebar to bring teammates in.

## Driving it

Projectiles/nudges need a **second player** — open a second browser tab (or a second `openchamber_web` tab) that joins the same code, so one seat can target the other. Then:

```
browser.hover { selector: "<seat of the other player>" }   // reveal the throw menu
browser.click { ... }                                       // pick a projectile; watch the countdown
```

Self-target and disconnected targets are refused (inline error), so verify against the *other* seat. Invite copy needs no second player:

```
browser.click { selector: "button ... label 'Copy'" }       // sidebar invite
// then check the clipboard/`Invite link` input value == <origin>/join?code=<CODE>
```

## Gotchas

- Cooldowns are enforced client-side *and* server-side; the server is SSOT (`PROJECTILE_COOLDOWN_MS` / `PROJECTILE_CHAIR_COOLDOWN_MS` in `packages/shared`). A successful-looking click inside the cooldown should still be refused.
- Throwing at yourself or at a disconnected seat surfaces `content.projectile.unavailable` — not proof of the happy path.
- Cutucada never persists: the balloon is ephemeral and does not survive a reload.
- This feature was **not** fully live-proven at generation time (needs two seats); treat the two-player pass as the first coverage gap for `maintain-verification-skill`.
