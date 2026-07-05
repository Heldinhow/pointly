# syntax=docker/dockerfile:1.7
# Pointly — Bun monorepo (apps/web + apps/server + packages/shared)
ARG BUN_VERSION=1.2.19

# ----------------------------------------------------------------------------
# deps: install all workspace deps (dev + prod) so build stages can use Vite/etc.
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS deps
WORKDIR /app
ENV NODE_ENV=development
# Copy the full workspace tree so bun can resolve all workspaces during install.
# Selective COPY of only manifests + lockfile fails because bun's --frozen-lockfile
# needs to scan the actual workspace layout (apps/, packages/) to validate.
COPY package.json bun.lock bunfig.toml ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
RUN bun install --frozen-lockfile

# ----------------------------------------------------------------------------
# web-build: build the React/Vite SPA, output to apps/web/dist
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS web-build
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY package.json bun.lock bunfig.toml ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN cd apps/web && bun run build

# ----------------------------------------------------------------------------
# base: shared runtime layer with source + node_modules
# ----------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app
RUN apk add --no-cache tini
ENV NODE_ENV=production BUN_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY package.json bun.lock bunfig.toml ./
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
COPY --from=deps /app/packages/shared ./packages/shared
COPY --from=deps /app/node_modules ./node_modules
COPY scripts/serve-web.mjs ./scripts/serve-web.mjs
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "scripts/serve-web.mjs"]