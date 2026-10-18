# Pauta (agenda)

## Sub-features

- Add story: one path only, the Pauta form — title (`#pauta-novo-titulo`) + optional acceptance criteria (`pauta-criterio-toggle`, labeled "(optional)" and collapsed by default).
- Any player can edit, reorder (up/down), delete, and select the active story.
- The active story gates the deck: cards stay disabled until a story exists and is active.
- With no active story the center of the table explains the block ("Add a story to unlock the cards" when the agenda is empty, "Select a story..." when stories exist but none is active) and always carries the add button (`first-story-action`), which focuses the Pauta title field. A new story auto-becomes active on the server. There is no separate banner. Spectators see the reason and the locked-cards legend but get no add button.

## How to get to it (user POV)

Inside a room, use the add button in the center of the table (or scroll to the "Agenda / Pauta" panel in the sidebar): type a story title, click Add. It becomes ACTIVE; the deck unlocks and shows "Active story: <title>".

## Driving it

```
browser.click { selector: "button[data-testid=\"first-story-action\"]" }  // center-of-table empty state
browser.type  { selector: "#pauta-novo-titulo", value: "Checkout PIX" }
browser.click { selector: "button[data-testid=\"pauta-add-button\"]" }
browser.snapshot   // deck cards no longer disabled; "Active story: Checkout PIX"
```

Per-story controls appear once the story exists: `pauta-up-<id>`, `pauta-down-<id>`, `pauta-edit-<id>`, `pauta-remove-<id>` (the `<id>` is stable per story, e.g. `h_4ce298f03e8e`).

## Gotchas

- **This is the #1 reason a drive stalls.** With a `pauta` present and no active story, every `deck-card-*` is `disabled`, `reveal-button` is absent, and the center says "Add a story to unlock the cards" (or "Select a story..." when stories exist but none is active). Add or select a story before trying to vote.
- The deck card carries the same explanation (`deck-selection`) plus a visible legend under the locked cards (`deck-locked-legend`), for players and spectators alike.
- When stories exist but none is active, `first-story-action` still exists: adding a story auto-selects it, so it also unlocks the deck.
- A legacy room with no `pauta` keeps the old always-on deck (compat); don't assume the gate on every room.
- Removing a scored story may ask for confirmation (`confirmScored`) — expect a second step.
