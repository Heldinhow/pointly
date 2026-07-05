/**
 * HelpModal component tests — ADR-007 / BUG-306 gate.
 */
import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "./ui/test-helpers";
import { HelpModal } from "./help-modal";

describe("HelpModal — render", () => {
	test("não renderiza quando open=false", () => {
		const { container } = render(
			<HelpModal open={false} onClose={() => {}} />,
		);
		expect(container.firstChild).toBeNull();
	});

	test("renderiza com role='dialog' + aria-modal + aria-labelledby", () => {
		render(<HelpModal open={true} onClose={() => {}} />);
		const dialog = screen.getByTestId("help-modal");
		expect(dialog.getAttribute("role")).toBe("dialog");
		expect(dialog.getAttribute("aria-modal")).toBe("true");
		expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
	});

	test("lista os 4 atalhos: R / N / ? / Esc", () => {
		render(<HelpModal open={true} onClose={() => {}} />);
		const table = screen.getByTestId("help-modal-shortcuts");
		const html = table.textContent ?? "";
		expect(html).toContain("R");
		expect(html).toContain("N");
		expect(html).toContain("?");
		expect(html).toContain("Esc");
	});
});

describe("HelpModal — interactions", () => {
	test("click em 'Fechar' chama onClose", () => {
		const onClose = mock(() => {});
		render(<HelpModal open={true} onClose={onClose} />);
		fireEvent.click(screen.getByTestId("help-modal-close"));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	test("Esc fecha o modal (chama onClose)", () => {
		const onClose = mock(() => {});
		render(<HelpModal open={true} onClose={onClose} />);
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	test("Esc com open=false NÃO chama onClose", () => {
		const onClose = mock(() => {});
		render(<HelpModal open={false} onClose={onClose} />);
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).toHaveBeenCalledTimes(0);
	});
});
