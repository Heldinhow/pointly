# v1 has no backend

> **Status: superseded by [0005](./0005-v1-functional-in-memory-state.md)** — v1 agora tem backend real (Bun + Hono + WebSocket). Estado da sala em Map no processo do servidor.

v1 wireframe é 100% client-side: sem servidor, sem WebSocket, sem banco. Estado vive em memória JS (state machine) + `localStorage` para identidade cross-page (nick, code, host flag). Bots são pre-scripted no HTML pra simular os outros 11 assentos. A regra "Sala some quando todos saem" é conceito v2 — em v1 ninguém sai porque não há desconexão real. Pular backend em v1 mantém o wireframe deployable como HTML estático, testável em qualquer browser, e refatorável sem coordenar servidor. v2 multiplayer vai trazer persistência, sync e WebSocket próprios, com ADRs dedicadas quando chegar lá.
