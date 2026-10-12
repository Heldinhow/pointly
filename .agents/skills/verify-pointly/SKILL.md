---
name: verify-pointly
description: Drive and verify the Pointly planning-poker web app (React+Vite UI on :5173, Bun+Hono WS server on :3001) the way a user does. Use to prove room create/join, voting/reveal, agenda (pauta), and table interactions, in OpenChamber.
---

# Verify Pointly

Pointly is Planning Poker sem cadastro: an ephemeral room ("Sala") with a 4-char code; players ("Player") join by link/code, vote on the Fibonacci deck, reveal, and discuss. State is in-memory — restarting the server empties every room.

## Launch

Two services; run each in its own background `shell` session from the repo root `/Users/helder/pointly`:

```
bun --filter server dev        # Bun+Hono WS on :3001
bun --filter pointly-web dev   # Vite UI on :5173 (proxies /api and /ws to :3001)
```

Ready signals: server logs `[server] listening on http://localhost:3001`; Vite logs `ready in ... ms` and `Local: http://localhost:5173/`. The UI needs the server up (WS at `/ws`); a lone Vite gives a dead room.

Teardown kills only what this run started (both ports are ours):

```
lsof -ti tcp:3001 | while read p; do kill "$p"; done
lsof -ti tcp:5173 | while read p; do kill "$p"; done
```

## Doctor

Read-only, run first when anything looks off:

```
curl -sf http://localhost:3001/health          # {"status":"ok","service":"pointly-server",...}
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/join   # 200
curl -s http://localhost:3001/api/v1/salas/<CODE>   # 404 exists:false when the room is gone (server restarted)
```

`api/v1/salas/:code` is the SSOT for "does this room still exist". A room older than the server process is gone.

## Drive

Harness: `openchamber_web`. Flow: `browser.open` → `browser.snapshot` → act by selector → `browser.snapshot` to read the result.

```
browser.open { url: "http://localhost:5173/join", viewport: "desktop" }
```

Use the app's real handles (they are stable and test-anchored):

- Create room: type `#nick` (2–20 chars), then click `button[type="submit"]`. (Careful: the mode switch also has a "Create room" label — click by `selector`, not by text.) The page navigates to `/s/<CODE>`.
- Join with a code: open `/join?code=<CODE>` (invite link shape) or pick the "Join with code" radio, then the 4-char `OTPField #code`.
- Cast a vote: `button[data-testid="deck-card-<value>"]` where value ∈ `0, ½, 1, 2, 3, 5, 8, 13, ☕`.
- Reveal: `button[data-testid="reveal-button"]` (shortcut `R`), enabled after the first vote.
- New round: `button[data-testid="new-round-button"]` (shortcut `N`) — needs a **second** activation within the confirm window.
- Room/round state readouts: `[data-testid="sala-code"]`, `[data-testid="round-label"]`, `[data-testid="presence-line"]`.
- Agenda (pauta): `#pauta-novo-titulo` + `button[data-testid="pauta-add-button"]`; per-story `pauta-up-*`/`pauta-down-*`/`pauta-edit-*`/`pauta-remove-*`.

Speech is brushed aside by real controls: prefer `data-testid` and `aria-label` over button text (pt-BR/en labels swap with the language toggle).

## Evidence

Save proofs under `/tmp/pointly-verify/` (untracked, outside git). For each drive capture:

1. `browser.capture { label: "<feature>-<state>" }` and copy the returned path into `/tmp/pointly-verify/`.
2. The observable end state in the snapshot text (e.g. `Round 1 · Revealed`, `Average ... 5`).
3. The side effect via API/logs, not just the screen: `curl http://localhost:3001/api/v1/salas/<CODE>` (expect `"phase":"revealed"`) and the server log lines (`ws.event ... event":"cast_vote"`, `"votes_revealed"`).

Proof standard: exercise the real user path (click the deck, not an internal setter), capture the action and the resulting state, and confirm the side effect (room phase, WS log) alongside the screenshot.

## Cleanup

Kill the two dev processes started above (by the ports they own, never by process name). Rooms are ephemeral: they vanish with the server. Evidence in `/tmp/pointly-verify/` is never removed by cleanup.

## Gotchas

- **The deck is locked until an agenda story exists.** With `pauta` present and no active story, every `deck-card-*` is `disabled` and shows "Add or select a story in the agenda to unlock the cards." Add a story first. A legacy room without `pauta` keeps the old always-on deck.
- Spectators (`spectate: true`) cannot vote; card clicks surface an inline error, not a disabled state.
- Signup-free but stateful: nick draft/avatar live on the device (localStorage) and are re-sent on reload; a reload rejoins the same seat via the persisted UUID.
- Joining a code that no longer exists (server restarted) shows "sala não encontrada" and clears the session.
