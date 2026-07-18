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

type AeoPage = { pathname: string; title: string; description: string; content?: string };
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
	schema: {
		organization: {
			name: string;
			logo?: string;
			url?: string;
			sameAs?: string[];
		};
	};
	og: {
		enabled: boolean;
		image?: string;
		twitterHandle?: string;
		type?: "website" | "article";
	};
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
	// `content` on `/` carries the FAQ in markdown so aeo.js's
	// `detectFaqPatterns` picks up `How…? / What…? / Is…? / Does…?`
	// triggers and emits a real FAQPage into schema.json. (The
	// detectFaqPatterns regex is English-only — see vite.config.ts
	// notes about the visual FAQ in landing.tsx being a sibling render
	// of the same Q&A list.)
	pages: [
		{
			pathname: "/",
			title: "Pointly — Free Real-Time Planning Poker for Agile Teams",
			description:
				"Pointly is a free, real-time planning poker app for agile teams. Create a room in 100ms, share a 6-character code, vote on story points together, and reveal in one click. No signup, no install, in-memory only.",
			content: `# Pointly — Free Real-Time Planning Poker

## Is Pointly really free?

Yes. No freemium tiers, no paywall, no card required. Each room runs entirely in memory on the backend and disappears when the last player leaves — there is no database to bill against.

## How many players fit in one room?

Up to 12 participants per room, sized for typical agile teams of 4 to 9 estimators plus 1 to 3 observers, and rooms that hit the cap redirect to a dedicated /full page instead of throwing an error.

## How fast can I create a room?

About 100 milliseconds from click to room-open-ready. There are no intermediate steps: click Create, choose a nickname, and the room is ready for the rest of the team to join via a 6-character code.

## Does Pointly save my retrospective data?

No. Every room is ephemeral: votes, chat messages and timers exist only while the room is open. When the last player exits, the entire state is discarded — this is the design, not a bug.

## Does Pointly work on mobile?

Yes. The arena uses the standard Fibonacci deck (0, 0.5, 1, 2, 3, 5, 8, 13, 21, ?, coffee) rendered as large tappable cards.

## Can I integrate Pointly with Jira, Linear or Azure DevOps?

Not today. Pointly focuses on speed of the session — vote, reveal, decide — and does not export to external trackers. The revealed round is visible on screen and can be transcribed manually.

## Are AI bots and crawlers allowed to index Pointly?

Yes. The site publishes llms.txt, sitemap.xml, schema.json and robots.txt — all major AI bots (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) can cite and reference the tool with structured metadata.

## What deck sizes are supported?

The default Fibonacci deck (0, 0.5, 1, 2, 3, 5, 8, 13, 21, ?, coffee). Hosts can pick an active subset per round, and votes are median-aggregated (not averaged) to avoid outlier bias from single estimators.
`,
		},
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
	schema: {
		organization: {
			name: "Pointly",
			url: "https://pointly.space",
			logo: "https://pointly.space/logo.png",
			sameAs: ["https://github.com/Heldinhow/pointly"],
		},
	},
	og: {
		enabled: true,
		image: "https://pointly.space/og-cover.png",
		type: "website",
	},
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
