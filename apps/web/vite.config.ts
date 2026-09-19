import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { vitePrerenderPlugin } from "vite-prerender-plugin";
import { buildSitemap, SEO_ROUTES } from "./src/seo/routes";

/**
 * Emite artefatos estáticos de SEO no build, ANTES do prerender rodar
 * (ambos `enforce: 'post'`; a ordem do array importa):
 * - `shell.html`: o shell SPA cru (pré-prerender), servido por serve-web nas
 *   rotas do app (/join, /s/:code) para não hidratar a home no lugar delas;
 * - `sitemap.xml`: gerado do registro canônico de rotas.
 */
function emitStaticSeo(): Plugin {
	return {
		name: "pointly-static-seo",
		apply: "build",
		enforce: "post",
		generateBundle(_options, bundle) {
			const shell = bundle["index.html"];
			if (shell?.type === "asset") {
				this.emitFile({
					type: "asset",
					fileName: "shell.html",
					source: shell.source,
				});
			}
			this.emitFile({
				type: "asset",
				fileName: "sitemap.xml",
				source: buildSitemap(),
			});
		},
	};
}

/**
 * Remove o `modulepreload` do chunk do prerender do HTML servido: ele é
 * build-time (Node) e nunca é executado pelo navegador.
 */
function stripPrerenderPreload(): Plugin {
	return {
		name: "pointly-strip-prerender-preload",
		apply: "build",
		enforce: "post",
		generateBundle(_options, bundle) {
			for (const item of Object.values(bundle)) {
				if (item.type !== "asset" || !item.fileName.endsWith(".html")) continue;
				if (typeof item.source !== "string") continue;
				item.source = item.source.replace(
					/<link[^>]*rel="modulepreload"[^>]*href="\/assets\/prerender-[^"]*"[^>]*>\s*/g,
					"",
				);
			}
		},
	};
}

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		emitStaticSeo(),
		vitePrerenderPlugin({
			renderTarget: "#root",
			prerenderScript: fileURLToPath(new URL("./src/prerender.tsx", import.meta.url)),
			// O registro canônico (routes.ts) manda: rota nova entra lá e é
			// pré-renderizada aqui, sem lista paralela para manter.
			additionalPrerenderRoutes: SEO_ROUTES.map((route) => route.path),
			previewMiddlewareFallback: "/404",
		}),
		stripPrerenderPreload(),
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	server: {
		port: 5173,
		proxy: {
			"/api": "http://localhost:3001",
			"/ws": {
				target: "ws://localhost:3001",
				ws: true,
			},
		},
	},
	preview: {
		port: 5199,
		proxy: {
			"/api": "http://localhost:3001",
			"/ws": {
				target: "ws://localhost:3001",
				ws: true,
			},
		},
	},
});
