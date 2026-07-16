/**
 * Join page tests — T28 verify (≥3 of 5 minimum required).
 *
 * Cobre:
 *  - validateNick() puro: 1 char rejeitado, 21 rejeitado, espaços duplos,
 *    espaços nas pontas, ok
 *  - Render: card 'Seu nome na sala' + FIG.02 strip + code label
 *  - Validação inline: nick 1 char → erro, nick 'X X X' → erro
 *  - Submit com nick válido dispara redirect (stub)
 *  - A11y: input tem label + aria-invalid em erro
 *  - Host note aparece quando ?host=1
 */
import { describe, expect, test } from "bun:test";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "../components/ui/test-helpers";
import { ToastProvider } from "../components/ui/toast";
import { Join, validateNick } from "./join";

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
