import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

process.env.SERVE_WEB_NO_LISTEN = "1";
const {
	cacheControlFor,
	compressedFor,
	inlineScriptHashes,
	decide,
	etagFor,
	headersFor,
	isNotModified,
	pickEncoding,
	respond,
} = await import("./serve-web.mjs");

function tempFile(name, content) {
	const dir = mkdtempSync(join(tmpdir(), "pointly-serve-web-"));
	const file = join(dir, name);
	writeFileSync(file, content);
	return { dir, file };
}

function request(headers = {}) {
	return { headers: new Headers(headers) };
}

describe("serve-web: headers de segurança", () => {
	it("toda resposta leva CSP, nosniff, frame DENY, Referrer e Permissions", () => {
		const h = headersFor({ status: 404, text: "x" }, undefined, request());
		assert.equal(h["X-Content-Type-Options"], "nosniff");
		assert.equal(h["X-Frame-Options"], "DENY");
		assert.equal(h["Referrer-Policy"], "strict-origin-when-cross-origin");
		assert.match(h["Permissions-Policy"], /camera=\(\)/);
		const csp = h["Content-Security-Policy"];
		assert.match(csp, /frame-ancestors 'none'/);
		assert.match(csp, /script-src 'self'[^;]*https:\/\/www\.googletagmanager\.com/);
		assert.match(csp, /img-src 'self' data: blob:/);
		assert.match(csp, /connect-src 'self' wss:\/\/pointly\.space/);
		assert.match(csp, /google-analytics\.com/);
		assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
	});

	it("CSP do HTML inclui hash sha256 do <script> inline (e ignora src/vazio)", () => {
		const body = "document.documentElement.classList.add('dark')";
		const { dir, file } = tempFile(
			"index.html",
			`<html><head><script>${body}</script><script type="module" src="/a.js"></script></head></html>`,
		);
		try {
			const hashes = inlineScriptHashes(file);
			assert.deepEqual(hashes, [
				createHash("sha256").update(body).digest("base64"),
			]);
			const csp = headersFor({ status: 200 }, file, request())[
				"Content-Security-Policy"
			];
			assert.ok(csp.includes(`'sha256-${hashes[0]}'`));
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe("serve-web: negociação de entrega", () => {
	it("prefere Brotli e aceita parâmetros de qualidade", () => {
		assert.equal(pickEncoding("gzip, deflate, br, zstd"), "br");
		assert.equal(pickEncoding("gzip;q=1.0, br;q=0.8"), "br");
		assert.equal(pickEncoding("gzip"), "gzip");
		assert.equal(pickEncoding("identity"), null);
		assert.equal(pickEncoding(null), null);
	});

	it("ETag acompanha o arquivo e valida If-None-Match", () => {
		const { dir, file } = tempFile("page.html", "<p>oi</p>");
		try {
			const etag = etagFor(file);
			assert.match(etag, /^W\/"[0-9a-f]+-[0-9a-f]+"$/);
			assert.equal(isNotModified(file, etag), true);
			assert.equal(isNotModified(file, "*"), true);
			assert.equal(isNotModified(file, 'W/"0-0"'), false);
			assert.equal(isNotModified(file, null), false);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("comprime texto e ignora binário", () => {
		const text = tempFile("app.js", "const ponto = 'pointly';\n".repeat(200));
		const image = tempFile("foto.png", Buffer.from([137, 80, 78, 71]));
		try {
			const compressed = compressedFor(text.file, "gzip, br");
			assert.ok(compressed);
			assert.equal(compressed.encoding, "br");
			assert.ok(compressed.bytes.length < 4600);

			assert.equal(compressedFor(image.file, "gzip, br"), null);
			assert.equal(compressedFor(text.file, "identity"), null);
		} finally {
			rmSync(text.dir, { recursive: true, force: true });
			rmSync(image.dir, { recursive: true, force: true });
		}
	});

	it("cache separa asset com hash de HTML e HSTS só sobre HTTPS", () => {
		const dist = mkdtempSync(join(tmpdir(), "pointly-dist-"));
		const hashed = join(dist, "assets", "app-abc123.js");
		const html = join(dist, "index.html");
		try {
			assert.equal(
				cacheControlFor(hashed, dist),
				"public, max-age=31536000, immutable",
			);
			assert.equal(cacheControlFor(html, dist), "no-cache");

			const https = { headers: { "x-forwarded-proto": "https" } };
			const http = { headers: {} };
			assert.equal(
				headersFor({ status: 200 }, html, https)["Strict-Transport-Security"],
				"max-age=31536000; includeSubDomains",
			);
			assert.equal(
				headersFor({ status: 200 }, html, http)["Strict-Transport-Security"],
				undefined,
			);
		} finally {
			rmSync(dist, { recursive: true, force: true });
		}
	});

	it("resposta comprimível manda Vary: Accept-Encoding", () => {
		const { dir, file } = tempFile("app.js", "const a = 1;\n".repeat(100));
		try {
			const result = respond(
				{ status: 200, file },
				request(),
				undefined,
				"br",
			);
			assert.equal(result.headers.Vary, "Accept-Encoding");
			assert.equal(result.headers["Content-Encoding"], "br");
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("404 nunca vira 304 e o 304 preserva X-Robots-Tag", () => {
		const { dir, file } = tempFile("nf.html", "<p>404</p>");
		try {
			const etag = etagFor(file);
			const notFound = respond(
				{ status: 404, file, noindex: true },
				request(),
				etag,
				"",
			);
			assert.equal(notFound.status, 404);
			assert.equal(notFound.headers["X-Robots-Tag"], "noindex");

			const revalidated = respond(
				{ status: 200, file, noindex: true },
				request(),
				etag,
				"",
			);
			assert.equal(revalidated.status, 304);
			assert.equal(revalidated.headers["X-Robots-Tag"], "noindex");
			assert.equal(revalidated.body, undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe("serve-web: proxy de /api (harness e2e)", () => {
	it("sem PROXY_API_TO, nada é proxied; com ele, só /api/", async () => {
		const base = await import("./serve-web.mjs?base=1");
		assert.equal(base.shouldProxyApi("/api/stats/visits"), false);
		assert.equal(base.shouldProxyApi("/"), false);

		process.env.PROXY_API_TO = "http://127.0.0.1:3001/";
		try {
			const proxied = await import("./serve-web.mjs?proxy=1");
			assert.equal(proxied.shouldProxyApi("/api/stats/visits"), true);
			assert.equal(proxied.shouldProxyApi("/api/stats/pageview"), true);
			assert.equal(proxied.shouldProxyApi("/join"), false);
			assert.equal(proxied.shouldProxyApi("/"), false);
			assert.equal(
				proxied.proxyTarget("http://x:5188/api/stats/visits?r=1"),
				"http://127.0.0.1:3001/api/stats/visits?r=1",
			);
		} finally {
			delete process.env.PROXY_API_TO;
		}
	});
});
