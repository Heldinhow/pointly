#!/usr/bin/env node
/**
 * Pointly web — static SPA server.
 * Serves apps/web/dist on $PORT (default 8080) with SPA fallback to index.html.
 * Pure Node, no extra deps — fine for production runtime.
 */
import { createReadStream, statSync } from "node:fs";
import { join, normalize } from "node:path";

const DIST = join(import.meta.dirname, "..", "apps", "web", "dist");
const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".map":  "application/json; charset=utf-8",
  ".txt":  "text/plain; charset=utf-8",
};

function safeJoin(rel) {
  // Resolve, then strip any leading ../
  const full = normalize(join(DIST, rel));
  if (!full.startsWith(DIST)) return null;
  return full;
}

function mimeOf(p) {
  const i = p.lastIndexOf(".");
  return i >= 0 ? (MIME[p.slice(i)] ?? "application/octet-stream") : "application/octet-stream";
}

const server = Bun?.serve ?? null;

if (server) {
  // Bun is bundled in the alpine image; use it for speed.
  const srv = server({
    port: PORT,
    hostname: HOST,
    async fetch(req) {
      const url = new URL(req.url);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === "/") pathname = "/index.html";
      const full = safeJoin(pathname);
      if (!full) return new Response("Bad Request", { status: 400 });
      try {
        const f = Bun.file(full);
        if (await f.exists()) return new Response(f, { headers: { "Content-Type": mimeOf(full), "Cache-Control": "no-cache" } });
      } catch {}
      // SPA fallback
      const idx = safeJoin("/index.html");
      if (idx) return new Response(Bun.file(idx), { headers: { "Content-Type": "text/html; charset=utf-8" } });
      return new Response("Not Found", { status: 404 });
    },
  });
  console.log(`[pointly-web] serving ${DIST} on http://${srv.hostname}:${srv.port}`);
} else {
  // Pure-Node fallback (shouldn't be reached in our alpine image, but safe).
  const http = await import("node:http");
  http.createServer((req, res) => {
    let pathname = decodeURIComponent(req.url.split("?")[0]);
    if (pathname === "/") pathname = "/index.html";
    const full = safeJoin(pathname);
    if (!full) { res.writeHead(400); return res.end("Bad Request"); }
    try {
      statSync(full);
      res.writeHead(200, { "Content-Type": mimeOf(full) });
      createReadStream(full).pipe(res);
      return;
    } catch {}
    const idx = safeJoin("/index.html");
    if (idx) { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); createReadStream(idx).pipe(res); return; }
    res.writeHead(404); res.end("Not Found");
  }).listen(PORT, HOST, () => console.log(`[pointly-web] serving ${DIST} on http://${HOST}:${PORT}`));
}