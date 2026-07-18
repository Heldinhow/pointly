/**
 * Router setup — T24 (Phase 5).
 *
 * Define as 4 rotas principais do Pointly + catch-all 404.
 * Pages são carregadas via `React.lazy` para code splitting.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T24
 */

import { Suspense, lazy } from "react";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import { NetworkBanner } from "./components/network-banner";
import { PageviewTracker } from "./components/pageview-tracker";

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
		<div
			role="status"
			aria-live="polite"
			style={{ padding: "2rem", textAlign: "center" }}
		>
			Carregando…
		</div>
	);
}

function NotFound() {
	return <div>Not Found</div>;
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
