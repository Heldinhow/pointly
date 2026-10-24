#!/usr/bin/env node
/**
 * Pointly web — servidor estático de apps/web/dist (pure Node/Bun, sem deps).
 *
 * Regras de entrega (SEO):
 * - arquivo real, ou diretório → index.html: serve o HTML pré-renderizado (200);
 * - /join e /s/*: shell SPA (shell.html) com `X-Robots-Tag: noindex`;
 * - rota desconhecida: 404 real com dist/404/index.html (fim do soft-404);
 * - /caminho/ → 301 para /caminho (forma canônica sem barra final).
 * - cache: `/assets/*` imutável por 1 ano; estáticos públicos por 1 dia; HTML
 *   e erros sem cache. `ETag` fraco + 304; Brotli/gzip só para texto, com
 *   `Vary` implícito pela negociação de `Accept-Encoding`. HSTS (1 ano,
 *   includeSubDomains) apenas quando `X-Forwarded-Proto: https`.
 * - segurança: CSP (self + GA, hashes dos <script> inline de cada HTML),
 *   frame-ancestors none, nosniff, Referrer-Policy e Permissions-Policy em
 *   toda resposta.
 */
import { createHash } from "node:crypto";
import { createReadStream, readFileSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

const DIST = join(import.meta.dirname, "..", "apps", "web", "dist");
const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? "0.0.0.0";

const CACHE_IMMUTABLE = "public, max-age=31536000, immutable";
const CACHE_SHORT = "public, max-age=86400";
const CACHE_NONE = "no-cache";
const HSTS_MAX_AGE = 31536000;

// GA4 (ADR-0012): gtag.js + coleta. Hosts oficiais da doc de CSP do Google.
const GA_SCRIPT = "https://www.googletagmanager.com";
const GA_CONNECT =
	"https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com";
const GA_IMG = "https://*.google-analytics.com https://*.googletagmanager.com";
const WS_ORIGINS = "wss://pointly.space wss://www.pointly.space";

const SECURITY_HEADERS = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy":
		"camera=(), microphone=(), geolocation=(), payment=(), usb=()",
	"Cross-Origin-Opener-Policy": "same-origin",
};

/**
 * CSP. `scriptHashes` cobre os <script> inline (bootstrap de tema) do HTML
 * servido; JSON-LD não executa e não precisa de hash, mas entra junto sem
 * prejuízo. Estilos inline (atributos `style` do prerender) exigem
 * 'unsafe-inline' em style-src.
 */
function cspFor(scriptHashes = []) {
	const hashes = scriptHashes.map((h) => `'sha256-${h}'`).join(" ");
	return [
		"default-src 'self'",
		`script-src 'self' ${hashes} ${GA_SCRIPT}`.replace(/\s+/g, " "),
		"style-src 'self' 'unsafe-inline'",
		`img-src 'self' data: blob: ${GA_IMG}`,
		"font-src 'self' data:",
		`connect-src 'self' ${WS_ORIGINS} ${GA_CONNECT}`,
		"manifest-src 'self'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"upgrade-insecure-requests",
	].join("; ");
}

const inlineHashCache = new Map();

