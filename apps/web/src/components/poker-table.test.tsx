import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PokerTable, type TablePlayer } from "./poker-table";

const AVATAR = "data:image/jpeg;base64,AAA";

function seated(overrides: Partial<TablePlayer> = {}): TablePlayer {
	return {
		id: "p_ana",
		nick: "Ana",
		seatIndex: 0,
		hasVoted: false,
		value: null,
		status: "connected",
		...overrides,
	};
}

afterEach(() => {
	cleanup();
});

describe("PokerTable avatar (AV-04)", () => {
	test("com avatar renderiza img no círculo em vez das iniciais", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ avatar: AVATAR })]}
				playerId="p_ana"
				hostId="p_ana"
				revealed={false}
			/>,
		);
		const circle = container.querySelector(".poker-avatar");
		expect(circle).toBeTruthy();
		const img = screen.getByRole("img", { name: "Ana" }) as HTMLImageElement;
		expect(img.getAttribute("src")).toBe(AVATAR);
		expect(img.className).toMatch(/poker-avatar-img/);
		expect(circle?.textContent).not.toMatch("AN");
	});

	test("sem avatar exibe as iniciais", () => {
		const { container } = render(
			<PokerTable seats={[seated()]} playerId="p_ana" revealed={false} />,
		);
		expect(container.querySelector(".poker-avatar img")).toBeNull();
		expect(container.querySelector(".poker-avatar")?.textContent).toMatch(
			"AN",
		);
	});

	test("avatar null exibe as iniciais", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ avatar: null })]}
				playerId="p_ana"
				revealed={false}
			/>,
		);
		expect(container.querySelector(".poker-avatar img")).toBeNull();
		expect(container.querySelector(".poker-avatar")?.textContent).toMatch(
			"AN",
		);
	});

	test("erro de load volta para as iniciais sem círculo vazio", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ avatar: AVATAR })]}
				playerId="p_ana"
				revealed={false}
			/>,
		);
		fireEvent.error(screen.getByRole("img", { name: "Ana" }));
		expect(container.querySelector(".poker-avatar img")).toBeNull();
		expect(container.querySelector(".poker-avatar")?.textContent).toMatch(
			"AN",
		);
	});

	test("âncora de projéteis inalterada com avatar", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ id: "p_beto", nick: "Beto", avatar: AVATAR })]}
				playerId="p_ana"
				revealed={false}
			/>,
		);
		const anchored = container.querySelector(
			'.poker-avatar[data-projectile-player="p_beto"]',
		);
		expect(anchored).toBeTruthy();
		expect(anchored?.querySelector("img")?.getAttribute("src")).toBe(AVATAR);
	});
});

describe("PokerTable cartas na mesa", () => {
	test("voto pré-reveal mostra a carta à frente do assento com verso", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ hasVoted: true })]}
				playerId="p_ana"
				revealed={false}
			/>,
		);
		const card = container.querySelector(
			".poker-seat .poker-played-card",
		);
		expect(card?.className).toMatch(/poker-played-card--dealt/);
		expect(card?.className).not.toMatch(/--face/);
		expect(card?.querySelector(".poker-card-pattern")).toBeTruthy();
	});

	test("sem voto não há carta", () => {
		const { container } = render(
			<PokerTable seats={[seated()]} playerId="p_ana" revealed={false} />,
		);
		expect(container.querySelector(".poker-played-card")).toBeNull();
	});

	test("pós-reveal a carta vira face e mostra o valor", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ hasVoted: true, value: "5" })]}
				playerId="p_ana"
				revealed
			/>,
		);
		const card = container.querySelector(
			".poker-seat .poker-played-card",
		);
		expect(card?.className).toMatch(/poker-played-card--face/);
		expect(card?.className).not.toMatch(/--dealt/);
		expect(card?.textContent).toBe("5");
	});
});

describe("PokerTable carta votada (14.2)", () => {
	const css = readFileSync(
		new URL("./poker-table.css", import.meta.url),
		"utf8",
	);

	test("voto entra com flip de meia-volta, sem voo", () => {
		const dealtRule = css.match(/\.poker-played-card--dealt\s*{[^}]*}/)?.[0];
		expect(dealtRule).toContain("card-flip");
		const flip = css.slice(
			css.indexOf("@keyframes card-flip"),
			css.indexOf("@keyframes card-reveal"),
		);
		expect(flip).toContain("rotateY(180deg)");
		expect(flip).toContain("rotateY(0)");
		expect(flip).not.toContain("translateY");
		expect(css).not.toContain("card-dealt");
	});

	test("reduced motion desliga o flip do voto", () => {
		const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion"));
		expect(reduced).toContain(".poker-played-card--dealt");
	});
});

describe("PokerTable dado da mesa (14.6)", () => {
	test("assento sorteado ganha a pill 'Justifica'", () => {
		render(
			<PokerTable
				seats={[
					seated({ hasVoted: true, value: "5" }),
					seated({ id: "p_beto", nick: "Beto", seatIndex: 3, hasVoted: true, value: "8" }),
				]}
				playerId="p_ana"
				revealed
				justifySeatIndex={3}
			/>,
		);
		const pill = screen.getByTestId("seat-justify-3");
		expect(pill.textContent).toContain("Justifica");
		expect(screen.queryByTestId("seat-justify-0")).toBeNull();
	});

	test("sem sorteio (null) nenhum assento recebe a pill", () => {
		const { container } = render(
			<PokerTable
				seats={[seated({ hasVoted: true, value: "5" })]}
				playerId="p_ana"
				revealed
				justifySeatIndex={null}
			/>,
		);
		expect(container.querySelector(".poker-justify")).toBeNull();
	});
});
