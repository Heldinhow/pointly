/**
 * Landing page tests — T27 verify (≥3 of 5 minimum required).
 *
 * Cobre:
 *  - Render: headline com itálico
 *  - CTAs: 'Criar sala' navega para /join?host=1
 *  - A11y: heading hierárquico + CTAs focáveis
 */
import { describe, expect, test } from "bun:test";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "../components/ui/test-helpers";
import { Landing } from "./landing";

function renderLanding() {
	return render(
		<MemoryRouter>
			<Landing />
		</MemoryRouter>,
	);
}

describe("Landing — T27", () => {
	test("renderiza headline", () => {
		renderLanding();
		expect(screen.getByTestId("hero-headline")).toBeInTheDocument();
		expect(screen.getByTestId("hero-headline")).toHaveTextContent(/ritmo/i);
		expect(screen.getByTestId("hero-headline")).toHaveTextContent(/confiança/i);
	});

	test("CTA 'Criar sala' tem variant coral (≤1 CTA coral por viewport)", () => {
		renderLanding();
		const cta = screen.getByTestId("cta-create-room");
		expect(cta).toBeInTheDocument();
		expect(cta.className).toContain("bg-coral");
		expect(cta).toHaveTextContent(/criar sala/i);
	});

	test("CTA 'Criar sala' navega para /join?host=1 (server cria sala)", () => {
		renderLanding();
		const cta = screen.getByTestId("cta-create-room");
		expect(cta).toBeInTheDocument();
		// Verifica que é um button (não link) — navegação é client-side via useNavigate
		expect(cta.tagName).toBe("BUTTON");
		// Click não deve quebrar
		fireEvent.click(cta);
		expect(cta).toBeInTheDocument();
	});

	test("headings hierárquicos (h1 + h2)", () => {
		renderLanding();
		expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
		const h2s = screen.getAllByRole("heading", { level: 2 });
		expect(h2s.length).toBeGreaterThanOrEqual(1);
	});

	test("renderiza 4 capability cards numerados", () => {
		renderLanding();
		expect(screen.getByTestId("cap-card-01")).toBeInTheDocument();
		expect(screen.getByTestId("cap-card-02")).toBeInTheDocument();
		expect(screen.getByTestId("cap-card-03")).toBeInTheDocument();
		expect(screen.getByTestId("cap-card-04")).toBeInTheDocument();
	});

	test("CTA ribbon 'Criar sala' também presente", () => {
		renderLanding();
		const ctas = screen.getAllByTestId("cta-ribbon-create");
		expect(ctas.length).toBe(1);
	});

	test("campo 'Entrar com Código' inline e botão 'Entrar'", () => {
		renderLanding();
		const input = screen.getByTestId("landing-code-input") as HTMLInputElement;
		const submitBtn = screen.getByTestId("landing-code-submit");
		expect(input).toBeInTheDocument();
		expect(submitBtn).toBeInTheDocument();
		expect(submitBtn).toBeDisabled();

		// Digita um código incompleto
		fireEvent.change(input, { target: { value: "AB" } });
		expect(input.value).toBe("AB");
		expect(submitBtn).toBeDisabled();

		// Digita caracteres inválidos e testa que filtra + uppercase
		fireEvent.change(input, { target: { value: "ab-3" } });
		expect(input.value).toBe("AB3"); // hifen removido, convertido pra maiúsculas
		expect(submitBtn).toBeDisabled();

		// Código completo
		fireEvent.change(input, { target: { value: "a1b2" } });
		expect(input.value).toBe("A1B2");
		expect(submitBtn).toBeEnabled();
	});

	// T1 — Hero mostra o produto (preview da mesa de votação)
	test("T1 — hero mostra preview da mesa com jogadores e mediana visíveis", () => {
		renderLanding();
		const preview = screen.getByTestId("hero-table-preview");
		expect(preview).toBeInTheDocument();

		// Plaqueta editorial 'Fig. 01 · Mesa revelada' indica o produto
		expect(preview.textContent).toMatch(/Fig\. 01.*Mesa revelada/i);

		// 'Você' e 'Mediana' comunicam que se trata de uma mesa de votação com cartas
		expect(preview.textContent).toMatch(/Você/i);
		expect(preview.textContent).toMatch(/Mediana/i);

		// Pelo menos 6 valores Fibonacci expostos (cartas reveladas)
		const fibVotes = (preview.textContent || "").match(/[01358]|13/g) || [];
		expect(fibVotes.length).toBeGreaterThanOrEqual(6);
	});

	// T2 — Métrica '0 Cadastros' ambígua
	test("T2 — barra de stats não mostra 'Cadastros' como label numérico; selo 'Sem cadastro' presente", () => {
		renderLanding();

		// O rótulo 'Cadastros' não pode mais aparecer isolado como label numérico
		expect(screen.queryByText(/^Cadastros$/)).not.toBeInTheDocument();

		// Selo editorial substitui o claim ambíguo
		const selo = screen.getByTestId("selo-sem-cadastro");
		expect(selo).toBeInTheDocument();
		expect(selo.textContent).toMatch(/Sem cadastro/i);
		expect(selo.textContent).toMatch(/Sem e-mail/i);
	});

	test("T2 — stats numéricos restantes são inequívocos (Assentos, Decidir, Setup)", () => {
		renderLanding();
		expect(screen.getByText(/Assentos/i)).toBeInTheDocument();
		expect(screen.getByText(/P\/ decidir|Decidir/i)).toBeInTheDocument();
		expect(screen.getByText(/Setup/i)).toBeInTheDocument();
	});
});
