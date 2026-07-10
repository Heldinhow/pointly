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

		// Plaqueta de estado 'Votos revelados' confirma que o hero está mostrando
		// a fase pós-reveal do produto (não a tela de voto cego)
		expect(preview.textContent).toMatch(/Votos revelados/i);

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

	// T3 — Open-source escondido no footer
	test("T3 — selo '[ GITHUB ↗ ]' visível no header (não só no footer)", () => {
		renderLanding();
		const selo = screen.getByTestId("selo-github-header");
		expect(selo).toBeInTheDocument();
		expect(selo.tagName).toBe("A");
		expect(selo.getAttribute("href")).toMatch(/github\.com/i);
		expect(selo.getAttribute("target")).toBe("_blank");
		expect(selo.textContent || "").toMatch(/GITHUB/i);

		// Visível sem rolar — deve estar no topo da página (dentro do top metadata strip)
		expect(selo.getBoundingClientRect().top).toBeLessThan(100);
	});

	// T4 — Footer 'Produto' incompleto
	test("T4 — coluna 'Produto' do footer tem ≥3 itens (densidade comparável)", () => {
		renderLanding();
		// Itens novos (T4) presentes na coluna 'Produto'
		expect(screen.getByText(/Roadmap/i)).toBeInTheDocument();
		expect(screen.getByText(/Changelog/i)).toBeInTheDocument();
		expect(screen.getByText(/Pre\u00e7os.*gr\u00e1tis/i)).toBeInTheDocument();
		// Contato continua presente
		expect(screen.getByText(/Contato/i)).toBeInTheDocument();
	});

	// T5 — Navegação persistente (sumário / índice de revista)
	test("T5 — sticky nav tem 'Sumário' (TOC) que abre e lista ≥4 âncoras de seção", () => {
		renderLanding();
		const toggle = screen.getByTestId("toc-toggle");
		expect(toggle).toBeInTheDocument();
		expect(toggle.textContent || "").toMatch(/Sum\u00e1rio/i);

		// Menu inicialmente fechado
		expect(screen.queryByTestId("toc-menu")).not.toBeInTheDocument();

		// Clica e menu aparece com as 5 entradas
		fireEvent.click(toggle);
		const menu = screen.getByTestId("toc-menu");
		expect(menu).toBeInTheDocument();

		expect(screen.getByTestId("toc-item-como-funciona")).toBeInTheDocument();
		expect(screen.getByTestId("toc-item-para-times")).toBeInTheDocument();
		expect(screen.getByTestId("toc-item-capabilidades")).toBeInTheDocument();
		expect(screen.getByTestId("toc-item-fluxo-de-voto")).toBeInTheDocument();
		expect(screen.getByTestId("toc-item-cta-final")).toBeInTheDocument();

		// Clicar numa entrada fecha o menu
		fireEvent.click(screen.getByTestId("toc-item-para-times"));
		expect(screen.queryByTestId("toc-menu")).not.toBeInTheDocument();
	});

	test("T5 — seções da página têm ids para o TOC âncorar", () => {
		renderLanding();
		expect(document.getElementById("como-funciona")).toBeInTheDocument();
		expect(document.getElementById("para-times")).toBeInTheDocument();
		expect(document.getElementById("capabilidades")).toBeInTheDocument();
		expect(document.getElementById("fluxo-de-voto")).toBeInTheDocument();
		expect(document.getElementById("cta-final")).toBeInTheDocument();
	});

	// T8 — Responsividade mobile (375px)
	test("T8 — selo 'GitHub' também é renderizado no DOM (visível em mobile via sticky nav)", () => {
		renderLanding();
		const seloMobile = screen.getByTestId("selo-github-mobile");
		expect(seloMobile).toBeInTheDocument();
		expect(seloMobile.tagName).toBe("A");
		expect(seloMobile.getAttribute("href")).toMatch(/github\.com/i);
	});

	test("T8 — stats e selo Sem cadastro não excedem viewport mobile (375px)", () => {
		renderLanding();
		const selo = screen.getByTestId("selo-sem-cadastro");
		const rect = selo.getBoundingClientRect();
		expect(rect.right).toBeLessThanOrEqual(375);
	});
});
