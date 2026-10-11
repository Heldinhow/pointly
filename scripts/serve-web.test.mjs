import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

process.env.SERVE_WEB_NO_LISTEN = "1";
const {
	cacheControlFor,
	compressedFor,
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
				"max-age=86400",
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
