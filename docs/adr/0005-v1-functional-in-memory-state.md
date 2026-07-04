# v1 functional with in-memory state

> **Supersedes**: [0002](./0002-wireframe-simulates-host.md), [0003](./0003-demo-mode-overlay.md), [0004](./0004-v1-no-backend-localstorage.md). v1 abandonou wireframe client-side e virou sistema funcional real.

v1 é um sistema funcional real: backend com WebSocket, frontend React, sala como objeto JS num `Map<codigo, Sala>` no processo do servidor. Sem mock, sem bots, sem Demo Mode. Salas reais entre jogadores reais via WebSocket.

In-memory (vs DB ou Redis) vem do spec: "Sala some quando todos saem" + "Sem backlog, analytics, histórico". Sala como objeto JS no processo satisfaz ambos: morre quando processo reinicia (aceitável, sala é efêmera por design) ou quando último jogador sai (sala é removida do Map). Sem infra extra (DB host, Redis), sem schema, sem migração.

**Trade-offs aceitos:**

- Sem audit log: quem votou o quê não persiste depois que a sala some.
- Sem reconnect state entre restarts do servidor: sala perdida, jogadores recriam.
- Single-instance: `Map` em processo não compartilha entre réplicas. Suficiente pra v1 single-server.
- TTL opcional: sala some imediatamente quando todos saem, ou por timeout se servidor reiniciar.

**Quando v2 chegar** com audit, reconnect entre restarts, ou horizontal scaling, vai precisar de Redis (pub/sub + state compartilhado) ou Postgres (audit). ADR dedicada quando chegar lá.

**Stack vinculada** (ADRs 0006+ a seguir): Bun runtime, Hono HTTP + WebSocket, React 18 + Vite + TS no frontend, Zustand pra state local, Zod pra shared schemas.
