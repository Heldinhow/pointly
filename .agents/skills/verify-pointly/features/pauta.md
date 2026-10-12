# Pauta (agenda)

## Sub-features

- Add story: title (`#pauta-novo-titulo`) + optional acceptance criteria (`pauta-criterio-toggle`).
- Any player can edit, reorder (up/down), delete, and select the active story.
- The active story gates the deck: cards stay disabled until a story exists and is active.

## How to get to it (user POV)

Inside a room, scroll to the "Agenda / Pauta" panel in the sidebar: type a story title, click Add. It becomes ACTIVE; the deck unlocks and shows "Active story: <title>".

## Driving it

```
browser.type  { selector: "#pauta-novo-titulo", value: "Checkout PIX" }
browser.click { selector: "button[data-testid=\"pauta-add-button\"]" }
browser.snapshot   // deck cards no longer disabled; "Active story: Checkout PIX"
```

Per-story controls appear once the story exists: `pauta-up-<id>`, `pauta-down-<id>`, `pauta-edit-<id>`, `pauta-remove-<id>` (the `<id>` is stable per story, e.g. `h_4ce298f03e8e`).

## Gotchas

- **This is the #1 reason a drive stalls.** With a `pauta` present and no active story, every `deck-card-*` is `disabled` and the panel says "Add or select a story in the agenda to unlock the cards." Add a story before trying to vote.
- A legacy room with no `pauta` keeps the old always-on deck (compat); don't assume the gate on every room.
- Removing a scored story may ask for confirmation (`confirmScored`) — expect a second step.
