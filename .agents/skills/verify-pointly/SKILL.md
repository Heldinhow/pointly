---
name: verify-pointly
description: Drive and verify the Pointly planning-poker web app (React+Vite UI on :5173, Bun+Hono WS server on :3001) the way a user does. Use to prove room create/join, voting/reveal, agenda (pauta), and table interactions, via the Playwright E2E suite or a manual browser pass.
---

# Verify Pointly

Pointly is Planning Poker sem cadastro: an ephemeral room ("Sala") with a 4-char code; players ("Player") join by link/code, vote on the Fibonacci deck, reveal, and discuss. State is in-memory — restarting the server empties every room.

## Launch

Two services; run each in its own background `shell` session from the repo root (the checkout you are working in, e.g. `git rev-parse --show-toplevel`):

```
bun --filter server dev        # Bun+Hono WS on :3001
bun --filter pointly-web dev   # Vite UI on :5173 (proxies /api and /ws to :3001)
```

Record the shell session handle (or PID) of each service when you start it.

Ready signals: server logs `[server] listening on http://localhost:3001`; Vite logs `ready in ... ms` and `Local: http://localhost:5173/`. The UI needs the server up (WS at `/ws`); a lone Vite gives a dead room.

Teardown stops only the two sessions/PIDs recorded above (e.g. kill the
stored PID, or stop the stored background session handle). Never kill by
port scan (`lsof`/`fuser -k`) or by process name: the ports may host
unrelated processes.

## Doctor

Read-only, run first when anything looks off:

```
curl -sf http://localhost:3001/health          # {"status":"ok","service":"pointly-server",...}
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/join   # 200
curl -s http://localhost:3001/api/v1/salas/<CODE>   # 404 exists:false when the room is gone (server restarted)
```

`api/v1/salas/:code` is the SSOT for "does this room still exist". A room older than the server process is gone.

## Drive

Automated first: the Playwright E2E suite (`e2e/README.md`) drives the
real Vite frontend against the real backend on its own ports
(`:5179`/`:3001`, `reuseExistingServer: false`):

```
bun run typecheck:e2e
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser bun run test:e2e
```

For a manual pass, open `http://localhost:5173/join` in a real browser
(desktop viewport 1280×800, then a mobile viewport 390×844 with touch)
and walk the handles below, reading the result on screen after each step.

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

1. A screenshot of the end state saved into `/tmp/pointly-verify/`
   (Playwright keeps screenshots only on failure; for a manual pass use
   the browser's own screenshot).
2. The observable end state in the snapshot text (e.g. `Round 1 · Revealed`, `Average ... 5`).
3. The side effect via API/logs, not just the screen: `curl http://localhost:3001/api/v1/salas/<CODE>` (expect `"phase":"revealed"`) and the server log lines (`ws.event ... event":"cast_vote"`, `"votes_revealed"`).

Proof standard: exercise the real user path (click the deck, not an internal setter), capture the action and the resulting state, and confirm the side effect (room phase, WS log) alongside the screenshot.

## Cleanup

Kill only the recorded sessions/PIDs from Launch (never by port or process name). Rooms are ephemeral: they vanish with the server. Evidence in `/tmp/pointly-verify/` is never removed by cleanup.

## Gotchas

- **The deck is locked until an agenda story exists.** With `pauta` present and no active story, every `deck-card-*` is `disabled` and shows "Add or select a story in the agenda to unlock the cards." Add a story first. A legacy room without `pauta` keeps the old always-on deck.
- Spectators (`spectate: true`) cannot vote: the deck cards render `disabled` for them, so no vote request is ever sent and no error surfaces on click.
- Signup-free but stateful: nick draft/avatar live on the device (localStorage) and are re-sent on reload; a reload rejoins the same seat via the persisted UUID.
- Joining a code that no longer exists from the entry form shows the
  inline "sala não encontrada" error without opening a socket; a reload
  into a vanished room (arena rejoin) clears the session and shows the
  terminal "Esta sala não está mais disponível." card, with a return to
  `/join` (no dead code reuse).
- **Invite vs manual:** a valid `/join?code=XXXX` shows a compact summary
  (`invite-code`) with `Edit code` to reopen the OTP + mode switch; an
  invalid code is never truncated into a valid one — the manual OTP
  stays empty with an error.
- **Photo/spectator live in a closed disclosure** (`Foto e preferências`,
  `join-options-toggle`): open it before checking `#spectate` — never
  bypass-click a hidden control.
- **First story:** an empty agenda shows `Adicionar primeira história`
  (`first-story-action`) for non-spectators; it focuses the real
  `#pauta-novo-titulo` input and never creates a story by itself.
  Spectators never get this action.
- **Ended vs dropped:** `sala_ended` (`server_restart`, `replaced`,
  `last_left`) and `missing` render the terminal `room-ended` card (no
  more votes, back to `/join` without recreating). A reason-less drop
  keeps the 5min backoff — don't disable reconnect for every failure.
- **Analytics is policy-disabled:** even with a non-empty
  `VITE_GA_MEASUREMENT_ID` (E2E uses synthetic `G-POINTLY-E2E-DISABLED`)
  no GA/GTM request may fire.
- Don't claim iPhone-real, Safari, Docker, or server-restart E2E evidence
  that was never executed.
