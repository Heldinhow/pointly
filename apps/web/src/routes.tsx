/**
 * Router setup — T24 (Phase 5).
 *
 * Define as 4 rotas principais do Pointly + catch-all 404.
 * Pages são carregadas via `React.lazy` para code splitting.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T24
 */

import { Suspense, lazy, useEffect, useRef } from "react";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import { NetworkBanner } from "./components/network-banner";
import { PageviewTracker } from "./components/pageview-tracker";
import { Brand } from "./components/brand";
import { ThemeToggle } from "./components/theme-toggle";
import { Link } from "react-router-dom";
import "./styles/entry.css";

const Landing = lazy(() =>
	import("./pages/landing").then((m) => ({ default: m.Landing })),
);
const Join = lazy(() =>
	import("./pages/join").then((m) => ({ default: m.Join })),
);
const Arena = lazy(() =>
	import("./pages/arena").then((m) => ({ default: m.Arena })),
);
const Full = lazy(() =>
	import("./pages/full").then((m) => ({ default: m.Full })),
);

function PageFallback() {
	return (
		<div className="entry-page">
			<header className="entry-header"><Brand /><span className="entry-header-label">Preparando a mesa</span></header>
			<main className="recovery-main"><section className="recovery-shell"><p className="entry-eyebrow">Só um instante</p><h1 className="recovery-title">Abrindo a mesa<span aria-hidden="true">.</span></h1><p className="recovery-copy" role="status">Estamos carregando o próximo passo da sua rodada.</p></section></main>
		</div>
	);
}

function NotFound() {
	const titleRef = useRef<HTMLHeadingElement>(null);
	useEffect(() => {
		titleRef.current?.focus();
	}, []);
	return (
		<div className="entry-page" data-testid="page-not-found">
			<header className="entry-header"><Link to="/" aria-label="Pointly — página inicial"><Brand /></Link><div className="entry-header-actions"><ThemeToggle /><span className="entry-header-label">Página não encontrada</span></div></header>
			<main className="recovery-main"><section className="recovery-shell" role="region" aria-labelledby="notfound-title"><div className="recovery-mark" aria-hidden="true">?</div><p className="entry-eyebrow">Endereço desconhecido</p><h1 id="notfound-title" ref={titleRef} tabIndex={-1} className="recovery-title">Essa página não existe<span aria-hidden="true">.</span></h1><p className="recovery-copy">O endereço pode estar incompleto ou a sala já terminou. Volte ao início para criar uma sala ou abrir um novo convite.</p><div className="recovery-actions"><Link to="/" className="button-reset" data-testid="notfound-home"><span>Ir para o início</span><span aria-hidden="true">↗</span></Link><Link to="/join" className="button-reset button-reset-secondary" data-testid="notfound-join">Entrar com código</Link></div></section></main>
		</div>
	);
}

/**
 * RootLayout — wrappa todas as rotas com `<PageviewTracker />` (que precisa
 * de `useLocation()`, ou seja, do RouterProvider em cima) + `<Outlet />`
 * que renderiza a rota filho.
 *
 * Layout route é o padrão React Router para "algo que envolve todas as rotas".
 * Sem isso, teríamos que adicionar `<PageviewTracker />` em cada elemento
 * individualmente — drift garantido na próxima rota nova.
 */
function RootLayout() {
	return (
		<>
			<PageviewTracker />
			<Outlet />
		</>
	);
}

const router = createBrowserRouter(
	[
		{
			element: <RootLayout />,
			children: [
				{
					path: "/",
					element: (
						<Suspense fallback={<PageFallback />}>
							<Landing />
						</Suspense>
					),
				},
				{
					path: "/join",
					element: (
						<Suspense fallback={<PageFallback />}>
							<Join />
						</Suspense>
					),
				},
				{
					path: "/arena",
					element: (
						<Suspense fallback={<PageFallback />}>
							<Arena />
						</Suspense>
					),
				},
				{
					path: "/full",
					element: (
						<Suspense fallback={<PageFallback />}>
							<Full />
						</Suspense>
					),
				},
				{
					path: "*",
					element: <NotFound />,
				},
			],
		},
	],
	{
		// RR v7 future flags — silencia 5 dos 6 warnings de console ao
		// usar createBrowserRouter com a API do RR 6.28+. Quando
		// migrarmos pra RR v7 (major upgrade), esses flags passam a ser
		// default e essa config sai.
		//
		// NOTA P6: o 6º flag (`v7_skipTrailingSlashRedirect`) é de v7
		// apenas — não existe na v6.x. Foi verificado experimentalmente
		// em RR 6.30.4 (upgrade tentado) e tsc rejeitou o tipo
		// (`v7_skipTrailingSlashRedirect` não consta no
		// `FutureConfig`). Para silenciar 100% dos warnings é preciso
		// major upgrade RR → v7, que está fora do escopo de P6.
		// O warning residual restante é inofensivo e documentado.
		future: {
			v7_fetcherPersist: true,
			v7_relativeSplatPath: true,
			v7_skipActionErrorRevalidation: true,
			v7_normalizeFormMethod: true,
			v7_partialHydration: true,
		},
	},
);

/**
 * RouterProvider pronto para uso em `App.tsx`.
 * Exportado como componente default named export pra T26/T27 consumirem.
 */
export function AppRouter() {
	return (
		<>
			<NetworkBanner />
			<RouterProvider router={router} future={{ v7_startTransition: true }} />
		</>
	);
}

export { router };
