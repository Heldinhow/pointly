# Mesa e votação (vote → reveal)

## Sub-features

- Fibonacci deck: `0, ½, 1, 2, 3, 5, 8, 13, ☕` — click to vote; repeat click on the same card is a no-op.
- Reveal (any player, after ≥1 vote): button or shortcut `R`.
- Results card: average/median/lowest/highest, "pause and absence stay out of the math", vote breakdown with a visible legend for the `votes×value` notation ("1×3 = 1 vote on card 3"), "Copy results".
- New round (after reveal): button or shortcut `N`; the first activation arms, the second confirms, and a visible "Cancel" button (`new-round-cancel`) disarms. No expiry timer.
- "Everyone voted." shows only with more than one connected voter; alone in a revealable room it reads "We already have votes".
- Post-reveal vote edit (recomputes consensus, room stays `revealed`); Unânime celebration and Divergent "justify first" seat.

## How to get to it (user POV)

Create/join a room → add an agenda story (see `pauta.md`) → click a card → press Reveal → read the results → New round for the next estimate.

## Driving it

```
browser.click { selector: "button[data-testid=\"deck-card-5\"]" }
browser.click { selector: "button[data-testid=\"reveal-button\"]" }
browser.snapshot   // expect "Round 1 · Revealed" + Results block
browser.click { selector: "button[data-testid=\"new-round-button\"]" }  // arms
browser.snapshot   // expect "Confirm new round" + "Cancel"
browser.click { selector: "button[data-testid=\"new-round-button\"]" }  // confirms
```

Prove the state transition, not just the pixels:

```
curl -s http://localhost:3001/api/v1/salas/<CODE>   // {"phase":"revealed",...}
```

and the server log: `ws.event ... event":"cast_vote"` then `"votes_revealed"`.

## Gotchas

- Set the cursor for "1 in the room · 1 voted" in `[data-testid="presence-line"]` — the reveal button is disabled until at least one vote exists.
- New round needs **two** activations; one click only arms it. While armed, `new-round-cancel` (or `Cancel`) disarms without sending, and nothing expires on a timer.
- The confirm hint (`new-round-hint`) changes between the two steps; read it instead of assuming the send already happened.
- With a single voter the results read `Single vote` (no unanimity — unanimity needs ≥2 numeric voters) and the center never claims "Everyone voted".
- The ½ card is a half vote; ☕ (pause) counts as present but is excluded from the math.
