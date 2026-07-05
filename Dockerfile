# syntax=docker/dockerfile:1.7
# Pointly — Bun monorepo (apps/web + apps/server + packages/shared)
ARG BUN_VERSION=1.3.14

# ----------------------------------------------------------------------------
# deps: install all workspace deps (dev + prod) so build stages can use Vite/etc.
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS deps
WORKDIR /app
ENV NODE_ENV=development
# Copy the full workspace tree so bun can resolve all workspaces during install.
# The bun.lockb was generated with ALL workspaces present (including tests/*);
# Bun's --frozen-lockfile compares the workspace snapshot against the lockfile,
# so missing workspaces → phantom drift → "lockfile had changes".
COPY package.json bun.lockb bunfig.toml ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY tests ./tests
COPY scripts ./scripts
RUN bun install --frozen-lockfile

# ----------------------------------------------------------------------------
# web-build: build the React/Vite SPA, output to apps/web/dist
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS web-build
WORKDIR /app
# Vite usa NODE_ENV pra computar `import.meta.env.DEV` no client bundle.
# Manter NODE_ENV=development aqui quebra prod: DEV vira `true` mesmo em
# `vite build`, e o `ws-client.defaultURL()` retorna `ws://localhost:3001/ws`
# em vez de `wss://${window.location.host}/ws`. Resultado: o browser aponta
# o WS pro dev server (que não existe em prod), e nenhuma `hello` chega no
# server — Sala nunca é criada (`SALA — / COMPARTILHAR: —`).
# (Bun já traz dev deps resolvidos via bun install no FROM deps.)
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lockb bunfig.toml ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN cd apps/web && bun x vite build

# ----------------------------------------------------------------------------
# base: shared runtime layer with source + node_modules (hoisted to /app)
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app
RUN apk add --no-cache tini
ENV NODE_ENV=production BUN_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lockb bunfig.toml ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN mkdir -p /app/logs

# ----------------------------------------------------------------------------
# server: Bun + Hono + WS on port 3001
# ----------------------------------------------------------------------------
FROM base AS server
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3001/health >/dev/null 2>&1 || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["bun", "run", "apps/server/src/index.ts"]

# ----------------------------------------------------------------------------
# web: serve the built dist via Bun.serve with SPA fallback, on port 8080
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS web
WORKDIR /app
RUN apk add --no-cache tini
ENV NODE_ENV=production PORT=8080
COPY --from=web-build /app/apps/web/dist ./apps/web/dist
COPY --from=deps /app/node_modules ./node_modules
COPY scripts/serve-web.mjs ./scripts/serve-web.mjs
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "scripts/serve-web.mjs"]