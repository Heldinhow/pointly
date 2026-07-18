/**
 * Vite config — Pointly web app
 *
 * Phase 1 (T6): proxy `/api` and `/ws` → :3001 server.
 * Phase 6+: Tailwind tokens + shadcn/ui (T25/T26).
 * aeo.js (AE-1+): emit llms.txt / robots.txt / sitemap.xml / schema.json
 *                 during `vite build`. Config kept inline (no separate
 *                 aeo.config.ts) — the plugin takes options inline.
 *                 `pages` enumerated manually (SPA build has only /).
 *                 Post-process strips aeo.js's hardcoded refs to files
 *                 we don't generate (llms-full.txt / docs.json / ai-index.json)
 *                 to avoid 404s in the published llms.txt.
 *
 * Reference: ADR-0007 (React+Vite+TS), ADR-0010 (shadcn/ui).
 *
 * Tests are run via `bun test` (apps/web/package.json). No vitest dependency.
 */
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { defineConfig, type PluginOption } from "vite";

type AeoPage = { pathname: string; title: string; description: string };
type AeoConfig = {
	title: string;
	description: string;
	url: string;
	pages: AeoPage[];
	generators: {
		robotsTxt: boolean;
		llmsTxt: boolean;
		sitemap: boolean;
		schema: boolean;
		llmsFullTxt: boolean;
		rawMarkdown: boolean;
		manifest: boolean;
		aiIndex: boolean;
	};
	robots: { disallow: string[] };
	schema: { organization: { name: string } };
	// Disable the plugin's auto-injected widget. We render <AeoWidget />
	// from `aeo.js/react` ourselves on `/` (landing) only, so the build-time
	// widget shouldn't render on every route.
	widget: { enabled: boolean };
};

const aeoConfig: AeoConfig = {
	title: "Pointly",
	description:
		"Pointly is a free, real-time planning poker app for agile teams. Create a room, share the code, vote on story points together. No signup, no install, no DB — in-memory only.",
	url: "https://pointly.space",
	// 4 public SPA routes. Salas dinâmicas (?code=) ficam fora do sitemap.
	pages: [
		{ pathname: "/", title: "Pointly", description: "Planning poker for agile teams." },
		{ pathname: "/join", title: "Join a room", description: "Enter a room code to join an existing planning poker session." },
		{ pathname: "/arena", title: "Arena", description: "Live planning poker arena where the host runs rounds and the team votes on story points." },
		{ pathname: "/full", title: "Room full", description: "The room reached its seat limit." },
	],
	generators: {
		robotsTxt: true,
		llmsTxt: true,
		sitemap: true,
		schema: true,
		// Off by default — adds build time and we'd have no content for them.
		llmsFullTxt: false,
		rawMarkdown: false,
		manifest: false,
		aiIndex: false,
	},
	// /arena is a client-side route that takes ?code=… — meaningless to bots.
	robots: { disallow: ["/arena"] },
	schema: { organization: { name: "Pointly" } },
	widget: { enabled: false },
};

// CJS `createRequire` lets us load aeo.js without crashing the ESM vite
// config file if the dep is missing/broken (AC AEO-05: degrade gracefully).
const requireFromHere = createRequire(import.meta.url);

/**
 * aeo.js v0.0.16 hardcodes `Quick Links` and `For LLMs` sections in llms.txt
 * pointing to /llms-full.txt, /docs.json, /ai-index.json — files we DON'T
 * emit (those generators are off). Strip those blocks after the plugin runs.
 */
function stripUngeneratedRefs(distDir: string) {
	const llmsPath = path.join(distDir, "llms.txt");
	if (!fs.existsSync(llmsPath)) return;
	const text = fs.readFileSync(llmsPath, "utf-8");
	const sections = text.split(/^## /m);
	// Reassemble, dropping the headers (and their bodies) we didn't actually emit.
	const kept = sections.filter((s) => {
		const head = (s.split("\n", 1)[0] ?? "").trim();
		return !["Quick Links", "For LLMs"].includes(head);
	});
	const out = kept[0] + kept.slice(1).map((s) => `## ${s}`).join("");
	fs.writeFileSync(llmsPath, out, "utf-8");
}

/**
 * Load aeo.js lazily so a missing dep degrades to an empty plugin list
 * instead of breaking config resolution. Wraps the plugin's closeBundle to
 * post-process llms.txt (AC AEO-05: no broken refs in published files).
 */
function safeAeoPlugin(): PluginOption[] {
	try {
		const mod = requireFromHere("aeo.js/vite") as {
			aeoVitePlugin: (opts: AeoConfig) => PluginOption;
		};
		const inner = mod.aeoVitePlugin(aeoConfig);
		// Capture Vite's resolved outDir at configResolved time (it may be
		// overridden via `--outDir` from CLI). Without this, the post-process
		// would strip aeo.js's broken refs only when running from the default
		// `apps/web/dist` — tests with a custom outDir would publish broken
		// refs.
		let resolvedDistDir = path.resolve(import.meta.dirname, "dist");
		const innerObj = inner as unknown as Record<string, unknown>;
		const originalConfigResolved = innerObj.configResolved as
			| ((this: unknown, cfg: { root: string; build: { outDir: string } }) => void)
			| undefined;
		return [
			{
				...innerObj,
				configResolved(this: unknown, cfg: { root: string; build: { outDir: string } }) {
					resolvedDistDir = path.isAbsolute(cfg.build.outDir)
						? cfg.build.outDir
						: path.resolve(cfg.root, cfg.build.outDir);
					if (typeof originalConfigResolved === "function") {
						originalConfigResolved.call(this, cfg);
					}
				},
				closeBundle: async (...args: unknown[]) => {
					try {
						const fn = (inner as unknown as { closeBundle?: unknown })
							.closeBundle;
						if (typeof fn === "function") {
							await (fn as (...a: unknown[]) => unknown)(...args);
						}
					} catch (err) {
						console.warn(
							"[aeo.js] closeBundle failed — SEO files not emitted:",
							err instanceof Error ? err.message : String(err),
						);
						return;
					}
					try {
						stripUngeneratedRefs(resolvedDistDir);
					} catch (err) {
						console.warn(
							"[aeo.js] post-process failed:",
							err instanceof Error ? err.message : String(err),
						);
					}
				},
			} as unknown as PluginOption,
		];
	} catch (err) {
		console.warn(
			"[aeo.js] plugin not loadable — skipping AEO integration:",
			err instanceof Error ? err.message : String(err),
		);
		return [];
	}
}

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), ...safeAeoPlugin()],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "src"),
			"@planning-poker/shared": path.resolve(
				import.meta.dirname,
				"../../packages/shared/src/index.ts",
			),
		},
	},
	server: {
		port: 5173,
		strictPort: true,
		proxy: {
			"/api": {
				target: "http://localhost:3001",
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: "dist",
		sourcemap: true,
		target: "es2022",
	},
});
