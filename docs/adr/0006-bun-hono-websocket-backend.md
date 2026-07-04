# Backend: Bun + Hono + Bun.serve WebSocket

Runtime único: Bun. HTTP via Hono (router minimalista, type-safe, middleware-friendly). WebSocket nativo via `Bun.serve()` — zero dependência de `socket.io` ou `ws`. Single-binary, TS first-class, e `Bun.serve()` tem suporte maduro pra WebSocket com pub/sub por sala. Alternativas: Node + Express + lib WS (mais setup, mais dependências) ou Deno (menos ecossistema para Planning Poker). Trade-off: Bun ainda é 1.0+ mas a API HTTP/WebSocket está estável e a DX é superior.
