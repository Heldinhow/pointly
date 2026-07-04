# T23 — WebSocket client wrapper

**Status:** ✓ complete · 2026-07-04
**Gate:** quick
**Files:** `apps/web/src/lib/ws-client.ts`, `apps/web/src/lib/ws-client.test.ts`

## Resultado

- 18/18 testes em `ws-client.test.ts` (gate ≥5)
- `bun run test:web` → 49 pass / 0 fail (regressão zero)
- `bun run typecheck` → 4/4 workspaces exit 0

## API entregue

`createWSClient({ url?, onEvent, setTimeoutFn?, clearTimeoutFn?, WebSocketCtor?, maxReconnectRetries?, heartbeatIntervalMs?, heartbeatTimeoutMs? })` → `{ connect, send, close, getStatus }`

- URL default: `import.meta.env.VITE_WS_URL ?? "ws://localhost:3001/ws"`
- Zod validation: `ClientToServerEventSchema` (send) + `ServerToClientEventSchema` (receive); malformed → `console.warn` + drop
- Auto-reconnect: backoff 1s, 2s, 4s, …, cap 30s
- Heartbeat: ping 30s, espera pong em 5s, fecha+reconnect se timeout
- Status: `idle | connecting | open | closed | error`
- `close()` para tudo, sem reconnect (explicit closed)

## Cobertura de testes

| Grupo | Tests | Cobre |
|---|---|---|
| connect lifecycle | 2 | idle→connecting→open; close() no-op quando já closed |
| message dispatch | 2 | welcome, vote_cast (individual) chegam ao onEvent |
| malformed events | 4 | sem `type`, type desconhecido, nick inválido, JSON inválido |
| send validation | 3 | válido serializa; inválido dropa; pré-open dropa |
| reconnect on close | 3 | close agenda reconnect; backoff exponencial 1s→2s; close() impede |
| heartbeat | 3 | ping após 30s; pong reseta; intervalo customizado |
| env defaults | 1 | URL default funciona |
