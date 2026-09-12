/**
 * join.test — modos + submit flow (spell-rebuild).
 *
 * Cobre: create esconde código e pula pre-check; invite trava código;
 * manual valida; 404 → erro inline sem navegar; rede/5xx → navega mesmo
 * assim; Escape → /; autofocus; contador de nick.
 */
import "../test-jsdom";

// jsdom sem pretendToBeVisual não tem rAF — @testing-library/react exige.
if (typeof globalThis.requestAnimationFrame === "undefined") {
	globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number =>
		setTimeout(() => cb(performance.now()), 16) as unknown as number;
	globalThis.cancelAnimationFrame = (id: number): void => {
		clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
	};
}
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { setNick } from "@/lib/identity";
import { Join } from "./join";

afterEach(() => {
	cleanup();
});

// ---------------------------------------------------------------------------
// fetch stub controlável + restore seguro do fetch nativo do bun
// ---------------------------------------------------------------------------
type FetchBehavior =
	| { kind: "ok" }
	| { kind: "not-found" }
	| { kind: "server-error" }
	| { kind: "network-error" };

let fetchCalls: string[] = [];
let fetchBehavior: FetchBehavior = { kind: "ok" };
const originalFetch = globalThis.fetch;

beforeEach(() => {
	fetchCalls = [];
	fetchBehavior = { kind: "ok" };
	sessionStorage.clear();
	globalThis.fetch = (async (input: RequestInfo | URL) => {
		const url = typeof input === "string" ? input : input.toString();
		fetchCalls.push(url);
		if (fetchBehavior.kind === "network-error") {
			throw new TypeError("Failed to fetch");
		}
		if (fetchBehavior.kind === "not-found") {
			return new Response(JSON.stringify({ exists: false }), {
				status: 404,
				headers: { "content-type": "application/json" },
			});
		}
		if (fetchBehavior.kind === "server-error") {
			return new Response("boom", { status: 500 });
		}
		return new Response(
			JSON.stringify({ code: "AB12", exists: true }),
			{ status: 200, headers: { "content-type": "application/json" } },
		);
	}) as typeof fetch;
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

function LocationProbe() {
	const loc = useLocation();
	return (
		<div data-testid="location">
			{loc.pathname}
			{loc.search}
		</div>
	);
}

function renderJoin(initialEntry = "/join") {
	return render(
		<MemoryRouter
			future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
			initialEntries={[initialEntry]}
		>
			<Routes>
				<Route path="/join" element={<Join />} />
				<Route path="/arena" element={<LocationProbe />} />
				<Route path="/" element={<div data-testid="home-marker">home</div>} />
			</Routes>
		</MemoryRouter>,
	);
}

function fillNick(value: string) {
	fireEvent.change(screen.getByTestId("join-nick"), {
		target: { value },
	});
}

function submitButton(): HTMLButtonElement {
	const el = screen.getByTestId("join-submit");
	if (el.tagName !== "BUTTON") {
		throw new Error("join-submit não é um <button>");
	}
	return el as HTMLButtonElement;
}

async function expectLocation(text: string) {
	await waitFor(() => {
		expect(screen.getByTestId("location").textContent).toBe(text);
	});
}

describe("Join — modos", () => {
	test("manual (/join): nick + código visíveis, submit disabled", () => {
		renderJoin("/join");
		expect(screen.getByTestId("page-join")).toBeTruthy();
		expect(screen.getByTestId("join-nick")).toBeTruthy();
		expect(screen.getByTestId("join-code")).toBeTruthy();
		expect(submitButton().disabled).toBe(true);
	});

	test("host (?host=1): esconde input de código", () => {
		renderJoin("/join?host=1");
		expect(screen.getByTestId("join-nick")).toBeTruthy();
		expect(screen.queryByTestId("join-code")).toBeNull();
	});

	test("invite (?code= válido): código travado em display", () => {
		renderJoin("/join?code=ab12");
		expect(screen.getByTestId("join-code-display").textContent).toBe("AB12");
		expect(screen.queryByTestId("join-code")).toBeNull();
	});

	test("?code= inválido cai para manual com fragmento pré-preenchido", () => {
		renderJoin("/join?code=XYZ");
		const code = screen.getByTestId("join-code") as HTMLInputElement;
		expect(code.value).toBe("XYZ");
	});
});

describe("Join — nick", () => {
	test("contador n/20 acompanha digitação", () => {
		renderJoin("/join?code=AB12");
		fillNick("Luna");
		expect(screen.getByText("4/20")).toBeTruthy();
	});

	test("nick curto → erro inline + submit segue disabled", () => {
		renderJoin("/join?code=AB12");
		fillNick("A");
		expect(
			screen.getByTestId("join-nick-error").textContent ?? "",
		).toMatch(/pelo menos 2/i);
		expect(submitButton().disabled).toBe(true);
	});

	test("autofocus no nick quando vazio", () => {
		renderJoin("/join");
		expect(document.activeElement).toBe(screen.getByTestId("join-nick"));
	});

	test("nick pré-preenchido → foco vai para o código", () => {
		setNick("Luna");
		renderJoin("/join");
		expect(document.activeElement).toBe(screen.getByTestId("join-code"));
	});
});

describe("Join — código", () => {
	test("uppercase live", () => {
		renderJoin("/join");
		fireEvent.change(screen.getByTestId("join-code"), {
			target: { value: "ab12" },
		});
		expect(
			(screen.getByTestId("join-code") as HTMLInputElement).value,
		).toBe("AB12");
	});

	test("código malformado → erro inline, sem fetch, sem navegar", () => {
		renderJoin("/join");
		fireEvent.change(screen.getByTestId("join-code"), {
			target: { value: "A" },
		});
		fillNick("Luna");
		fireEvent.click(screen.getByTestId("join-submit"));
		expect(
			screen.getByTestId("join-code-error").textContent ?? "",
		).toMatch(/código inválido/i);
		expect(fetchCalls).toEqual([]);
		expect(screen.queryByTestId("location")).toBeNull();
	});
});

describe("Join — submit flow", () => {
	test("host: pula pre-check e navega /arena", async () => {
		renderJoin("/join?host=1");
		fillNick("Luna");
		fireEvent.click(screen.getByTestId("join-submit"));
		await expectLocation("/arena");
		expect(fetchCalls).toEqual([]);
		expect(sessionStorage.getItem("pointly.nick")).toBe("Luna");
		expect(sessionStorage.getItem("pointly.uuid")).toBeTruthy();
	});

	test("invite 200 → persiste e navega /arena?code=", async () => {
		renderJoin("/join?code=AB12");
		fillNick("Luna");
		fireEvent.click(screen.getByTestId("join-submit"));
		await expectLocation("/arena?code=AB12");
		expect(fetchCalls).toEqual(["/api/v1/salas/AB12"]);
		expect(sessionStorage.getItem("pointly.code")).toBe("AB12");
	});

	test("404 → erro inline, SEM navegar, foco no código", async () => {
		fetchBehavior = { kind: "not-found" };
		renderJoin("/join");
		fireEvent.change(screen.getByTestId("join-code"), {
			target: { value: "ZZ99" },
		});
		fillNick("Luna");
		fireEvent.click(screen.getByTestId("join-submit"));
		await waitFor(() => {
			expect(
				screen.getByTestId("join-code-error").textContent ?? "",
			).toMatch(/não encontrada/i);
		});
		expect(screen.queryByTestId("location")).toBeNull();
		expect(document.activeElement).toBe(screen.getByTestId("join-code"));
	});

	test("invite 404 → revela input com erro, SEM navegar", async () => {
		fetchBehavior = { kind: "not-found" };
		renderJoin("/join?code=AB12");
		expect(screen.queryByTestId("join-code")).toBeNull();
		fillNick("Luna");
		fireEvent.click(screen.getByTestId("join-submit"));
		await waitFor(() => {
			expect(
				screen.getByTestId("join-code-error").textContent ?? "",
			).toMatch(/não encontrada/i);
		});
		expect(screen.queryByTestId("location")).toBeNull();
		expect(
			(screen.getByTestId("join-code") as HTMLInputElement).value,
		).toBe("AB12");
	});

	test("erro de rede → toasta mas navega mesmo assim", async () => {
		fetchBehavior = { kind: "network-error" };
		renderJoin("/join");
		fireEvent.change(screen.getByTestId("join-code"), {
			target: { value: "ZZ99" },
		});
		fillNick("Luna");
		fireEvent.click(screen.getByTestId("join-submit"));
		await expectLocation("/arena?code=ZZ99");
	});

	test("5xx → navega mesmo assim", async () => {
		fetchBehavior = { kind: "server-error" };
		renderJoin("/join?code=AB12");
		fillNick("Luna");
		fireEvent.click(screen.getByTestId("join-submit"));
		await expectLocation("/arena?code=AB12");
	});

	test("Escape → /", async () => {
		renderJoin("/join");
		fireEvent.keyDown(document, { key: "Escape" });
		await waitFor(() => {
			expect(screen.getByTestId("home-marker")).toBeTruthy();
		});
	});
});
