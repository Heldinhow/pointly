import { expect, mock, test } from "bun:test";
import { MemoryRouter } from "react-router-dom";
import { SiteHeader } from "./site-header";
import { fireEvent, render, screen } from "./ui/test-helpers";

test("header preserves navigation and actions without changing on scroll", () => {
	const create = mock(() => {});
	const join = mock(() => {});
	const { container } = render(
		<MemoryRouter>
			<SiteHeader onCreateRoom={create} onJoinRoom={join} />
		</MemoryRouter>,
	);
	const header = screen.getByRole("banner");
	expect(screen.getByRole("link").getAttribute("href")).toBe("/");
	expect(container.querySelector("svg.pointly-mark")).toHaveAttribute(
		"aria-hidden",
		"true",
	);
	fireEvent.click(screen.getByTestId("cta-nav-create-room"));
	fireEvent.click(screen.getByTestId("cta-nav-join-room"));
	expect(create).toHaveBeenCalledTimes(1);
	expect(join).toHaveBeenCalledTimes(1);
	Object.defineProperty(window, "scrollY", { configurable: true, value: 120 });
	try {
		fireEvent.scroll(window);
		expect(header).not.toHaveAttribute("data-scrolled");
	} finally {
		Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
	}
});

test("room actions replace landing actions and preserve brand label and theme control", () => {
	render(
		<MemoryRouter>
			<SiteHeader
				brandLabel="Sair da sala"
				actions={<button type="button">Copiar convite</button>}
			/>
		</MemoryRouter>,
	);
	expect(screen.getByRole("link", { name: "Sair da sala" })).toHaveAttribute(
		"href",
		"/",
	);
	expect(screen.getByRole("button", { name: "Copiar convite" })).toBeEnabled();
	expect(screen.getByTestId("theme-toggle")).toBeEnabled();
	expect(screen.queryByTestId("cta-nav-create-room")).not.toBeInTheDocument();
	expect(screen.queryByTestId("cta-nav-join-room")).not.toBeInTheDocument();
});
