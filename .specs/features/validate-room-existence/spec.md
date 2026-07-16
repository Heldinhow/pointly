# validate-room-existence — Spec

## Context

The current `/join` flow validates only the **shape** of the room code (4 alphanumeric chars) and then navigates blindly to `/arena`. The real existence check happens later, when the WebSocket `hello` event reaches the server's `handleHello` → `Hub.addPlayer` → throws `HubError("sala_nao_encontrada")`, which surfaces as a transient toast in `sala-end-loop.ts:92`. Two user-visible problems:

1. **Wasted round-trip.** User fills nick, clicks "Entrar", navigates to arena, waits for the WS to open and `hello` to be sent, only to bounce back from a toast that says "Sala não encontrada". All while their nick and (typed) code state are gone.
2. **Wrong place for the error.** The Arena is for gameplay; an entry-time validation failure shouldn't reach that screen. The Join screen is where the user can correct the code in-place (select-all focus pattern is already wired).

The fix: validate existence on the Join screen, before the navigation. A 404 must show an inline error near the code input and keep the user on the form.

## Scope

### In scope
- New REST endpoint `GET /api/v1/salas/:code` on the server.
- `Join` page calls this endpoint on submit (only when joining **with** a code; host-creation flow is exempt because the server generates a fresh code in the WS `hello`).
- Inline error state on the code input when 404, with `aria-invalid=true` + `role="alert"` copy.
- Server test for the new endpoint (200/404/400).
- Client test for the new submit path (200 → navigates; 404 → stays + shows error).

### Out of scope
- Replacing the WS `hello` existence check. It stays as defense in depth (race: room deleted between HTTP check and WS open).
- Caching the existence response. The check is cheap and rooms are ephemeral.
- Auth/permissions. v1 has none.
- Telling the user *why* a room doesn't exist (expired vs typo vs never existed). v1 just says "not found".
- A separate `?code=...` validation on mount. Only on submit — same trigger as today.

## Acceptance Criteria

| ID  | Criterion |
| --- | --------- |
| **AC-1** | Server exposes `GET /api/v1/salas/:code`. When `code` matches `[A-Z0-9]{4}` and a sala exists in the Hub → **200** with `{ code: string, exists: true, playerCount: number, phase: Phase }`. |
| **AC-2** | Server: code matches shape but no sala in Hub → **404** with `{ code: string, exists: false }`. |
| **AC-3** | Server: code malformed (not 4 alphanum chars) → **400** with `{ error: 'invalid_code' }`. |
| **AC-4** | Join screen on submit, when `isHost=false` AND `activeCode` valid: client fetches `GET /api/v1/salas/{code}`. While fetching, the submit button shows "Conectando…" and is disabled. |
| **AC-5** | Join screen on **200** response: proceeds to navigate to `/arena?code=...` exactly like today. No regression. |
| **AC-6** | Join screen on **404** response: does **NOT** navigate. Shows inline error near the code input with copy "Sala não encontrada. Confira o código." in `coral-deep`, with `aria-invalid=true` on the input, `role="alert"` on the error node. |
| **AC-7** | Join screen on **network error / 5xx**: does **NOT** navigate. Falls back to navigating anyway (defense in depth via WS hello). Treated as "best-effort pre-check failed" — better to let the user reach the arena and get the toast than to block them forever. |
| **AC-8** | Join screen on submit when `isHost=true`: skips the existence check entirely (no code exists yet — server creates on WS hello). |
| **AC-9** | Submit button reflects all three states: idle ("Entrar"), validating ("Verificando…"), connecting (existing "Conectando…"). |
| **AC-10** | Inline error clears as soon as the user edits the code (mirrors `nick-error` UX pattern already in the page). |

## Transport decision: HTTP REST, not WS peek

Two paths were considered:

