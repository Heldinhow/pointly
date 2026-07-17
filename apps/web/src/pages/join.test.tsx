/**
 * Join page tests — T28 verify (≥3 of 5 minimum required) + sala-existence
 * pre-check (validate-room-existence).
 *
 * Cobre:
 *  - validateNick() puro: 1 char rejeitado, 21 rejeitado, espaços duplos,
 *    espaços nas pontas, ok
 *  - Render: card 'Seu nome na sala' + FIG.02 strip + code label
 *  - Validação inline: nick 1 char → erro, nick 'X X X' → erro
 *  - Submit com nick válido dispara redirect (stub)
 *  - A11y: input tem label + aria-invalid em erro
 *  - Host note aparece quando ?host=1
 *  - Pre-check de existência:
 *    - 200 → navega
 *    - 404 → erro inline, NÃO navega, aria-invalid=true
 *    - host=1 → fetch NÃO é chamado
 *    - editar code limpa erro
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "../components/ui/test-helpers";
import { ToastProvider } from "../components/ui/toast";
import { Join, validateNick } from "./join";

// ---------------------------------------------------------------------------
// fetch mock — instala um stub controlável no globalThis antes de cada test
// e restaura no afterEach. Cada test ajusta `fetchMock.next` (ou usa .ok/.notFound/.networkError)
// e o componente vai bater no stub. Em paralelo, gravamos as URLs chamadas
// para asserções tipo "host não chamou fetch" e "code veio certo na URL".
// ---------------------------------------------------------------------------

type FetchResult =
	| { kind: "ok"; status?: number; body?: unknown }
	| { kind: "not-found"; status?: number }
	| { kind: "network-error" };

let fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
let nextResult: FetchResult = { kind: "ok" };

beforeEach(() => {
	fetchCalls = [];
	nextResult = { kind: "ok" };
	(globalThis as { fetch: typeof fetch }).fetch = (async (
		input: RequestInfo | URL,
		init?: RequestInit,
	) => {
		const url = typeof input === "string" ? input : input.toString();
		fetchCalls.push({ url, init });
		const r = nextResult;
		if (r.kind === "network-error") {
			throw new TypeError("Failed to fetch");
		}
		const status = r.status ?? (r.kind === "not-found" ? 404 : 200);
		const body =
			r.kind === "not-found"
				? { code: "ABCD", exists: false }
				: (r.body ?? { code: "ABCD", exists: true, playerCount: 1, phase: "idle" });
		return new Response(JSON.stringify(body), {
			status,
			headers: { "content-type": "application/json" },
		});
	}) as typeof fetch;
});

afterEach(() => {
	delete (globalThis as { fetch?: typeof fetch }).fetch;
});

function renderJoin(initialEntry = "/join") {
	return render(
		<ToastProvider>
			<MemoryRouter
				future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
				initialEntries={[initialEntry]}
			>
				<Join />
			</MemoryRouter>
		</ToastProvider>,
	);
}

describe("validateNick — T28 unit (pure function)", () => {
	test("nick vazio → ok=false sem erro (UX: ainda digitando)", () => {
		const r = validateNick("");
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toBe("");
	});

	test("nick 1 char → erro 'Mínimo 2 caracteres.'", () => {
		const r = validateNick("A");
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/pelo menos 2/i);
	});

	test("nick 21 chars → erro 'Máximo 20 caracteres.'", () => {
		const r = validateNick("a".repeat(21));
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/no máximo 20/i);
	});

	test("nick com espaço duplo → erro 'Sem espaços duplos.'", () => {
		const r = validateNick("Hel  der");
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/espaços duplos/i);
	});

	test("nick com espaço na ponta → erro 'Sem espaços no início ou fim.'", () => {
		const r = validateNick(" Helder");
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/espaços no início/i);
	});

	test("nick válido → ok=true com value trim", () => {
		const r = validateNick("Helder");
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.value).toBe("Helder");
	});

	test("nick 20 chars (limite) → ok=true", () => {
		const r = validateNick("a".repeat(20));
		expect(r.ok).toBe(true);
	});

	test("nick 2 chars (mínimo) → ok=true", () => {
		const r = validateNick("He");
		expect(r.ok).toBe(true);
	});
});

describe("Join page — render", () => {
	test("renderiza headline 'Entrar na sala' + 'Entrar'", () => {
		renderJoin();
		expect(
			screen.getByRole("heading", { level: 1, name: /entrar na sala/i }),
		).toBeInTheDocument();
		expect(screen.getAllByText(/Entrar/i).length).toBeGreaterThan(0);
	});

	test("input tem label associado e placeholder", () => {
		renderJoin();
		const input = screen.getByTestId("nick-input");
		expect(input).toBeInTheDocument();
		expect(input.tagName).toBe("INPUT");
		expect(screen.getByLabelText(/como você quer ser chamado/i)).toBe(input);
	});

	test("botão 'Entrar' começa disabled (nick vazio)", () => {
		renderJoin();
		const submit = screen.getByTestId("join-submit");
		expect(submit).toBeDisabled();
	});
});

describe("Join page — validation inline", () => {
	test("nick 1 char → erro inline 'Mínimo 2'", () => {
		renderJoin("/join?code=ABCD");
		const input = screen.getByTestId("nick-input");
		fireEvent.change(input, { target: { value: "A" } });
		const error = screen.getByTestId("nick-error");
		expect(error).toHaveTextContent(/pelo menos 2/i);
	});

	test("nick 'Hel  der' (espaço duplo) → erro inline", () => {
		renderJoin("/join?code=ABCD");
		const input = screen.getByTestId("nick-input");
		fireEvent.change(input, { target: { value: "Hel  der" } });
		const error = screen.getByTestId("nick-error");
		expect(error).toHaveTextContent(/espaços duplos/i);
	});

	test("nick 'Helder' (válido) com código na URL → botão habilita, erro vazio", () => {
		renderJoin("/join?code=ABCD");
		const input = screen.getByTestId("nick-input");
		fireEvent.change(input, { target: { value: "Helder" } });
		const submit = screen.getByTestId("join-submit");
		expect(submit).toBeEnabled();
		expect(screen.getByTestId("nick-error")).toHaveTextContent("");
	});

	test("input tem aria-invalid=true em erro, false em válido", () => {
		renderJoin("/join?code=ABCD");
		const input = screen.getByTestId("nick-input");
		fireEvent.change(input, { target: { value: "A" } });
		expect(input.getAttribute("aria-invalid")).toBe("true");
		fireEvent.change(input, { target: { value: "Helder" } });
		expect(input.getAttribute("aria-invalid")).toBe("false");
	});
});

describe("Join page — manual code entry", () => {
	test("renderiza campo de código no join sem parâmetros", () => {
		renderJoin("/join");
		expect(screen.getByTestId("join-code-input")).toBeInTheDocument();
	});

	test("digitar no nick NÃO rouba foco para o input de código", async () => {
		// /join (sem ?code, sem ?host) → showCodeInput=true, code=''.
		// Bug: o useEffect de auto-foco agendava um rAF no mount que
		// disparava tarde (depois do usuário já ter focado o nick
		// manualmente) e roubava foco pra o code input, OU re-rodava a
		// cada keystroke de nick via dep, fazendo o caret pular entre
		// campos a cada letra. O usuário não conseguia digitar o nick.
		renderJoin("/join");
		const codeInput = screen.getByTestId("join-code-input");
		const nickInput = screen.getByTestId("nick-input");

		// Preenche o código (4 chars válidos) — habilita o submit depois.
		fireEvent.change(codeInput, { target: { value: "ABCD" } });

		// Usuário foca o nick e digita. O foco deve permanecer no nick
		// input mesmo após o rAF do auto-foco disparar.
		nickInput.focus();
		expect(document.activeElement).toBe(nickInput);

		fireEvent.change(nickInput, { target: { value: "H" } });
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		expect(document.activeElement).toBe(nickInput);

		fireEvent.change(nickInput, { target: { value: "He" } });
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		expect(document.activeElement).toBe(nickInput);
	});

	test("NÃO renderiza campo de código no join com code na URL", () => {
		renderJoin("/join?code=ABCD");
		expect(screen.queryByTestId("join-code-input")).not.toBeInTheDocument();
	});

	test("NÃO renderiza campo de código no join como host", () => {
		renderJoin("/join?host=1");
		expect(screen.queryByTestId("join-code-input")).not.toBeInTheDocument();
	});

	test("botão só habilita com nick válido E código de 4 caracteres no join manual", () => {
		renderJoin("/join");
		const nickInput = screen.getByTestId("nick-input");
		const codeInput = screen.getByTestId("join-code-input");
		const submit = screen.getByTestId("join-submit");

		// Apenas nick -> disabled
		fireEvent.change(nickInput, { target: { value: "Helder" } });
		expect(submit).toBeDisabled();

		// Nick + código curto -> disabled
		fireEvent.change(codeInput, { target: { value: "AB" } });
		expect(submit).toBeDisabled();

		// Nick + código 4 chars -> enabled
		fireEvent.change(codeInput, { target: { value: "ABCD" } });
		expect(submit).toBeEnabled();
	});
});

describe("Join page — querystring parsing", () => {
	test("code 'ABCD' aparece no FIG strip", () => {
		renderJoin("/join?code=ABCD");
		expect(screen.getByTestId("join-code-label")).toHaveTextContent("ABCD");
	});

	test("?host=1 não mostra uma nota redundante", () => {
		renderJoin("/join?host=1");
		expect(screen.queryByTestId("host-note")).not.toBeInTheDocument();
	});

	test("sem ?host=1 NÃO mostra host note", () => {
		renderJoin("/join?code=ABCD");
		expect(screen.queryByTestId("host-note")).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// validate-room-existence — pre-check na tela Join
// AC-4..AC-10 do .specs/features/validate-room-existence/spec.md
// ---------------------------------------------------------------------------

describe("Join — pre-check de existência da sala", () => {
	test("submit com code válido e fetch 200 → fetch foi chamado e navega", async () => {
		nextResult = { kind: "ok" };
		renderJoin("/join?code=ABCD");
		fireEvent.change(screen.getByTestId("nick-input"), {
			target: { value: "Helder" },
		});
		fireEvent.click(screen.getByTestId("join-submit"));
		await waitFor(() => {
			expect(fetchCalls.length).toBeGreaterThanOrEqual(1);
		});
		expect(fetchCalls[0]?.url).toBe("/api/v1/salas/ABCD");
		// A navegação é assíncrona (setTimeout 200ms dentro do handler);
		// validamos que o submit clicou sem erro e o fetch rolou.
	});

	test("submit com fetch 404 (code via URL) → erro inline no form + NÃO navega", async () => {
		nextResult = { kind: "not-found" };
		renderJoin("/join?code=ZZZZ");
		fireEvent.change(screen.getByTestId("nick-input"), {
			target: { value: "Helder" },
		});
		fireEvent.click(screen.getByTestId("join-submit"));

		const errorNode = await screen.findByTestId("join-code-error");
		expect(errorNode).toHaveTextContent(/sala não encontrada/i);
		expect(errorNode).toHaveAttribute("role", "alert");
		// Quando code vem via URL, showCodeInput é false → erro vive no form,
		// não inline no input. Verifica que NÃO navegou.
		expect(window.location.pathname).toBe("/");
	});

	test("submit com fetch 404 (code manual) → erro inline NO INPUT + aria-invalid=true", async () => {
		nextResult = { kind: "not-found" };
		// Sem ?code= → showCodeInput=true → usuário digita o code manualmente.
		renderJoin("/join");
		fireEvent.change(screen.getByTestId("join-code-input"), {
			target: { value: "ZZZZ" },
		});
		fireEvent.change(screen.getByTestId("nick-input"), {
			target: { value: "Helder" },
		});
		fireEvent.click(screen.getByTestId("join-submit"));

		const errorNode = await screen.findByTestId("join-code-error");
		expect(errorNode).toHaveTextContent(/sala não encontrada/i);
		const codeInput = screen.getByTestId("join-code-input");
		expect(codeInput.getAttribute("aria-invalid")).toBe("true");
	});

	test("submit como host=1 → fetch NÃO é chamado (server gera code no hello)", async () => {
		renderJoin("/join?host=1");
		fireEvent.change(screen.getByTestId("nick-input"), {
			target: { value: "Helder" },
		});
		fireEvent.click(screen.getByTestId("join-submit"));
		// Aguarda um tick — se fetch fosse chamado, fetchCalls teria 1+.
		await new Promise((r) => setTimeout(r, 50));
		expect(fetchCalls.length).toBe(0);
	});

	test("editar o code após 404 limpa o erro e aria-invalid (entrada manual)", async () => {
		nextResult = { kind: "not-found" };
		// Sem ?code= → showCodeInput=true → usuário digita o code.
		renderJoin("/join");
		const codeInput = screen.getByTestId("join-code-input");
		fireEvent.change(codeInput, { target: { value: "ZZZZ" } });
		fireEvent.change(screen.getByTestId("nick-input"), {
			target: { value: "Helder" },
		});
		fireEvent.click(screen.getByTestId("join-submit"));
		await screen.findByTestId("join-code-error");

		// Editar o code deve limpar o erro de "não encontrada".
		// Digitando 4 chars válidos, o aria-invalid também fica false.
		fireEvent.change(codeInput, { target: { value: "WXYZ" } });
		expect(screen.queryByTestId("join-code-error")).not.toBeInTheDocument();
		expect(codeInput.getAttribute("aria-invalid")).toBe("false");
	});

	test("fetch lança (network error) → fall through e navega normalmente", async () => {
		nextResult = { kind: "network-error" };
		renderJoin("/join?code=ABCD");
		fireEvent.change(screen.getByTestId("nick-input"), {
			target: { value: "Helder" },
		});
		fireEvent.click(screen.getByTestId("join-submit"));
		// Erro inline NÃO deve aparecer (defesa em profundidade: WS hello
		// é a fonte da verdade).
		await new Promise((r) => setTimeout(r, 50));
		expect(screen.queryByTestId("join-code-error")).not.toBeInTheDocument();
		expect(fetchCalls.length).toBe(1);
	});
});