/** sha256 (base64) de cada <script> inline sem `src` do HTML. */
function inlineScriptHashes(file) {
	if (!file?.endsWith(".html")) return [];
	let stat;
	try {
		stat = statSync(file);
	} catch {
		return [];
	}
	const cached = inlineHashCache.get(file);
	if (cached && cached.mtimeMs === stat.mtimeMs) return cached.hashes;
	let html;
	try {
		html = readFileSync(file, "utf8");
	} catch {
		return [];
	}
	const hashes = [];
	const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
	for (const match of html.matchAll(re)) {
		const body = match[1] ?? "";
		if (!body.trim()) continue;
		hashes.push(createHash("sha256").update(body, "utf8").digest("base64"));
	}
	const unique = [...new Set(hashes)];
	if (inlineHashCache.size < 500) {
		inlineHashCache.set(file, { mtimeMs: stat.mtimeMs, hashes: unique });
	}
	return unique;
}
// Só texto comprime bem; imagens/fontes já são comprimidas.
const COMPRESSIBLE = new Set([
	".html",
	".js",
	".mjs",
	".css",
	".json",
	".xml",
	".txt",
	".svg",
	".webmanifest",
	".map",
]);
// Estáticos públicos sem hash mudam entre deploys; ficam com cache curto.
const SHORT_LIVED = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
	".ico",
	".svg",
	".woff",
	".woff2",
	".ttf",
	".webmanifest",
]);
const MAX_COMPRESSED_BYTES = 2 * 1024 * 1024;
const compressedCache = new Map();

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
	".webmanifest": "application/manifest+json",
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

function headersFor(decision, file, request) {
	const headers = {
		"Cache-Control": file ? cacheControlFor(file) : CACHE_NONE,
		...SECURITY_HEADERS,
		"Content-Security-Policy": cspFor(inlineScriptHashes(file)),
	};
	if (decision.location) headers.Location = decision.location;
	if (file) {
		headers["Content-Type"] = mimeOf(file);
		const etag = etagFor(file);
		if (etag) headers.ETag = etag;
	}
	if (decision.noindex) headers["X-Robots-Tag"] = "noindex";
	Object.assign(headers, hstsHeader(request));
	return headers;
}

function hstsHeader(request) {
	// HSTS só faz sentido sobre HTTPS; o protocolo chega no X-Forwarded-Proto
	// setado pelo Traefik (único caminho até este servidor). 1 ano; sem
	// `preload` até o domínio ser submetido manualmente em hstspreload.org.
	if (requestProto(request) !== "https") return {};
	return {
		"Strict-Transport-Security": `max-age=${HSTS_MAX_AGE}; includeSubDomains`,
	};
}

function extOf(pathname) {
	const index = pathname.lastIndexOf(".");
	return index >= 0 ? pathname.slice(index).toLowerCase() : "";
}

/** Assets do Vite têm hash no nome e nunca mudam; o resto varia por tipo. */
function cacheControlFor(file, distDir = DIST) {
	const assetsPrefix = join(distDir, "assets") + "/";
	if (file.startsWith(assetsPrefix)) return CACHE_IMMUTABLE;
	if (SHORT_LIVED.has(extOf(file))) return CACHE_SHORT;
	return CACHE_NONE;
}

