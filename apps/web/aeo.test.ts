/**
 * aeo.js Vite plugin integration tests.
 *
 * AEO-01..05 + AEO-09 (subset): run an isolated `vite build` with the
 * production config, point outputDir at /tmp, then inspect the 4 emitted
 * files. Uses Bun's child_process so it works under `bun run test`.
 *
 * Skipped from the unit-test fast path on principle: this test forks a
 * full Vite build (~1-2s). Tag it `aeo` so it can be filtered.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const SCRATCH = mkdtempSync(join(tmpdir(), "aeo-test-"));

afterAll(() => {
	if (existsSync(SCRATCH)) rmSync(SCRATCH, { recursive: true, force: true });
});

describe("aeo.js — Vite build emits 4 SEO files (AEO-01..04)", () => {
	test("emits llms.txt / robots.txt / sitemap.xml / schema.json", () => {
		const result = spawnSync(
			"bun",
			["x", "vite", "build", "--config", "vite.config.ts", "--outDir", SCRATCH],
			{
				cwd: import.meta.dir,
				env: { ...process.env, NODE_ENV: "production" },
				stdio: "pipe",
			},
		);
		// Build must complete with exit code 0 (AC AEO-05).
		expect(result.status).toBe(0);

		for (const f of ["llms.txt", "robots.txt", "sitemap.xml", "schema.json"]) {
			expect(existsSync(join(SCRATCH, f))).toBe(true);
		}
	}, { timeout: 30_000 });

	test("AEO-01: llms.txt is clean (no broken refs to ungenerated files)", () => {
		const text = readFileSync(join(SCRATCH, "llms.txt"), "utf-8");
		expect(text).toStartWith("# Pointly");
		expect(text).toContain("https://pointly.space");
		// aeo.js v0.0.16 hardcodes these URLs in the template; the
		// post-process in vite.config.ts strips them — if this fails,
		// the strip is broken.
		expect(text).not.toContain("llms-full.txt");
		expect(text).not.toContain("docs.json");
		expect(text).not.toContain("ai-index.json");
	});

	test("AEO-02: robots.txt disallows /arena", () => {
		const text = readFileSync(join(SCRATCH, "robots.txt"), "utf-8");
		expect(text).toContain("Disallow: /arena");
		expect(text).toContain("User-agent: *");
	});

	test("AEO-03: sitemap.xml lists the 4 public SPA routes", () => {
		const text = readFileSync(join(SCRATCH, "sitemap.xml"), "utf-8");
		expect(text).toContain("https://pointly.space/");
		expect(text).toContain("https://pointly.space/join");
		expect(text).toContain("https://pointly.space/arena");
		expect(text).toContain("https://pointly.space/full");
		const urlCount = (text.match(/<url>/g) ?? []).length;
		expect(urlCount).toBe(4);
	});

	test("AEO-04: schema.json has WebSite + Organization with correct name/url", () => {
		const json = JSON.parse(
			readFileSync(join(SCRATCH, "schema.json"), "utf-8"),
		) as {
			site: Array<{ "@type": string; name: string; url: string }>;
		};
		const types = json.site.map((s) => s["@type"]);
		expect(types).toContain("Organization");
		expect(
			types.some((t) => t === "WebSite" || t === "WebApplication"),
		).toBe(true);
		// Every site schema entry must have name=Pointly and url=pointly.space.
		for (const s of json.site) {
			expect(s.name).toBe("Pointly");
			expect(s.url).toBe("https://pointly.space");
		}
	});
});

describe("aeo.js — AEO audit gates (audit fixes 2026-07-18)", () => {
	// Audit issue #7: Organization must have a real `logo` URL so Google /
	// AI crawlers display it in the knowledge panel.
	test("schema.organization has logo URL on pointly.space", () => {
		const html = readFileSync(
			join(import.meta.dir, "index.html"),
			"utf-8",
		);
		// The plugin emits `logo` into schema.json from config.schema.organization,
		// not from index.html — read the built artifact instead.
		const json = JSON.parse(
			readFileSync(join(SCRATCH, "schema.json"), "utf-8"),
		) as {
			site: Array<{ "@type": string; logo?: string }>;
		};
		const org = json.site.find((s) => s["@type"] === "Organization");
		expect(org).toBeDefined();
		expect(org?.logo).toMatch(/^https:\/\/pointly\.space\/.*\.png$/);
	});

	test("FAQPage is auto-detected on / and lists all 8 Q&A items", () => {
		const json = JSON.parse(
			readFileSync(join(SCRATCH, "schema.json"), "utf-8"),
		) as {
			pages: Record<
				string,
				Array<{
					"@type": string;
					mainEntity?: Array<{ name: string; acceptedAnswer: { text: string } }>;
				}>
			>;
		};
		const root = json.pages["/"];
		const faq = root?.find((s) => s["@type"] === "FAQPage");
		expect(faq).toBeDefined();
		expect(faq?.mainEntity?.length).toBe(8);
		// Every Q&A must have a non-trivial answer (≥20 words).
		for (const q of faq?.mainEntity ?? []) {
			const words = q.acceptedAnswer.text.trim().split(/\s+/).length;
			expect(words).toBeGreaterThanOrEqual(20);
		}
	});

	// Audit issues #1 (title 10–70 chars) and #2 (description 50–200 chars).
	test("index.html title is 10–70 chars and description is 50–200", () => {
		const html = readFileSync(
			join(import.meta.dir, "index.html"),
			"utf-8",
		);
		const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
		const desc =
			html.match(/name="description"\s+content="([^"]+)"/)?.[1] ?? "";
		expect(title.length).toBeGreaterThanOrEqual(10);
		expect(title.length).toBeLessThanOrEqual(70);
		expect(desc.length).toBeGreaterThanOrEqual(50);
		expect(desc.length).toBeLessThanOrEqual(200);
	});

	// Audit issue #3: OG + Twitter meta tags present for social previews.
	test("index.html declares Open Graph + Twitter card meta tags", () => {
		const html = readFileSync(
			join(import.meta.dir, "index.html"),
			"utf-8",
		);
		for (const tag of [
			'property="og:title"',
			'property="og:description"',
			'property="og:image"',
			'property="og:type"',
			'property="og:url"',
			'property="og:locale"',
			'name="twitter:card"',
			'name="twitter:title"',
			'name="twitter:description"',
			'name="twitter:image"',
		]) {
			expect(html).toContain(tag);
		}
		// og:image must point to the OG cover (1200×630) we ship.
		expect(html).toContain('content="https://pointly.space/og-cover.png"');
	});
});

describe("aeo.js — landing bundle (AEO-09)", () => {
	test("landing-*.js stays under +10 KB gzipped vs baseline", () => {
		// Baseline = landing chunk gzipped BEFORE <AeoWidget /> landed.
		// Measured on commit 3279685 (this PR): landing was 3.13 KB gzipped.
		// AC AEO-09 budget: baseline + 10 KB = 13 KB ceiling.
		const result = spawnSync(
			"gzip",
			["-c", join(SCRATCH, "assets/landing-*.js")],
			{ encoding: "buffer" },
		);
		// glob didn't expand via spawnSync — fall back to listing the dir.
		if (result.status !== 0) {
			const ls = spawnSync("ls", [join(SCRATCH, "assets")], {
				encoding: "utf-8",
			});
			const file = ls.stdout.split("\n").find((l) =>
				l.startsWith("landing-") && l.endsWith(".js"),
			);
			if (!file) throw new Error("landing-*.js not in build output");
			const data = spawnSync("gzip", ["-c", join(SCRATCH, "assets", file)], {
				encoding: "buffer",
			});
			expect(data.status).toBe(0);
			expect(data.stdout.byteLength).toBeLessThan(13 * 1024);
		} else {
			expect(result.stdout.byteLength).toBeLessThan(13 * 1024);
		}
	}, { timeout: 10_000 });
});
