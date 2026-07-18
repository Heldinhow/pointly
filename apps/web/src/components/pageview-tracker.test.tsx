/**
 * PageviewTracker unit tests — GA-02, GA-19, GA-20.
 *
 * Cobre:
 *  - GA-19: mudanças de pathname disparam trackPageview(prev, new)
 *  - GA-20: mount inicial chama trackPageview(null, current)
 *  - Retorna null (não renderiza DOM)
 *
 * Estratégia: usa `__setTrackPageviewForTests` em analytics.ts pra instalar
 * um spy sem mockar o módulo inteiro (mock.module deixava residue que
 * quebrava tests em outros arquivos).
 */

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import { act, render } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import {
	__setTrackPageviewForTests,
} from "../lib/analytics";
import {
	__resetPreviousPathnameForTests,
	PageviewTracker,
} from "./pageview-tracker";

const trackCalls: Array<{ prev: string | null; next: string }> = [];

beforeEach(() => {
	trackCalls.length = 0;
	__setTrackPageviewForTests((prev, next) => {
		trackCalls.push({ prev, next });
	});
});

afterEach(() => {
	__setTrackPageviewForTests(null);
	// Reset module-scoped `previousPathname` no pageview-tracker pra que o
	// próximo teste não herde o pathname final do anterior.
	__resetPreviousPathnameForTests();
});

describe("PageviewTracker", () => {
	test("GA-20: mount inicial dispara trackPageview(null, '/')", () => {
		render(
			<MemoryRouter
				initialEntries={["/"]}
				future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
			>
				<PageviewTracker />
			</MemoryRouter>,
		);

		expect(trackCalls).toHaveLength(1);
		expect(trackCalls[0]).toEqual({ prev: null, next: "/" });
	});

	test("GA-20: mount em /arena dispara trackPageview(null, '/arena')", () => {
		render(
			<MemoryRouter
				initialEntries={["/arena"]}
				future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
			>
				<PageviewTracker />
			</MemoryRouter>,
		);

		expect(trackCalls).toHaveLength(1);
		expect(trackCalls[0]).toEqual({ prev: null, next: "/arena" });
	});

	test("GA-19: mudança de rota via navigate dispara trackPageview(prev, new)", () => {
		// MemoryRouter.initialEntries é só seed inicial, não atualiza em
		// rerender. Pra forçar route change dentro do mesmo wrapper,
		// remontamos o Router com novo `key` quando path muda.
		function RouterControl({
			children,
		}: {
			children: (path: string, navigate: (p: string) => void) => React.ReactNode;
		}) {
			const [path, setPath] = useState("/");
			return (
				<MemoryRouter
					key={path}
					initialEntries={[path]}
					future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
				>
					{children(path, setPath)}
				</MemoryRouter>
			);
		}

		const { getByTestId } = render(
			<RouterControl>
				{(path, navigate) => (
					<>
						<PageviewTracker />
						<button
							type="button"
							data-testid="go-join"
							onClick={() => navigate("/join")}
						>
							go
						</button>
						<span data-testid="current">{path}</span>
					</>
				)}
			</RouterControl>,
		);

		expect(trackCalls).toHaveLength(1);
		expect(trackCalls[0]).toEqual({ prev: null, next: "/" });

		act(() => {
			getByTestId("go-join").click();
		});

		expect(trackCalls).toHaveLength(2);
		expect(trackCalls[0]).toEqual({ prev: null, next: "/" });
		expect(trackCalls[1]).toEqual({ prev: "/", next: "/join" });
	});

	test("não renderiza DOM (retorna null)", () => {
		const { container } = render(
			<MemoryRouter
				initialEntries={["/"]}
				future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
			>
				<PageviewTracker />
			</MemoryRouter>,
		);

		expect(container.firstChild).toBeNull();
	});
});