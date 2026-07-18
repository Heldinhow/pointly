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
