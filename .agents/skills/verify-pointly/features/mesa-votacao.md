# Mesa e votação (vote → reveal)

## Sub-features

- Fibonacci deck: `0, ½, 1, 2, 3, 5, 8, 13, ☕` — click to vote; repeat click on the same card is a no-op.
- Reveal (any player, after ≥1 vote): button or shortcut `R`.
- Results card: average/median/lowest/highest, "pause and absence stay out of the math", vote breakdown, "Copy results".
- New round (after reveal): button or shortcut `N`, with a second activation to confirm.
- Post-reveal vote edit (recomputes consensus, room stays `revealed`); Unânime celebration and Divergent "justify first" seat.

## How to get to it (user POV)

Create/join a room → add an agenda story (see `pauta.md`) → click a card → press Reveal → read the results → New round for the next estimate.

## Driving it

```
browser.click { selector: "button[data-testid=\"deck-card-5\"]" }
browser.click { selector: "button[data-testid=\"reveal-button\"]" }
browser.snapshot   // expect "Round 1 · Revealed" + Results block
browser.click { selector: "button[data-testid=\"new-round-button\"]" }  // ×2 within the confirm window
```

Prove the state transition, not just the pixels:

```
curl -s http://localhost:3001/api/v1/salas/<CODE>   // {"phase":"revealed",...}
```

and the server log: `ws.event ... event":"cast_vote"` then `"votes_revealed"`.

## Gotchas

- Set the cursor for "1 in the room · 1 voted" in `[data-testid="presence-line"]` — the reveal button is disabled until at least one vote exists.
- New round needs **two** activations inside the confirm window; one click only arms it.
- With a single voter the results read `Single vote` (no unanimity — unanimity needs ≥2 numeric voters).
- The ½ card is a half vote; ☕ (pause) counts as present but is excluded from the math.
