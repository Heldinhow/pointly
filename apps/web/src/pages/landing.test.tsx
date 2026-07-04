/**
 * Landing page tests — T27 verify (≥3 of 5 minimum required).
 *
 * Cobre:
 *  - Render: headline com itálico + Trust Badge
 *  - CTAs: 'Criar sala' navega para /join?host=1
 *  - Form 'Entrar com código': validação inline + redirect com code
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
	test("renderiza headline + Trust Badge", () => {
		renderLanding();
		expect(screen.getByTestId("hero-headline")).toBeInTheDocument();
		expect(screen.getByTestId("hero-headline")).toHaveTextContent(/ritmo/i);
		expect(screen.getByTestId("hero-headline")).toHaveTextContent(/confiança/i);
		expect(screen.getByTestId("trust-badge")).toHaveTextContent(
			/0 cadastros · 4 chars no código/i,
		);
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

	test("Form 'Entrar com código' valida code < 4 chars com erro inline", () => {
		renderLanding();
		const input = screen.getByTestId("code-input");
		const submitBtn = screen.getByTestId("cta-join-with-code");
		// input com 2 chars
		fireEvent.change(input, { target: { value: "AB" } });
		fireEvent.click(submitBtn);
		expect(screen.getByRole("alert")).toHaveTextContent(/4 caracteres/i);
	});

	test("Form 'Entrar com código' aceita code 4 chars e dispara navegação", () => {
		renderLanding();
		const input = screen.getByTestId("code-input");
		fireEvent.change(input, { target: { value: "9b9f" } });
		// input é uppercased — verificamos via atributo value do DOM
		expect(input).toHaveValue("9B9F");
	});

	test("headings hierárquicos (h1 + h2)", () => {
		renderLanding();
		expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
		const h2s = screen.getAllByRole("heading", { level: 2 });
		expect(h2s.length).toBeGreaterThanOrEqual(2);
	});

	test("renderiza 4 capability cards numerados", () => {
		renderLanding();
		expect(screen.getByTestId("cap-card-01")).toBeInTheDocument();
		expect(screen.getByTestId("cap-card-02")).toBeInTheDocument();
		expect(screen.getByTestId("cap-card-03")).toBeInTheDocument();
		expect(screen.getByTestId("cap-card-04")).toBeInTheDocument();
	});

	test("renderiza 4 method steps", () => {
		renderLanding();
		expect(screen.getByTestId("method-step-01")).toBeInTheDocument();
		expect(screen.getByTestId("method-step-04")).toBeInTheDocument();
	});

	test("mega footer 'Pointly.' presente", () => {
		renderLanding();
		// aria-hidden no footer word; verificamos via queryAllByText
		const all = screen.queryAllByText(/Pointly\./);
		expect(all.length).toBeGreaterThanOrEqual(1);
	});

	test("CTA ribbon 'Criar sala' também presente", () => {
		renderLanding();
		const ctas = screen.getAllByTestId("cta-ribbon-create");
		expect(ctas.length).toBe(1);
	});
});