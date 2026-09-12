/**
 * Router — 4 rotas do Pointly + catch-all 404.
 *
 * Pages são carregadas via `React.lazy` (code splitting). Os módulos
 * `@/pages/landing|join|arena|full` são implementados pelos workers
 * de páginas — aqui só o wiring + fallback de loading.
 */
import { Suspense, lazy } from "react";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageviewTracker } from "@/components/analytics";
import { NotFound } from "@/pages/not-found";

const Landing = lazy(() =>
	import("@/pages/landing").then((m) => ({ default: m.Landing })),
);
const Join = lazy(() =>
	import("@/pages/join").then((m) => ({ default: m.Join })),
);
const Arena = lazy(() =>
	import("@/pages/arena").then((m) => ({ default: m.Arena })),
);
const Full = lazy(() =>
	import("@/pages/full").then((m) => ({ default: m.Full })),
);

function PageFallback() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-[#09090b] text-zinc-100">
			<p className="flex items-center gap-2 font-mono text-xs tracking-[0.08em] uppercase opacity-70">
				<Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
				Carregando…
			</p>
		</div>
	);
}

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
		future: {
			v7_fetcherPersist: true,
			v7_relativeSplatPath: true,
			v7_skipActionErrorRevalidation: true,
			v7_normalizeFormMethod: true,
			v7_partialHydration: true,
		},
	},
);

export function AppRouter() {
	return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}

export { router };
