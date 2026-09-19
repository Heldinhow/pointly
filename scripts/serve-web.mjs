#!/usr/bin/env node
/**
 * Pointly web — servidor estático de apps/web/dist (pure Node/Bun, sem deps).
 *
 * Regras de entrega (SEO):
 * - arquivo real, ou diretório → index.html: serve o HTML pré-renderizado (200);
 * - /join e /s/*: shell SPA (shell.html) com `X-Robots-Tag: noindex`;
 * - rota desconhecida: 404 real com dist/404/index.html (fim do soft-404);
 * - /caminho/ → 301 para /caminho (forma canônica sem barra final).
 */
import { createReadStream, statSync } from "node:fs";
import { join, normalize } from "node:path";

const DIST = join(import.meta.dirname, "..", "apps", "web", "dist");
const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? "0.0.0.0";

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".mjs": "application/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".xml": "application/xml; charset=utf-8",
	".txt": "text/plain; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".map": "application/json; charset=utf-8",
};

function safeJoin(rel) {
	// Resolve, then strip any leading ../
	const full = normalize(join(DIST, rel));
	if (!full.startsWith(DIST)) return null;
	return full;
}

function mimeOf(p) {
	const i = p.lastIndexOf(".");
	return i >= 0
		? (MIME[p.slice(i)] ?? "application/octet-stream")
		: "application/octet-stream";
}

function isFile(p) {
	if (!p) return false;
	try {
		return statSync(p).isFile();
	} catch {
		return false;
	}
}

/** Arquivo real ou diretório→index.html; null se não existir. */
function resolveFile(pathname) {
	const exact = safeJoin(pathname);
	if (isFile(exact)) return exact;
	const index = safeJoin(join(pathname, "index.html"));
	if (isFile(index)) return index;
	return null;
}

/**
 * Decide a resposta para uma URL.
 * @returns {{status:number, file?:string, text?:string, noindex?:boolean, location?:string}}
 */
function decide(rawUrl) {
	const url = new URL(rawUrl, "http://localhost");
	let pathname;
	try {
		pathname = decodeURIComponent(url.pathname);
	} catch {
		return { status: 400, text: "Bad Request" };
	}

	if (pathname !== "/" && pathname.endsWith("/")) {
		return {
			status: 301,
			location: `${pathname.replace(/\/+$/, "")}${url.search}`,
		};
	}

	// Rotas do app: shell SPA (sem conteúdo pré-renderizado), noindex.
	if (pathname === "/join" || pathname.startsWith("/s/")) {
		const shell = resolveFile("/shell.html") ?? resolveFile("/index.html");
		if (shell) return { status: 200, file: shell, noindex: true };
		return { status: 500, text: "shell.html ausente no build" };
	}

	const file = resolveFile(pathname === "/" ? "/index.html" : pathname);
	if (file) return { status: 200, file };

	const notFound = resolveFile("/404");
	if (notFound) return { status: 404, file: notFound, noindex: true };
	return { status: 404, text: "Not Found" };
}

function headersFor(decision, file) {
	const headers = { "Cache-Control": "no-cache" };
	if (decision.location) headers.Location = decision.location;
	if (file) headers["Content-Type"] = mimeOf(file);
	if (decision.noindex) headers["X-Robots-Tag"] = "noindex";
	return headers;
}

const server = globalThis.Bun?.serve ?? null;

if (server) {
	const srv = server({
		port: PORT,
		hostname: HOST,
		fetch(req) {
			const decision = decide(req.url);
			if (decision.text) {
				return new Response(decision.text, {
					status: decision.status,
					headers: {
						...headersFor(decision),
						"Content-Type": "text/plain; charset=utf-8",
					},
				});
			}
			return new Response(decision.file ? Bun.file(decision.file) : null, {
				status: decision.status,
				headers: headersFor(decision, decision.file),
			});
		},
	});
	console.log(
		`[pointly-web] serving ${DIST} on http://${srv.hostname}:${srv.port}`,
	);
} else {
	const http = await import("node:http");
	http
		.createServer((req, res) => {
			const decision = decide(req.url ?? "/");
			res.writeHead(decision.status, headersFor(decision, decision.file));
			if (decision.text) return res.end(decision.text);
			if (!decision.file) return res.end();
			createReadStream(decision.file).pipe(res);
		})
		.listen(PORT, HOST, () =>
			console.log(`[pointly-web] serving ${DIST} on http://${HOST}:${PORT}`),
		);
}
