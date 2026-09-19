/**
 * Entry de pré-renderização (executado pelo vite-prerender-plugin no build).
 * Roda em Node, sem DOM: `renderToString` + `StaticRouter` (React Router 6) e
 * head por rota a partir do registro em `src/seo/routes.ts`.
 *
 * Tudo que é server-only entra por import dinâmico (regra do plugin): assim o
 * bundle do navegador não carrega react-dom/server nem o código do prerender.
 */

export async function prerender({ url }: { url: string }): Promise<{
	html: string;
	links: Set<string>;
	head: { lang: string; title: string; elements: Set<unknown> };
}> {
	const [{ renderToString }, { StaticRouter }, { default: App }, seo] =
		await Promise.all([
			import("react-dom/server"),
			import("react-router-dom/server"),
			import("./App"),
			import("./seo/routes"),
		]);

	const route = seo.SEO_ROUTES.find((candidate) => candidate.path === url);
	const { lang, title, elements } = seo.headForRoute(route ?? seo.FALLBACK_ROUTE);
	const html = renderToString(
		<StaticRouter location={url}>
			<App />
		</StaticRouter>,
	);

	// Sem crawl automático: só as rotas do registro são pré-renderizadas.
	return {
		html,
		links: new Set<string>(),
		head: { lang, title, elements: new Set(elements) },
	};
}