1. **HTTP `GET /api/v1/salas/:code`** (chosen) — idempotent, cacheable, no session needed, simpler error mapping (status code → state). The server already runs Hono for `/health` so adding a route is one block of code. Pairs naturally with REST conventions the rest of `/api/v1/*` follows.
2. **WS `peek_room` message** — would need a new event type in `shared/schemas/events.ts`, plus handler dispatch wiring, plus a way to correlate the request with the response on a connection that hasn't sent `hello` yet. Higher surface area for the same outcome.

HTTP wins on simplicity and matches existing patterns (`/api/v1/health` is already there).

## Errors

| Surface | When | Copy |
| --- | --- | --- |
| Inline code error | HTTP 404 | "Sala não encontrada. Confira o código." |
| Inline code error | HTTP 400 (very rare; caught client-side first) | "Código inválido." |
| Toast | HTTP 5xx / network | (none — we fall through to navigate; WS hello surfaces the real reason) |

## Implementation sketch

### Server (`apps/server/src/index.ts`)

```ts
app.get("/api/v1/salas/:code", (c) => {
  const code = c.req.param("code").toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(code)) {
    return c.json({ error: "invalid_code" }, 400);
  }
  const sala = hub.getSala(code);
  if (!sala) {
    return c.json({ code, exists: false }, 404);
  }
  const state = sala.toState();
  return c.json({
    code,
    exists: true,
    playerCount: state.players.length,
    phase: state.phase,
  });
});
```

The handler reads the existing Hub singleton — no new state. But `index.ts` builds the Hub **only inside** `if (import.meta.main)`. Tests currently construct their own Hub. Two options:

- **A** (chosen for this feature): instantiate the Hub at module top-level when running tests too. This requires moving the `const hub = new Hub()` line out of the `if (import.meta.main)` block, while leaving the `wsService` and `Bun.serve` inside. Tests then import a `hub` export.
- **B**: lazy-init via a getter. Slightly more code; doesn't change behavior at runtime.

Going with **A** because it removes the implicit test/runtime asymmetry.

### Client (`apps/web/src/pages/join.tsx`)

1. New state `checkState: 'idle' | 'checking' | 'not-found' | 'ok'`.
2. New submit-time branch when `!isHost` and `activeCode` is well-formed:
   ```ts
   const resp = await fetch(`/api/v1/salas/${activeCode}`);
   if (resp.status === 404) { setCheckState('not-found'); return; }
   // any other non-2xx → fall through to navigate (defense in depth)
   ```
3. Submit button disabled while `checkState === 'checking'`; label switches to "Verificando…".
4. Code input gets `aria-invalid` when `checkState === 'not-found'`; error node shows the copy.
5. `handleCodeChange` resets `checkState` to `'idle'` so the error clears as soon as the user types.

### Tests

**Server** (`apps/server/src/index.test.ts`, new):
- `GET /api/v1/salas/ABCD` after `hub.createSala(...)` → 200, payload shape.
- `GET /api/v1/salas/ZZZZ` when none exists → 404.
- `GET /api/v1/salas/ab` (too short) → 400.

**Client** (`apps/web/src/pages/join.test.tsx`):
- Mock `globalThis.fetch`, submit with `code=ABCD`, assert navigate fires when 200.
- Submit with 404, assert **no** navigate and inline error copy appears with `role="alert"`.
- Submit as `host=1`, assert `fetch` is **not** called.
- Assert `aria-invalid=true` on the code input after 404, and that editing the input clears it.

## Risks

- **Race window.** Room can be deleted between the HTTP check and the WS `hello`. Mitigation: WS handler still throws `sala_nao_encontrada`, which `sala-end-loop` already shows as a toast. No regression.
- **Hub lifetime in tests.** Moving `new Hub()` to module scope changes when the singleton is constructed. Mitigated by ensuring tests construct their own (don't rely on the shared one). Verified by re-running the existing `apps/server/src/_smoke.test.ts` and `hub.test.ts`.
- **CORS.** WebSocket is the same-origin in dev (Vite proxy) and prod (server serves static). REST goes through the same `Bun.serve` handler → `app.fetch(req)`. No CORS headers needed for same-origin; for dev Vite proxy needs `/api` to forward (verify `vite.config.ts`).