/** Validador fraco a partir de tamanho + mtime; barato e suficiente aqui. */
function etagFor(file) {
	try {
		const stat = statSync(file);
		if (!stat.isFile()) return undefined;
		return `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
	} catch {
		return undefined;
	}
}

function isNotModified(file, ifNoneMatch) {
	if (!ifNoneMatch) return false;
	const etag = etagFor(file);
	if (!etag) return false;
	return String(ifNoneMatch)
		.split(",")
		.map((value) => value.trim())
		.some((value) => value === "*" || value === etag);
}

/**
 * Decide a resposta HTTP completa (status, headers e corpo) para uma
 * requisição. Compartilhada pelo caminho Bun e pelo caminho Node.
 * @returns {{status:number, headers:Record<string,string>, body?:string|Uint8Array}}
 */
function respond(decision, request, ifNoneMatch, acceptEncoding) {
	if (decision.text) {
		return {
			status: decision.status,
			headers: {
				...headersFor(decision, undefined, request),
				"Content-Type": "text/plain; charset=utf-8",
			},
			body: decision.text,
		};
	}
	if (!decision.file) {
		return {
			status: decision.status,
			headers: headersFor(decision, undefined, request),
		};
	}

	const base = {
		...headersFor(decision, decision.file, request),
		...hstsHeader(request),
	};
	// Só 200 revalida (o 404 também tem ETag, mas nunca vira 304).
	if (decision.status === 200 && isNotModified(decision.file, ifNoneMatch)) {
		return { status: 304, headers: base };
	}

	if (!COMPRESSIBLE.has(extOf(decision.file))) {
		return { status: decision.status, headers: base };
	}
	// A resposta varia por Accept-Encoding; sem o Vary um cache pode
	// entregar br a quem não aceita.
	const headers = { ...base, Vary: "Accept-Encoding" };
	const compressed = compressedFor(decision.file, acceptEncoding);
	if (!compressed) return { status: decision.status, headers };
	return {
		status: decision.status,
		headers: {
			...headers,
			"Content-Encoding": compressed.encoding,
			"Content-Length": String(compressed.bytes.length),
		},
		body: compressed.bytes,
	};
}

/** Prefere Brotli; aceita token com parâmetros (`br;q=1.0`). */
function pickEncoding(acceptEncoding) {
	const parts = String(acceptEncoding ?? "")
		.toLowerCase()
		.split(",")
		.map((part) => part.trim().split(";")[0]?.trim());
	if (parts.includes("br")) return "br";
	if (parts.includes("gzip")) return "gzip";
	return null;
}

/**
 * Comprime uma vez e reaproveita: arquivos são imutáveis por deploy.
 * Retorna null quando não vale a pena (binário, sem Accept-Encoding ou
 * compressão maior que o original).
 */
function compressedFor(file, acceptEncoding) {
	if (!COMPRESSIBLE.has(extOf(file))) return null;
	const encoding = pickEncoding(acceptEncoding);
	if (!encoding) return null;
	let stat;
	try {
		stat = statSync(file);
		if (!stat.isFile() || stat.size > MAX_COMPRESSED_BYTES) return null;
	} catch {
		return null;
	}
	// mtime+size no valor: se o dist mudar com o processo vivo, re-comprime.
	const key = `${file}:${encoding}`;
	const cached = compressedCache.get(key);
	if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
		return cached;
	}
	let bytes;
	try {
		bytes = readFileSync(file);
	} catch {
		return null;
	}

	let compressed;
	try {
		compressed =
			encoding === "br" ? brotliCompressSync(bytes) : gzipSync(bytes);
	} catch {
		return null;
	}
	if (!compressed || compressed.length >= bytes.length) return null;
	const result = {
		bytes: compressed,
		encoding,
		mtimeMs: stat.mtimeMs,
		size: stat.size,
	};
	if (compressedCache.size < 200) compressedCache.set(key, result);
	return result;
}

function requestProto(request) {
	const headers = request?.headers;
	if (!headers) return undefined;
	const value =
		typeof headers.get === "function"
			? headers.get("x-forwarded-proto")
			: headers["x-forwarded-proto"];
	const first = Array.isArray(value) ? value[0] : value;
	return first?.split(",")[0]?.trim().toLowerCase();
}

export {
	cspFor,
	inlineScriptHashes,
	cacheControlFor,
	compressedFor,
	decide,
	etagFor,
	headersFor,
	isNotModified,
	pickEncoding,
	proxyTarget,
	respond,
	shouldProxyApi,
};

const server = globalThis.Bun?.serve ?? null;
const listenEnabled = process.env.SERVE_WEB_NO_LISTEN !== "1";
/**
 * Harness e2e (e o `verify-pointly` manual) servem o estático sem o
 * Traefik de prod — que rotearia `/api/*` ao backend. Com
 * `PROXY_API_TO=http://127.0.0.1:3001`, o estático encaminha `/api/*`
 * pra lá (ex.: o beacon first-party `POST /api/stats/pageview`).
 * Em prod a variável não é setada: comportamento idêntico ao anterior.
 */
const PROXY_API_TO = (process.env.PROXY_API_TO ?? "").replace(/\/+$/, "");

/** Alvo do proxy: mesmo path+query, outro host. */
function proxyTarget(rawUrl) {
	const incoming = new URL(rawUrl, "http://localhost");
	return `${PROXY_API_TO}${incoming.pathname}${incoming.search}`;
}

function shouldProxyApi(rawUrl) {
	if (!PROXY_API_TO) return false;
	try {
		return new URL(rawUrl, "http://localhost").pathname.startsWith("/api/");
	} catch {
		return false;
	}
}

/** Encaminha ao backend e devolve status/headers/corpo como vieram. */
async function proxyWeb(req) {
	const headers = new Headers(req.headers);
	headers.delete("host");
	const init = { method: req.method, headers, redirect: "manual" };
	if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
		init.body = req.body;
		init.duplex = "half";
	}
	const upstream = await fetch(proxyTarget(req.url), init);
	return new Response(upstream.body, {
		status: upstream.status,
		headers: upstream.headers,
	});
}

/** Variante Node do proxy: acumula o corpo (teto 1MB) antes de encaminhar. */
async function proxyNode(req, res) {
	try {
		const chunks = [];
		let size = 0;
		for await (const chunk of req) {
			size += chunk.length;
			if (size > 1024 * 1024) {
				res.writeHead(413, { "Content-Type": "text/plain; charset=utf-8" });
				return res.end("Payload Too Large");
			}
			chunks.push(chunk);
		}
		const headers = { ...req.headers };
		delete headers.host;
		const target = proxyTarget(req.url ?? "/");
		const upstream = await fetch(target, {
			method: req.method,
			headers,
			redirect: "manual",
			body:
				req.method === "GET" || req.method === "HEAD" || chunks.length === 0
					? undefined
					: Buffer.concat(chunks),
		});
		const body = Buffer.from(await upstream.arrayBuffer());
		res.writeHead(upstream.status, Object.fromEntries(upstream.headers.entries()));
		return res.end(req.method === "HEAD" ? undefined : body);
	} catch {
		res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
		return res.end("Bad Gateway");
	}
}

if (listenEnabled && server) {
	const srv = server({
		port: PORT,
		hostname: HOST,
		async fetch(req) {
			if (shouldProxyApi(req.url)) {
				try {
					return await proxyWeb(req);
				} catch {
					return new Response("Bad Gateway", { status: 502 });
				}
			}
			const decision = decide(req.url);
			const result = respond(
				decision,
				req,
				req.headers.get("if-none-match"),
				req.headers.get("accept-encoding") ?? "",
			);
			if (result.status === 304) {
				return new Response(null, {
					status: result.status,
					headers: result.headers,
				});
			}
			if (result.body !== undefined) {
				return new Response(result.body, {
					status: result.status,
					headers: result.headers,
				});
			}
			if (!decision.file) {
				return new Response(null, {
					status: result.status,
					headers: result.headers,
				});
			}
			return new Response(Bun.file(decision.file), {
				status: result.status,
				headers: result.headers,
			});
		},
	});
	console.log(
		`[pointly-web] serving ${DIST} on http://${srv.hostname}:${srv.port}`,
	);
} else if (listenEnabled) {
	const http = await import("node:http");
	http
		.createServer((req, res) => {
			if (shouldProxyApi(req.url ?? "/")) {
				void proxyNode(req, res);
				return;
			}
			const decision = decide(req.url ?? "/");
			const result = respond(
				decision,
				req,
				req.headers["if-none-match"],
				req.headers["accept-encoding"] ?? "",
			);
			if (result.status === 304 || result.body !== undefined) {
				res.writeHead(result.status, result.headers);
				return res.end(result.body);
			}
			if (!decision.file) {
				res.writeHead(result.status, result.headers);
				return res.end();
			}
			res.writeHead(result.status, result.headers);
			if (req.method === "HEAD") return res.end();
			createReadStream(decision.file).pipe(res);
		})
		.listen(PORT, HOST, () =>
			console.log(`[pointly-web] serving ${DIST} on http://${HOST}:${PORT}`),
		);
}
