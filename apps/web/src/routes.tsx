/**
 * Router setup — T24 (Phase 5).
 *
 * Define as 4 rotas principais do Pointly + catch-all 404.
 * Pages são carregadas via `React.lazy` para code splitting.
 *
 * @see .specs/features/planning-poker-v1/tasks.md T24
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

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

const router = createBrowserRouter([
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
]);

/**
 * RouterProvider pronto para uso em `App.tsx`.
 * Exportado como componente default named export pra T26/T27 consumirem.
 */
export function AppRouter() {
	return <RouterProvider router={router} />;
}

export { router };
